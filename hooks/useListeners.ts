import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../utils/firebase';
import firebase from 'firebase/compat/app';
import type { Listener } from '../types';

const PAGE_SIZE = 10;

const areArraysEqual = (a: number[], b: number[]) => {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((value, index) => value === sortedB[index]);
};

export const useListeners = (favoriteListenerIds: number[] = []) => {
    const [listeners, setListeners] = useState<Listener[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [lastVisible, setLastVisible] = useState<firebase.firestore.QueryDocumentSnapshot<firebase.firestore.DocumentData> | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const prevFavoritesRef = useRef<number[]>([]);

    const fetchAndSortListeners = useCallback(async (loadMore = false) => {
        if (!hasMore && loadMore) return;

        if (loadMore) {
            setLoadingMore(true);
        } else {
            setLoading(true);
        }

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

            setLastVisible(documentSnapshots.docs[documentSnapshots.docs.length - 1] || null);
            setHasMore(newListeners.length === PAGE_SIZE);

            setListeners(prevListeners => {
                const combinedListeners = loadMore ? [...prevListeners, ...newListeners] : newListeners;
                // FIX: Explicitly type uniqueListeners as Listener[] to help TypeScript inference.
                const uniqueListeners: Listener[] = Array.from(new Map(combinedListeners.map(l => [l.id, l])).values());

                uniqueListeners.sort((a, b) => {
                    const aIsFav = favoriteListenerIds.includes(a.id);
                    const bIsFav = favoriteListenerIds.includes(b.id);
                    if (aIsFav !== bIsFav) return aIsFav ? -1 : 1;
                    if (a.online !== b.online) return a.online ? -1 : 1;
                    return b.rating - a.rating;
                });

                return uniqueListeners;
            });

        } catch (error) {
            console.error("Error fetching listeners:", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [hasMore, lastVisible, favoriteListenerIds]);

    useEffect(() => {
        // Initial fetch or full refetch if favorites have actually changed
        if (!areArraysEqual(favoriteListenerIds, prevFavoritesRef.current)) {
            prevFavoritesRef.current = favoriteListenerIds;
            // Reset for a full refetch that applies new sort order correctly
            setListeners([]);
            setLastVisible(null);
            setHasMore(true);
            fetchAndSortListeners(false);
        }
    }, [favoriteListenerIds, fetchAndSortListeners]);

    const loadMoreListeners = () => {
        if (!loadingMore && hasMore) {
            fetchAndSortListeners(true);
        }
    };

    return { listeners, loading, loadingMore, hasMore, loadMoreListeners };
};