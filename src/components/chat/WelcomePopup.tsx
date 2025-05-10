'use client';

interface WelcomePopupProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  content: string;
}

const WelcomePopup = ({ isOpen, onClose, fileName, content }: WelcomePopupProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70">
      <div className="absolute right-12 top-1/2 transform -translate-y-1/2 w-96 max-h-[80vh] bg-gray-900 rounded-md border border-blue-800 shadow-[0_0_15px_rgba(37,99,235,0.5)] overflow-auto">
        <div className="p-3 bg-blue-900/40 border-b border-blue-800 flex justify-between items-center">
          <h3 className="text-sm font-bold">{fileName}</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200"
          >
            ✕
          </button>
        </div>
        <div className="p-4 font-mono text-sm whitespace-pre-line text-green-400">
          {content}
        </div>
        <div className="p-3 bg-blue-900/20 border-t border-blue-800/40 text-xs text-gray-400">
          File path: /var/log/security/{fileName}
        </div>
      </div>
    </div>
  );
};

export default WelcomePopup; 