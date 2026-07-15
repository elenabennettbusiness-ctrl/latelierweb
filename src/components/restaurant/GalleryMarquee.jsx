import React from 'react';

/**
 * GalleryMarquee — premium infinite-loop portrait gallery.
 *
 * Two synchronized rows of portrait plates running in opposite directions:
 *   - Row 1  (Gallery/)   moves  0 → -33.3333%   (left-to-right reading)
 *   - Row 2  (Gallery+/)  moves  -33.3333% → 0   (right-to-left reading)
 *
 * Both rows share the EXACT same speed (50s), easing (linear), spacing,
 * tile size, corner radius, shadow, hover behavior, and responsive
 * breakpoints. Only the direction differs — a single modifier class
 * (`.gallery__track--reverse`) swaps the keyframe endpoints.
 *
 * Pure CSS animation on the track — no JavaScript rAF, no framer-motion
 * for the scroll itself — so it stays perfectly smooth and battery-friendly.
 *
 * Loop math:
 *   The 9 images are rendered THREE times in a row inside the track.
 *   The track animates between translate3d(0,0,0) and translate3d(-33.3333%,0,0)
 *   over 50s linear infinite. Because each group is identical, translating
 *   by exactly one group's width (33.3333%) lands group N+1 in the exact
 *   pixel position group N started at — the loop is mathematically
 *   seamless: no jump, no flash, no pause, no visible wrap point.
 *
 * Hover does NOT pause the animation (animation lives on the parent
 * `.gallery__track`, hover styles live on the child `.gallery__tile`).
 * Hovering scales the tile to 1.03, brightens it, and deepens the shadow
 * while the marquee keeps moving underneath.
 *
 * Visual language mirrors the rest of the site:
 *   - obsidian background (#0A0A0A, inherited from the body)
 *   - gold overline + italic Cormorant Garamond heading + gold line
 *   - soft luxury shadows, rounded 32px corners, generous spacing
 */

const ROW_ONE = [
  { src: '/gallery/1.png', alt: "L'Atelier — ambiance 1" },
  { src: '/gallery/2.png', alt: "L'Atelier — ambiance 2" },
  { src: '/gallery/3.png', alt: "L'Atelier — ambiance 3" },
  { src: '/gallery/4.png', alt: "L'Atelier — ambiance 4" },
  { src: '/gallery/5.png', alt: "L'Atelier — ambiance 5" },
  { src: '/gallery/6.png', alt: "L'Atelier — ambiance 6" },
  { src: '/gallery/7.png', alt: "L'Atelier — ambiance 7" },
  { src: '/gallery/8.png', alt: "L'Atelier — ambiance 8" },
  { src: '/gallery/9.png', alt: "L'Atelier — ambiance 9" },
];

const ROW_TWO = [
  { src: '/gallery-plus/1.png', alt: "L'Atelier — expérience 1" },
  { src: '/gallery-plus/2.png', alt: "L'Atelier — expérience 2" },
  { src: '/gallery-plus/3.png', alt: "L'Atelier — expérience 3" },
  { src: '/gallery-plus/4.png', alt: "L'Atelier — expérience 4" },
  { src: '/gallery-plus/5.png', alt: "L'Atelier — expérience 5" },
  { src: '/gallery-plus/6.png', alt: "L'Atelier — expérience 6" },
  { src: '/gallery-plus/7.png', alt: "L'Atelier — expérience 7" },
  { src: '/gallery-plus/8.png', alt: "L'Atelier — expérience 8" },
  { src: '/gallery-plus/9.png', alt: "L'Atelier — expérience 9" },
];

// Three identical groups back-to-back so the 33.3333% keyframe lands
// seamlessly on the next identical group. Three is the minimum that
// keeps the row dense on ultra-wide viewports.
const REPEATS = 3;

function Group({ images, ariaHidden = false }) {
  return (
    <ul className="gallery__group" aria-hidden={ariaHidden ? 'true' : undefined}>
      {images.map((img, i) => (
        <li key={i} className="gallery__tile">
          <img
            src={img.src}
            alt={ariaHidden ? '' : img.alt}
            loading={ariaHidden ? 'lazy' : 'eager'}
            decoding="async"
            draggable="false"
          />
        </li>
      ))}
    </ul>
  );
}

function Row({ images, reverse = false }) {
  const trackClassName = reverse
    ? 'gallery__track gallery__track--reverse'
    : 'gallery__track';
  return (
    <div className="gallery__viewport">
      <div className={trackClassName}>
        <Group images={images} />
        <Group images={images} ariaHidden />
        <Group images={images} ariaHidden />
      </div>
    </div>
  );
}

