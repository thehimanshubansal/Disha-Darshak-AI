'use client';

import { useEffect, useState } from 'react';

const STAR_COUNT = 50;

export default function TwinklingStars() {
  const [stars, setStars] = useState<any[]>([]);

  useEffect(() => {
    const generatedStars = Array.from({ length: STAR_COUNT }).map(() => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      animationDuration: `${2 + Math.random() * 3}s`,
      animationDelay: `${Math.random() * 5}s`,
    }));
    setStars(generatedStars);
  }, []);

  return (
    <div id="stars-container">
      {stars.map((style, index) => (
        <div key={index} className="star" style={style} />
      ))}
    </div>
  );
}
