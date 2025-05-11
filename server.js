const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const next = require('next');
const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
let db;
try {
  console.log('Initializing Firebase Admin...');
  
  // Check if running in production
  if (process.env.NODE_ENV === 'production') {
    console.log('Using production Firebase config');
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
    console.log('Using development Firebase config');
    try {
      // Use local service account file in development
      const serviceAccount = require('./firebase-admin-key.json');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://escape-room-bb563.firebaseio.com"
      });
    } catch (fileError) {
      console.error('Failed to load Firebase admin key file:', fileError);
      console.log('Falling back to Firebase emulator...');
      // Fallback to emulator for local development
      admin.initializeApp({
        projectId: 'escape-room-local',
      });
    }
  }
  
  db = admin.firestore();
  console.log('Firebase Admin initialized successfully');
} catch (error) {
  console.error('Firebase admin initialization error:', error.message, error.stack);
  // Initialize a mock db for development if Firebase fails
  console.log('Using mock Firebase for development');
  db = {
    collection: (name) => ({
      doc: (id) => ({
        get: async () => ({ exists: false, data: () => ({}) }),
        set: async (data) => console.log(`Mock set ${name}/${id}:`, data),
        update: async (data) => console.log(`Mock update ${name}/${id}:`, data)
      }),
      get: async () => ({ empty: true, forEach: () => {} })
    })
  };
}

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
        console.log('Joining room:', roomCode, 'as', playerName);
        
        if (!roomCode) {
          console.error('No room code provided');
          socket.emit('roomError', 'No room code provided');
          return;
        }
        
        if (!playerName) {
          console.error('No player name provided');
          socket.emit('roomError', 'No player name provided');
          return;
        }
        
        if (!playerId) {
          console.error('No player ID provided');
          socket.emit('roomError', 'No player ID provided');
          return;
        }
        
        // Check if room exists
        const roomRef = db.collection('rooms').doc(roomCode);
        const roomDoc = await roomRef.get();

        if (!roomDoc.exists) {
          console.log('Room does not exist:', roomCode);
          socket.emit('roomError', 'Room does not exist');
          return;
        }
        
        const roomData = roomDoc.data();
        console.log('Found room:', roomCode, 'with players:', roomData.players ? roomData.players.length : 0);
        
        // Check if player is already in the room
        if (roomData.players && roomData.players.some(p => p.id === playerId)) {
          console.log('Player already in room, updating socket ID');
          
          // Update the player's socket ID
          const updatedPlayers = roomData.players.map(p => 
            p.id === playerId ? { ...p, socketId: socket.id } : p
          );
          
          await roomRef.update({ players: updatedPlayers });
          
          // Join socket room
          socket.join(roomCode);
          
          // Send current room state to the player
          const updatedRoomData = { ...roomData, players: updatedPlayers };
          socket.emit('roomState', updatedRoomData);
          return;
        }

        // Create the player object with ISO string date
        const playerData = {
          id: playerId,
          name: playerName,
          socketId: socket.id,
          isLeader: false,
          isReady: false,
          joinedAt: new Date().toISOString()
        };

        // Add player to the room
        await roomRef.update({
          players: admin.firestore.FieldValue.arrayUnion(playerData)
        });

        console.log('Player added to room:', roomCode);

        // Join socket room
        socket.join(roomCode);
        
        // Get updated room data
        const updatedRoom = await roomRef.get();
        const updatedRoomData = updatedRoom.data();
        
        // Notify everyone in the room about the new player
        io.to(roomCode).emit('playerJoined', {
          id: playerId,
          name: playerName
        });

        // Send updated room state to ALL players in the room
        io.to(roomCode).emit('roomState', updatedRoomData);
        console.log('Sent room state to all players');

      } catch (error) {
        console.error('Error joining room:', error.message, error.stack);
        socket.emit('roomError', 'Failed to join room: ' + error.message);
      }
    });

    // Create a room
    socket.on('createRoom', async ({ roomName, hostName, hostId, customCode }) => {
      try {
        console.log('Creating room with data:', { roomName, hostName, hostId, customCode });
        
        // Use the custom code if provided, otherwise generate a random 6-character room code
        const roomCode = customCode || Math.random().toString(36).substring(2, 8).toUpperCase();
        console.log('Using room code:', roomCode);
        
        // Check if the room already exists
        const existingRoom = await db.collection('rooms').doc(roomCode).get();
        if (existingRoom.exists) {
          console.log('Room already exists with this code');
          socket.emit('roomError', 'Room code already in use. Please try again.');
          return;
        }
        
        // Create room document in Firestore
        const roomData = {
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
            joinedAt: new Date().toISOString() // Use ISO string instead of serverTimestamp
          }]
        };
        
        await db.collection('rooms').doc(roomCode).set(roomData);
        console.log('Room created successfully with code:', roomCode);

        // Join socket room
        socket.join(roomCode);
        
        // Send room info back to host
        socket.emit('roomCreated', { roomCode });
        
        // Also immediately send room state
        socket.emit('roomState', roomData);
        
      } catch (error) {
        console.error('Error creating room:', error.message, error.stack);
        socket.emit('roomError', 'Failed to create room: ' + error.message);
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

    // Handle request for room state
    socket.on('requestRoomState', async ({ roomCode }) => {
      try {
        const roomRef = db.collection('rooms').doc(roomCode);
        const roomDoc = await roomRef.get();
        
        if (!roomDoc.exists) {
          socket.emit('roomError', 'Room does not exist');
          return;
        }
        
        // Send current room state
        socket.emit('roomState', roomDoc.data());
      } catch (error) {
        console.error('Error requesting room state:', error);
        socket.emit('roomError', 'Failed to get room state');
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log('User disconnected:', socket.id);
      
      try {
        // Find rooms where this socket is a player
        const roomsQuery = await db.collection('rooms').get();
        
        if (roomsQuery.empty) return;
        
        // Update each room the user was in
        for (const doc of roomsQuery.docs) {
          const roomData = doc.data();
          if (!roomData.players) continue;
          
          const playerIndex = roomData.players.findIndex(p => p.socketId === socket.id);
          
          if (playerIndex !== -1) {
            const player = roomData.players[playerIndex];
            console.log(`Found player ${player.name} in room ${roomData.roomCode}`);
            
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
            console.log(`Player ${player.name} removed from room ${roomData.roomCode}`);
            
            // If room is empty, delete it after some time
            if (roomData.players.length === 0) {
              console.log(`Room ${roomData.roomCode} is now empty, scheduling deletion`);
              setTimeout(async () => {
                try {
                  const currentRoom = await doc.ref.get();
                  if (currentRoom.exists && currentRoom.data().players.length === 0) {
                    await doc.ref.delete();
                    console.log(`Empty room ${roomData.roomCode} deleted`);
                  }
                } catch (err) {
                  console.error(`Error deleting empty room ${roomData.roomCode}:`, err);
                }
              }, 3600000); // 1 hour
            }
          }
        }
      } catch (error) {
        console.error('Error handling disconnect:', error.message, error.stack);
      }
    });

    // Handle game start
    socket.on('startGame', async ({ roomCode }) => {
      try {
        console.log(`Starting game for room ${roomCode}`);
        
        if (!roomCode) {
          socket.emit('roomError', 'No room code provided');
          return;
        }
        
        const roomRef = db.collection('rooms').doc(roomCode);
        const roomDoc = await roomRef.get();
        
        if (!roomDoc.exists) {
          socket.emit('roomError', 'Room does not exist');
          return;
        }
        
        // Update game state to indicate game has started
        await roomRef.update({
          'gameState.stage': 'game',
          'gameState.startTime': new Date().toISOString()
        });
        
        // Get updated room data
        const updatedRoom = await roomRef.get();
        
        // Broadcast to ALL players in the room that the game has started
        io.to(roomCode).emit('gameStarted', {
          gameCode: roomCode,
          startTime: new Date().toISOString(),
          team: {
            name: updatedRoom.data().roomName,
            agents: updatedRoom.data().players.length
          }
        });
        
        // Also update room state
        io.to(roomCode).emit('roomState', updatedRoom.data());
        
        console.log(`Game started successfully for room ${roomCode}`);
      } catch (error) {
        console.error('Error starting game:', error.message, error.stack);
        socket.emit('roomError', 'Failed to start game: ' + error.message);
      }
    });

    // Handle trigger video for all players
    socket.on('triggerVideo', ({ roomCode }) => {
      try {
        if (!roomCode) {
          socket.emit('roomError', 'No room code provided');
          return;
        }
        
        console.log(`Triggering video for room ${roomCode}`);
        
        // Broadcast to ALL players in the room to show the video
        io.to(roomCode).emit('showVideo');
        
        console.log(`Video triggered successfully for room ${roomCode}`);
      } catch (error) {
        console.error('Error triggering video:', error.message, error.stack);
        socket.emit('roomError', 'Failed to trigger video: ' + error.message);
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