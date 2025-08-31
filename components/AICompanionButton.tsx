
import React from 'react';

interface AICompanionButtonProps {
    onClick: () => void;
}

const AICompanionIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M11.984 1.5c-5.91 0-10.703 4.29-10.703 9.573 0 2.213.82 4.347 2.296 6.042-2.296 2.01-1.996 2.891-1.996 2.891s.75-2.091 4.502-2.176c1.65.652 3.424 1.01 5.201 1.01 5.91 0 10.703-4.29 10.703-9.574S17.894 1.5 11.984 1.5zM9.75 12.75a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm6 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
    </svg>
);


const AICompanionButton: React.FC<AICompanionButtonProps> = ({ onClick }) => {
    return (
        <button
            onClick={onClick}
            className="fixed bottom-24 right-6 z-30 bg-gradient-to-br from-purple-600 to-indigo-700 text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transform hover:scale-110 transition-all duration-300 animate-pulse-slow focus:outline-none focus:ring-4 focus:ring-purple-400"
            aria-label="सकून AI दोस्त से बात करें"
        >
            <AICompanionIcon className="w-8 h-8"/>
            <span className="absolute -top-3 -right-3 flex h-5 w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 text-xs items-center justify-center">AI</span>
            </span>
        </button>
    );
};

export default React.memo(AICompanionButton);