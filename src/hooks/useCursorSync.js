'use client';

import { useState, useEffect } from 'react';
import { useSocket } from '@/context/SocketContext';

/**
 * Custom hook to synchronize cursor position between players
 * 
 * @param {boolean} isLeader - Whether the current player is the leader
 * @returns {Object} - Cursor position and handler functions
 */
export default function useCursorSync(isLeader) {
  const [cursorPosition, setCursorPosition] = useState(0);
  const { socket, currentRoom, syncCursorPosition } = useSocket();
  
  // Listen for cursor position updates from the leader
  useEffect(() => {
    if (!isLeader && socket) {
      // Set up event listener for cursor position updates
      const handleCursorUpdate = ({ position }) => {
        setCursorPosition(position);
      };
      
      socket.on('cursorPositionUpdated', handleCursorUpdate);
      
      // Clean up listener on unmount
      return () => {
        socket.off('cursorPositionUpdated', handleCursorUpdate);
      };
    }
  }, [isLeader, socket]);
  
  // Handler for cursor position changes
  const handleCursorPositionChange = (position) => {
    setCursorPosition(position);
    
    // If leader, sync with other players
    if (isLeader && syncCursorPosition) {
      syncCursorPosition(position);
    }
  };
  
  return {
    cursorPosition,
    handleCursorPositionChange
  };
} 