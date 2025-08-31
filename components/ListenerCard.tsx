

import React, { useState } from 'react';
import type { Listener } from '../types';

interface ListenerCardProps {
  listener: Listener;
  onCallClick?: () => void;
  onChatClick?: () => void;
  variant?: 'default' | 'compact';
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

const PlaceholderAvatar: React.FC<{className?: string}> = ({className}) => (
    <div className={`flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 ${className}`}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3/5 h-3/5 text-slate-400 dark:text-slate-500">
            <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
        </svg>
    </div>
);

const VerifiedIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
    </svg>
);

const HeartIcon: React.FC<{ className?: string, isFilled?: boolean }> = ({ className, isFilled }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isFilled ? "currentColor" : "none"} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
);

const CallIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.298-.083.465a7.48 7.48 0 003.429 3.429c.167.081.364.052.465-.083l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C6.542 22.5 1.5 17.458 1.5 9.75V4.5z" clipRule="evenodd" />
    </svg>
);

const ChatBubbleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97zM6.75 8.25a.75.75 0 01.75-.75h9a.75.75 0 010 1.5h-9a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H7.5z" clipRule="evenodd" />
  </svg>
);



const ListenerCard: React.FC<ListenerCardProps> = ({ listener, onCallClick, onChatClick, variant = 'default', isFavorite, onToggleFavorite }) => {
    const [imageError, setImageError] = useState(false);

    if (variant === 'compact') {
        return (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-3 flex items-center space-x-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
            {onToggleFavorite && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }} 
                    className="text-slate-400 hover:text-red-500 transition-colors"
                    aria-label={isFavorite ? `Remove ${listener.name} from favorites` : `Add ${listener.name} to favorites`}
                >
                    <HeartIcon className={`w-6 h-6 ${isFavorite ? 'text-red-500' : ''}`} isFilled={isFavorite} />
                </button>
            )}
            <div className="relative flex-shrink-0">
                {imageError ? (
                    <PlaceholderAvatar className="w-16 h-16" />
                ) : (
                    <img 
                        src={listener.image} 
                        alt={listener.name} 
                        className="w-16 h-16 rounded-full object-cover" 
                        loading="lazy" decoding="async"
                        onError={() => setImageError(true)}
                    />
                )}
                <span className={`absolute bottom-0 right-0 block h-4 w-4 rounded-full ${listener.online ? 'bg-green-400' : 'bg-slate-400'} border-2 border-white dark:border-slate-800 ring-1 ${listener.online ? 'ring-green-500' : 'ring-slate-500'}`}></span>
            </div>
            <div className="flex-grow text-left">
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg">{listener.name}</h3>
                <VerifiedIcon className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 mt-1">
                <span>{listener.rating}★ ({listener.reviewsCount})</span>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
               {onChatClick && (
                <button
                  onClick={onChatClick}
                  disabled={!listener.online}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold w-12 h-12 rounded-full transition-colors shadow-lg flex items-center justify-center transform hover:scale-105 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100"
                  aria-label={`Chat with ${listener.name}`}
                >
                  <ChatBubbleIcon className="w-6 h-6"/>
                </button>
              )}
              {onCallClick && (
                <button
                  onClick={onCallClick}
                  disabled={!listener.online}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold w-12 h-12 rounded-full transition-colors shadow-lg flex items-center justify-center transform hover:scale-105 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100"
                  aria-label={`Call with ${listener.name}`}
                >
                  <CallIcon className="w-6 h-6"/>
                </button>
              )}
            </div>
          </div>
        );
    }

    // Default variant for Listener Selection screen
    return (
        <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-3 md:p-4 text-center border border-slate-100 dark:border-slate-700 transition-all duration-300 transform hover:scale-105 hover:shadow-cyan-500/20 group">
            {onToggleFavorite && (
                 <button 
                    onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }} 
                    className="absolute top-2 left-2 z-10 text-slate-400 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-full p-1.5 hover:text-red-500 transition-colors"
                    aria-label={isFavorite ? `Remove ${listener.name} from favorites` : `Add ${listener.name} to favorites`}
                >
                    <HeartIcon className={`w-6 h-6 ${isFavorite ? 'text-red-500' : ''}`} isFilled={isFavorite} />
                </button>
            )}
            <div className="relative inline-block mb-3">
                 {imageError ? (
                    <PlaceholderAvatar className="w-24 h-24 md:w-28 md:h-28 mx-auto border-4 border-slate-100 dark:border-slate-700" />
                ) : (
                    <img 
                        src={listener.image} 
                        alt={listener.name} 
                        className="w-24 h-24 md:w-28 md:h-28 rounded-full mx-auto border-4 border-slate-100 dark:border-slate-700 object-cover" 
                        loading="lazy" decoding="async"
                        onError={() => setImageError(true)}
                    />
                )}
                <span className={`absolute bottom-2 right-2 block h-5 w-5 rounded-full ${listener.online ? 'bg-green-400' : 'bg-slate-400'} border-2 border-white dark:border-slate-800 ring-1 ${listener.online ? 'ring-green-500' : 'ring-slate-500'}`}></span>
                <div className="absolute top-0 -right-1 bg-white dark:bg-slate-800 rounded-full p-0.5">
                    <VerifiedIcon className="w-6 h-6 text-blue-500" />
                </div>
            </div>

            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg md:text-xl truncate">{listener.name}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm mb-3">{`(${listener.gender}, ${listener.age} yrs)`}</p>

            <div className="flex justify-center items-center text-xs md:text-sm text-center mb-4 text-slate-600 bg-slate-50 dark:bg-slate-700/50 p-2 rounded-lg">
                <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{listener.rating}★</span>
                    <span className="block text-slate-500 dark:text-slate-400 text-[10px] md:text-xs">({listener.reviewsCount})</span>
                </div>
            </div>
            
            {onCallClick &&
                <button
                    onClick={onCallClick}
                    disabled={!listener.online}
                    className="w-16 h-16 mx-auto bg-green-500 group-hover:bg-green-600 text-white font-bold rounded-full transition-colors flex items-center justify-center shadow-lg transform hover:scale-110 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100"
                    aria-label={`Call ${listener.name}`}
                >
                    <CallIcon className="w-8 h-8" />
                </button>
            }
            {onChatClick &&
                <button
                    onClick={onChatClick}
                    disabled={!listener.online}
                    className="w-16 h-16 mx-auto bg-cyan-500 group-hover:bg-cyan-600 text-white font-bold rounded-full transition-colors flex items-center justify-center shadow-lg transform hover:scale-110 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100"
                    aria-label={`Chat with ${listener.name}`}
                >
                    <ChatBubbleIcon className="w-8 h-8" />
                </button>
            }
        </div>
    );
};

export default React.memo(ListenerCard);