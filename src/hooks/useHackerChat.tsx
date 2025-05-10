'use client';

import { useState, useEffect } from 'react';
import { HackerMessage } from '../components/chat/HackerChat';

export default function useHackerChat(showLogin: boolean) {
  const [hackerMessages, setHackerMessages] = useState<HackerMessage[]>([]);
  const [showHackerChat, setShowHackerChat] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [welcomeFile, setWelcomeFile] = useState<{fileName: string, content: string} | null>(null);
  const [hasFirstLoginAttemptMessage, setHasFirstLoginAttemptMessage] = useState(false);
  const [hasEmergencyAccessHint, setHasEmergencyAccessHint] = useState(false);

  // Welcome Admin File Content - moved here from page.tsx
  const welcomeAdminContent = `*** SYSTEM LOG ***
Unauthorized Access Detected  
User: blocked_user  
Time: 03:14 AM  
IP: 127.0.0.1  
TraceID: RECON-314159

Message:  
"He's hidden the key where configs hide.  
Not everything is visible in plain sight...  
Sometimes, to see the truth, you need to Inspect."

#404NotFound #ButLookCloser`;

  // Initialize the hacker messages sequence
  const initializeHackerMessages = () => {
    // Start with an empty messages array instead of showing a welcome message
    const initialMessages: HackerMessage[] = [];
    
    setHackerMessages(initialMessages);
    
    // Always show the hacker chat interface
    setShowHackerChat(true);
  };
  
  // Function to send message after first login attempt
  const sendFirstLoginAttemptMessage = () => {
    if (hasFirstLoginAttemptMessage) return;
    
    setHasFirstLoginAttemptMessage(true);
    
    // Play the hacker voice audio
    playHackerVoice();
    
    sendHackerMessage({
      id: 2,
      text: "Access denied.\nYour precious system… is no longer yours.\nBut I'm not without mercy.\nI left you something — a gift, if you will.\nDecode it…\nand maybe, just maybe… you'll earn your way back in",
      time: "03:16 AM"
    });
    
    // Schedule just the welcome_admin.txt file without extra text message
    setTimeout(() => {
      sendHackerMessage({
        id: 3,
        text: "",
        time: "03:17 AM",
        isFile: true,
        fileName: "welcome_admin.txt",
        fileContent: welcomeAdminContent
      });
    }, 8000);
  };
  
  // Play hacker voice audio with better browser compatibility
  const playHackerVoice = () => {
    try {
      // First try playing directly
      const hackerAudio = new Audio('/hacker-clue/hacker first clue.wav');
      
      // Set up audio
      hackerAudio.volume = 1.0;
      
      // Try to play - this might fail in some browsers due to autoplay policies
      const playPromise = hackerAudio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Audio started playing successfully
            console.log('Hacker voice audio playing');
          })
          .catch(err => {
            console.warn('Direct audio play failed, trying with user gesture:', err);
            
            // If direct play fails, we'll use this audio element later when the user clicks
            const audioElement = document.createElement('audio');
            audioElement.id = 'hacker-voice-audio';
            audioElement.src = '/hacker-clue/hacker first clue.wav';
            audioElement.style.display = 'none';
            document.body.appendChild(audioElement);
            
            // Set up a one-time event listener for the next user click
            const playOnUserGesture = () => {
              const audio = document.getElementById('hacker-voice-audio') as HTMLAudioElement;
              if (audio) {
                audio.play().catch(e => console.error('Failed to play on user gesture:', e));
              }
              document.removeEventListener('click', playOnUserGesture);
            };
            
            document.addEventListener('click', playOnUserGesture, { once: true });
          });
      }
    } catch (err) {
      console.error('Error creating audio element for hacker voice:', err);
    }
  };
  
  // Function to send emergency access hint after 3 login attempts
  const sendEmergencyAccessHint = () => {
    if (hasEmergencyAccessHint) return;
    
    setHasEmergencyAccessHint(true);
    
    sendHackerMessage({
      id: 4,
      text: "You need to gain \"EMERGENCY ACCESS\" to the system.\nHidden in plain sight, only visible to those who look beyond the surface.",
      time: "03:20 AM"
    });
  };
  
  // Handle file click from chat
  const handleFileClick = (fileName: string, content: string) => {
    setWelcomeFile({ fileName, content });
    setShowWelcomePopup(true);
  };
  
  // Send a new hacker message
  const sendHackerMessage = (message: HackerMessage) => {
    setHackerMessages(prev => [...prev, message]);
    
    // Create notification sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (err) {
      console.error('Failed to play notification sound:', err);
    }
  };
  
  // Format time as HH:MM AM/PM for displaying timestamps
  const formatTimeAMPM = (date: Date) => {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    
    return hours + ':' + minutesStr + ' ' + ampm;
  };
  
  // Schedule puzzle-specific hints based on puzzle stage
  const sendPuzzleHint = (puzzleStage: number) => {
    const puzzleHints = [
      "The key you're looking for is hidden in plain sight. Try base64 decoding.",
      "To restore firewall access, you need to clear all rules first with iptables -F",
      "The passphrase follows a format: Company_Protocol_Action_Year"
    ];
    
    if (puzzleStage <= puzzleHints.length) {
      sendHackerMessage({
        id: 100 + puzzleStage, // Use 100+ to ensure uniqueness with other messages
        text: puzzleHints[puzzleStage - 1],
        time: formatTimeAMPM(new Date())
      });
    }
  };

  return {
    hackerMessages,
    showHackerChat,
    showWelcomePopup,
    welcomeFile,
    setShowWelcomePopup,
    initializeHackerMessages,
    sendHackerMessage,
    sendPuzzleHint,
    handleFileClick,
    sendFirstLoginAttemptMessage,
    hasFirstLoginAttemptMessage,
    sendEmergencyAccessHint
  };
} 