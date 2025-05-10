'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Setup() {
  const router = useRouter();
  const [teamName, setTeamName] = useState('');
  const [teamAgents, setTeamAgents] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [error, setError] = useState('');

  // Generate a random 6-character code
  const generateGameCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!teamName) {
      setError('Team name is required');
      return;
    }

    const agentsCount = parseInt(teamAgents) || 1;

    if (agentsCount < 1 || agentsCount > 7) {
      setError('Team must have 1-7 agents');
      return;
    }

    // Generate a unique game code if not provided
    const lobbyCode = gameCode || generateGameCode();

    // Store team data in localStorage for use across the app
    localStorage.setItem('escapeRoomTeam', JSON.stringify({
      team: { name: teamName, agents: agentsCount },
      gameCode: lobbyCode,
      startTime: new Date().toISOString(),
      connectedAgents: 0
    }));

    // Navigate to the game lobby
    router.push('/lobby');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-b from-black to-gray-900 text-gray-100">
      <div className="w-full max-w-xl p-8 rounded-lg bg-gray-800/70 backdrop-blur-sm shadow-[0_0_15px_rgba(37,99,235,0.3)]">
        <h1 className="text-3xl font-bold text-center text-blue-500 mb-8">Mission Setup</h1>
        
        {error && (
          <div className="p-3 mb-4 bg-red-900/50 border border-red-700 text-red-200 rounded-md text-center">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4 p-4 border border-blue-800/50 rounded-md">
            <h2 className="text-xl font-bold text-center mb-2">Team Information</h2>
            
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="teamName">
                Team Name
              </label>
              <input
                id="teamName"
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter team name"
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="teamAgents">
                Number of Agents (1-7)
              </label>
              <input
                id="teamAgents"
                type="number"
                min="1"
                max="7"
                value={teamAgents}
                onChange={(e) => setTeamAgents(e.target.value)}
                placeholder="Number of agents"
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="gameCode">
                Game Code (Optional)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  id="gameCode"
                  type="text"
                  value={gameCode}
                  onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                  placeholder="Leave blank to generate random code"
                  maxLength={6}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <button
                  type="button"
                  onClick={() => setGameCode(generateGameCode())}
                  className="px-3 py-2 bg-blue-800 hover:bg-blue-700 rounded-md font-medium transition-colors"
                >
                  Generate
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Agents will use this code to join your game lobby
              </p>
            </div>
          </div>
          
          <div className="flex justify-between mt-8">
            <Link 
              href="/"
              className="px-5 py-3 bg-gray-700 hover:bg-gray-600 rounded-md font-medium transition-colors"
            >
              Back
            </Link>
            
            <button 
              type="submit"
              className="px-5 py-3 bg-blue-700 hover:bg-blue-600 rounded-md font-medium transition-colors"
            >
              Create Lobby
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 