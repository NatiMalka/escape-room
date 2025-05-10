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
  const [showModal, setShowModal] = useState(false);
  const [missionCode, setMissionCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
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

  // Simulating loading state for a more game-like experience
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleJoinMission = () => {
    if (missionCode.trim()) {
      localStorage.setItem('currentMissionCode', missionCode.toUpperCase());
      router.push('/lobby');
    }
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
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-screen">
            <div className="text-3xl text-blue-500 font-mono">Initializing System...</div>
            <div className="w-64 h-2 bg-gray-800 mt-4 overflow-hidden rounded-full">
              <div className="h-full bg-blue-600 animate-loading-bar"></div>
            </div>
          </div>
        ) : (
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
              
              {/* Call to Action Buttons */}
              <div className="flex flex-col md:flex-row justify-center gap-6 mb-16">
                <Link 
                  href="/setup" 
                  className="flex items-center justify-center px-8 py-4 text-xl bg-blue-700 hover:bg-blue-600 text-white font-bold rounded-md transition-all relative overflow-hidden group"
                >
                  <span className="relative z-10">CREATE LOBBY</span>
                  <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-800 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
                </Link>
                <button 
                  onClick={() => setShowModal(true)}
                  className="flex items-center justify-center px-8 py-4 text-xl bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-md transition-all relative overflow-hidden group"
                >
                  <span className="relative z-10">JOIN MISSION</span>
                  <span className="absolute inset-0 bg-gradient-to-r from-gray-700 to-gray-900 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
                </button>
              </div>
              
              {/* Footer with terminal style */}
              <div className="text-center text-sm text-gray-500 bg-black/50 py-4 px-6 rounded-t-lg mx-auto max-w-md font-mono">
                <div className="animate-blink">█</div>
                <div>system_breach.exe v1.0.3 • TOMAX SECURITY PROTOCOL</div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Join mission modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-blue-900/50 rounded-lg p-6 max-w-md w-full shadow-[0_0_25px_rgba(37,99,235,0.3)]">
            <h2 className="text-2xl font-bold text-blue-400 mb-6 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Secure Connection
            </h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2" htmlFor="mission-code">
                Enter Mission Code
              </label>
              <input
                id="mission-code"
                type="text"
                placeholder="Enter 6-digit code"
                value={missionCode}
                onChange={(e) => setMissionCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono tracking-wider text-center text-xl"
                maxLength={6}
              />
              <p className="text-xs text-gray-400 mt-2">
                Enter the 6-digit code provided by the lobby creator
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleJoinMission}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded-md transition-colors flex items-center"
              >
                <span>Connect</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

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
