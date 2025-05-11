'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

/**
 * @typedef {Object} Player
 * @property {string} id - Player unique identifier
 * @property {string} name - Player name
 * @property {string} socketId - Socket connection ID
 * @property {boolean} isLeader - Whether this player is the leader
 * @property {boolean} [isHost] - Whether this player is the host
 * @property {boolean} [isReady] - Whether this player is ready
 * @property {any} joinedAt - Firebase timestamp
 */

/**
 * @typedef {Object} SocketContextType
 * @property {any} socket - Socket.io instance
 * @property {boolean} isConnected - Whether socket is connected
 * @property {string|null} currentRoom - Current room code
 * @property {Player[]} players - Array of players in the room
 * @property {Player|null} leader - Current leader player
 * @property {Object|null} gameState - Current game state
 * @property {string|null} error - Current error message
 * @property {function(string): boolean} amILeader - Function to check if given ID is leader
 * @property {function(string, string, string, string=): void} createRoom - Create a new room
 * @property {function(string, string, string): void} joinRoom - Join an existing room
 * @property {function(string): void} setNewLeader - Set a new leader
 * @property {function(string): void} toggleReady - Toggle player ready status
 * @property {function(Object): void} updateGameState - Update game state
 * @property {function(string, string): void} syncLoginInput - Sync login input
 * @property {function(string): void} syncTerminalInput - Sync terminal input
 * @property {function(number): void} syncCursorPosition - Sync cursor position
 */

/** @type {React.Context<SocketContextType|null>} */
const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);
  /** @type {[Player[], Function]} */
  const [players, setPlayers] = useState([]);
  const [leader, setLeader] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only create the socket connection once in the client
    const socketInstance = io(
      process.env.NODE_ENV === 'production' 
        ? 'https://escape-room-bb563.web.app' 
        : 'http://localhost:3000',
      { autoConnect: true }
    );

    setSocket(socketInstance);

    // Set up event listeners
    socketInstance.on('connect', () => {
      console.log('Connected to WebSocket server');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      setIsConnected(false);
    });

    socketInstance.on('roomError', (message) => {
      setError(message);
    });

    socketInstance.on('roomCreated', ({ roomCode }) => {
      setCurrentRoom(roomCode);
      setError(null);
    });

    socketInstance.on('roomState', (data) => {
      setPlayers(data.players || []);
      setGameState(data.gameState || {});
      
      // Set current leader
      const leaderPlayer = data.players.find(player => player.isLeader);
      if (leaderPlayer) {
        setLeader(leaderPlayer);
      }
      
      setError(null);
    });

    socketInstance.on('playerJoined', ({ id, name }) => {
      console.log(`Player joined: ${name}`);
      // We'll get the full room state in a separate event
    });

    socketInstance.on('playerLeft', ({ id, name }) => {
      console.log(`Player left: ${name}`);
      // We'll get the full room state in a separate event
    });

    socketInstance.on('leaderChanged', ({ leaderId }) => {
      // Update the local leader state
      const newLeader = players.find(player => player.id === leaderId);
      if (newLeader) {
        setLeader(newLeader);
      }
    });

    socketInstance.on('gameStateUpdated', (newState) => {
      setGameState(newState);
    });

    // Login screen input synchronization
    socketInstance.on('loginInputUpdated', ({ field, value }) => {
      // This will be handled by individual components that need to
      // update their UI based on leader's input
    });

    // Terminal input synchronization
    socketInstance.on('terminalInputUpdated', ({ input }) => {
      // This will be handled by individual components that need to
      // update their UI based on leader's terminal input
    });

    // Cursor position synchronization
    socketInstance.on('cursorPositionUpdated', ({ position }) => {
      // This will be handled by individual components that need to
      // update their UI based on leader's cursor position
    });

    // Clean up on component unmount
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, []);

  // Update players whenever the socket changes its players
  useEffect(() => {
    if (currentRoom && players.length > 0) {
      const leaderPlayer = players.find(player => player.isLeader);
      if (leaderPlayer) {
        setLeader(leaderPlayer);
      }
    }
  }, [currentRoom, players]);

  // Methods for interacting with the socket
  const createRoom = (roomName, hostName, hostId, customCode) => {
    if (socket && isConnected) {
      socket.emit('createRoom', { roomName, hostName, hostId, customCode });
    }
  };

  const joinRoom = (roomCode, playerName, playerId) => {
    if (socket && isConnected) {
      socket.emit('joinRoom', { roomCode, playerName, playerId });
      setCurrentRoom(roomCode);
    }
  };

  const setNewLeader = (playerId) => {
    if (socket && isConnected && currentRoom) {
      socket.emit('setLeader', { roomCode: currentRoom, playerId });
    }
  };

  const toggleReady = (playerId) => {
    if (socket && isConnected && currentRoom) {
      socket.emit('toggleReady', { roomCode: currentRoom, playerId });
    }
  };

  const updateGameState = (newState) => {
    if (socket && isConnected && currentRoom) {
      socket.emit('updateGameState', { 
        roomCode: currentRoom, 
        gameState: { ...gameState, ...newState } 
      });
      setGameState({ ...gameState, ...newState });
    }
  };

  const syncLoginInput = (field, value) => {
    if (socket && isConnected && currentRoom) {
      socket.emit('loginInput', { roomCode: currentRoom, field, value });
    }
  };

  const syncTerminalInput = (input) => {
    if (socket && isConnected && currentRoom) {
      socket.emit('terminalInput', { roomCode: currentRoom, input });
    }
  };

  const syncCursorPosition = (position) => {
    if (socket && isConnected && currentRoom) {
      socket.emit('cursorPosition', { roomCode: currentRoom, position });
    }
  };

  // Values to be exposed in the context
  const value = {
    socket,
    isConnected,
    currentRoom,
    players,
    leader,
    gameState,
    error,
    amILeader: (myId) => leader?.id === myId,
    createRoom,
    joinRoom,
    setNewLeader,
    toggleReady,
    updateGameState,
    syncLoginInput,
    syncTerminalInput,
    syncCursorPosition
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}; 