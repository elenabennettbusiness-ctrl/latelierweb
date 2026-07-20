/* ============================================================
   reviewsData — the Avis Clients background photo and the raw
   Google-review-card HTML snippets, both auto-discovered the same
   way menuData.js discovers dish images: drop a file into
   src/assets/Happy/ or src/assets/Reviews Code/ and it's picked up
   automatically at the next dev/build pass, no code change needed.

   The review cards are pre-authored standalone HTML documents
   (fixed 640x460 "shareable review card" markup) that must render
   completely untouched — REVIEW_CARDS holds their exact raw file
   text, unmodified, for RawReviewCard.jsx to render verbatim.
   ============================================================ */

const backgroundModules = import.meta.glob('/src/assets/Happy/*.webp', {
  eager: true,
  import: 'default',
});

export const HAPPY_BACKGROUND = Object.values(backgroundModules)[0] || null;

const reviewCardModules = import.meta.glob('/src/assets/Reviews Code/*.html', {
  eager: true,
  query: '?raw',
  import: 'default',
});

export const REVIEW_CARDS = Object.keys(reviewCardModules)
  .sort()
  .map((path) => reviewCardModules[path]);
