'use client';

import { useState, useEffect, useRef } from 'react';
import useTerminalSync from '@/hooks/useTerminalSync';
import useCursorSync from '@/hooks/useCursorSync';

const Terminal = ({ isLeader, playerId, historyProp = [] }) => {
  const [history, setHistory] = useState(historyProp);
  const { terminalInput, handleTerminalInputChange, clearTerminalInput } = useTerminalSync(isLeader);
  const { cursorPosition, handleCursorPositionChange } = useCursorSync(isLeader);
  const inputRef = useRef(null);
  const terminalEndRef = useRef(null);
  
  // Scroll to bottom of terminal when history changes
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history]);
  
  // Handle submission of terminal input (only leader can submit)
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!isLeader || !terminalInput.trim()) return;
    
    // Add command to history
    setHistory([
      ...history,
      { input: terminalInput, user: playerId }
    ]);
    
    // Clear input
    clearTerminalInput();
    
    // Reset cursor position
    handleCursorPositionChange(0);
    
    // Focus input again
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  // Track cursor position changes (only leader)
  const handleCursorMove = (e) => {
    if (isLeader) {
      handleCursorPositionChange(e.target.selectionStart);
    }
  };
  
  // Focus input when terminal is clicked (only for leader)
  const handleTerminalClick = () => {
    if (isLeader && inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  return (
    <div 
      className="relative bg-black text-green-400 p-4 rounded-md shadow-lg font-mono h-96 overflow-y-auto"
      onClick={handleTerminalClick}
    >
      {/* Terminal history */}
      <div className="mb-4">
        {history.map((entry, index) => (
          <div key={index} className="mb-2">
            {entry.input && (
              <div>
                <span className="text-blue-400">$ </span>
                <span>{entry.input}</span>
              </div>
            )}
            {entry.output && (
              <div className={`ml-2 ${entry.isError ? 'text-red-400' : ''}`}>
                {entry.output}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Terminal input */}
      <form onSubmit={handleSubmit} className="flex items-center">
        <span className="text-blue-400 mr-2">$</span>
        <div className="relative flex-grow">
          <input
            ref={inputRef}
            type="text"
            value={terminalInput}
            onChange={handleTerminalInputChange}
            onKeyUp={handleCursorMove}
            onMouseUp={handleCursorMove}
            disabled={!isLeader}
            className="w-full bg-transparent outline-none"
            autoComplete="off"
          />
          
          {/* Show cursor position for non-leaders */}
          {!isLeader && cursorPosition !== null && terminalInput && (
            <div 
              className="absolute top-0 left-0 h-full w-0.5 bg-white/70 opacity-70 animate-pulse pointer-events-none"
              style={{ 
                left: `${cursorPosition * 0.6}em`, // Approximate position for monospace font
                animation: 'cursorBlink 1s infinite'
              }}
            />
          )}
        </div>
      </form>
      
      {/* Auto-scroll anchor */}
      <div ref={terminalEndRef} />
      
      {/* CSS for cursor blink animation */}
      <style jsx>{`
        @keyframes cursorBlink {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Terminal; 