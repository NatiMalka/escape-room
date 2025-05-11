'use client';

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// Define a type for our background line
interface BackgroundLine {
  id: number;
  width: string;
  left: string;
  top: string;
  animationDuration: string;
  animationDelay: string;
}

export default function Home() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [joinError, setJoinError] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [backgroundLines, setBackgroundLines] = useState<BackgroundLine[]>([]);
  const containerRef = useRef(null);

  // Generate background lines after component mounts to avoid hydration mismatch
  useEffect(() => {
    // Generate background lines with random positions
    const generateBackgroundLines = () => {
      const lines: BackgroundLine[] = [];
      for (let i = 0; i < 20; i++) {
        lines.push({
          id: i,
          width: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDuration: `${Math.random() * 8 + 6}s`,
          animationDelay: `${Math.random() * 2}s`,
        });
      }
      setBackgroundLines(lines);
    };

    generateBackgroundLines();
  }, []);

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!joinCode.trim()) {
      setJoinError('Please enter a room code');
      return;
    }
    
    if (!playerName.trim()) {
      setJoinError('Please enter your name');
      return;
    }
    
    // Store the room code and player name, then navigate to the lobby
    localStorage.setItem('joinRoomData', JSON.stringify({
      roomCode: joinCode.toUpperCase(),
      playerName: playerName
    }));
    
    router.push('/lobby');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-gray-100 overflow-hidden relative" ref={containerRef}>
      {/* Animated cyber background elements */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute top-0 left-0 w-full h-1 bg-blue-600 opacity-70 shadow-[0_0_15px_rgba(37,99,235,0.8)]"></div>
        {backgroundLines.map((line) => (
          <div 
            key={line.id}
            className="absolute h-px bg-blue-500 opacity-30"
            style={{ 
              width: line.width, 
              left: line.left,
              top: line.top,
              animation: `pulse ${line.animationDuration} infinite alternate`,
              animationDelay: line.animationDelay
            }}
          ></div>
        ))}
      </div>

      <div className="z-10 max-w-5xl w-full mx-auto px-4">
        <div className="flex flex-col items-center">
          {/* Top Status Bar */}
          <div className="w-full bg-gray-900/70 backdrop-blur-sm border-b border-blue-900/50 py-2 px-4 mb-8 flex justify-between items-center fixed top-0 left-0 z-20">
            <div className="text-sm font-mono text-blue-400">SYSTEM STATUS: <span className="text-red-500">COMPROMISED</span></div>
            <div className="text-sm font-mono text-blue-400">TIME: 03:14:07</div>
          </div>

          {/* Main Content */}
          <div className="mt-20 w-full">
            {/* Header Section with title */}
            <div className="text-center mb-16 relative">
              <h1 className="text-5xl md:text-7xl font-bold text-blue-600 mb-3 animate-pulse tracking-wider">
                <span className="glitch-title">SYSTEM BREACH</span>
              </h1>
              <div className="text-xl md:text-2xl font-bold text-blue-400 tracking-widest font-mono mb-8">
                TOMAX SECURITY DIVISION
              </div>
              <div className="h-1 w-48 bg-blue-700 mx-auto rounded-full mb-8 shadow-[0_0_15px_rgba(37,99,235,0.8)]"></div>
              <p className="text-xl max-w-2xl mx-auto leading-relaxed text-gray-300">
                A high-stakes cyber security challenge where agents race against time to stop a devastating hack
              </p>
            </div>
            
            {/* Main Image with Overlay */}
            <div className="w-full max-w-4xl mx-auto mb-16 relative rounded-lg overflow-hidden shadow-[0_0_30px_rgba(37,99,235,0.3)] border border-blue-900/30">
              <div className="relative aspect-video">
                <Image
                  src="/image-homepage.jpg"
                  alt="Cyber Security Breach"
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                
                {/* Overlay Elements */}
                <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black to-transparent">
                  <div className="font-mono text-red-500 text-lg mb-2 animate-pulse">// CRITICAL SECURITY ALERT</div>
                  <div className="text-white text-xl md:text-2xl mb-4">System compromised at 03:14 AM</div>
                </div>
                
                {/* Scan lines effect */}
                <div className="absolute inset-0 bg-scanlines opacity-10 pointer-events-none"></div>
              </div>
            </div>
            
            {/* Mission Brief */}
            <div className="bg-gray-900/40 backdrop-blur-sm border border-blue-900/30 rounded-lg p-6 max-w-3xl mx-auto mb-12">
              <h2 className="text-2xl font-bold text-blue-400 mb-4">MISSION BRIEF</h2>
              <p className="mb-4 text-lg">
                A critical security breach has been detected at TOMAX systems. Create a secure lobby and invite your agents to stop the countdown before all data is permanently encrypted.
              </p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-400 mt-6 justify-center">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  <span>Create a mission lobby</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  <span>Share the code with agents</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  <span>Work together to solve the breach</span>
                </div>
              </div>
            </div>
            
            {/* Simplified Action Buttons */}
            {!showJoinForm ? (
              <div className="flex flex-col md:flex-row justify-center gap-6 mb-16">
                <Link 
                  href="/setup" 
                  className="flex items-center justify-center px-8 py-4 text-xl bg-blue-700 hover:bg-blue-600 text-white font-bold rounded-md transition-all relative overflow-hidden group"
                >
                  <span className="relative z-10">CREATE ROOM</span>
                  <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-800 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
                </Link>
                <button 
                  onClick={() => setShowJoinForm(true)}
                  className="flex items-center justify-center px-8 py-4 text-xl bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-md transition-all relative overflow-hidden group"
                >
                  <span className="relative z-10">JOIN ROOM</span>
                  <span className="absolute inset-0 bg-gradient-to-r from-gray-700 to-gray-900 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
                </button>
              </div>
            ) : (
              <div className="max-w-md mx-auto bg-gray-900/80 backdrop-blur-sm rounded-lg p-6 border border-blue-900/50 mb-16">
                <h3 className="text-xl font-bold mb-4 text-center text-blue-400">Join a Room</h3>
                <form onSubmit={handleJoinRoom} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="playerName">
                      Your Name
                    </label>
                    <input
                      id="playerName"
                      type="text"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="gameCode">
                      Room Code
                    </label>
                    <input
                      id="gameCode"
                      type="text"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      placeholder="e.g. ABC123"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 uppercase"
                      maxLength={6}
                    />
                    
                    {joinError && (
                      <p className="mt-1 text-red-400 text-xs">{joinError}</p>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-blue-700 hover:bg-blue-600 rounded-md font-medium"
                    >
                      Join Room
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowJoinForm(false)}
                      className="py-3 px-4 bg-gray-700 hover:bg-gray-600 rounded-md"
                    >
                      Back
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            {/* Footer with terminal style */}
            <div className="text-center text-sm text-gray-500 bg-black/50 py-4 px-6 rounded-t-lg mx-auto max-w-md font-mono">
              <div className="animate-blink">█</div>
              <div>system_breach.exe v1.0.3 • TOMAX SECURITY PROTOCOL</div>
            </div>
          </div>
        </div>
      </div>

      {/* Add custom styles for animations */}
      <style jsx global>{`
        @keyframes loadingBar {
          0% { width: 0; }
          50% { width: 100%; }
          100% { width: 0; }
        }
        
        .animate-loading-bar {
          animation: loadingBar 2s ease-in-out infinite;
        }
        
        .glitch-title {
          position: relative;
          display: inline-block;
        }
        
        .glitch-title::before,
        .glitch-title::after {
          content: "SYSTEM BREACH";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
        
        .glitch-title::before {
          color: #ef4444;
          z-index: -1;
          animation: glitch-animation 3.5s infinite linear alternate-reverse;
        }
        
        .glitch-title::after {
          color: #93c5fd;
          z-index: -2;
          animation: glitch-animation 2s infinite linear alternate-reverse;
        }
        
        @keyframes glitch-animation {
          0% { transform: translate(-2px, 2px); }
          20% { transform: translate(1px, 1px); }
          40% { transform: translate(-1px, -3px); }
          60% { transform: translate(3px, 2px); }
          80% { transform: translate(-2px, -2px); }
          100% { transform: translate(2px, 3px); }
        }
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        
        @keyframes pulse {
          0% { opacity: 0.2; }
          100% { opacity: 0.4; }
        }
        
        .animate-blink {
          animation: blink 1s infinite;
        }
        
        .bg-scanlines {
          background: linear-gradient(
            to bottom,
            transparent 50%,
            rgba(0, 0, 0, 0.3) 50%
          );
          background-size: 100% 4px;
        }
      `}</style>
    </div>
  );
}
