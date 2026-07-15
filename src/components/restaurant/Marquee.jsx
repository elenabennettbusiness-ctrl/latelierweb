import React from 'react';

/**
 * Marquee — premium editorial branding band.
 *
 * A subtle, oversized horizontal scroll that sits between the Hero and
 * "Notre Histoire" sections. Pure CSS animation, GPU-accelerated,
 * seamless loop, accessibility-aware.
 *
 * Design language mirrors the rest of the site:
 *   background   #050505 (slightly deeper than --obsidian)
 *   soft text    #C5A059 (existing gold token) at 0.45
 *   accent text  #F5F2EC (warm white) at 0.95
 *   typeface     Cormorant Garamond (existing display face)
 *   separator    gold diamond ◇, ties to existing gold-line motif
 *
 * Visual hierarchy:
 *   - highlight phrases (e.g. L'Atelier Restaurant, #Gastronomie)
 *     render in warm white, weight 700, full visibility.
 *   - the lead slot (#LAtelierRestaurant) currently coincides with
 *     a highlight, so it uses the highlight treatment directly.
 *   - the remaining hashtags render in muted gold, lighter weight,
 *     softer opacity — they form the supporting rhythm.
 */

// Single source of truth for the sequence. Order matters — the brief
// specifies `#LAtelierRestaurant` first and "repeatedly throughout".
// Sequence is interleaved so white-highlight terms never sit next to
// each other. 8 of 18 items (~44%) resolve to the highlight set, which
// keeps the visual rhythm balanced and avoids bright clusters.
const SEQUENCE = [
  '#LAtelierRestaurant',
  '#PâtesFraîches',
  '#Fès',
  '#SaveursAuthentiques',
  'Restaurant',
  '#ArtDeLaTable',
  '#CuisineMéditerranéenne',
  '#CuisineAuFeu',
  '#Gastronomie',
  '#AmbianceÉlégante',
  '#LiveMusic',
  '#ServiceRaffiné',
  "L'Atelier Restaurant",
  '#CaveÀVins',
  '#Terrasse',
  '#CadreChaleureux',
  '#VuePanoramique',
  '#ExpérienceGastronomique',
];

// Phrases that should pop in warm white with a heavier weight.
// The set is pre-normalized (lowercase + diacritics stripped) once
// at module load so per-render matching is a single Set.has() lookup.
const HIGHLIGHT_NORMALIZED = new Set(
  [
    "L'Atelier Restaurant",
    'Restaurant',
    '#LAtelier',
    '#Restaurant',
    '#RestaurantFes',
    '#Fès',
    '#Cuisine',
    '#Gastronomie',
    '#ExpérienceGastronomique',
    '#Saveurs',
    '#CuisineMéditerranéenne',
    '#Grillades',
    '#Pizza',
    '#Pâtes',
    '#Desserts',
    '#Cocktails',
    '#FineDining',
    '#LiveMusic',
    '#FoodExperience',
    '#MediterraneanCuisine',
    '#MoroccanFlavors',
    '#Chef',
    '#LAtelierRestaurant',
  ].map((s) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
  )
);

const LEAD_INDEX = 0;

// How many copies of the sequence appear in the track. Three is the
// minimum that keeps the rhythm dense on ultra-wide viewports; the
// keyframe translation is exactly one group's width (33.3333%), so
// the loop stays mathematically seamless.
const REPEATS = 3;

function Group({ ariaHidden = false }) {
  // The sequence is rendered `REPEATS` times per group. Because each
  // group is identical, translating the track by one group's width
  // positions group N+1 exactly where group N was — the loop is
  // visually seamless and structurally minimal.
  return (
    <ul className="marquee__group" aria-hidden={ariaHidden ? 'true' : undefined}>
      {Array.from({ length: REPEATS }).map((_, cycle) => (
        <React.Fragment key={cycle}>
          {SEQUENCE.map((label, i) => {
            const isHighlight = HIGHLIGHT_NORMALIZED.has(
              label
                .toLowerCase()
                .normalize('NFD')
                .replace(/\p{Diacritic}/gu, '')
            );
            // LEAD_INDEX is kept as a declared intent. Currently the
            // lead slot is also a highlight, so the lead class is a
            // no-op; if the lead is ever moved out of the highlight
            // set, the class wiring is already in place.
            const isLead = i === LEAD_INDEX;
            const classes = ['marquee__item'];
            if (isHighlight) classes.push('marquee__item--highlight');
            if (isLead && !isHighlight) classes.push('marquee__item--lead');
            return (
              <React.Fragment key={`${cycle}-${i}`}>
                <li className={classes.join(' ')}>{label}</li>
                <li className="marquee__sep" aria-hidden="true">
                  ◇
                </li>
              </React.Fragment>
            );
          })}
        </React.Fragment>
      ))}
    </ul>
  );
}

