'use client';

import { useState, useEffect } from 'react';
import { useSocket } from '@/context/SocketContext';

/**
 * Custom hook to synchronize terminal input between players
 * 
 * @param {boolean} isLeader - Whether the current player is the leader
 * @returns {Object} - Terminal input value and handler functions
 */
export default function useTerminalSync(isLeader) {
  const [terminalInput, setTerminalInput] = useState('');
  const { socket, currentRoom, syncTerminalInput } = useSocket();
  
  // Listen for terminal input updates from the leader
  useEffect(() => {
    if (!isLeader && socket) {
      // Set up event listener for terminal input updates
      const handleTerminalUpdate = ({ input }) => {
        setTerminalInput(input);
      };
      
      socket.on('terminalInputUpdated', handleTerminalUpdate);
      
      // Clean up listener on unmount
      return () => {
        socket.off('terminalInputUpdated', handleTerminalUpdate);
      };
    }
  }, [isLeader, socket]);
  
  // Handler for input changes
  const handleTerminalInputChange = (e) => {
    const value = e.target.value;
    setTerminalInput(value);
    
    // If leader, sync with other players
    if (isLeader && syncTerminalInput) {
      syncTerminalInput(value);
    }
  };
  
  // For programmatic updates (not from input events)
  const updateTerminalInput = (value) => {
    setTerminalInput(value);
    if (isLeader && syncTerminalInput) {
      syncTerminalInput(value);
    }
  };
  
  // Clear terminal input
  const clearTerminalInput = () => {
    setTerminalInput('');
    if (isLeader && syncTerminalInput) {
      syncTerminalInput('');
    }
  };
  
  return {
    terminalInput,
    handleTerminalInputChange,
    updateTerminalInput,
    clearTerminalInput
  };
} 