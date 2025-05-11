'use client';

import { useState, useEffect } from 'react';
import { useSocket } from '@/context/SocketContext';

/**
 * Custom hook to synchronize login input fields between players
 * 
 * @param {boolean} isLeader - Whether the current player is the leader
 * @returns {Object} - Login field values and handler functions
 */
export default function useLoginSync(isLeader) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { socket, currentRoom, syncLoginInput } = useSocket();
  
  // Listen for login input updates from the leader
  useEffect(() => {
    if (!isLeader && socket) {
      // Set up event listener for login field updates
      const handleLoginUpdate = ({ field, value }) => {
        if (field === 'username') {
          setUsername(value);
        } else if (field === 'password') {
          setPassword(value);
        }
      };
      
      socket.on('loginInputUpdated', handleLoginUpdate);
      
      // Clean up listener on unmount
      return () => {
        socket.off('loginInputUpdated', handleLoginUpdate);
      };
    }
  }, [isLeader, socket]);
  
  // Handler functions for input changes
  const handleUsernameChange = (e) => {
    const value = e.target.value;
    setUsername(value);
    
    // If leader, sync with other players
    if (isLeader && syncLoginInput) {
      syncLoginInput('username', value);
    }
  };
  
  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    
    // If leader, sync with other players
    if (isLeader && syncLoginInput) {
      syncLoginInput('password', value);
    }
  };
  
  return {
    username,
    password,
    handleUsernameChange,
    handlePasswordChange,
    // For direct updates (not from input events)
    setUsername: (value) => {
      setUsername(value);
      if (isLeader && syncLoginInput) {
        syncLoginInput('username', value);
      }
    },
    setPassword: (value) => {
      setPassword(value);
      if (isLeader && syncLoginInput) {
        syncLoginInput('password', value);
      }
    }
  };
} 