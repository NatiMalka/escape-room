'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSocket } from '@/context/SocketContext';
import { v4 as uuidv4 } from 'uuid';

interface Player {
  id: string;
  name: string;
  socketId: string;
  isLeader: boolean;
  isHost?: boolean;
  isReady?: boolean;
  joinedAt: any; // Firebase timestamp
  votes?: number;
}

// Add interface for createRoomData
interface CreateRoomData {
  roomName: string;
  hostName: string;
  hostId: string;
  customCode?: string;
}

// Add interface for joinRoomData
interface JoinRoomData {
  roomCode: string;
  playerName: string;
}

export default function Lobby() {
  const router = useRouter();
  const { 
    currentRoom, 
    players, 
    leader, 
    error, 
    isConnected,
    createRoom, 
    joinRoom,
    setNewLeader,
    toggleReady,
    amILeader 
  } = useSocket();
  
  const [playerName, setPlayerName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [hasJoinedRoom, setHasJoinedRoom] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [showSkipButton, setShowSkipButton] = useState(false);
  const [votingActive, setVotingActive] = useState(false);
  const [votedForId, setVotedForId] = useState<string | null>(null);
  const [startingGame, setStartingGame] = useState(false);
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  
  // Generate a player ID on initial render if not already in localStorage
  useEffect(() => {
    let storedId = '';
    
    try {
      const playerInfo = localStorage.getItem('playerInfo');
      if (playerInfo) {
        const parsed = JSON.parse(playerInfo);
        storedId = parsed.id;
        setPlayerId(storedId);
        setPlayerName(parsed.name || '');
      }
    } catch (error) {
      console.error('Failed to parse player info:', error);
    }
    
    if (!storedId) {
      const newId = uuidv4();
      setPlayerId(newId);
      localStorage.setItem('playerInfo', JSON.stringify({ id: newId }));
    }
  }, []);

  // Check for createRoomData from setup page and join automatically
  useEffect(() => {
    if (isConnected && !hasJoinedRoom && !currentRoom) {
      try {
        const createRoomDataString = localStorage.getItem('createRoomData');
        if (createRoomDataString) {
          const createRoomData: CreateRoomData = JSON.parse(createRoomDataString);
          
          // Update local state with values from createRoomData
          setRoomName(createRoomData.roomName);
          setPlayerName(createRoomData.hostName);
          setPlayerId(createRoomData.hostId);
          
          // Store player name in playerInfo
          localStorage.setItem('playerInfo', JSON.stringify({ 
            id: createRoomData.hostId,
            name: createRoomData.hostName 
          }));
          
          // Create room using stored data
          if (createRoomData.customCode) {
            handleCreateWithCustomCode(
              createRoomData.roomName,
              createRoomData.hostName,
              createRoomData.hostId,
              createRoomData.customCode
            );
          } else {
            handleCreateWithRandomCode(
              createRoomData.roomName,
              createRoomData.hostName,
              createRoomData.hostId
            );
          }
          
          // Clear the create room data after using it
          localStorage.removeItem('createRoomData');
        } else {
          // Check for joinRoomData if no createRoomData exists
          const joinRoomDataString = localStorage.getItem('joinRoomData');
          if (joinRoomDataString) {
            const joinRoomData: JoinRoomData = JSON.parse(joinRoomDataString);
            
            // Update local state
            setPlayerName(joinRoomData.playerName);
            setRoomCode(joinRoomData.roomCode);
            
            // Store player name in playerInfo
            if (playerId) {
              localStorage.setItem('playerInfo', JSON.stringify({ 
                id: playerId,
                name: joinRoomData.playerName 
              }));
              
              // Join the room
              if (typeof joinRoom === 'function') {
                joinRoom(joinRoomData.roomCode, joinRoomData.playerName, playerId);
                setHasJoinedRoom(true);
              }
            }
            
            // Clear the join room data after using it
            localStorage.removeItem('joinRoomData');
          }
        }
      } catch (error) {
        console.error('Failed to process room data:', error);
      }
    }
  }, [isConnected, currentRoom, hasJoinedRoom, playerId]);
  
  // Store player name when it changes
  useEffect(() => {
    if (playerName && playerId) {
      try {
        const existingInfo = localStorage.getItem('playerInfo');
        const infoObj = existingInfo ? JSON.parse(existingInfo) : { id: playerId };
        infoObj.name = playerName;
        localStorage.setItem('playerInfo', JSON.stringify(infoObj));
      } catch (error) {
        console.error('Failed to update player info:', error);
      }
    }
  }, [playerName, playerId]);
  
  // Handle game start
  const handleStartGame = () => {
    if (!currentRoom) return;
    
    setStartingGame(true);
    
    // Store mission start time and team info in localStorage
    localStorage.setItem('escapeRoomTeam', JSON.stringify({
      team: { name: roomName || `Room ${currentRoom}`, agents: players ? players.length : 0 },
      gameCode: currentRoom,
      startTime: new Date().toISOString(),
      connectedAgents: players ? players.length : 0
    }));
    
    // Navigate to game
    setTimeout(() => {
      router.push('/game');
    }, 1000);
  };

  // Navigate to game when the countdown is complete
  useEffect(() => {
    if (currentRoom && hasJoinedRoom) {
      // Store the room data in localStorage for persistence
      localStorage.setItem('escapeRoomTeam', JSON.stringify({
        team: { name: roomName || `Room ${currentRoom}`, agents: players ? players.length : 0 },
        gameCode: currentRoom,
        startTime: new Date().toISOString(),
        connectedAgents: players ? players.length : 0
      }));
    }
  }, [currentRoom, hasJoinedRoom, roomName, players]);

  const handleCreateWithRandomCode = (roomName: string, hostName: string, hostId: string) => {
    if (typeof createRoom === 'function') {
      createRoom(roomName, hostName, hostId);
      setIsCreatingRoom(false);
      setHasJoinedRoom(true);
    }
  };

  const handleCreateWithCustomCode = (roomName: string, hostName: string, hostId: string, customCode: string) => {
    if (typeof createRoom === 'function') {
      // The server should handle creating with a custom code
      // For now, we'll just use the createRoom function
      createRoom(roomName, hostName, hostId, customCode);
      setIsCreatingRoom(false);
      setHasJoinedRoom(true);
    }
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !roomName.trim()) return;

    handleCreateWithRandomCode(roomName, playerName, playerId);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !roomCode.trim()) return;

    if (typeof joinRoom === 'function') {
      joinRoom(roomCode.toUpperCase(), playerName, playerId);
      setIsJoiningRoom(false);
      setHasJoinedRoom(true);
    }
  };

  const handleVoteForLeader = (id: string) => {
    if (id === playerId) return; // Can't vote for yourself
    
    // In a real implementation, this would send a vote to the server
    // For now, we'll just update the local state
    setVotedForId(id);
  };
  
  const handleStartVoting = () => {
    setVotingActive(true);
  };
  
  const handleEndVoting = () => {
    // In a real implementation, this would tally votes and send to server
    // For now, just end the voting period
    setVotingActive(false);
    setVotedForId(null);
  };
  
  const handleToggleReady = () => {
    if (typeof toggleReady === 'function' && playerId) {
      toggleReady(playerId);
    }
  };
  
  const handleCopyRoomCode = () => {
    if (currentRoom) {
      navigator.clipboard.writeText(currentRoom)
        .then(() => {
          setShowCopiedMessage(true);
          setTimeout(() => setShowCopiedMessage(false), 2000);
        })
        .catch(err => {
          console.error('Failed to copy room code:', err);
        });
    }
  };
  
  // Check if all players are ready
  const areAllPlayersReady = () => {
    if (!players || !Array.isArray(players) || players.length === 0) return false;
    return players.every((player: Player) => player.isReady === true);
  };

  // If already joined a room, show the waiting room
  if (hasJoinedRoom && currentRoom) {
    // Get current player details
    const currentPlayer = players && Array.isArray(players) 
      ? players.find((p: Player) => p.id === playerId) 
      : undefined;
    
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col">
        <div className="bg-black p-4">
          <div className="container mx-auto">
            <h1 className="text-2xl font-bold text-blue-500">TOMAX Security</h1>
          </div>
        </div>
        
        <div className="flex-1 container mx-auto p-6">
          <div className="bg-black/50 p-6 rounded-lg border border-blue-900/50 mb-8">
            <h2 className="text-xl font-bold mb-4">Room: {roomName || `Room ${currentRoom}`}</h2>
            <div className="bg-gray-800/50 p-4 rounded mb-4">
              <div className="flex items-center justify-between">
                <p className="font-mono">Room Code: <span className="text-yellow-400">{currentRoom}</span></p>
                <button 
                  onClick={handleCopyRoomCode} 
                  className="px-3 py-1 bg-blue-900/70 hover:bg-blue-800 rounded-md text-sm ml-4"
                >
                  Copy Code
                </button>
              </div>
              {showCopiedMessage && (
                <p className="text-green-400 text-xs mt-1">Copied to clipboard!</p>
              )}
              <p className="text-sm text-gray-400 mt-2">Share this code with your team members</p>
            </div>
            
            
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-bold">Connected Agents ({players && Array.isArray(players) ? players.length : 0})</h3>
                
                {!votingActive && !leader && players && Array.isArray(players) && players.length > 1 && (
                  <button
                    onClick={handleStartVoting}
                    className="px-3 py-1 bg-blue-700 hover:bg-blue-600 rounded-md text-sm"
                  >
                    Start Leader Vote
                  </button>
                )}
              </div>
              
              <div className="space-y-2">
                {players && Array.isArray(players) && players.map((player: Player) => (
                  <div key={player.id} className="flex items-center justify-between bg-gray-800 p-2 rounded">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${player.isLeader ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                      <span>{player.name}</span>
                      {player.isLeader && <span className="ml-2 text-xs bg-green-900/50 px-2 py-0.5 rounded text-green-400">LEADER</span>}
                      {player.isHost && <span className="ml-2 text-xs bg-blue-900/50 px-2 py-0.5 rounded text-blue-400">HOST</span>}
                      {player.isReady && <span className="ml-2 text-xs bg-yellow-900/50 px-2 py-0.5 rounded text-yellow-400">READY</span>}
                      {votingActive && votedForId === player.id && (
                        <span className="ml-2 text-xs bg-purple-900/50 px-2 py-0.5 rounded text-purple-400">VOTED</span>
                      )}
                    </div>
                    
                    <div className="flex gap-2 items-center">
                      {/* Ready status indicator */}
                      <div className={`h-5 w-5 flex items-center justify-center rounded-full border ${
                        player.isReady 
                          ? 'border-green-500 bg-green-900/30' 
                          : 'border-red-500 bg-red-900/30'
                        }`}
                      >
                        {player.isReady 
                          ? <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          : <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        }
                      </div>

                      {/* Ready toggle button for current player */}
                      {player.id === playerId && (
                        <button
                          onClick={handleToggleReady}
                          className={`px-3 py-1 rounded-md text-xs ${
                            player.isReady 
                              ? 'bg-red-700 hover:bg-red-600 text-white' 
                              : 'bg-green-700 hover:bg-green-600 text-white'
                          }`}
                        >
                          {player.isReady ? 'Not Ready' : 'Ready'}
                        </button>
                      )}
                      
                      {/* Leader vote button */}
                      {votingActive && player.id !== playerId && (
                        <button
                          onClick={() => handleVoteForLeader(player.id)}
                          className={`px-3 py-1 ${
                            votedForId === player.id 
                              ? 'bg-purple-700' 
                              : 'bg-blue-900 hover:bg-blue-800'
                          } rounded-md text-xs`}
                        >
                          {votedForId === player.id ? 'Voted' : 'Vote Leader'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                
                {votingActive && (
                  <div className="mt-4">
                    <button
                      onClick={handleEndVoting}
                      className="px-4 py-2 bg-red-700 hover:bg-red-600 rounded-md text-sm"
                    >
                      End Voting
                    </button>
                  </div>
                )}
              </div>
            
              {/* Ready status progress indicator */}
              {players && Array.isArray(players) && players.length > 0 && (
                <div className="mt-4 p-3 bg-gray-800/70 rounded-md">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">Ready Status:</span>
                    <span className="text-sm">
                      {players.filter(p => p.isReady).length} / {players.length} agents ready
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-green-600 h-full rounded-full transition-all duration-500 ease-in-out"
                      style={{ 
                        width: `${players.filter(p => p.isReady).length / players.length * 100}%`,
                      }}
                    ></div>
                  </div>
                  {players.every(p => p.isReady) ? (
                    <p className="text-green-400 text-xs mt-2 text-center">All agents ready!</p>
                  ) : (
                    <p className="text-yellow-400 text-xs mt-2 text-center">
                      Waiting for {players.length - players.filter(p => p.isReady).length} more agent(s) to be ready
                    </p>
                  )}
                </div>
              )}
            
            <div className="mt-6">
              <p className="mb-4 text-gray-300">
                {leader 
                  ? "The team leader will control inputs during the mission. When everyone is ready, the leader can start the mission."
                  : "Select a team leader before starting the mission. The leader will control inputs while others provide support."
                }
              </p>
              
              {leader && typeof amILeader === 'function' && playerId && amILeader(playerId) && (
                <button
                  onClick={handleStartGame}
                  disabled={startingGame || !areAllPlayersReady()}
                  className={`w-full py-3 rounded-md font-bold ${
                    startingGame 
                      ? 'bg-gray-700 cursor-not-allowed' 
                      : !areAllPlayersReady()
                        ? 'bg-gray-700 cursor-not-allowed'
                        : 'bg-blue-700 hover:bg-blue-600 animate-pulse shadow-[0_0_15px_rgba(37,99,235,0.5)]'
                  }`}
                >
                  {startingGame 
                    ? 'Starting Mission...' 
                    : !areAllPlayersReady()
                      ? 'Waiting for all agents to be ready...'
                      : 'Start Mission'
                  }
                </button>
              )}
              
              {(!leader || typeof amILeader !== 'function' || !playerId || !amILeader(playerId)) && (
                <div className="p-3 bg-gray-800/80 rounded-md text-center">
                  {leader 
                    ? areAllPlayersReady()
                      ? "All agents ready! Waiting for the leader to start the mission..."
                      : "Waiting for the leader to start the mission..."
                    : "Waiting for a team leader to be selected..."
                  }
                </div>
              )}
              
              <div className="mt-3 text-center text-xs text-gray-500">
                <p>All agents must be ready before the mission can start.</p>
                <p className="mt-1">The leader will have control of mission inputs while other agents provide support.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show the initial lobby screen for creating or joining a room
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="bg-black p-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold text-blue-500">TOMAX Security</h1>
        </div>
      </div>
      
      <div className="flex-1 container mx-auto p-6">
        <div className="max-w-3xl mx-auto">
          <div className="p-6 bg-black/50 rounded-lg border border-blue-900/50 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-center">Multiplayer Mission</h2>
            
            <p className="mb-6 text-center text-gray-300">
              Work together as a team to infiltrate the compromised system. One agent will lead the operation while others provide support.
            </p>
            
            {!isCreatingRoom && !isJoiningRoom && (
              <div className="space-y-4">
              <div
                className={`p-4 border rounded-md ${isCreatingRoom ? 'border-blue-500 bg-blue-900/20' : 'border-gray-700 hover:border-blue-700 bg-gray-800/30 hover:bg-gray-800/50'} cursor-pointer transition-colors`}
                onClick={() => {
                  setIsCreatingRoom(true);
                  setIsJoiningRoom(false);
                }}
              >
                <h3 className="text-lg font-bold mb-2">Create a Room</h3>
                <p className="text-sm text-gray-400">Start a new mission and invite other agents to join you.</p>
              </div>
              
              <div
                className={`p-4 border rounded-md ${isJoiningRoom ? 'border-blue-500 bg-blue-900/20' : 'border-gray-700 hover:border-blue-700 bg-gray-800/30 hover:bg-gray-800/50'} cursor-pointer transition-colors`}
                onClick={() => {
                  setIsJoiningRoom(true);
                  setIsCreatingRoom(false);
                }}
              >
                <h3 className="text-lg font-bold mb-2">Join a Room</h3>
                <p className="text-sm text-gray-400">Enter a room code to join an existing mission.</p>
              </div>
            </div>
            )}
            
            {isCreatingRoom && (
              <div className="mt-6 p-4 bg-gray-800/50 rounded-md">
                <h3 className="text-lg font-bold mb-4">Create a New Mission</h3>
                <form onSubmit={handleCreateRoom} className="space-y-4">
                  <div>
                    <label htmlFor="playerName" className="block text-sm text-gray-400 mb-1">Your Name</label>
                    <input
                      id="playerName"
                      type="text"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      className="w-full p-2 bg-gray-900 border border-gray-700 rounded-md focus:outline-none focus:border-blue-500"
                      placeholder="Enter your agent name"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="roomName" className="block text-sm text-gray-400 mb-1">Room Name</label>
                    <input
                      id="roomName"
                      type="text"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      className="w-full p-2 bg-gray-900 border border-gray-700 rounded-md focus:outline-none focus:border-blue-500"
                      placeholder="Name your mission room"
                      required
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full py-2 bg-blue-700 hover:bg-blue-600 rounded-md"
                  >
                    Create Room
                  </button>
                </form>
              </div>
            )}
            
            {isJoiningRoom && (
              <div className="mt-6 p-4 bg-gray-800/50 rounded-md">
                <h3 className="text-lg font-bold mb-4">Join an Existing Mission</h3>
                <form onSubmit={handleJoinRoom} className="space-y-4">
                  <div>
                    <label htmlFor="playerName" className="block text-sm text-gray-400 mb-1">Your Name</label>
                    <input
                      id="playerName"
                      type="text"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      className="w-full p-2 bg-gray-900 border border-gray-700 rounded-md focus:outline-none focus:border-blue-500"
                      placeholder="Enter your agent name"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="roomCode" className="block text-sm text-gray-400 mb-1">Room Code</label>
                    <input
                      id="roomCode"
                      type="text"
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                      className="w-full p-2 bg-gray-900 border border-gray-700 rounded-md focus:outline-none focus:border-blue-500 uppercase"
                      placeholder="Enter 6-character room code"
                      maxLength={6}
                      required
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full py-2 bg-blue-700 hover:bg-blue-600 rounded-md"
                  >
                    Join Room
                  </button>
                </form>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
} 