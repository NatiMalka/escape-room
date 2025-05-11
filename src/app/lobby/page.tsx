'use client';

import { useState, useEffect, useRef } from 'react';
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
    amILeader,
    startGame,
    shouldShowVideo,
    setShouldShowVideo,
    socket
  } = useSocket();
  
  const [playerName, setPlayerName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [hasJoinedRoom, setHasJoinedRoom] = useState(false);
  const [showSkipButton, setShowSkipButton] = useState(false);
  const [votingActive, setVotingActive] = useState(false);
  const [votedForId, setVotedForId] = useState<string | null>(null);
  const [startingGame, setStartingGame] = useState(false);
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [videoCompleted, setVideoCompleted] = useState(false);
  
  // Video ref for controlling video
  const videoRef = useRef<HTMLVideoElement>(null);
  
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
          setIsHost(true);
          
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
            
            console.log('Found join data:', joinRoomData);
            
            // Make sure we have a player ID
            if (!playerId) {
              const newId = uuidv4();
              setPlayerId(newId);
              
              // Store in local storage and try again on next render
              localStorage.setItem('playerInfo', JSON.stringify({ 
                id: newId,
                name: joinRoomData.playerName 
              }));
              return;
            }
            
            // Update local state
            setPlayerName(joinRoomData.playerName);
            setRoomCode(joinRoomData.roomCode);
            
            console.log('Joining room with:', {
              roomCode: joinRoomData.roomCode,
              playerName: joinRoomData.playerName,
              playerId
            });
            
            // Store player name in playerInfo
            localStorage.setItem('playerInfo', JSON.stringify({ 
              id: playerId,
              name: joinRoomData.playerName 
            }));
            
            // Join the room
            if (typeof joinRoom === 'function') {
              joinRoom(joinRoomData.roomCode, joinRoomData.playerName, playerId);
              setHasJoinedRoom(true);
              
              // Clear the join room data after using it
              localStorage.removeItem('joinRoomData');
            } else {
              console.error('joinRoom function is not available');
            }
          }
        }
      } catch (error) {
        console.error('Failed to process room data:', error);
      }
    }
  }, [isConnected, currentRoom, hasJoinedRoom, playerId, joinRoom]);
  
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
    
    // Use the socket context's startGame function to broadcast to all players
    if (typeof startGame === 'function') {
      startGame();
    } else {
      console.error('startGame function is not available');
    }
  };
  
  // Handle video end
  const handleVideoEnded = () => {
    console.log('Video ended, starting game for everyone');
    setVideoCompleted(true);
    
    // Only proceed to start the game if we're not already in process
    if (!window.location.pathname.includes('/game')) {
      // Manually trigger startGame via socket if we're the host
      if (isHost) {
        console.log('Host is starting game after video completed');
        // Use socket directly to send startGame event
        if (socket && isConnected && currentRoom) {
          // Exit fullscreen if needed
          try {
            if (document.fullscreenElement) {
              document.exitFullscreen().catch(err => {
                console.error('Error exiting fullscreen:', err);
              });
            }
          } catch (err) {
            console.error('Error checking fullscreen state:', err);
          }
          
          // Short delay to allow fullscreen exit
          setTimeout(() => {
            socket.emit('startGame', { roomCode: currentRoom });
            setShouldShowVideo(false);
          }, 500);
        }
      }
    }
  };
  
  // Skip video (for testing or if user wants to skip)
  const handleSkipVideo = () => {
    setVideoCompleted(true);
    
    // Only trigger game start if we're the host
    if (isHost) {
      console.log('Host is skipping video, starting game for everyone');
      
      // Exit fullscreen if needed
      try {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(err => {
            console.error('Error exiting fullscreen:', err);
          });
        }
      } catch (err) {
        console.error('Error checking fullscreen state:', err);
      }
      
      if (socket && isConnected && currentRoom) {
        socket.emit('startGame', { roomCode: currentRoom });
        setShouldShowVideo(false);
      }
    } else {
      // For non-hosts, just hide the video
      setShouldShowVideo(false);
    }
  };
  
  // Show skip button after 3 seconds
  useEffect(() => {
    if (shouldShowVideo) {
      const timer = setTimeout(() => {
        setShowSkipButton(true);
      }, 3000);
      
      return () => clearTimeout(timer);
    } else {
      setShowSkipButton(false);
    }
  }, [shouldShowVideo]);

  // Try to play the video once loaded
  useEffect(() => {
    if (shouldShowVideo && videoRef.current) {
      console.log('Attempting to play video');
      
      // Add event listener to play when data is loaded
      const videoElement = videoRef.current;
      const playVideo = () => {
        console.log('Video data loaded, attempting to play');
        videoElement.play()
          .then(() => console.log('Video playing successfully'))
          .catch(err => console.error('Error playing video:', err));
      };
      
      videoElement.addEventListener('loadeddata', playVideo);
      
      // Also try to play immediately
      const playPromise = videoElement.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Video started playing immediately');
          })
          .catch(error => {
            console.error('Error playing video immediately:', error);
          });
      }
      
      return () => {
        videoElement.removeEventListener('loadeddata', playVideo);
      };
    }
  }, [shouldShowVideo]);

  // Add a log whenever shouldShowVideo changes
  useEffect(() => {
    console.log('shouldShowVideo changed:', shouldShowVideo);
  }, [shouldShowVideo]);

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
      setHasJoinedRoom(true);
    } 
  };
  
  const handleCreateWithCustomCode = (roomName: string, hostName: string, hostId: string, customCode: string) => {
    if (typeof createRoom === 'function') {
      createRoom(roomName, hostName, hostId, customCode);
      setRoomCode(customCode);
      setHasJoinedRoom(true);
    }
  };
  
  // Add an error message displayed to the user for debugging purposes
  useEffect(() => {
    if (error) {
      console.error('Room error:', error);
    }
  }, [error]);
  
  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    // Functionality moved to homepage
  };
  
  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    // Functionality moved to homepage
  };
  
  const handleVoteForLeader = (id: string) => {
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

  // Add a sort function to sort players by join time
  const sortPlayersByJoinTime = (playerList: Player[]) => {
    if (!playerList || !Array.isArray(playerList)) return [];
    
    return [...playerList].sort((a, b) => {
      // Handle different timestamp formats
      const timeA = a.joinedAt ? 
        (typeof a.joinedAt === 'string' ? new Date(a.joinedAt).getTime() : a.joinedAt.toDate?.().getTime() || 0) 
        : 0;
      
      const timeB = b.joinedAt ? 
        (typeof b.joinedAt === 'string' ? new Date(b.joinedAt).getTime() : b.joinedAt.toDate?.().getTime() || 0) 
        : 0;
      
      return timeA - timeB;
    });
  };

  // Add a function to request room state
  const requestRoomState = () => {
    if (isConnected && currentRoom) {
      console.log('Manually requesting room state for:', currentRoom);
      if (typeof joinRoom === 'function') {
        // Re-use existing join information as a way to refresh
        joinRoom(currentRoom, playerName || 'Player', playerId);
      }
    }
  };

  // Add an effect to automatically request room state if we're connected but don't have players
  useEffect(() => {
    if (isConnected && currentRoom && hasJoinedRoom && (!players || players.length === 0)) {
      console.log('No players detected, requesting room state');
      const timer = setTimeout(() => {
        requestRoomState();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isConnected, currentRoom, hasJoinedRoom, players]);

  // Add an effect to periodically refresh the room state
  useEffect(() => {
    if (isConnected && currentRoom && hasJoinedRoom) {
      console.log('Setting up periodic room state refresh');
      
      // Refresh every 5 seconds
      const refreshInterval = setInterval(() => {
        if (typeof joinRoom === 'function') {
          console.log('Periodic room state refresh');
          // Use requestRoomState instead of re-joining
          requestRoomState();
        }
      }, 5000);
      
      return () => {
        clearInterval(refreshInterval);
      };
    }
  }, [isConnected, currentRoom, hasJoinedRoom]);

  // If already joined a room, show the waiting room
  if (hasJoinedRoom && currentRoom) {
    // Get current player details
    const currentPlayer = players && Array.isArray(players) 
      ? players.find((p: Player) => p.id === playerId) 
      : undefined;
    
    const canStartGame = players && Array.isArray(players) && players.length > 1;
    
    // Sort players by join time
    const sortedPlayers = sortPlayersByJoinTime(players);
    
    // Video overlay
    if (shouldShowVideo) {
      return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
          <div className="text-white text-xl font-bold mb-6">
            INCOMING TRANSMISSION...
          </div>
          <div className="w-full h-screen bg-black flex items-center justify-center">
            <video
              ref={videoRef}
              src={`/Hacker Computer  Mask Criminal.mp4`}
              className="w-full h-full object-contain"
              autoPlay
              playsInline
              muted={false}
              loop={false}
              preload="auto"
              onLoadedData={() => {
                console.log('Video data loaded from onLoadedData prop');
                if (videoRef.current) {
                  // Request fullscreen
                  try {
                    const videoElement = videoRef.current;
                    // Play first, then request fullscreen after a short delay
                    videoElement.play()
                      .then(() => {
                        console.log('Video playing from onLoadedData');
                        // Short delay to ensure playback has started before going fullscreen
                        setTimeout(() => {
                          if (videoElement.requestFullscreen) {
                            videoElement.requestFullscreen().catch(err => {
                              console.error('Error attempting to enable fullscreen:', err);
                            });
                          } else if ((videoElement as any).webkitRequestFullscreen) {
                            (videoElement as any).webkitRequestFullscreen();
                          } else if ((videoElement as any).msRequestFullscreen) {
                            (videoElement as any).msRequestFullscreen();
                          }
                        }, 1000);
                      })
                      .catch(err => {
                        console.error('Error playing from onLoadedData:', err);
                        // If we can't play automatically, show controls
                        videoElement.controls = true;
                      });
                  } catch (err) {
                    console.error('Fullscreen error:', err);
                    if (videoRef.current) {
                      videoRef.current.controls = true;
                    }
                  }
                }
              }}
              onEnded={handleVideoEnded}
              onClick={() => {
                // On video click, try to play if it's paused
                if (videoRef.current && videoRef.current.paused) {
                  videoRef.current.play().catch(err => {
                    console.error('Error playing video on click:', err);
                  });
                }
              }}
              style={{ maxHeight: '100vh' }}
            />
          </div>
          
          {showSkipButton && isHost && (
            <button 
              onClick={handleSkipVideo}
              className="fixed bottom-6 right-6 px-6 py-3 bg-red-700 hover:bg-red-600 text-white rounded-md text-lg font-medium z-50"
            >
              Skip Transmission
            </button>
          )}
          
          <div className="fixed bottom-6 left-6 text-sm text-gray-400 max-w-md z-50">
            This transmission contains critical mission information. Please watch the entire video.
          </div>
        </div>
      );
    }
    
    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        <div className="bg-gray-900 p-4 border-b border-blue-900/50">
          <div className="container mx-auto">
            <h1 className="text-2xl font-bold text-blue-500">SYSTEM BREACH - LOBBY</h1>
          </div>
        </div>
        
        <div className="flex-1 container mx-auto p-6">
          <div className="bg-gray-900/50 p-6 rounded-lg border border-blue-900/50 mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-6">
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2 text-blue-400">{roomName || `Room ${currentRoom}`}</h2>
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <p className="text-gray-400">
                    {isConnected ? 'Connected to server' : 'Connecting...'}
                  </p>
                </div>
              </div>
              
              <div className="w-full md:w-auto bg-gray-800/70 p-4 rounded-md border border-blue-900/50 flex flex-col">
                <p className="text-center mb-2 font-medium">JOIN CODE</p>
                <div className="flex items-center gap-3 justify-center">
                  <div className="font-mono text-lg md:text-xl text-yellow-400 bg-gray-900/70 px-4 py-2 rounded-md tracking-wider border border-gray-700">
                    {currentRoom}
                  </div>
                  <button 
                    onClick={handleCopyRoomCode} 
                    className="bg-blue-900 hover:bg-blue-800 text-white py-2 px-3 rounded-md flex items-center text-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </button>
                </div>
                {showCopiedMessage && (
                  <p className="text-green-400 text-xs mt-2 text-center">Copied to clipboard!</p>
                )}
                <button
                  onClick={requestRoomState}
                  className="mt-2 text-xs text-blue-400 hover:text-blue-300 flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh Connection
                </button>
              </div>
            </div>
            
            {/* Players list */}
            <div className="mb-8">
              <h3 className="text-lg font-bold mb-4 text-blue-300 flex items-center">
                <span>PLAYERS</span>
                <span className="ml-2 bg-blue-900/50 text-xs px-2 py-0.5 rounded-full">
                  {sortedPlayers.length} CONNECTED
                </span>
                <span className="ml-2 text-xs text-gray-400">
                  (auto-refreshes every 5s)
                </span>
              </h3>
              
              <div className="space-y-2">
                {sortedPlayers.map((player: Player) => {
                  // Format join time
                  const joinTime = player.joinedAt ? 
                    (typeof player.joinedAt === 'string' ? 
                      new Date(player.joinedAt) : 
                      player.joinedAt.toDate?.()) : 
                    null;
                  
                  const joinTimeDisplay = joinTime ? 
                    joinTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 
                    'Unknown';
                  
                  return (
                    <div key={player.id} className="flex items-center justify-between bg-gray-800/70 p-3 rounded-md border border-gray-700/50">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2 bg-green-500"></div>
                        <span className="font-medium">{player.name}</span>
                        {player.isHost && <span className="ml-2 text-xs bg-blue-900/50 px-2 py-0.5 rounded text-blue-400">HOST</span>}
                      </div>
                      <div className="text-xs text-gray-400">
                        Joined at {joinTimeDisplay}
                      </div>
                    </div>
                  );
                })}
                
                {(!sortedPlayers || sortedPlayers.length === 0) && (
                  <div className="bg-gray-800/40 p-4 rounded-md text-center text-gray-400 italic">
                    No players have joined yet
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-gray-800/50 p-4 rounded-md mb-8 border border-blue-900/30">
              <p className="text-gray-300">
                Share the join code with other players so they can join your mission.
              </p>
            </div>
            
            {/* Action buttons */}
            <div className="flex justify-between items-center">
              <Link href="/" className="text-blue-400 hover:text-blue-300">
                Back to Home
              </Link>
              
              {isHost && (
                <button
                  onClick={handleStartGame}
                  disabled={!canStartGame || startingGame}
                  className={`px-6 py-3 rounded-md font-bold ${
                    !canStartGame || startingGame
                      ? 'bg-gray-700 cursor-not-allowed' 
                      : 'bg-green-700 hover:bg-green-600'
                  }`}
                >
                  {startingGame ? 'Starting...' : 'Start Game'}
                </button>
              )}
            </div>
            
            {isHost && !canStartGame && (
              <p className="text-yellow-400 text-sm mt-2 text-center">
                At least one more player needs to join before you can start the game
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Loading state while connecting
  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white text-xl">Connecting to server...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black p-4">
        <div className="max-w-md w-full bg-gray-900/80 backdrop-blur-sm rounded-lg p-6 border border-red-900/50">
          <h2 className="text-xl font-bold mb-4 text-red-400">Connection Error</h2>
          <p className="text-white mb-4">{error}</p>
          <div className="bg-gray-800/70 p-4 rounded-md mb-6 text-sm text-gray-400">
            <p className="mb-2">Troubleshooting tips:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Check if the server is running</li>
              <li>Try creating a room with a different code</li>
              <li>Refresh the page and try again</li>
              <li>Clear your browser cache and cookies</li>
            </ul>
          </div>
          <div className="flex gap-3">
            <Link href="/" className="flex-1 block py-3 bg-blue-700 hover:bg-blue-600 text-white font-bold rounded-md text-center">
              Back to Home
            </Link>
            <button 
              onClick={() => {
                // Clear storage and reload
                localStorage.removeItem('createRoomData');
                localStorage.removeItem('joinRoomData');
                window.location.reload();
              }}
              className="py-3 px-4 bg-green-700 hover:bg-green-600 rounded-md text-white"
            >
              Reset & Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default: Show loading state
  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="max-w-md w-full">
        <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-6 border border-blue-900/50">
          <h2 className="text-xl font-bold mb-4 text-center text-blue-400">Connecting to Lobby</h2>
          <div className="flex justify-center items-center my-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
          <p className="text-center text-gray-400 mb-6">Please wait while we connect you to the game lobby...</p>
          
          <div className="text-center">
            <button
              onClick={() => {
                // Clear localStorage and reload
                localStorage.removeItem('joinRoomData');
                window.location.reload();
              }}
              className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-sm rounded-md inline-flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Retry Connection
            </button>
          </div>
          
          <div className="mt-4 border-t border-gray-800 pt-4">
            <p className="text-center text-xs text-gray-500">Connection taking too long? Try going back and creating a new game instead.</p>
            <div className="mt-3 text-center">
              <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm">
                &larr; Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 