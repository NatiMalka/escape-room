'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';
import { useSocket } from '@/context/SocketContext';

export default function Setup() {
  const router = useRouter();
  const { createRoom, isConnected } = useSocket();
  
  const [teamName, setTeamName] = useState('');
  const [hostName, setHostName] = useState('');
  const [customRoomCode, setCustomRoomCode] = useState('');
  const [useCustomCode, setUseCustomCode] = useState(false);
  const [hostId, setHostId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Generate a unique host ID when the component mounts
  useEffect(() => {
    setHostId(uuidv4());
  }, []);

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!teamName.trim()) {
      setError('Please enter a team name');
      return;
    }
    
    if (!hostName.trim()) {
      setError('Please enter your name');
      return;
    }
    
    if (useCustomCode && (!customRoomCode.trim() || customRoomCode.length < 3)) {
      setError('Please enter a valid room code (minimum 3 characters)');
      return;
    }
    
    setIsLoading(true);
    
    // For demonstration, we'll store the data in localStorage and redirect to the lobby
    if (createRoom) {
      // If using a custom code, use it as the room code
      if (useCustomCode && customRoomCode) {
        const roomData = {
          roomName: teamName,
          hostName: hostName,
          hostId: hostId,
          customCode: customRoomCode.toUpperCase()
        };
        localStorage.setItem('createRoomData', JSON.stringify(roomData));
      } else {
        // Let the server generate a random code
        const roomData = {
          roomName: teamName,
          hostName: hostName,
          hostId: hostId
        };
        localStorage.setItem('createRoomData', JSON.stringify(roomData));
      }
      
      // Redirect to the lobby
      router.push('/lobby');
    } else {
      setError('Connection to server failed. Please try again.');
      setIsLoading(false);
    }
  };

  // Display loading screen if connecting to socket
  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white text-xl">Connecting to server...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="bg-black p-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold text-blue-500">TOMAX Security</h1>
        </div>
      </div>
      
      <div className="flex-1 container mx-auto p-6 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-black/50 p-6 rounded-lg border border-blue-900/50">
            <h2 className="text-2xl font-bold mb-6 text-center">Create New Room</h2>
            
            <form onSubmit={handleCreateRoom} className="space-y-6">
              <div>
                <label htmlFor="teamName" className="block text-sm font-medium mb-1">
                  Team Name
                </label>
                <input
                  id="teamName"
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Enter team name"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="hostName" className="block text-sm font-medium mb-1">
                  Your Name
                </label>
                <input
                  id="hostName"
                  type="text"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Enter your name"
                  required
                />
              </div>
              
              <div className="flex items-center">
                <input
                  id="useCustomCode"
                  type="checkbox"
                  checked={useCustomCode}
                  onChange={() => setUseCustomCode(!useCustomCode)}
                  className="h-4 w-4 text-blue-600 border-gray-700 rounded bg-gray-800 focus:ring-blue-600"
                />
                <label htmlFor="useCustomCode" className="ml-2 block text-sm">
                  Use custom room code
                </label>
              </div>
              
              {useCustomCode && (
                <div>
                  <label htmlFor="customCode" className="block text-sm font-medium mb-1">
                    Custom Room Code
                  </label>
                  <input
                    id="customCode"
                    type="text"
                    value={customRoomCode}
                    onChange={(e) => setCustomRoomCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 uppercase"
                    placeholder="e.g. MYROOM"
                    maxLength={6}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    3-6 characters, letters and numbers only
                  </p>
                </div>
              )}
              
              {error && (
                <div className="p-3 bg-red-900/40 border border-red-700 text-red-300 text-sm rounded">
                  {error}
                </div>
              )}
              
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3 rounded-md font-bold ${
                    isLoading ? 'bg-gray-700 cursor-not-allowed' : 'bg-blue-700 hover:bg-blue-600'
                  }`}
                >
                  {isLoading ? 'Creating Room...' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
          
          <div className="mt-6 text-center">
            <Link href="/" className="text-blue-400 hover:text-blue-300">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 