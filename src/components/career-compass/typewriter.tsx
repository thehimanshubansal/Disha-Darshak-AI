
'use client';
import { useState, useEffect } from 'react';

interface TypewriterProps {
  words: string[];
  typingDelay?: number;
  erasingDelay?: number;
  newWordDelay?: number;
}

export default function Typewriter({
  words,
  typingDelay = 150,
  erasingDelay = 100,
  newWordDelay = 2000,
}: TypewriterProps) {
  const [wordIndex, setWordIndex] = useState(0);
  const [text, setText] = useState('');
  const [isErasing, setIsErasing] = useState(false);

  useEffect(() => {
    const currentWord = words[wordIndex];

    const handleTyping = () => {
      if (isErasing) {
        // Erase characters
        if (text.length > 0) {
          setText((prev) => prev.substring(0, prev.length - 1));
        } else {
          // Finished erasing, move to next word
          setIsErasing(false);
          setWordIndex((prev) => (prev + 1) % words.length);
        }
      } else {
        // Type characters
        if (text.length < currentWord.length) {
          setText((prev) => currentWord.substring(0, prev.length + 1));
        } else {
          // Finished typing, wait then start erasing
          setTimeout(() => setIsErasing(true), newWordDelay);
        }
      }
    };

    const delay = isErasing ? erasingDelay : typingDelay;
    const timeout = setTimeout(handleTyping, delay);

    return () => clearTimeout(timeout);
  }, [text, isErasing, wordIndex, words, typingDelay, erasingDelay, newWordDelay]);

  return (
    <span className="relative bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
      {text}
      <span className="animate-pulse text-primary">|</span>
    </span>
  );
}
