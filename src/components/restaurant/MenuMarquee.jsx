import React from 'react';

/**
 * MenuMarquee — premium editorial food band.
 *
 * A direct visual twin of `Marquee.jsx` (the brand band) but themed
 * entirely around the restaurant's dishes. It lives between the
 * "Notre Histoire" and "La Carte" sections and acts as a tactile,
 * atmospheric transition into the menu.
 *
 * What is IDENTICAL to the brand `Marquee` (must stay in sync):
 *   - section height (220 / 160 / 110 px)
 *   - container background #050505 with the same gold hairline borders
 *   - animation: 150s linear infinite, translate3d(0 → -33.3333%, 0, 0)
 *   - 3 identical groups back-to-back for a mathematically seamless loop
 *   - typography: Cormorant Garamond, weight 500, sizes 168 / 108 / 60 px,
 *     letter-spacing -0.02em, white-space nowrap, padding 0 0.4em
 *   - separator glyph ◇, color #FF6B6B, with the same 3-layer text-shadow glow
 *   - GPU-friendly hints: will-change transform, translate3d(0,0,0),
 *     backface-visibility hidden
 *   - reduced-motion: animation:none, transform: translateX(0)
 *
 * What is DIFFERENT (intentional, per the brief):
 *   - content: dish names from the menu (no hashtags)
 *   - every item renders in the warm-white highlight color
 *     (#F5F2EC, opacity 0.95, weight 700) — i.e. the same treatment
 *     that `Marquee.jsx` reserves for its anchor phrases. Here every
 *     dish is an anchor, so the band reads as a uniform white stream
 *     of plates flowing toward the menu section.
 *   - the diamond separator and its light-red glow are preserved
 *     exactly so the two bands feel like siblings.
 */

// Single source of truth for the dish sequence. Order matters only in
// that every name must appear, and the sequence must read as a natural
// tasting menu flow: entrées → plats → pâtes / pizza → grillades →
// desserts → boissons. It is interleaved so the same diamonds separate
// every pair, matching the rhythm of the brand band.
const SEQUENCE = [
  'Entrecôte',
  'Pizza Reine',
  'Risotto aux Fruits de Mer',
  'Filet de Veau Grillé',
  'Burger Maison',
  'Saumon Grillé',
  'Tagliatelles',
  'Pâtes Fraîches',
  'Pizza Margherita',
  'Salade César',
  'Grillades',
  'Dessert Maison',
  'Tiramisu',
  'Fondant au Chocolat',
  'Jus Frais',
  'Cocktail Signature',
];

// Three identical groups back-to-back so the 33.3333% keyframe lands
// seamlessly on the next identical group. Three is the minimum that
// keeps the row dense on ultra-wide viewports — the same number used
// by the brand `Marquee` so the two bands read at the same density.
const REPEATS = 3;

function Group({ ariaHidden = false }) {
  return (
    <ul className="menu-marquee__group" aria-hidden={ariaHidden ? 'true' : undefined}>
      {Array.from({ length: REPEATS }).map((_, cycle) => (
        <React.Fragment key={cycle}>
          {SEQUENCE.map((label, i) => (
            <React.Fragment key={`${cycle}-${i}`}>
              <li className="menu-marquee__item">{label}</li>
              <li className="menu-marquee__sep" aria-hidden="true">
                ◇
              </li>
            </React.Fragment>
          ))}
        </React.Fragment>
      ))}
    </ul>
  );
}

