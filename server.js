const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const next = require('next');
const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
try {
  // Check if running in production
  if (process.env.NODE_ENV === 'production') {
    // Use environment variables in production
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      }),
      databaseURL: "https://escape-room-bb563.firebaseio.com"
    });
  } else {
    // Use local service account file in development
    // You'll need to download this from Firebase console
    const serviceAccount = require('./firebase-admin-key.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: "https://escape-room-bb563.firebaseio.com"
    });
  }
} catch (error) {
  console.log('Firebase admin initialization error', error);
}

const db = admin.firestore();
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();
  const httpServer = http.createServer(server);
  const io = new Server(httpServer, {
    cors: {
      origin: dev ? "http://localhost:3000" : "https://escape-room-bb563.web.app",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // WebSocket event handlers
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join a room
    socket.on('joinRoom', async ({ roomCode, playerName, playerId }) => {
      try {
        // Add player to room in Firestore
        const roomRef = db.collection('rooms').doc(roomCode);
        const roomDoc = await roomRef.get();

        if (!roomDoc.exists) {
          socket.emit('roomError', 'Room does not exist');
          return;
        }

        // Add player to the room
        await roomRef.update({
          players: admin.firestore.FieldValue.arrayUnion({
            id: playerId,
            name: playerName,
            socketId: socket.id,
            isLeader: false,
            isReady: false,
            joinedAt: admin.firestore.FieldValue.serverTimestamp()
          })
        });

        // Join socket room
        socket.join(roomCode);
        
        // Notify everyone in the room
        io.to(roomCode).emit('playerJoined', {
          id: playerId,
          name: playerName
        });

        // Send current room state to the new player
        const updatedRoom = await roomRef.get();
        socket.emit('roomState', updatedRoom.data());

      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('roomError', 'Failed to join room');
      }
    });

    // Create a room
    socket.on('createRoom', async ({ roomName, hostName, hostId }) => {
      try {
        // Generate a unique 6-character room code
        const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        // Create room document in Firestore
        await db.collection('rooms').doc(roomCode).set({
          roomCode,
          roomName,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          gameState: {
            stage: 'lobby',
            timeRemaining: 3600,
            isPaused: true,
            loginAttempts: 0,
            puzzleStage: 0,
            hackingProgress: 0
          },
          players: [{
            id: hostId,
            name: hostName,
            socketId: socket.id,
            isLeader: true, // Host is the default leader
            isHost: true,
            isReady: false,
            joinedAt: admin.firestore.FieldValue.serverTimestamp()
          }]
        });

        // Join socket room
        socket.join(roomCode);
        
        // Send room info back to host
        socket.emit('roomCreated', { roomCode });
        
      } catch (error) {
        console.error('Error creating room:', error);
        socket.emit('roomError', 'Failed to create room');
      }
    });

    // Toggle player ready status
    socket.on('toggleReady', async ({ roomCode, playerId }) => {
      try {
        const roomRef = db.collection('rooms').doc(roomCode);
        const roomDoc = await roomRef.get();
        
        if (!roomDoc.exists) {
          socket.emit('roomError', 'Room does not exist');
          return;
        }
        
        const roomData = roomDoc.data();
        const playerIndex = roomData.players.findIndex(player => player.id === playerId);
        
        if (playerIndex === -1) {
          socket.emit('roomError', 'Player not found in room');
          return;
        }
        
        // Toggle the ready status
        const updatedPlayers = [...roomData.players];
        updatedPlayers[playerIndex] = {
          ...updatedPlayers[playerIndex],
          isReady: !updatedPlayers[playerIndex].isReady
        };
        
        await roomRef.update({ players: updatedPlayers });
        
        // Send updated room state to all players
        const updatedRoom = await roomRef.get();
        io.to(roomCode).emit('roomState', updatedRoom.data());
        
      } catch (error) {
        console.error('Error toggling ready status:', error);
        socket.emit('roomError', 'Failed to update ready status');
      }
    });

    // Set leader
    socket.on('setLeader', async ({ roomCode, playerId }) => {
      try {
        const roomRef = db.collection('rooms').doc(roomCode);
        const roomDoc = await roomRef.get();
        
        if (!roomDoc.exists) {
          socket.emit('roomError', 'Room does not exist');
          return;
        }
        
        const roomData = roomDoc.data();
        const updatedPlayers = roomData.players.map(player => ({
          ...player,
          isLeader: player.id === playerId
        }));
        
        await roomRef.update({ players: updatedPlayers });
        
        // Broadcast leader change to all players in the room
        io.to(roomCode).emit('leaderChanged', { leaderId: playerId });
        
      } catch (error) {
        console.error('Error setting leader:', error);
        socket.emit('roomError', 'Failed to set leader');
      }
    });

    // Game state updates
    socket.on('updateGameState', async ({ roomCode, gameState }) => {
      try {
        await db.collection('rooms').doc(roomCode).update({
          'gameState': gameState
        });
        
        // Broadcast to everyone except sender
        socket.to(roomCode).emit('gameStateUpdated', gameState);
        
      } catch (error) {
        console.error('Error updating game state:', error);
      }
    });

    // Login input updates (for login screen)
    socket.on('loginInput', ({ roomCode, field, value }) => {
      // Broadcast to everyone in the room except the sender
      socket.to(roomCode).emit('loginInputUpdated', { field, value });
    });

    // Terminal input updates (for game screen)
    socket.on('terminalInput', ({ roomCode, input }) => {
      // Broadcast to everyone in the room except the sender
      socket.to(roomCode).emit('terminalInputUpdated', { input });
    });

    // Cursor position updates
    socket.on('cursorPosition', ({ roomCode, position }) => {
      // Broadcast to everyone in the room except the sender
      socket.to(roomCode).emit('cursorPositionUpdated', { position });
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log('User disconnected:', socket.id);
      
      try {
        // Find rooms where this socket is a player
        const roomsQuery = await db.collection('rooms')
          .where('players', 'array-contains', { socketId: socket.id })
          .get();
        
        if (roomsQuery.empty) return;
        
        // Update each room the user was in
        roomsQuery.forEach(async (doc) => {
          const roomData = doc.data();
          const playerIndex = roomData.players.findIndex(p => p.socketId === socket.id);
          
          if (playerIndex !== -1) {
            const player = roomData.players[playerIndex];
            
            // Notify others in the room
            io.to(roomData.roomCode).emit('playerLeft', {
              id: player.id,
              name: player.name
            });
            
            // If the player was the leader, assign a new leader
            if (player.isLeader && roomData.players.length > 1) {
              const newLeaderIndex = (playerIndex + 1) % roomData.players.length;
              roomData.players[newLeaderIndex].isLeader = true;
              
              // Notify about leader change
              io.to(roomData.roomCode).emit('leaderChanged', { 
                leaderId: roomData.players[newLeaderIndex].id 
              });
            }
            
            // Remove the player from the room
            roomData.players.splice(playerIndex, 1);
            
            // Update the room in Firestore
            await doc.ref.update({ players: roomData.players });
            
            // If room is empty, delete it after some time
            if (roomData.players.length === 0) {
              setTimeout(async () => {
                const currentRoom = await doc.ref.get();
                if (currentRoom.exists && currentRoom.data().players.length === 0) {
                  await doc.ref.delete();
                }
              }, 3600000); // 1 hour
            }
          }
        });
      } catch (error) {
        console.error('Error handling disconnect:', error);
      }
    });
  });

  // Let Next.js handle all HTTP requests
  server.use(function(req, res) {
    return handle(req, res);
  });

  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}); 