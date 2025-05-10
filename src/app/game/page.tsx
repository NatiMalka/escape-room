'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import HackerChat from '@/components/chat/HackerChat';
import WelcomePopup from '@/components/chat/WelcomePopup';
import useHackerChat from '@/hooks/useHackerChat';
import Timer from '@/components/Timer';

type TeamData = {
  team: { name: string; agents: number };
  gameCode: string;
  startTime: string;
  connectedAgents: number;
};

type TerminalEntry = {
  input?: string;
  output?: string;
  isError?: boolean;
};

type HackerMessage = {
  id: number;
  text: string;
  time: string;
  isFile?: boolean;
  fileName?: string;
  fileContent?: string;
};

export default function Game() {
  const router = useRouter();
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [gameTime, setGameTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  // Login screen state
  const [showLogin, setShowLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [loginError, setLoginError] = useState('');
  const [passwordHint, setPasswordHint] = useState('');
  const [showPasswordHint, setShowPasswordHint] = useState(false);
  
  // Welcome message popup state - removing this as we're using the one from useHackerChat
  
  // Terminal state
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalHistory, setTerminalHistory] = useState<TerminalEntry[]>([
    { output: 'TOMAX Security Terminal initialized...' },
    { output: 'Type "help" for available commands.' }
  ]);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  
  // Game state
  const [activeTeam, setActiveTeam] = useState<string>('team');
  const [puzzleStage, setPuzzleStage] = useState(1);
  const [errorCount, setErrorCount] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(3600); // 60 minutes in seconds

  // Add near the top of the component, after other state variables
  const [bgMusicPlaying, setBgMusicPlaying] = useState(false);

  // Use the hacker chat hook
  const {
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
  } = useHackerChat(showLogin);

  // Login credentials to crack
  const correctUsername = "security";
  const correctPassword = "T0M4X2023!";
  
  // Puzzle data with expected commands/answers
  const puzzles = [
    {
      id: 1,
      title: "System Access",
      description: "The attacker has encrypted file access. You need to find the decryption key in the welcome_admin.txt file left by the hacker.",
      initialOutput: [
        ">> SYSTEM ALERT: Unauthorized access detected",
        ">> Security protocols active",
        ">> Found file: welcome_admin.txt",
        ">> Contents: 'The key is hidden in plain sight. Base64: VEhFX0tFWV9JU19UT01BWA=='",
        ">> Enter decryption key:"
      ],
      expectedInput: "THE_KEY_IS_TOMAX",
      acceptableInputs: ["THE_KEY_IS_TOMAX"],
      hint: "The message contains a Base64 encoded string. Try decoding it to reveal the key.",
      incorrectResponses: [
        ">> Authentication failed. Incorrect decryption key.",
        ">> Invalid input. Security systems are locking down further.",
        ">> Error: Decryption attempt rejected."
      ]
    },
    {
      id: 2,
      title: "Firewall Bypass",
      description: "You've gained initial access. The attacker has modified the firewall rules. Identify and execute the correct command to restore access to core services.",
      initialOutput: [
        ">> Access granted to level 1 systems",
        ">> Firewall blocking access to core services",
        ">> Security log shows recent changes to iptables",
        ">> Type 'ls' to view available files"
      ],
      expectedInput: "iptables -F && service firewall restart",
      acceptableInputs: [
        "iptables -F && service firewall restart",
        "iptables --flush && service firewall restart",
        "service firewall restart"
      ],
      specificResponses: {
        "ls": "firewall.conf  backdoor.log  access_history.txt  iptables.rules",
        "cat firewall.conf": "# Firewall Configuration\n# Last modified by: unknown_user\n# Modified at: 03:12 AM\n\n# All outbound connections blocked\n# All inbound connections blocked except SSH on custom port\n# To reset: use iptables flush command and restart service",
        "cat backdoor.log": "03:11 AM: SSH connection established\n03:12 AM: User 'root' executed: iptables -A INPUT -j DROP\n03:12 AM: User 'root' executed: iptables -A OUTPUT -j DROP\n03:13 AM: User 'root' created file: welcome_admin.txt\n03:14 AM: Connection closed",
        "cat access_history.txt": "Recent access attempts:\n- Failed login from 192.168.1.34\n- Failed login from 192.168.1.34\n- Successful login from 192.168.1.34\n- Multiple file system changes\n- Firewall configuration modified",
        "cat iptables.rules": "# Current Rules\n*filter\n:INPUT DROP [0:0]\n:FORWARD DROP [0:0]\n:OUTPUT DROP [0:0]\n-A INPUT -p tcp -m tcp --dport 2222 -j ACCEPT\nCOMMIT",
        "help": "Available commands: ls, cat, iptables, service, -F, --flush",
        "ls -la": "total 28\ndrwxr-xr-x 2 root root 4096 Oct 31 03:14 .\ndrwxr-xr-x 4 root root 4096 Oct 31 03:14 ..\n-rw-r--r-- 1 root root  237 Oct 31 03:12 firewall.conf\n-rw-r--r-- 1 root root  258 Oct 31 03:13 backdoor.log\n-rw-r--r-- 1 root root  189 Oct 31 03:13 access_history.txt\n-rw-r--r-- 1 root root  142 Oct 31 03:12 iptables.rules"
      },
      hint: "Look at the firewall.conf file for clues. You need to flush (clear) the iptables rules and restart the firewall service.",
      incorrectResponses: [
        ">> Command failed. Firewall rules still blocking access.",
        ">> Invalid sequence. Firewall remains active.",
        ">> Error: Insufficient parameters or incorrect command."
      ]
    },
    {
      id: 3,
      title: "Logic Bomb Defusal",
      description: "You've bypassed the firewall. Now you need to locate and defuse the logic bomb before it triggers. The system shows it's linked to a specific encryption key.",
      initialOutput: [
        ">> Firewall successfully bypassed",
        ">> Core services accessible",
        ">> URGENT: Logic bomb detected, countdown active",
        ">> Encryption algorithm identified: AES-256",
        ">> Logic bomb will trigger at: 04:14 AM",
        ">> Defusal requires encryption passphrase"
      ],
      expectedInput: "TOMAX_SECURITY_OVERRIDE_2023",
      acceptableInputs: ["TOMAX_SECURITY_OVERRIDE_2023"],
      specificResponses: {
        "ls": "defuse.sh  README.md  bomb_signatures.dat  encrypted.bin",
        "cat README.md": "## Logic Bomb Defusal\nThis system has been compromised. A logic bomb has been planted that will encrypt all data at 04:14 AM.\n\nTo defuse, you need the encryption passphrase.\n\nHint: The company name followed by the security protocol and current year.",
        "cat bomb_signatures.dat": "[BINARY DATA CORRUPTED]\nSignature pattern: TOMAX_********_********_****",
        "./defuse.sh": "Usage: ./defuse.sh [passphrase]\nAttempting to defuse logic bomb...\nError: No passphrase provided.\nFormat: Company_Protocol_Action_Year",
        "help": "Available commands: ls, cat, ./defuse.sh",
      },
      hint: "Look at the README.md and bomb_signatures.dat files. The passphrase follows a specific pattern related to TOMAX security protocols.",
      incorrectResponses: [
        ">> Authentication failed. Incorrect passphrase.",
        ">> Error: Invalid defusal code. Logic bomb still active.",
        ">> Wrong passphrase. Countdown continues."
      ]
    }
  ];

  useEffect(() => {
    // Get team data from localStorage
    const storedData = localStorage.getItem('escapeRoomTeam');
    
    if (!storedData) {
      router.push('/setup');
      return;
    }
    
    try {
      const parsedData = JSON.parse(storedData);
      setTeamData(parsedData);
      // Set active team to just 'team' since we now have only one team
      setActiveTeam('team');
    } catch (error) {
      console.error('Failed to parse team data:', error);
      router.push('/setup');
    }

    // Initialize hacker messages
    initializeHackerMessages();
  }, [router]);

  // Timer effect for game time
  useEffect(() => {
    if (!isPaused && !showLogin) {
      const timer = setInterval(() => {
        setGameTime(prevTime => prevTime + 1);
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [isPaused, showLogin]);

  // Timer effect for countdown (logic bomb) - Now handled by Timer component for the main game
  // This useEffect handles the timer countdown for the login screen
  useEffect(() => {
    // Only countdown the timer for the login screen
    if (showLogin && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prevTime => prevTime - 1);
      }, 1000);
      
      return () => clearInterval(timer);
    } else if (timeRemaining <= 0) {
      // Logic bomb triggered - game over
      localStorage.setItem('gameResult', JSON.stringify({
        winningTeam: null, // No winner
        totalTime: gameTime,
        errors: errorCount,
        completedAt: new Date().toISOString(),
        success: false
      }));
      
      router.push('/results');
    }
  }, [showLogin, timeRemaining, gameTime, errorCount, router]);

  // Auto-scroll terminal to bottom when history changes
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalHistory]);

  // Ensure background music continues playing but don't try to auto-play before user interaction
  useEffect(() => {
    const playBackgroundMusic = () => {
      // Check if there's already an audio element created in the lobby
      let audioElement = document.getElementById('background-music') as HTMLAudioElement;
      
      // If not found, create a new one
      if (!audioElement) {
        audioElement = document.createElement('audio');
        audioElement.id = 'background-music';
        audioElement.src = '/dark-mysterious-true-crime-music-loopable-235870.mp3';
        audioElement.loop = true;
        document.body.appendChild(audioElement);
      }
      
      // Set volume to 80%
      audioElement.volume = 0.8;
      
      // We won't try to autoplay here - we'll wait for a user click
      // Only set the state if the audio is already playing
      if (!audioElement.paused) {
        setBgMusicPlaying(true);
      }
    };

    // Initialize audio element without trying to autoplay
    playBackgroundMusic();

    // Create event listener for user interactions to enable autoplay
    const enableAudio = () => {
      const audioElement = document.getElementById('background-music') as HTMLAudioElement;
      if (audioElement && !bgMusicPlaying) {
        audioElement.play()
          .then(() => {
            setBgMusicPlaying(true);
            
            // Create a silent audio context to enable audio for the hacker voice
            try {
              const silentContext = new (window.AudioContext || (window as any).webkitAudioContext)();
              const silentBuffer = silentContext.createBuffer(1, 1, 22050);
              const silentSource = silentContext.createBufferSource();
              silentSource.buffer = silentBuffer;
              silentSource.connect(silentContext.destination);
              silentSource.start();
            } catch (err) {
              console.error('Failed to create silent audio context:', err);
            }
          })
          .catch(err => {
            console.error('Failed to play audio:', err);
          });
      }
      
      // Preload both hacker voice audio files
      try {
        const hackerAudio1 = new Audio('/hacker-clue/hacker first clue.wav');
        hackerAudio1.preload = 'auto';
        
        const hackerAudio2 = new Audio('/hacker-clue/hacker secund respose.wav');
        hackerAudio2.preload = 'auto';
      } catch (err) {
        console.error('Failed to preload hacker audio:', err);
      }
    };

    // Add the event listener to the entire document
    document.addEventListener('click', enableAudio, { once: true });

    return () => {
      document.removeEventListener('click', enableAudio);
    };
  }, [bgMusicPlaying]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check credentials
    if (username === correctUsername && password === correctPassword) {
      // Successfully cracked the password
      setShowLogin(false);
      
      // Play the second hacker audio clip after successful login
      try {
        const hackerAudio = new Audio('/hacker-clue/hacker secund respose.wav');
        hackerAudio.play()
          .catch(err => console.error('Failed to play hacker audio after login:', err));
      } catch (err) {
        console.error('Error creating audio element:', err);
      }
      
      // Send success message from hacker
      sendHackerMessage({
        id: Date.now(),
        text: "Well done… you manage to get into the system.\nBut this is only the beginning.\nThe system is mine… unless you prove otherwise...",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      
      // Initialize the terminal with the first puzzle
      const currentPuzzle = puzzles[0];
      setTerminalHistory([
        { output: 'TOMAX Security Terminal initialized...' },
        { output: 'Access granted to emergency security protocols.' },
        ...currentPuzzle.initialOutput.map(line => ({ output: line }))
      ]);
    } else {
      // Failed login attempt
      setLoginAttempts(loginAttempts + 1);
      setLoginError('Authentication failed. Access denied.');
      
      // Send the hacker message after the first login attempt
      if (loginAttempts === 0) {
        sendFirstLoginAttemptMessage();
      }
      
      // Send emergency access hint after the third login attempt
      if (loginAttempts === 2) {
        sendEmergencyAccessHint();
      }
      
      // Provide hints as they fail more
      if (loginAttempts === 1) {
        setPasswordHint('Hint: Check the welcome_admin.txt file. The username is the department responsible for system protection.');
        setShowPasswordHint(true);
      } else if (loginAttempts === 3) {
        setPasswordHint('Hint: Username: "security", Password contains company name and year.');
      } else if (loginAttempts === 5) {
        setPasswordHint('Warning: Username: "security", Password format: "T0M4X2023!"');
      }
    }
  };

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!terminalInput.trim()) return;
    
    const currentPuzzle = puzzles[puzzleStage - 1];
    const userInput = terminalInput.trim();
    
    // Add user input to terminal history
    setTerminalHistory([...terminalHistory, { input: userInput }]);
    
    // Process the input
    let response: TerminalEntry = { output: '', isError: true };
    
    // Check for specific responses first (for puzzle 2 and 3)
    if ((puzzleStage === 2 || puzzleStage === 3) && 
        currentPuzzle.specificResponses && 
        Object.keys(currentPuzzle.specificResponses).includes(userInput)) {
      const specificOutput = currentPuzzle.specificResponses[userInput as keyof typeof currentPuzzle.specificResponses];
      response = { output: specificOutput, isError: false };
    }
    // Check if input is correct for current puzzle
    else if (currentPuzzle.acceptableInputs.includes(userInput)) {
      // Correct answer
      response = { 
        output: `>> Authentication successful! ${
          puzzleStage >= puzzles.length 
            ? 'Logic bomb defused! System secured.' 
            : 'Proceeding to next security level...'
        }`, 
        isError: false 
      };
      
      setTimeout(() => {
        if (puzzleStage >= puzzles.length) {
          // Team has completed all puzzles
          handleComplete(true);
        } else {
          // Move to next puzzle
          setPuzzleStage(puzzleStage + 1);
          setShowHint(false);
          
          // Switch active team
          setActiveTeam('team');
          
          // Update terminal for next puzzle
          const nextPuzzle = puzzles[puzzleStage];
          setTerminalHistory(prevHistory => [
            ...prevHistory,
            { output: '------------------------' },
            { output: `>> SECURITY LEVEL ${puzzleStage + 1} ACCESSED` },
            ...nextPuzzle.initialOutput.map(line => ({ output: line }))
          ]);
        }
      }, 2000);
    } else {
      // Incorrect answer
      setErrorCount(errorCount + 1);
      const randomErrorMsg = currentPuzzle.incorrectResponses[
        Math.floor(Math.random() * currentPuzzle.incorrectResponses.length)
      ];
      response = { output: randomErrorMsg, isError: true };
    }
    
    // Add response to terminal history
    setTerminalHistory(prev => [...prev, response]);
    
    // Clear input
    setTerminalInput('');
  };

  const handleComplete = (success: boolean) => {
    // Save completion data
    localStorage.setItem('gameResult', JSON.stringify({
      team: teamData?.team.name,
      totalTime: gameTime,
      errors: errorCount,
      completedAt: new Date().toISOString(),
      success: success
    }));
    
    // Navigate to results page
    router.push('/results');
  };

  // Handle timer expiration
  const handleTimeExpired = () => {
    // Logic bomb triggered - game over
    localStorage.setItem('gameResult', JSON.stringify({
      winningTeam: null, // No winner
      totalTime: gameTime,
      errors: errorCount,
      completedAt: new Date().toISOString(),
      success: false
    }));
    
    router.push('/results');
  };

  // Display loading state if team data is not yet loaded
  if (!teamData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-pulse text-blue-500 text-xl">Loading...</div>
      </div>
    );
  }

  const currentPuzzle = puzzles[puzzleStage - 1];
  const activeTeamName = teamData.team.name;

  // Welcome Admin File Content
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

  // TOMAX Hacked Login screen
  if (showLogin) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        {/* Timer component for login screen */}
        <Timer 
          initialTime={timeRemaining} 
          isPaused={false} 
          onTimeExpired={handleTimeExpired}
        />
        
        {/* Header bar - removed the duplicate timer */}
        <div className="bg-[#101820] p-2 flex justify-between items-center mt-10">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="text-sm font-mono">TOMAX Security Terminal - SYSTEM BREACH DETECTED</div>
          <div className="w-16"></div> {/* Spacer for balance */}
        </div>
        
        {/* Main content */}
        <div className="flex-1 flex flex-col items-center justify-center bg-[#1a1a2e] p-4 font-mono">
          {/* Hidden credentials in actual HTML comment that will show in source */}
          <div 
            className="credentials-data"
            style={{ display: 'none' }} 
            data-sysadmin-note="EMERGENCY ACCESS"
            data-credentials-username="security"
            data-credentials-password="T0M4X2023!"
            data-note="SYSADMIN NOTE: These emergency credentials should be removed before production deployment."
          >
            {/* This hidden div will be visible in the inspector but not on the page */}
          </div>
          
          <div className="w-full max-w-md">
            <div className="mb-8">
              <div className="text-blue-300 text-center mb-2">TOMAX CORPORATION</div>
              <div className="text-blue-400 text-xl mb-4 text-center font-bold">SECURITY DIVISION</div>
              
              <div className="p-4 bg-black/30 rounded-md mb-6 text-sm border border-blue-900/50">
                <p className="mb-2 text-red-400 font-bold">[ CRITICAL SECURITY ALERT ]</p>
                <p className="mb-1 text-gray-300">Unauthorized system modification detected.</p>
                <p className="mb-1 text-gray-300">Logic bomb countdown initiated.</p>
                <p className="text-yellow-300">Emergency system access required.</p>
              </div>
            </div>
            
            {/* Login form with hidden HTML comment that will show in source */}
            <div dangerouslySetInnerHTML={{ __html: '<!-- SYSADMIN NOTES: Emergency Credentials: Login: security Password: T0M4X2023! Keep these credentials secure. -->' }} />
            
            <form onSubmit={handleLogin} className="space-y-4 w-full">
              {loginError && (
                <div className="p-2 bg-red-900/40 border border-red-700 text-red-300 text-sm mb-4 rounded">
                  {loginError}
                </div>
              )}
              
              <div className="space-y-1">
                <label htmlFor="username" className="block text-gray-400 text-sm">
                  Username:
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-gray-900 border border-blue-900 p-2 rounded-sm text-white focus:outline-none focus:border-blue-500"
                  autoFocus
                  data-testid="login-username"
                />
              </div>
              
              <div className="space-y-1">
                <label htmlFor="password" className="block text-gray-400 text-sm">
                  Password:
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-900 border border-blue-900 p-2 rounded-sm text-white focus:outline-none focus:border-blue-500"
                  data-testid="login-password"
                />
              </div>
              
              <div className="flex justify-between items-center pt-2">
                <div>
                  <div className="text-sm text-gray-500">
                    Login attempts: <span className="text-yellow-500">{loginAttempts}</span>
                  </div>
                  {showPasswordHint && (
                    <div className="mt-2 text-xs text-blue-400">
                      {passwordHint}
                    </div>
                  )}
                </div>
                
                <button
                  type="submit"
                  className="bg-blue-900 hover:bg-blue-800 px-4 py-2 rounded-sm text-white"
                >
                  Login
                </button>
              </div>
            </form>
            
            <div className="mt-8 text-xs text-gray-500 text-center">
              <div className="mb-1">Active team: {activeTeamName}</div>
              <div>Crack the login credentials to access the system</div>
            </div>
          </div>
        </div>

        {/* Hacker Chat - positioned appropriately for login screen */}
        <HackerChat 
          messages={hackerMessages} 
          onFileClick={handleFileClick} 
          isVisible={showHackerChat}
        />
        
        {/* Welcome File Popup */}
        {welcomeFile && (
          <WelcomePopup 
            isOpen={showWelcomePopup} 
            onClose={() => setShowWelcomePopup(false)} 
            fileName={welcomeFile.fileName} 
            content={welcomeFile.content} 
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-black text-gray-100">
      {/* Timer component - show for both login and game screens */}
      <Timer 
        initialTime={timeRemaining} 
        isPaused={isPaused} 
        onTimeExpired={handleTimeExpired}
      />
      
      {/* Audio element as fallback if not already present */}
      {!document.getElementById('background-music') && (
        <audio 
          id="background-music" 
          src="/dark-mysterious-true-crime-music-loopable-235870.mp3" 
          loop 
          preload="auto"
        />
      )}
      
      {/* Game header with music controls */}
      <header className="bg-gray-900 p-4 shadow-md mt-10">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-blue-500">TOMAX SECURITY</h1>
            <div className="px-3 py-1 bg-blue-900/50 rounded-md">
              Security Level: {puzzleStage}/{puzzles.length}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                const audio = document.getElementById('background-music') as HTMLAudioElement;
                if (audio) {
                  if (bgMusicPlaying) {
                    audio.pause();
                  } else {
                    audio.play();
                  }
                  setBgMusicPlaying(!bgMusicPlaying);
                }
              }}
              className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-md flex items-center"
            >
              {bgMusicPlaying ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/>
                  </svg>
                  Mute
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 0 1 0 7.072m2.828-9.9a9 9 0 0 1 0 12.728M5.586 15H4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/>
                  </svg>
                  Unmute
                </>
              )}
            </button>
            <div className="text-gray-400">Mission Time: <span className="text-blue-400 font-mono">{formatTime(gameTime)}</span></div>
            <button 
              onClick={() => setIsPaused(!isPaused)}
              className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-md"
            >
              {isPaused ? 'Resume' : 'Pause'}
            </button>
          </div>
        </div>
      </header>
      
      {/* Main game area */}
      <main className="flex-1 container mx-auto p-4 md:p-8">
        {isPaused ? (
          <div className="h-full flex items-center justify-center">
            <div className="p-6 bg-gray-800 rounded-lg text-center">
              <h2 className="text-2xl font-bold mb-4">Mission Paused</h2>
              <button 
                onClick={() => setIsPaused(false)}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded-md"
              >
                Resume Mission
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-8">
            {/* Terminal area */}
            <div className="space-y-6">
              <div className="p-4 bg-blue-900/20 border border-blue-800/50 rounded-md">
                <div className="font-mono text-gray-400 mb-2">// Active team:</div>
                <h2 className="text-2xl font-bold text-blue-400">{activeTeamName}'s Turn</h2>
              </div>
              
              <div className="p-6 bg-gray-800/70 border border-gray-700 rounded-lg shadow-lg">
                <h3 className="text-2xl font-bold mb-4 text-center">{currentPuzzle.title}</h3>
                
                <div className="mb-6 text-lg leading-relaxed">
                  {currentPuzzle.description}
                </div>
                
                {/* Terminal interface */}
                <div className="mb-6 font-mono p-4 bg-black border border-gray-700 rounded overflow-auto h-80 flex flex-col">
                  <div className="flex-1 overflow-y-auto space-y-1 mb-2">
                    {terminalHistory.map((entry, index) => (
                      <div key={index}>
                        {entry.input && (
                          <div className="flex">
                            <span className="text-blue-500 mr-2">$</span>
                            <span className="text-gray-100">{entry.input}</span>
                          </div>
                        )}
                        {entry.output && (
                          <div className={`ml-0 ${entry.isError ? 'text-red-400' : 'text-green-400'}`}>{entry.output}</div>
                        )}
                      </div>
                    ))}
                    <div ref={terminalEndRef} />
                  </div>
                  
                  <form onSubmit={handleTerminalSubmit} className="flex border-t border-gray-700 pt-2">
                    <span className="text-blue-500 mr-2">$</span>
                    <input
                      type="text"
                      value={terminalInput}
                      onChange={(e) => setTerminalInput(e.target.value)}
                      className="flex-1 bg-transparent focus:outline-none text-gray-100"
                      placeholder="Type your command here..."
                      autoFocus
                      disabled={isPaused}
                    />
                  </form>
                </div>
                
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => setShowHint(!showHint)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md"
                  >
                    {showHint ? 'Hide Hint' : 'Show Hint'}
                  </button>
                  
                  <div className="text-gray-400">
                    Failed attempts: {errorCount}
                  </div>
                </div>
                
                {showHint && (
                  <div className="mt-4 p-4 bg-blue-900/20 border border-blue-800/50 rounded-md">
                    <p className="text-blue-400">
                      <span className="font-bold">HINT:</span> {currentPuzzle.hint}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Sidebar */}
            <div className="space-y-6">
              {/* Team status */}
              <div className="p-4 bg-gray-800/70 border border-gray-700 rounded-lg">
                <h3 className="text-lg font-bold mb-4">Mission Team</h3>
                
                <div className="p-3 mb-3 rounded-md bg-blue-900/30 border border-blue-700">
                  <div className="font-bold">{teamData.team.name}</div>
                  <div className="text-sm text-gray-400">{teamData.team.agents} agents</div>
                </div>
              </div>
              
              {/* Challenge info */}
              <div className="p-4 bg-gray-800/70 border border-gray-700 rounded-lg">
                <h3 className="text-lg font-bold mb-4">Mission Status</h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Security level:</span>
                    <span className="text-blue-400">{puzzleStage}/{puzzles.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mission time:</span>
                    <span className="text-blue-400 font-mono">{formatTime(gameTime)}</span>
                  </div>
                  <p className="text-yellow-400 mt-4">WARNING: Logic bomb will trigger at 04:14 AM</p>
                </div>
              </div>
              
              {/* Game controls */}
              <div className="p-4 bg-gray-800/70 border border-gray-700 rounded-lg">
                <h3 className="text-lg font-bold mb-4">Mission Controls</h3>
                
                <div className="space-y-3">
                  <button
                    onClick={() => setIsPaused(!isPaused)}
                    className="w-full p-2 bg-gray-700 hover:bg-gray-600 rounded-md"
                  >
                    {isPaused ? 'Resume Mission' : 'Pause Mission'}
                  </button>
                  
                  <Link
                    href="/lobby"
                    className="block w-full p-2 bg-gray-700 hover:bg-gray-600 rounded-md text-center"
                  >
                    Abort Mission
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Hacker Chat - positioned appropriately for game screen */}
      <HackerChat 
        messages={hackerMessages} 
        onFileClick={handleFileClick} 
        isVisible={showHackerChat}
      />
      
      {/* Welcome File Popup */}
      {welcomeFile && (
        <WelcomePopup 
          isOpen={showWelcomePopup} 
          onClose={() => setShowWelcomePopup(false)} 
          fileName={welcomeFile.fileName} 
          content={welcomeFile.content} 
        />
      )}
    </div>
  );
}