// src/hooks/useMediaQuery.ts

import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // This code only runs on the client-side
    const media = window.matchMedia(query);
    
    // Update the state if the media query match status changes
    const listener = () => {
      setMatches(media.matches);
    };

    // Set the initial state
    listener();

    // Add the event listener
    media.addEventListener('change', listener);

    // Cleanup function to remove the listener when the component unmounts
    return () => media.removeEventListener('change', listener);
  }, [query]); // Re-run the effect if the query string changes

  return matches;
}