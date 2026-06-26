import { useState, useEffect, useCallback } from 'react';

const FAVORITES_KEY = 'madem_favorites';
const FAVORITES_EVENT = 'madem-favorites-changed';

function readFavorites(): string[] {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Could not load favorites", e);
    return [];
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);

  // Load favorites on mount and keep every hook instance in sync.
  useEffect(() => {
    setFavorites(readFavorites());

    const sync = () => setFavorites(readFavorites());
    // Same-tab updates (other components) + cross-tab updates.
    window.addEventListener(FAVORITES_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(FAVORITES_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const toggleFavorite = useCallback((propertyId: string) => {
    const current = readFavorites();
    const newFavorites = current.includes(propertyId)
      ? current.filter(id => id !== propertyId)
      : [...current, propertyId];

    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
    } catch (e) {
      console.error("Could not save favorites", e);
    }

    setFavorites(newFavorites);
    // Notify other hook instances in this tab.
    window.dispatchEvent(new Event(FAVORITES_EVENT));
  }, []);

  const isFavorite = useCallback((propertyId: string) => {
    return favorites.includes(propertyId);
  }, [favorites]);

  return { favorites, toggleFavorite, isFavorite };
}
