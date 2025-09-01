

import React, { useState, useEffect, useCallback } from 'react';
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState<firebase.firestore.QueryDocumentSnapshot<firebase.firestore.DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const favorites = currentUser.favoriteListeners || [];
  const PAGE_SIZE = 10;

  const fetchListeners = useCallback(async (loadMore = false) => {
      if (!hasMore && loadMore) return;
      
      setLoading(!loadMore);
      setLoadingMore(loadMore);

      try {
        let query = db.collection('listeners')
          .orderBy('online', 'desc')
          .orderBy('rating', 'desc')
          .limit(PAGE_SIZE);

        if (loadMore && lastVisible) {
          query = query.startAfter(lastVisible);
        }

        const documentSnapshots = await query.get();
        const newListeners = documentSnapshots.docs.map(doc => doc.data() as Listener);

        setLastVisible(documentSnapshots.docs[documentSnapshots.docs.length - 1]);
        setHasMore(newListeners.length === PAGE_SIZE);

        const allListeners = loadMore ? [...listeners, ...newListeners] : newListeners;
        
        // Custom sort to bring favorites to the top
        allListeners.sort((a, b) => {
            const aIsFav = favorites.includes(a.id);
            const bIsFav = favorites.includes(b.id);
            if (aIsFav !== bIsFav) return aIsFav ? -1 : 1;
            if (a.online !== b.online) return a.online ? -1 : 1;
            return b.rating - a.rating;
        });

        setListeners(allListeners);
      } catch (error) {
        console.error("Error fetching listeners:", error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
  }, [favorites, hasMore, lastVisible, listeners]);


  useEffect(() => {
    // Initial fetch
    fetchListeners();
  }, [currentUser.favoriteListeners]); // Refetch if favorites change

  const handleToggleFavorite = async (listenerId: number) => {
    if (!currentUser) return;
    const userRef = db.collection('users').doc(currentUser.uid);
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
      // Note: A real-time listener on the user doc would automatically refetch and re-render.
      // For now, we manually update the state to reflect the change immediately.
      const updatedListeners = listeners.map(l => l); // Create new array to trigger re-render
      setListeners(updatedListeners);

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
            isFavorite={favorites.includes(listener.id)}
            onToggleFavorite={() => handleToggleFavorite(listener.id)}
          />
        ))}
      </div>
      {hasMore && (
        <div className="text-center mt-6">
            <button
                onClick={() => fetchListeners(true)}
                disabled={loadingMore}
                className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:bg-slate-400"
            >
                {loadingMore ? 'Loading...' : 'Load More'}
            </button>
        </div>
      )}
    </div>
  );
};

export default React.memo(CallsView);