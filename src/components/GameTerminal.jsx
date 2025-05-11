'use client';

import { useState, useEffect } from 'react';
import Terminal from './Terminal';
import { useSocket } from '@/context/SocketContext';

const GameTerminal = ({
  terminalHistory,
  puzzleStage,
  puzzles,
  sendPuzzleHint,
  welcomeFile,
  showWelcomePopup,
  setShowWelcomePopup,
  hackerMessages,
  showHackerChat,
  handleFileClick
}) => {
  const [showHint, setShowHint] = useState(false);
  const { amILeader } = useSocket();
  const [playerId, setPlayerId] = useState('');
  
  useEffect(() => {
    // Get player ID from localStorage
    const playerInfo = localStorage.getItem('playerInfo');
    if (playerInfo) {
      try {
        setPlayerId(JSON.parse(playerInfo).id);
      } catch (error) {
        console.error('Failed to parse player info:', error);
      }
    }
  }, []);
  
  return (
    <div className="relative h-full p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
        <div className="md:col-span-2">
          <Terminal 
            isLeader={amILeader(playerId)}
            playerId={playerId}
            historyProp={terminalHistory}
          />
          
          {/* Show hint button only for puzzle stages */}
          {puzzleStage > 0 && puzzleStage <= puzzles.length && (
            <button
              onClick={() => {
                setShowHint(true);
                sendPuzzleHint(puzzleStage);
              }}
              className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-md"
            >
              Need a hint?
            </button>
          )}
        </div>

        <div>
          {/* HackerChat component will be passed in as a prop or composed here */}
          {/* This allows for more flexibility in the parent component */}
          <div className="h-full overflow-y-auto bg-gray-900 p-4 rounded-md border border-gray-700">
            {showHackerChat && hackerMessages.map((message) => (
              <div key={message.id} className="mb-4">
                <div className="text-green-500 text-sm">{message.time}</div>
                <div className="text-white whitespace-pre-line">{message.text}</div>
                {message.isFile && (
                  <button
                    onClick={() => handleFileClick(message.fileName, message.fileContent)}
                    className="mt-2 px-3 py-1 bg-blue-900 text-blue-300 rounded-sm text-sm hover:bg-blue-800"
                  >
                    View File: {message.fileName}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hint popup */}
      {showHint && puzzleStage > 0 && puzzleStage <= puzzles.length && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 border-2 border-yellow-500 p-6 rounded-lg max-w-md">
            <h3 className="text-yellow-500 text-xl mb-4">Hint</h3>
            <p className="text-white mb-6">{puzzles[puzzleStage - 1].hint}</p>
            <button
              onClick={() => setShowHint(false)}
              className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-md"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Welcome file popup - for the hacker's files */}
      {showWelcomePopup && welcomeFile && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 border-2 border-green-500 p-6 rounded-lg max-w-2xl w-full">
            <h3 className="text-green-500 text-xl mb-4">File: {welcomeFile.fileName}</h3>
            <div className="text-white whitespace-pre-line font-mono bg-black p-4 rounded-md mb-6 max-h-96 overflow-y-auto">
              {welcomeFile.content}
            </div>
            <button
              onClick={() => setShowWelcomePopup(false)}
              className="bg-green-500 hover:bg-green-600 text-black px-4 py-2 rounded-md"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameTerminal; 