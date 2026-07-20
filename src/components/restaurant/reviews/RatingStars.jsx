import React, { useId } from 'react';

const STAR_PATH = 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z';
const GOLD = '#FBBC04';
const EMPTY = '#DADCE0';

function Star({ fraction, size, clipId }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d={STAR_PATH} fill={EMPTY} />
      {fraction > 0 && (
        <>
          <defs>
            <clipPath id={clipId} clipPathUnits="objectBoundingBox">
              <rect x="0" y="0" width={fraction} height="1" />
            </clipPath>
          </defs>
          <path d={STAR_PATH} fill={GOLD} clipPath={`url(#${clipId})`} />
        </>
      )}
    </svg>
  );
}

// Renders 5 stars for a 0-5 rating, filling each proportionally so a
// fractional rating (e.g. 4.9) shows a naturally, precisely partial
// final star instead of rounding to a whole number of stars.
export default function RatingStars({ rating, size = 32, gap = 8 }) {
  const uid = useId();

  return (
    <div className="flex items-center" style={{ gap: `${gap}px` }} role="img" aria-label={`${rating} sur 5 étoiles`}>
      {Array.from({ length: 5 }, (_, i) => {
        const fraction = Math.max(0, Math.min(1, rating - i));
        return <Star key={i} fraction={fraction} size={size} clipId={`${uid}-star-${i}`} />;
      })}
    </div>
  );
}
