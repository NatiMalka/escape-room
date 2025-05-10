'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

type TeamData = {
  team: { name: string; agents: number };
  gameCode: string;
  startTime: string;
  connectedAgents: number;
};

type Agent = {
  id: string;
  name: string;
  avatar: number;
  isReady: boolean;
};

export default function Lobby() {
  const router = useRouter();
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [countdown, setCountdown] = useState(5);
  const [isStarting, setIsStarting] = useState(false);
  const [storyPart, setStoryPart] = useState(0);
  const [showStory, setShowStory] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [agentName, setAgentName] = useState('');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [localAgentId, setLocalAgentId] = useState<string | null>(null);

  // Generate random avatar numbers (1-12)
  const randomAvatar = () => Math.floor(Math.random() * 12) + 1;
  
  // Generate a unique ID for agents
  const generateAgentId = () => Math.random().toString(36).substring(2, 15);

  // Story narrative broken into parts
  const storyText = [
    "03:14 AM: Our monitoring system detected a critical security breach in TOMAX's production servers.",
    
    "03:22 AM: An anonymous hacker infiltrated our infrastructure, encrypted several core services, and blocked all user logins.",
    
    "03:58 AM: You are our last line of defense. As a team of elite engineers, analysts, and digital problem-solvers, your mission is critical.",
    
    "NOW: Regain access to the locked system. Investigate the hidden traces. Defuse the digital 'logic bomb' set to go off in 60 minutes. The system is counting on you."
  ];

  // This would normally connect to a backend, but we're simulating with local storage
  const simulateServerInteraction = () => {
    // In a real app, this would be a fetch to a backend API
    const storedData = localStorage.getItem('escapeRoomTeam');
    const storedAgents = localStorage.getItem('escapeRoomAgents');
    
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setTeamData(parsedData);
      } catch (error) {
        console.error('Failed to parse team data:', error);
      }
    }
    
    if (storedAgents) {
      try {
        const parsedAgents = JSON.parse(storedAgents);
        setAgents(parsedAgents);
      } catch (error) {
        console.error('Failed to parse agents data:', error);
      }
    }
  };

  // Load team data on component mount
  useEffect(() => {
    // Get stored agent ID if exists
    const storedAgentId = localStorage.getItem('currentAgentId');
    // Check if joining with a mission code from the home page
    const currentMissionCode = localStorage.getItem('currentMissionCode');
    
    // Set the background music volume to 80%
    const audioElement = document.getElementById('background-music') as HTMLAudioElement;
    if (audioElement) {
      audioElement.volume = 0.8;
    }
    
    if (storedAgentId) {
      setLocalAgentId(storedAgentId);
      setIsJoining(false);
    } else {
      setIsJoining(true);
      
      // If coming from the home page with a mission code, pre-fill it
      if (currentMissionCode) {
        // We'd check against a backend in a real app
        // Here we're just checking if we have valid team data in localStorage
        const storedData = localStorage.getItem('escapeRoomTeam');
        if (storedData) {
          try {
            const parsedData = JSON.parse(storedData);
            if (parsedData.gameCode === currentMissionCode) {
              // Valid game code, we can join this lobby
              // Clear the mission code as we've handled it
              localStorage.removeItem('currentMissionCode');
            }
          } catch (error) {
            console.error('Failed to parse team data:', error);
          }
        }
      }
    }

    // Get team data from localStorage
    simulateServerInteraction();
    
    // Set up polling to simulate real-time updates
    const interval = setInterval(() => {
      simulateServerInteraction();
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  // Handle countdown for game start
  useEffect(() => {
    if (isStarting && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (isStarting && countdown === 0) {
      // Show video for a few seconds before redirecting
      setShowVideo(true);
      
      // Start the background music
      const audioElement = document.getElementById('background-music') as HTMLAudioElement;
      if (audioElement) {
        // Set volume to 80%
        audioElement.volume = 0.8;
        audioElement.play().catch(err => console.error('Failed to play audio:', err));
      }
      
      // No need for redirect timer as we'll use the video's onEnded event
      // to handle navigation to the game page
    }
  }, [isStarting, countdown, router]);

  // Handle story progression
  useEffect(() => {
    if (showStory && storyPart < storyText.length) {
      const timer = setTimeout(() => {
        setStoryPart(storyPart + 1);
      }, 4000); // Show each part for 4 seconds
      
      return () => clearTimeout(timer);
    }
  }, [showStory, storyPart, storyText.length]);

  // Handle agent joining
  const handleJoinLobby = () => {
    if (!agentName.trim()) {
      setJoinError('Please enter your agent name');
      return;
    }

    if (!teamData) {
      setJoinError('Unable to join lobby: Missing team data');
      return;
    }

    if (agents.length >= teamData.team.agents) {
      setJoinError('Lobby is full. Cannot join mission.');
      return;
    }

    // Create new agent
    const newAgentId = generateAgentId();
    const newAgent = {
      id: newAgentId,
      name: agentName,
      avatar: randomAvatar(),
      isReady: false
    };

    // Store current agent ID
    localStorage.setItem('currentAgentId', newAgentId);
    setLocalAgentId(newAgentId);

    // Add agent to the list
    const updatedAgents = [...agents, newAgent];
    setAgents(updatedAgents);
    localStorage.setItem('escapeRoomAgents', JSON.stringify(updatedAgents));

    // Update team data
    const updatedTeamData = {
      ...teamData,
      connectedAgents: updatedAgents.length
    };
    localStorage.setItem('escapeRoomTeam', JSON.stringify(updatedTeamData));
    setTeamData(updatedTeamData);

    // Hide join form
    setIsJoining(false);
    setJoinError('');
  };

  // Handle agent ready status toggle
  const toggleReady = (agentId: string) => {
    if (agentId !== localAgentId) return;

    const updatedAgents = agents.map(agent => 
      agent.id === agentId ? { ...agent, isReady: !agent.isReady } : agent
    );

    setAgents(updatedAgents);
    localStorage.setItem('escapeRoomAgents', JSON.stringify(updatedAgents));
  };

  // Copy game code to clipboard
  const copyGameCode = () => {
    if (!teamData) return;
    
    navigator.clipboard.writeText(teamData.gameCode)
      .then(() => {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      })
      .catch(err => console.error('Failed to copy game code:', err));
  };

  // Start the game
  const handleStartGame = () => {
    setShowStory(true);
  };

  // Skip story and start countdown
  const handleSkipStory = () => {
    setShowStory(false);
    setIsStarting(true);
  };

  // Finish story and start countdown
  const handleFinishStory = () => {
    setShowStory(false);
    setIsStarting(true);
  };

  // Calculate how many agents are ready
  const readyAgentsCount = agents.filter(agent => agent.isReady).length;
  const allAgentsReady = readyAgentsCount === agents.length && agents.length > 0;
  
  // Calculate if ready button should be disabled
  const readyDisabled = !localAgentId || agents.length === 0;

  // Find current agent
  const currentAgent = agents.find(agent => agent.id === localAgentId);

  if (!teamData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-pulse text-blue-500 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-b from-black to-gray-900 text-gray-100">
      {/* Background music - will start when mission starts */}
      <audio 
        id="background-music" 
        src="/dark-mysterious-true-crime-music-loopable-235870.mp3" 
        loop 
        preload="auto"
      />
      
      {isStarting ? (
        <div className="text-center">
          {showVideo ? (
            <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
              <video 
                src="/Hacker Computer  Mask Criminal.mp4" 
                autoPlay 
                muted 
                className="max-w-full max-h-full object-contain"
                onEnded={() => router.push('/game')}
              />
              {/* Skip Video Button */}
              <button
                onClick={() => router.push('/game')}
                className="absolute bottom-8 right-8 px-6 py-3 bg-gray-900/80 hover:bg-gray-800 text-white rounded-md font-medium transition-colors border border-gray-700"
              >
                Skip Video
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-5xl font-bold text-blue-600 mb-6">Mission Starting</h1>
              <div className="text-8xl font-bold text-blue-500 animate-pulse mb-8">{countdown}</div>
              <p className="text-xl">Initializing connection to TOMAX servers...</p>
              
              {/* Skip Countdown Button */}
              <button
                onClick={() => {
                  // Start the background music when skipping
                  const audioElement = document.getElementById('background-music') as HTMLAudioElement;
                  if (audioElement) {
                    audioElement.volume = 0.8;
                    audioElement.play().catch(err => console.error('Failed to play audio:', err));
                  }
                  
                  setShowVideo(true);
                }}
                className="mt-8 px-6 py-3 bg-gray-900/80 hover:bg-gray-800 text-white rounded-md font-medium transition-colors border border-gray-700"
              >
                Skip Countdown
              </button>
            </>
          )}
        </div>
      ) : showStory ? (
        <div className="w-full max-w-3xl p-8 bg-black/80 rounded-lg shadow-[0_0_25px_rgba(37,99,235,0.3)]">
          <div className="mb-8 space-y-8">
            {storyText.slice(0, storyPart + 1).map((text, index) => (
              <div 
                key={index} 
                className={`transition-opacity duration-500 font-mono ${
                  index === storyPart ? 'animate-pulse' : ''
                }`}
              >
                <p className="text-lg leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
          
          <div className="flex justify-between">
            <button
              onClick={handleSkipStory}
              className="px-5 py-3 bg-gray-800 hover:bg-gray-700 rounded-md font-medium transition-colors"
            >
              Skip
            </button>
            
            {storyPart >= storyText.length - 1 && (
              <button
                onClick={handleFinishStory}
                className="px-8 py-3 bg-blue-800 hover:bg-blue-700 rounded-md font-bold text-lg transition-colors animate-pulse"
              >
                BEGIN MISSION
              </button>
            )}
          </div>
        </div>
      ) : isJoining ? (
        <div className="w-full max-w-md p-8 bg-gray-800/70 backdrop-blur-sm rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.3)]">
          <h2 className="text-2xl font-bold text-center text-blue-500 mb-6">Join Mission Lobby</h2>
          
          {joinError && (
            <div className="p-3 mb-4 bg-red-900/50 border border-red-700 text-red-200 rounded-md text-center">
              {joinError}
            </div>
          )}
          
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Mission Code:</span>
              <span className="text-xl font-mono font-bold tracking-widest text-blue-400">{teamData.gameCode}</span>
            </div>
            <div className="text-sm text-center text-gray-400">Team: {teamData.team.name}</div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="agentName">
                Your Agent Name
              </label>
              <input
                id="agentName"
                type="text"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="Enter your agent name"
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            
            <button
              onClick={handleJoinLobby}
              className="w-full px-5 py-3 bg-blue-700 hover:bg-blue-600 rounded-md font-medium transition-colors"
            >
              Join Lobby
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-4xl">
          <div className="bg-gray-800/70 backdrop-blur-sm rounded-lg overflow-hidden shadow-[0_0_15px_rgba(37,99,235,0.3)] mb-6">
            <div className="bg-blue-900/40 p-4 flex justify-between items-center">
              <h1 className="text-2xl font-bold text-blue-400">{teamData.team.name}</h1>
              <div 
                className="flex items-center space-x-2 px-4 py-2 bg-gray-900/50 rounded-md cursor-pointer border border-blue-900/50"
                onClick={copyGameCode}
              >
                <span className="text-lg font-mono font-bold tracking-widest text-blue-300">{teamData.gameCode}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                </svg>
                {copiedCode && <span className="text-xs text-green-400">Copied!</span>}
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">Mission Agents</h2>
                <div className="text-sm">
                  <span className="text-blue-400 font-bold">{agents.length}</span>
                  <span className="text-gray-400">/{teamData.team.agents} connected</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
                {[...Array(teamData.team.agents)].map((_, index) => {
                  const agent = agents[index];
                  
                  return (
                    <div 
                      key={index}
                      className={`bg-gray-900/60 border ${agent ? 'border-blue-800/50' : 'border-gray-800/50'} rounded-md p-4 flex flex-col items-center ${
                        agent?.id === localAgentId ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => agent?.id === localAgentId && toggleReady(agent.id)}
                    >
                      {agent ? (
                        <>
                          <div className="relative mb-2">
                            <div className="h-16 w-16 rounded-full bg-blue-900/50 flex items-center justify-center overflow-hidden">
                              <div className="text-2xl">👩‍💻</div>
                            </div>
                            {agent.isReady && (
                              <div className="absolute -top-1 -right-1 h-6 w-6 bg-green-500 rounded-full flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-white truncate w-24">{agent.name}</div>
                            <div className="text-xs text-gray-400">
                              {agent.isReady ? 'Ready' : 'Not Ready'}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="h-16 w-16 rounded-full bg-gray-800/50 mb-2 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </div>
                          <div className="text-gray-500 text-sm">Awaiting Agent</div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <div className="flex items-center justify-between mt-6">
                <Link 
                  href="/setup"
                  className="px-5 py-3 bg-gray-700 hover:bg-gray-600 rounded-md font-medium transition-colors"
                >
                  Back
                </Link>
                
                <div className="flex items-center gap-3">
                  {currentAgent && (
                    <button 
                      onClick={() => toggleReady(currentAgent.id)}
                      disabled={readyDisabled}
                      className={`px-5 py-3 rounded-md font-medium transition-colors ${
                        currentAgent.isReady 
                          ? 'bg-green-700 hover:bg-green-600' 
                          : 'bg-yellow-700 hover:bg-yellow-600'
                      } ${readyDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {currentAgent.isReady ? 'Ready' : 'Set Ready'}
                    </button>
                  )}
                  
                  <button 
                    onClick={handleStartGame}
                    disabled={!allAgentsReady}
                    className={`px-8 py-3 bg-blue-700 rounded-md font-bold text-lg transition-colors ${
                      allAgentsReady 
                        ? 'hover:bg-blue-600 animate-pulse' 
                        : 'opacity-50 cursor-not-allowed'
                    }`}
                  >
                    Start Mission
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800/40 backdrop-blur-sm p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4 text-blue-400">Mission Briefing</h3>
            <div className="prose prose-invert max-w-none">
              <p>
                At 03:14 AM, our monitoring system detected a critical security breach in TOMAX's production servers. 
                An anonymous hacker has infiltrated the infrastructure, encrypted several core services, and blocked all user logins.
              </p>
              <p>
                Your mission is to regain access to the system, investigate the attack vector, and defuse the digital logic bomb 
                that has been set to destroy all data in 60 minutes.
              </p>
              <p className="text-yellow-400 font-medium">
                All agents must mark themselves as ready before the mission can begin. Click your agent card to toggle your ready status.
              </p>
            </div>
          </div>
          
          <div className="text-center text-sm text-gray-500 mt-6">
            <div>Share the mission code with your teammates: <span className="font-mono font-bold text-blue-500">{teamData.gameCode}</span></div>
          </div>
        </div>
      )}
      
      {/* Background ambiance */}
      {(showStory || isStarting) && (
        <div className="fixed inset-0 z-[-1] opacity-40">
          <div className="absolute inset-0 bg-blue-900/20 animate-pulse"></div>
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-600 opacity-70 shadow-[0_0_15px_rgba(37,99,235,0.8)]"></div>
          {[...Array(5)].map((_, i) => (
            <div 
              key={i}
              className="absolute h-px bg-blue-500 opacity-40"
              style={{ 
                width: `${Math.random() * 100}%`, 
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDuration: `${Math.random() * 4 + 3}s`,
              }}
            ></div>
          ))}
        </div>
      )}
    </div>
  );
} 