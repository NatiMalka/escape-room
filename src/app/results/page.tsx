'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type TeamData = {
  team1: { name: string; players: number };
  team2: { name: string; players: number };
  startTime: string;
};

type GameResult = {
  winningTeam: 'team1' | 'team2' | null;
  totalTime: number;
  errors: number;
  completedAt: string;
  success: boolean;
};

export default function Results() {
  const router = useRouter();
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get team and result data from localStorage
    const storedTeamData = localStorage.getItem('escapeRoomTeams');
    const storedResult = localStorage.getItem('gameResult');
    
    if (!storedTeamData || !storedResult) {
      router.push('/');
      return;
    }
    
    try {
      const parsedTeamData = JSON.parse(storedTeamData);
      const parsedResult = JSON.parse(storedResult);
      setTeamData(parsedTeamData);
      setGameResult(parsedResult);
      setLoading(false);
    } catch (error) {
      console.error('Failed to parse game data:', error);
      router.push('/');
    }
  }, [router]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getSuccessMessage = () => {
    const messages = [
      "Mission accomplished. The security breach has been contained.",
      "System integrity restored. TOMAX data is secure.",
      "Threat neutralized. Your cybersecurity skills saved the day.",
      "Logic bomb defused with precision. Well done, team.",
      "Crisis averted. Your quick action prevented a catastrophic data loss."
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const getFailureMessage = () => {
    const messages = [
      "Mission failed. The logic bomb detonated, encrypting all TOMAX data.",
      "Security breach unresolved. Critical systems compromised.",
      "The hacker's countdown reached zero. All data has been lost.",
      "System lockdown initiated. Access to all TOMAX servers has been lost.",
      "Breach containment failed. The attack has spread beyond our systems."
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-pulse text-blue-500 text-xl">Generating mission report...</div>
      </div>
    );
  }

  if (!teamData || !gameResult) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-black text-gray-100">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-blue-600 mb-4">No Mission Results Found</h1>
          <p className="mb-8">No mission data was found. Please start a new mission.</p>
          <Link 
            href="/"
            className="px-6 py-3 bg-blue-700 hover:bg-blue-600 text-white font-bold rounded-md transition-colors"
          >
            Return to HQ
          </Link>
        </div>
      </div>
    );
  }

  // If there's no winner (time ran out)
  if (!gameResult.success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-b from-black to-gray-900 text-gray-100">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-10">
            <h1 className="text-5xl font-bold text-red-600 mb-6">Mission Failed</h1>
            <div className="text-3xl font-bold text-white mb-2">Logic Bomb Detonated</div>
            <p className="text-lg text-gray-400 italic">"{getFailureMessage()}"</p>
          </div>
          
          <div className="bg-gray-800/70 backdrop-blur-sm rounded-lg overflow-hidden mb-8 shadow-[0_0_15px_rgba(255,0,0,0.3)]">
            <div className="p-6 bg-red-900/30 border-b border-red-800">
              <h2 className="text-2xl font-bold">Mission Report</h2>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                <div className="p-4 bg-gray-900/80 rounded-md border border-gray-700">
                  <div className="text-gray-400 text-sm mb-1">Mission Time</div>
                  <div className="text-xl font-bold">{formatTime(gameResult.totalTime)}</div>
                </div>
                
                <div className="p-4 bg-gray-900/80 rounded-md border border-gray-700">
                  <div className="text-gray-400 text-sm mb-1">Failed Attempts</div>
                  <div className="text-xl font-bold">{gameResult.errors}</div>
                </div>
                
                <div className="p-4 bg-gray-900/80 rounded-md border border-gray-700">
                  <div className="text-gray-400 text-sm mb-1">Team 1</div>
                  <div className="text-xl font-bold">{teamData.team1.name}</div>
                </div>
                
                <div className="p-4 bg-gray-900/80 rounded-md border border-gray-700">
                  <div className="text-gray-400 text-sm mb-1">Team 2</div>
                  <div className="text-xl font-bold">{teamData.team2.name}</div>
                </div>
              </div>
              
              <div className="p-5 bg-black/50 rounded-md mb-6 border border-red-800/30">
                <h3 className="text-lg font-bold mb-3 text-red-400">Failure Analysis</h3>
                <p className="mb-2">
                  Both teams were unable to defuse the logic bomb in time. The countdown reached zero
                  at 04:14 AM, resulting in the encryption of all TOMAX systems.
                </p>
                <p>
                  A full security audit will be required to determine the extent of the breach
                  and to rebuild the affected systems.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center space-x-4">
            <Link 
              href="/setup"
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-md transition-colors"
            >
              New Mission
            </Link>
            
            <Link 
              href="/"
              className="px-6 py-3 bg-blue-700 hover:bg-blue-600 text-white font-bold rounded-md transition-colors"
            >
              Return to HQ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const winningTeamName = gameResult.winningTeam === 'team1' ? teamData.team1.name : teamData.team2.name;
  const losingTeamName = gameResult.winningTeam === 'team1' ? teamData.team2.name : teamData.team1.name;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-b from-black to-gray-900 text-gray-100">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-blue-600 mb-6">Mission Successful</h1>
          <div className="text-3xl font-bold text-white mb-2">{winningTeamName} Secured the System!</div>
          <p className="text-lg text-gray-400 italic">"{getSuccessMessage()}"</p>
        </div>
        
        <div className="bg-gray-800/70 backdrop-blur-sm rounded-lg overflow-hidden mb-8 shadow-[0_0_15px_rgba(37,99,235,0.3)]">
          <div className="p-6 bg-blue-900/30 border-b border-blue-800">
            <h2 className="text-2xl font-bold">Mission Report</h2>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              <div className="p-4 bg-gray-900/80 rounded-md border border-gray-700">
                <div className="text-gray-400 text-sm mb-1">Successful Team</div>
                <div className="text-xl font-bold">{winningTeamName}</div>
              </div>
              
              <div className="p-4 bg-gray-900/80 rounded-md border border-gray-700">
                <div className="text-gray-400 text-sm mb-1">Other Team</div>
                <div className="text-xl font-bold">{losingTeamName}</div>
              </div>
              
              <div className="p-4 bg-gray-900/80 rounded-md border border-gray-700">
                <div className="text-gray-400 text-sm mb-1">Defusal Time</div>
                <div className="text-xl font-bold">{formatTime(gameResult.totalTime)}</div>
              </div>
              
              <div className="p-4 bg-gray-900/80 rounded-md border border-gray-700">
                <div className="text-gray-400 text-sm mb-1">Failed Attempts</div>
                <div className="text-xl font-bold">{gameResult.errors}</div>
              </div>
            </div>
            
            <div className="p-5 bg-black/50 rounded-md mb-6 border border-blue-800/30">
              <h3 className="text-lg font-bold mb-3 text-blue-400">Mission Summary</h3>
              <p className="mb-2">
                The {winningTeamName} team successfully defused the logic bomb and secured TOMAX's systems
                with a completion time of {formatTime(gameResult.totalTime)}.
              </p>
              <p>
                They encountered {gameResult.errors} obstacles along the way, but managed to persevere
                through skillful cybersecurity techniques and problem-solving abilities.
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-center space-x-4">
          <Link 
            href="/setup"
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-md transition-colors"
          >
            New Mission
          </Link>
          
          <Link 
            href="/"
            className="px-6 py-3 bg-blue-700 hover:bg-blue-600 text-white font-bold rounded-md transition-colors"
          >
            Return to HQ
          </Link>
        </div>
      </div>
    </div>
  );
} 