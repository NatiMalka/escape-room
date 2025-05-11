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
 * @property {boolean} shouldShowVideo - Whether to show the hacker video
 * @property {function(boolean): void} setShouldShowVideo - Function to update shouldShowVideo state
 * @property {function(string): boolean} amILeader - Function to check if given ID is leader
 * @property {function(string, string, string, string=): void} createRoom - Create a new room
 * @property {function(string, string, string): void} joinRoom - Join an existing room
 * @property {function(string): void} setNewLeader - Set a new leader
 * @property {function(string): void} toggleReady - Toggle player ready status
 * @property {function(Object): void} updateGameState - Update game state
 * @property {function(string, string): void} syncLoginInput - Sync login input
 * @property {function(string): void} syncTerminalInput - Sync terminal input
 * @property {function(number): void} syncCursorPosition - Sync cursor position
 * @property {function(): void} startGame - Start the game for all players in the room
 * @property {function(): void} triggerVideoForAll - Trigger video for all players
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
  // Add state for video display
  const [shouldShowVideo, setShouldShowVideo] = useState(false);

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
      console.error('Socket room error:', message);
      setError(message);
    });

    socketInstance.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      setError(`Connection error: ${err.message}. Please check your network.`);
    });

    socketInstance.on('connect_timeout', () => {
      console.error('Socket connection timeout');
      setError('Connection timed out. Please try again.');
    });

    socketInstance.on('reconnect', (attemptNumber) => {
      console.log(`Socket reconnected after ${attemptNumber} attempts`);
      setIsConnected(true);
      setError(null);
    });

    socketInstance.on('reconnect_error', (err) => {
      console.error('Socket reconnection error:', err.message);
      setError(`Reconnection failed: ${err.message}. Please refresh the page.`);
    });

    socketInstance.on('reconnect_failed', () => {
      console.error('Socket reconnection failed after multiple attempts');
      setError('Failed to reconnect after multiple attempts. Please refresh the page.');
    });

    socketInstance.on('roomCreated', ({ roomCode }) => {
      console.log('Room created:', roomCode);
      setCurrentRoom(roomCode);
      setError(null);
      
      // Request room state after room creation
      setTimeout(() => {
        if (socketInstance.connected) {
          socketInstance.emit('requestRoomState', { roomCode });
        }
      }, 500);
    });

    socketInstance.on('roomState', (data) => {
      console.log('Room state received:', data);
      
      // Ensure we're working with arrays
      const newPlayers = Array.isArray(data.players) ? data.players : [];
      
      // Check if we have new players compared to our current state
      const hadNewPlayers = players.length < newPlayers.length;
      
      // Update state
      setPlayers(newPlayers);
      setGameState(data.gameState || {});
      
      // Set current leader
      const leaderPlayer = newPlayers.find(player => player.isLeader);
      if (leaderPlayer) {
        setLeader(leaderPlayer);
      }
      
      // Log if new players were added
      if (hadNewPlayers) {
        console.log(`Room updated: ${newPlayers.length} players now connected`);
      }
      
      setError(null);
    });

    socketInstance.on('playerJoined', ({ id, name }) => {
      console.log(`Player joined: ${name} (${id})`);
      // Request a fresh room state whenever a player joins
      if (currentRoom) {
        setTimeout(() => {
          socketInstance.emit('requestRoomState', { roomCode: currentRoom });
        }, 500);
      }
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

    // Add a listener for the showVideo event
    socketInstance.on('showVideo', () => {
      console.log('Received show video event');
      setShouldShowVideo(true);
    });

    // Handle game started notification
    socketInstance.on('gameStarted', (gameData) => {
      console.log('Game started!', gameData);
      
      // Store mission data in localStorage so it persists between pages
      localStorage.setItem('escapeRoomTeam', JSON.stringify({
        team: gameData.team,
        gameCode: gameData.gameCode,
        startTime: gameData.startTime,
        connectedAgents: gameData.team.agents
      }));
      
      // Navigate to game page
      window.location.href = '/game';
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
      console.log('Emitting joinRoom event:', { roomCode, playerName, playerId });
      
      // Clear any existing errors
      setError(null);
      
      // Set the current room immediately to avoid race conditions
      setCurrentRoom(roomCode);
      
      socket.emit('joinRoom', { roomCode, playerName, playerId });
      
      // Request room state as a fallback
      setTimeout(() => {
        if (socket.connected && currentRoom === roomCode) {
          console.log('Requesting room state as fallback');
          socket.emit('requestRoomState', { roomCode });
        }
      }, 1000);
    } else {
      console.error('Cannot join room: socket not connected');
      setError('Cannot join room: not connected to server');
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

  // Add a function to trigger the video for all players
  const triggerVideoForAll = () => {
    if (socket && isConnected && currentRoom) {
      console.log(`Emitting showVideo event for room: ${currentRoom}`);
      socket.emit('triggerVideo', { roomCode: currentRoom });
      // Also show video for the current client
      setShouldShowVideo(true);
    } else {
      console.error('Cannot trigger video: socket not connected or no room joined');
      setError('Cannot trigger video: connection issues or no room joined');
    }
  };

  // Updated startGame to ONLY show video - actual game start will be triggered after video ends
  const startGame = () => {
    if (socket && isConnected && currentRoom) {
      console.log('Starting game process: first showing video to all players');
      // Just trigger the video - the actual game start will be triggered by the host
      // after the video ends (in the handleVideoEnded function in lobby/page.tsx)
      triggerVideoForAll();
    } else {
      console.error('Cannot start game: socket not connected or no room joined');
      setError('Cannot start game: connection issues or no room joined');
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
    shouldShowVideo,
    setShouldShowVideo,
    amILeader: (myId) => leader?.id === myId,
    createRoom,
    joinRoom,
    setNewLeader,
    toggleReady,
    updateGameState,
    syncLoginInput,
    syncTerminalInput,
    syncCursorPosition,
    startGame,
    triggerVideoForAll
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}; 