export default function GalleryMarquee() {
  return (
    <section
      id="gallery"
      className="gallery"
      role="region"
      aria-label="Galerie — L'Atelier en images"
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
          /* === GALLERY MARQUEE — premium infinite portrait loop === */
          .gallery {
            position: relative;
            width: 100%;
            padding: 7rem 0;
            background: #0A0A0A;
            overflow: hidden;
          }

          .gallery__header {
            text-align: center;
            margin-bottom: 4rem;
            padding: 0 1.5rem;
          }

          /* Stacks the two rows vertically with elegant spacing. */
          .gallery__rows {
            display: flex;
            flex-direction: column;
            gap: 48px; /* sits in the requested 40–60px band */
          }

          .gallery__viewport {
            position: relative;
            width: 100%;
            overflow: hidden;
            /* Soft fade on the left/right edges so the wrap point of
               the loop is invisible — entry/exit feels organic. */
            -webkit-mask-image: linear-gradient(
              to right,
              transparent 0%,
              #000 6vw,
              #000 calc(100% - 6vw),
              transparent 100%
            );
                    mask-image: linear-gradient(
              to right,
              transparent 0%,
              #000 6vw,
              #000 calc(100% - 6vw),
              transparent 100%
            );
          }

          .gallery__track {
            display: flex;
            width: max-content;
            will-change: transform;
            /* 50s ≈ the middle of the requested 45–60s range.
               Linear, infinite — animation keeps running on hover. */
            animation: gallery-scroll 50s linear infinite;
            /* Promote to its own compositor layer for smoother animation. */
            transform: translate3d(0, 0, 0);
            backface-visibility: hidden;
          }

          @keyframes gallery-scroll {
            from { transform: translate3d(0, 0, 0); }
            to   { transform: translate3d(-33.3333%, 0, 0); }
          }

          /* Row 2 — mirror keyframe so the row travels in the
             opposite direction at the same speed. Endpoints are
             swapped, duration and easing stay identical, and because
             the group is symmetric (three identical copies) the
             wrap point is still mathematically seamless. */
          .gallery__track--reverse {
            animation-name: gallery-scroll-reverse;
          }

          @keyframes gallery-scroll-reverse {
            from { transform: translate3d(-33.3333%, 0, 0); }
            to   { transform: translate3d(0, 0, 0); }
          }

          .gallery__group {
            display: flex;
            align-items: center;
            list-style: none;
            margin: 0;
            padding: 0;
            flex-shrink: 0;
            gap: 40px;
            padding-left: 40px;
          }

          .gallery__tile {
            flex: 0 0 auto;
            width: min(28vw, 380px);
            aspect-ratio: 2 / 3;
            border-radius: 32px;
            overflow: hidden;
            position: relative;
            background: #111;
            box-shadow:
              0 30px 60px -20px rgba(0, 0, 0, 0.70),
              0 18px 36px -18px rgba(0, 0, 0, 0.50);
            /* Hover transitions live on the tile. The animation is on
               the parent track, so hover cannot pause the loop. */
            transition:
              transform 0.5s cubic-bezier(0.22, 1, 0.36, 1),
              box-shadow 0.5s cubic-bezier(0.22, 1, 0.36, 1),
              filter   0.5s cubic-bezier(0.22, 1, 0.36, 1);
            transform: translate3d(0, 0, 0);
            will-change: transform;
          }

          .gallery__tile img {
            display: block;
            width: 100%;
            height: 100%;
            object-fit: cover;
            user-select: none;
            -webkit-user-drag: none;
          }

          .gallery__tile:hover {
            transform: scale(1.03);
            filter: brightness(1.08);
            box-shadow:
              0 40px 80px -20px rgba(0, 0, 0, 0.85),
              0 24px 48px -18px rgba(0, 0, 0, 0.60),
              0 0 0 1px rgba(197, 160, 89, 0.20);
            z-index: 2;
          }

          /* === TABLET === */
          @media (max-width: 1023px) {
            .gallery__group { gap: 32px; padding-left: 32px; }
            .gallery__tile  { width: min(45vw, 360px); }
            .gallery        { padding: 6rem 0; }
            .gallery__rows  { gap: 40px; }
          }

          /* === MOBILE === */
          @media (max-width: 639px) {
            .gallery__group { gap: 24px; padding-left: 24px; }
            .gallery__tile  { width: min(80vw, 360px); border-radius: 28px; }
            .gallery        { padding: 5rem 0; }
            .gallery__header { margin-bottom: 2.5rem; }
            .gallery__rows  { gap: 32px; }
          }

          /* === ACCESSIBILITY: respect reduced-motion preference === */
          @media (prefers-reduced-motion: reduce) {
            .gallery__track,
            .gallery__track--reverse {
              animation: none;
              transform: translateX(0);
            }
            .gallery__tile { transition: none; }
          }
        `,
        }}
      />

      <div className="gallery__header">
        <p className="font-body text-xs tracking-[0.3em] uppercase text-gold mb-4">
          Galerie
        </p>
        <h2 className="font-heading text-4xl md:text-6xl font-light italic text-marble mb-4">
          L'Atelier en Images
        </h2>
        <div className="gold-line w-16 mx-auto" />
      </div>

      <div className="gallery__rows">
        <Row images={ROW_ONE} />
        <Row images={ROW_TWO} reverse />
      </div>
    </section>
  );
}

