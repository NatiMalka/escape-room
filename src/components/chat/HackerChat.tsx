'use client';

import { useState, useRef, useEffect } from 'react';

export type HackerMessage = {
  id: number;
  text: string;
  time: string;
  isFile?: boolean;
  fileName?: string;
  fileContent?: string;
};

interface HackerChatProps {
  messages: HackerMessage[];
  onFileClick: (fileName: string, content: string) => void;
  isVisible: boolean;
}

const HackerChat: React.FC<HackerChatProps> = ({ 
  messages, 
  onFileClick, 
  isVisible 
}) => {
  const [newMessageIndicator, setNewMessageIndicator] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const [isChatOpen, setIsChatOpen] = useState(true);

  // Set new message indicator when messages change
  useEffect(() => {
    if (messages.length > 0 && !isChatOpen) {
      setNewMessageIndicator(true);
    }
  }, [messages, isChatOpen]);

  // Open chat
  const openChat = () => {
    setIsChatOpen(true);
    setNewMessageIndicator(false);
  };

  // Close chat
  const closeChat = () => {
    setIsChatOpen(false);
  };

  // Only render if the chat should be visible
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat button */}
      {!isChatOpen && (
        <div 
          className="relative cursor-pointer"
          onClick={openChat}
        >
          <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.6)]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          {newMessageIndicator && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
          )}
        </div>
      )}
      
      {/* Chat window */}
      {isChatOpen && (
        <div 
          ref={chatRef} 
          className="w-80 max-h-96 bg-gray-900 rounded-lg shadow-[0_0_20px_rgba(220,38,38,0.4)] overflow-hidden"
        >
          <div className="bg-red-900/40 p-3 flex justify-between items-center border-b border-red-800/50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
              <h3 className="text-sm font-bold text-red-300">ANONYMOUS HACKER</h3>
            </div>
            <button 
              onClick={closeChat}
              className="text-gray-400 hover:text-gray-200"
            >
              ✕
            </button>
          </div>
          
          <div className="p-3 overflow-y-auto max-h-72 bg-[#121212] space-y-3">
            {messages.map(message => (
              <div key={message.id} className="space-y-1">
                <div className="flex justify-between items-start">
                  <div className="bg-red-900/30 p-2 rounded-lg text-sm text-red-100 max-w-[85%]">
                    {message.text}
                  </div>
                  <div className="text-[10px] text-gray-500">{message.time}</div>
                </div>
                
                {message.isFile && message.fileName && (
                  <div 
                    className="bg-gray-800 p-2 rounded cursor-pointer hover:bg-gray-700 transition-colors ml-2 text-xs"
                    onClick={() => message.fileName && message.fileContent && onFileClick(message.fileName, message.fileContent)}
                  >
                    <div className="flex items-center gap-1 text-blue-300 mb-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="font-mono">{message.fileName}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="p-2 bg-gray-800 border-t border-gray-700/50 text-[10px] text-gray-500">
            Connection secured - End-to-end encrypted
          </div>
        </div>
      )}
    </div>
  );
};

export default HackerChat; 