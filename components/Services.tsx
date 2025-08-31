

import React, { useState, useEffect } from 'react';
import ListenerCard from './ListenerCard';
import { db } from '../utils/firebase';
import firebase from 'firebase/compat/app';
import type { Listener, User } from '../types';

interface CallsViewProps {
  onStartSession: (type: 'call' | 'chat', listener: Listener) => void;
  currentUser: User;
}

const ViewLoader: React.FC = () => (
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center">
        <div className="text-cyan-600 dark:text-cyan-400">
             <svg className="animate-spin h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
             </svg>
        </div>
    </div>
);


const CallsView: React.FC<CallsViewProps> = ({ onStartSession, currentUser }) => {
  const [listeners, setListeners] = useState<Listener[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = db.collection('listeners').onSnapshot((snapshot) => {
      const listenersData = snapshot.docs.map(doc => doc.data() as Listener);
      const favorites = currentUser.favoriteListeners || [];
      
      // Sorting logic: Favorites Online > Favorites Offline > Rest Online > Rest Offline
      listenersData.sort((a, b) => {
        const aIsFav = favorites.includes(a.id);
        const bIsFav = favorites.includes(b.id);
        const aIsOnline = a.online === true;
        const bIsOnline = b.online === true;
        
        if (aIsFav !== bIsFav) return aIsFav ? -1 : 1;
        if (aIsOnline !== bIsOnline) return aIsOnline ? -1 : 1;
        return a.rating > b.rating ? -1 : 1; // Fallback sort by rating
      });
      
      setListeners(listenersData);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching listeners:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser.favoriteListeners]);

  const handleToggleFavorite = async (listenerId: number) => {
    if (!currentUser) return;
    const userRef = db.collection('users').doc(currentUser.uid);
    const favorites = currentUser.favoriteListeners || [];
    const isFavorite = favorites.includes(listenerId);

    try {
      if (isFavorite) {
        await userRef.update({
          favoriteListeners: firebase.firestore.FieldValue.arrayRemove(listenerId)
        });
      } else {
        await userRef.update({
          favoriteListeners: firebase.firestore.FieldValue.arrayUnion(listenerId)
        });
      }
    } catch (error) {
      console.error("Failed to update favorites:", error);
      alert("Error updating favorites. Please try again.");
    }
  };

  if (loading) {
    return <ViewLoader />;
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4">
      <div className="space-y-2 max-w-2xl mx-auto">
        {listeners.map((listener: Listener) => (
          <ListenerCard
            key={listener.id}
            listener={listener}
            variant="compact"
            onCallClick={() => onStartSession('call', listener)}
            isFavorite={(currentUser.favoriteListeners || []).includes(listener.id)}
            onToggleFavorite={() => handleToggleFavorite(listener.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default React.memo(CallsView);