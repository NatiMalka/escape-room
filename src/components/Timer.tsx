'use client';

import { useState, useEffect } from 'react';

interface TimerProps {
  initialTime: number;
  isPaused: boolean;
  onTimeExpired: () => void;
}

const Timer: React.FC<TimerProps> = ({ initialTime, isPaused, onTimeExpired }) => {
  const [timeRemaining, setTimeRemaining] = useState(initialTime);
  
  // Update internal time when initialTime changes
  useEffect(() => {
    setTimeRemaining(initialTime);
  }, [initialTime]);

  // Timer effect for countdown
  useEffect(() => {
    if (!isPaused && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prevTime => prevTime - 1);
      }, 1000);
      
      return () => clearInterval(timer);
    } else if (timeRemaining <= 0) {
      // Time expired - call the callback
      onTimeExpired();
    }
  }, [isPaused, timeRemaining, onTimeExpired]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed top-0 left-0 w-full z-[1000]">
      <div className="bg-black p-2 border-b border-red-900/50 text-center">
        <div className="container mx-auto flex items-center justify-center">
          <div className="flex items-center">
            <div className="mr-2 text-yellow-400 text-sm font-bold">LOGIC BOMB COUNTDOWN:</div>
            <div className="text-xl font-bold font-mono text-red-500 animate-pulse">
              {formatTime(timeRemaining)}
            </div>
            {isPaused && (
              <div className="ml-4 text-xs bg-yellow-800/50 px-2 py-1 rounded text-yellow-300">
                PAUSED
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timer; 