export default function Marquee() {
  return (
    <section
      className="marquee"
      role="region"
      aria-label="L'Atelier Restaurant — identité"
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
          /* === MARQUEE — premium editorial brand band === */
          .marquee {
            position: relative;
            width: 100%;
            height: 220px;
            overflow: hidden;
            background: #050505;
            display: flex;
            align-items: center;
            border-top: 0.5px solid rgba(197, 160, 89, 0.12);
            border-bottom: 0.5px solid rgba(197, 160, 89, 0.12);
          }

          .marquee__track {
            display: flex;
            width: max-content;
            will-change: transform;
            /* 150s ≈ 50% slower than the previous 75s. Linear, infinite,
               no pause — animation keeps running on hover. */
            animation: marquee-scroll 150s linear infinite;
            /* Promote to its own compositor layer for smoother animation. */
            transform: translate3d(0, 0, 0);
            backface-visibility: hidden;
          }

          @keyframes marquee-scroll {
            from { transform: translate3d(0, 0, 0); }
            to   { transform: translate3d(-33.3333%, 0, 0); }
          }

          .marquee__group {
            display: flex;
            align-items: center;
            list-style: none;
            margin: 0;
            padding: 0;
            flex-shrink: 0;
          }

          .marquee__item {
            font-family: 'Cormorant Garamond', serif;
            font-weight: 500;
            font-size: 168px;
            line-height: 0.9;
            letter-spacing: -0.02em;
            color: #C5A059;
            opacity: 0.45;
            white-space: nowrap;
            padding: 0 0.4em;
            user-select: none;
          }

          /* Lead phrase — kept as a soft accent in the muted gold family. */
          .marquee__item--lead {
            font-weight: 700;
            opacity: 0.70;
          }

          /* Highlight phrases — warm white, heavier weight, full visibility.
             These are the editorial anchors the eye should land on. */
          .marquee__item--highlight {
            font-weight: 700;
            color: #F5F2EC;
            opacity: 0.95;
          }

          /* Separator — original diamond glyph ◇, recolored to a
             premium light red with a soft ambient glow. text-shadow
             is used (it follows the glyph cleanly and stays crisp at
             every breakpoint, unlike a stacked box-shadow on a
             no-width inline element). */
          .marquee__sep {
            font-family: 'Cormorant Garamond', serif;
            font-weight: 400;
            font-size: 96px;
            line-height: 1;
            color: #FF6B6B;
            opacity: 0.95;
            padding: 0 0.1em;
            text-shadow:
              0 0 6px rgba(255, 107, 107, 0.55),
              0 0 14px rgba(255, 107, 107, 0.45),
              0 0 26px rgba(255, 138, 128, 0.25);
            user-select: none;
            flex-shrink: 0;
            align-self: center;
          }

          /* === TABLET === */
          @media (max-width: 1024px) {
            .marquee { height: 160px; }
            .marquee__item { font-size: 108px; }
            .marquee__sep  { font-size: 64px; }
          }

          /* === MOBILE === */
          @media (max-width: 640px) {
            .marquee { height: 110px; }
            .marquee__item { font-size: 60px; padding: 0 0.3em; }
            .marquee__sep  { font-size: 40px; }
          }

          /* === ACCESSIBILITY: respect reduced-motion preference === */
          @media (prefers-reduced-motion: reduce) {
            .marquee__track {
              animation: none;
              transform: translateX(0);
            }
          }
        `,
        }}
      />
      <div className="marquee__track">
        <Group />
        <Group ariaHidden />
        <Group ariaHidden />
      </div>
    </section>
  );
}