export default function MenuMarquee() {
  return (
    <section
      className="menu-marquee"
      role="region"
      aria-label="L'Atelier Restaurant — la carte en mouvement"
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
          /* === MENU MARQUEE — premium editorial food band === */
          .menu-marquee {
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

          .menu-marquee__track {
            display: flex;
            width: max-content;
            will-change: transform;
            /* 150s, linear, infinite — exactly mirrors the brand band. */
            animation: menu-marquee-scroll 150s linear infinite;
            transform: translate3d(0, 0, 0);
            backface-visibility: hidden;
          }

          @keyframes menu-marquee-scroll {
            from { transform: translate3d(0, 0, 0); }
            to   { transform: translate3d(-33.3333%, 0, 0); }
          }

          .menu-marquee__group {
            display: flex;
            align-items: center;
            list-style: none;
            margin: 0;
            padding: 0;
            flex-shrink: 0;
          }

          /* Dishes — same family, weight and size as the brand band.
             Every dish gets the warm-white highlight treatment so the
             band reads as a continuous stream of plates leading into
             the menu section. */
          .menu-marquee__item {
            font-family: 'Cormorant Garamond', serif;
            font-weight: 700;
            font-size: 168px;
            line-height: 0.9;
            letter-spacing: -0.02em;
            color: #F5F2EC;
            opacity: 0.95;
            white-space: nowrap;
            padding: 0 0.4em;
            user-select: none;
          }

          /* Separator — same diamond glyph, same breathing lamp
             treatment as the brand band: warm ivory → deep ruby →
             hold → back. Only the emitted light changes. */
          .menu-marquee__sep {
            font-family: 'Cormorant Garamond', serif;
            font-weight: 400;
            font-size: 96px;
            line-height: 1;
            opacity: 0.95;
            padding: 0 0.1em;
            user-select: none;
            flex-shrink: 0;
            align-self: center;
            color: #FFF1DE;
            animation: lamp-breathe 5.5s ease-in-out infinite;
          }

          /* Glow radius and brightness swell ~12% into the red phase,
             then settle back — the rhythm of a warm wall lamp, not a
             neon sign. 0% and 100% are identical so the loop never
             jumps. Same definition as the brand band's; @keyframes
             names are global, so the duplicate is harmless. */
          @keyframes lamp-breathe {
            0% {
              color: #FFF1DE;
              text-shadow:
                0 0 6px rgba(255, 238, 214, 0.50),
                0 0 14px rgba(255, 226, 190, 0.38),
                0 0 26px rgba(255, 214, 170, 0.20);
            }
            42% {
              color: #D92B4E;
              text-shadow:
                0 0 7px rgba(217, 43, 78, 0.80),
                0 0 16px rgba(196, 38, 70, 0.62),
                0 0 29px rgba(172, 33, 62, 0.33);
            }
            58% {
              color: #D92B4E;
              text-shadow:
                0 0 7px rgba(217, 43, 78, 0.80),
                0 0 16px rgba(196, 38, 70, 0.62),
                0 0 29px rgba(172, 33, 62, 0.33);
            }
            100% {
              color: #FFF1DE;
              text-shadow:
                0 0 6px rgba(255, 238, 214, 0.50),
                0 0 14px rgba(255, 226, 190, 0.38),
                0 0 26px rgba(255, 214, 170, 0.20);
            }
          }

          /* === TABLET === */
          @media (max-width: 1024px) {
            .menu-marquee { height: 160px; }
            .menu-marquee__item { font-size: 108px; }
            .menu-marquee__sep  { font-size: 64px; }
          }

          /* === MOBILE === */
          @media (max-width: 640px) {
            .menu-marquee { height: 110px; }
            .menu-marquee__item { font-size: 60px; padding: 0 0.3em; }
            .menu-marquee__sep  { font-size: 40px; }
          }

          /* === ACCESSIBILITY: respect reduced-motion preference === */
          @media (prefers-reduced-motion: reduce) {
            .menu-marquee__track {
              animation: none;
              transform: translateX(0);
            }
            /* Freeze the lamp at its warm-ivory rest state. The glow is
               restated here because it only ever exists inside the
               keyframes — animation: none alone would leave the glyph
               unlit. */
            .menu-marquee__sep {
              animation: none;
              text-shadow:
                0 0 6px rgba(255, 238, 214, 0.50),
                0 0 14px rgba(255, 226, 190, 0.38),
                0 0 26px rgba(255, 214, 170, 0.20);
            }
          }
        `,
        }}
      />
      <div className="menu-marquee__track">
        <Group />
        <Group ariaHidden />
        <Group ariaHidden />
      </div>
    </section>
  );
}
