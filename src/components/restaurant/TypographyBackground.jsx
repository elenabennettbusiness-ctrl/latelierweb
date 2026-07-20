import React, { useEffect, useRef } from 'react';

/* ============================================================
   TypographyBackground — the global animated wallpaper.

   A single position:fixed layer living behind every section:
   columns of luxury vocabulary drifting slowly up and down, plus
   a scroll-driven colour ramp from deep black through burgundy to
   a deep restaurant red and back.

   Two rules keep this at 60fps:
     - the columns are pure CSS transform keyframes, never touched
       by JS, so they run on the compositor;
     - the only per-frame JS is a throttled write of two custom
       properties, and it bails when the delta is imperceptible.

   Seamless looping reuses the house marquee trick (see
   GalleryMarquee.jsx): REPEATS identical groups in a max-content
   track, translated by exactly one group's share, so group N+1
   lands precisely where group N started. No reset, no jump.
   ============================================================ */

const WORDS = [
  "L'ATELIER",
  'GASTRONOMIE',
  'SAVEURS',
  'ÉLÉGANCE',
  'ART DE LA TABLE',
  'PRESTIGE',
  'EXCELLENCE',
  'CUISINE',
  'MÉDITERRANÉENNE',
  'FÈS',
  'RESTAURANT',
  'PASSION',
  'CULINAIRE',
  'AUTHENTIQUE',
  'RAFFINEMENT',
];

const REPEATS = 3;

// Five columns, alternating direction. Durations are mutually
// non-harmonic so no two columns ever settle into a visible phase
// lock — the wallpaper never looks like it is tiling.
const COLUMNS = [
  { dir: 'up', duration: 110, offset: 0 },
  { dir: 'down', duration: 151, offset: -18 },
  { dir: 'up', duration: 89, offset: -7 },
  { dir: 'down', duration: 173, offset: -26 },
  { dir: 'up', duration: 131, offset: -12 },
];

/* Deterministic rotation rather than Math.random(), so the word
   order is stable across rerenders and never hydration-mismatches. */
function wordsForColumn(index) {
  const step = 4; // coprime with WORDS.length (15) → every column differs
  return WORDS.map((_, i) => WORDS[(i * step + index * 3) % WORDS.length]);
}

/* Colour stops. In both themes the words now sit *lighter* than
   their background — a medium charcoal on black, a lifted burgundy
   on red — so they stay legible without any white, saturation,
   shadow or stroke. Same palette, raised a step. */
const LUXURY = { bg: [10, 10, 10], word: [88, 88, 88] };
const MID = { bg: [43, 14, 20], word: [96, 40, 48] };
const ENERGY = { bg: [74, 17, 25], word: [122, 46, 58] };

const lerp = (a, b, t) => a + (b - a) * t;

function mixRgb(a, b, t) {
  return `rgb(${Math.round(lerp(a[0], b[0], t))}, ${Math.round(
    lerp(a[1], b[1], t)
  )}, ${Math.round(lerp(a[2], b[2], t))})`;
}

/* The ramp is pinned to four real sections rather than to a
   fraction of the page, so the red peak lands on Location no
   matter how section heights change:

     about       → black
     horaires    → burgundy      (Menu spans black→burgundy)
     emplacement → red, the peak (Reviews spans burgundy→red)
     info        → black

   Outside the first/last anchor it clamps to black, so the hero
   and the footer both sit on pure Luxury. */
const RAMP = [
  { id: 'about', theme: LUXURY },
  { id: 'horaires', theme: MID },
  { id: 'emplacement', theme: ENERGY },
  { id: 'info', theme: LUXURY },
];

export default function TypographyBackground() {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    // Reduced motion: pin to the Luxury stop and never listen to
    // scroll at all. Static words, static background.
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduced.matches) {
      root.style.setProperty('--wp-bg', mixRgb(LUXURY.bg, LUXURY.bg, 0));
      root.style.setProperty('--wp-word', mixRgb(LUXURY.word, LUXURY.word, 0));
      return undefined;
    }

    // Resolve each ramp anchor to its page-Y centre. Measured from
    // real elements so the peak tracks Location even if sections
    // above it change height.
    let stops = [];
    const measure = () => {
      stops = RAMP.map((s) => {
        const el = document.getElementById(s.id);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { y: r.top + window.scrollY + r.height / 2, theme: s.theme };
      }).filter(Boolean);
    };

    // Viewport centre, so a section reads its colour when it is the
    // thing you are actually looking at.
    const sample = () => {
      const y = window.scrollY + window.innerHeight / 2;
      if (!stops.length) return { a: LUXURY, b: LUXURY, k: 0 };
      if (y <= stops[0].y) return { a: stops[0].theme, b: stops[0].theme, k: 0 };
      const last = stops[stops.length - 1];
      if (y >= last.y) return { a: last.theme, b: last.theme, k: 0 };
      for (let i = 0; i < stops.length - 1; i += 1) {
        const s = stops[i];
        const e = stops[i + 1];
        if (y >= s.y && y <= e.y) {
          const span = e.y - s.y;
          return { a: s.theme, b: e.theme, k: span > 0 ? (y - s.y) / span : 0 };
        }
      }
      return { a: LUXURY, b: LUXURY, k: 0 };
    };

    let ticking = false;
    let lastBg = '';
    let lastWord = '';

    const paint = () => {
      ticking = false;
      const { a, b, k } = sample();
      const bg = mixRgb(a.bg, b.bg, k);
      const word = mixRgb(a.word, b.word, k);
      // Compare the resolved colours, not a scalar position. A scalar
      // is ambiguous — the clamped end-of-page value can coincide with
      // an interior one, which silently skips the write and freezes the
      // background. Comparing output is unambiguous, and because mixRgb
      // rounds to integers this still collapses sub-perceptual scroll
      // deltas into no-ops.
      if (bg === lastBg && word === lastWord) return;
      lastBg = bg;
      lastWord = word;
      root.style.setProperty('--wp-bg', bg);
      root.style.setProperty('--wp-word', word);
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(paint);
    };

    const onResize = () => {
      measure();
      lastBg = '';
      lastWord = '';
      onScroll();
    };

    measure();
    paint();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    // The page carries several multi-megabyte images, so layout keeps
    // growing for a long time after first paint. A one-shot timeout is
    // not enough — without this the anchors stay pinned to a much
    // shorter page and the ramp peaks in the wrong section.
    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(onResize);
      ro.observe(document.body);
    }

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (ro) ro.disconnect();
    };
  }, []);

  return (
    <>
      <style>{`
        .wp-root {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          overflow: hidden;
          background-color: var(--wp-bg, #0A0A0A);
          --wp-bg: #0A0A0A;
          --wp-word: #2A2A2A;
        }

        .wp-columns {
          position: absolute;
          inset: -10% -4%;
          display: flex;
          justify-content: space-between;
          gap: clamp(2rem, 6vw, 7rem);
          opacity: 0.12;
        }

        .wp-col {
          flex: 1 1 0;
          min-width: 0;
          overflow: hidden;
        }

        .wp-track {
          display: flex;
          flex-direction: column;
          height: max-content;
          will-change: transform;
          transform: translate3d(0, 0, 0);
          backface-visibility: hidden;
        }

        .wp-word {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 700;
          font-size: clamp(2.75rem, 7vw, 6.5rem);
          line-height: 1.35;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          white-space: nowrap;
          color: var(--wp-word, #2A2A2A);
        }

        /* One group's share of a REPEATS-long track. Landing group
           N+1 exactly where group N began is what makes it seamless. */
        @keyframes wp-up {
          from { transform: translate3d(0, 0, 0); }
          to   { transform: translate3d(0, -33.3333%, 0); }
        }
        @keyframes wp-down {
          from { transform: translate3d(0, -33.3333%, 0); }
          to   { transform: translate3d(0, 0, 0); }
        }

        @media (max-width: 1024px) {
          .wp-col:nth-child(n + 4) { display: none; }
          .wp-columns { gap: clamp(1.5rem, 5vw, 3rem); }
        }
        @media (max-width: 640px) {
          .wp-col:nth-child(n + 3) { display: none; }
        }

        @media (prefers-reduced-motion: reduce) {
          .wp-track {
            animation: none !important;
            transform: translate3d(0, 0, 0) !important;
          }
        }
      `}</style>

      <div className="wp-root" ref={rootRef} aria-hidden="true">
        <div className="wp-columns">
          {COLUMNS.map((col, ci) => {
            const words = wordsForColumn(ci);
            return (
              <div className="wp-col" key={ci}>
                <div
                  className="wp-track"
                  style={{
                    animation: `wp-${col.dir} ${col.duration}s linear infinite`,
                    marginTop: `${col.offset}%`,
                  }}
                >
                  {Array.from({ length: REPEATS }).map((_, ri) => (
                    <div key={ri}>
                      {words.map((w, wi) => (
                        <div className="wp-word" key={`${ri}-${wi}`}>
                          {w}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
