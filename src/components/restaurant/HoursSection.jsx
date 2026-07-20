import React, { useEffect, useRef } from 'react';
import { openReservation } from './ReservationModal';
import {
  CLOSED_LABEL,
  HOURS_IMAGES,
  HOURS_IMAGE_ALTS,
  HOURS_IMAGE_NATURAL,
  SCHEDULE,
} from './hours/hoursData';

/* ============================================================
   HoursSection — "Horaires d'Ouverture"

   Two large portraits framing a centred schedule: gold label +
   heading + gold-line divider, the week as a <dl>, then the
   site's standard gold CTA which opens the reservation modal.

   Everything is fed from hours/hoursData.js — edit SCHEDULE
   there, not here.

   Atmosphere note: ReviewsSection layers a dark overlay + vignette
   over a background *photo*. Replaying that here would be a no-op —
   darkening #0A0A0A with rgba(10,10,10,.7) changes nothing — so the
   base is instead the warm near-black gradient ReviewsSection.jsx:124
   already falls back to when its photo is absent, topped with that
   section's exact vignette. Same two values, borrowed from the place
   they're used without a photo.
   ============================================================ */

const SECTION_STYLES = `
  .hrs-bg-base {
    position: absolute;
    inset: 0;
    z-index: 0;
    background: linear-gradient(160deg, #17130d 0%, #0A0A0A 55%, #050504 100%);
  }
  .hrs-bg-vignette {
    position: absolute;
    inset: 0;
    z-index: 1;
    background: radial-gradient(120% 100% at 50% 30%, transparent 35%, rgba(10, 10, 10, 0.65) 100%);
  }

  /* — Shell —
     Wider than the site's default max-w-6xl (72rem) on desktop only, purely
     to give the flanking portraits room. The timetable column is still
     pinned at 30rem, so every measurement inside it is untouched — the extra
     width lands entirely in the two side columns, which were the empty part
     of the section. Below 1024px this is exactly max-w-6xl, as before. */
  .hrs-shell {
    max-width: 72rem;
    margin-inline: auto;
  }
  @media (min-width: 1024px) {
    .hrs-shell { max-width: 87.5rem; }
  }

  /* — Layout —
     DOM order is the mobile order the brief asks for: heading, first
     image, hours + button, second image. Desktop and tablet then place
     items explicitly on the grid, so no order/flex hacks are needed and
     the reading order stays correct for screen readers at every width. */
  .hrs-layout {
    display: grid;
    justify-items: center;
    gap: 3.5rem;
  }
  .hrs-panel { width: 100%; }

  @media (min-width: 768px) and (max-width: 1023px) {
    .hrs-layout {
      grid-template-columns: 1fr 1fr;
      column-gap: 2.5rem;
      row-gap: 4.5rem;
      align-items: start;
    }
    .hrs-head   { grid-column: 1 / -1; grid-row: 1; }
    .hrs-panel  { grid-column: 1 / -1; grid-row: 2; max-width: 34rem; }
    .hrs-fig--a { grid-column: 1; grid-row: 3; }
    .hrs-fig--b { grid-column: 2; grid-row: 3; }
  }

  @media (min-width: 1024px) {
    .hrs-layout {
      grid-template-columns: minmax(0, 1fr) minmax(0, 30rem) minmax(0, 1fr);
      /* Was clamp(2rem, 5vw, 5rem) — a viewport-scaled gap against a fixed
         shell meant the side columns *shrank* as the screen grew (272px at
         1280 down to 256px at 1920). Capped at 3rem so widening the shell
         reaches the portraits instead of the gutters. */
      column-gap: clamp(1.75rem, 2.5vw, 3rem);
      row-gap: 2.75rem;
      align-items: center;
    }
    .hrs-fig--a { grid-column: 1; grid-row: 1 / span 2; }
    .hrs-head   { grid-column: 2; grid-row: 1; }
    .hrs-panel  { grid-column: 2; grid-row: 2; }
    .hrs-fig--b { grid-column: 3; grid-row: 1 / span 2; }
  }

  /* — Images — */
  .hrs-fig {
    margin: 0;
    width: 100%;
    max-width: 22rem;
  }
  /* 30rem is a ceiling, not a target: the side column is the real limit at
     every realistic viewport, so this only stops the portraits growing
     absurdly on ultra-wide screens. The old 26rem cap never even engaged. */
  @media (min-width: 1024px) {
    .hrs-fig { max-width: 30rem; }
  }
  .hrs-fig__frame {
    /* Diagonal corner treatment: large on one diagonal, the site's standard
       18px card radius on the other. ~11-20% of the frame width — a clear
       sculpted asymmetry that never approaches a pill (which would need 50%). */
    --hrs-r-lg: clamp(2.25rem, 3.5vw, 4.5rem);
    --hrs-r-sm: 18px;
    position: relative;
    overflow: hidden;
    aspect-ratio: 2 / 3;
    background: #111;
    box-shadow: 0 24px 50px -22px rgba(0, 0, 0, 0.65), 0 12px 24px -14px rgba(0, 0, 0, 0.45);
    transition: box-shadow 500ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  /* Mirrored about the centre line, so the two large corners lean toward each
     other and close the frame around the timetable rather than repeating.
     Order is top-left, top-right, bottom-right, bottom-left. */
  .hrs-fig--a .hrs-fig__frame {
    border-radius: var(--hrs-r-lg) var(--hrs-r-sm) var(--hrs-r-lg) var(--hrs-r-sm);
  }
  .hrs-fig--b .hrs-fig__frame {
    border-radius: var(--hrs-r-sm) var(--hrs-r-lg) var(--hrs-r-sm) var(--hrs-r-lg);
  }
  .hrs-fig__img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 700ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  /* Hover is desktop-only by capability, not just width: a touch device
     would otherwise latch the zoom on tap and keep it. */
  @media (hover: hover) and (pointer: fine) and (min-width: 1024px) {
    .hrs-fig:hover .hrs-fig__img { transform: scale(1.03); }
    .hrs-fig:hover .hrs-fig__frame {
      box-shadow:
        0 34px 70px -20px rgba(0, 0, 0, 0.8),
        0 18px 36px -16px rgba(0, 0, 0, 0.55),
        0 0 0 1px rgba(197, 160, 89, 0.25);
    }
  }

  /* — Schedule — */
  .hrs-list { margin: 0; }
  .hrs-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1.5rem;
    padding: 1.05rem 0.75rem;
    border-top: 1px solid rgba(235, 235, 235, 0.07);
    border-radius: 4px;
    transition: background-color 400ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .hrs-row:first-child { border-top: 0; }
  @media (hover: hover) and (pointer: fine) and (min-width: 1024px) {
    .hrs-row:hover { background-color: rgba(235, 235, 235, 0.03); }
  }
  .hrs-day {
    margin: 0;
    font-family: 'Cormorant Garamond', serif;
    font-weight: 500;
    font-size: 1.3rem;
    letter-spacing: 0.01em;
    color: #EBEBEB;
  }
  .hrs-slots {
    margin: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.2rem;
    text-align: right;
  }
  .hrs-slot {
    font-family: 'Inter', sans-serif;
    font-weight: 400;
    font-size: 0.85rem;
    letter-spacing: 0.04em;
    font-variant-numeric: tabular-nums;
    color: #FF6B6B;
    text-shadow: 0 0 6px rgba(255, 107, 107, 0.35), 0 0 14px rgba(255, 107, 107, 0.2);
  }
  .hrs-slot--closed {
    color: rgba(235, 235, 235, 0.35);
    text-shadow: none;
    font-style: italic;
  }

  /* — CTA —
     Same rules as Navigation.jsx's .nav-cta, the site-wide gold button.
     Duplicated rather than imported because .nav-cta lives inside that
     component's own <style> string; this section follows the project's
     per-section style-block convention. */
  .hrs-cta-wrap {
    margin-top: 2.75rem;
    text-align: center;
  }
  .hrs-cta {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-family: 'Inter', sans-serif;
    font-size: 0.72rem;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    padding: 0.65rem 1.5rem;
    border: 1px solid rgba(197, 160, 89, 0.7);
    color: #C5A059;
    background: transparent;
    cursor: pointer;
    transition: background-color 300ms cubic-bezier(0.22, 1, 0.36, 1),
                color 300ms cubic-bezier(0.22, 1, 0.36, 1),
                border-color 300ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .hrs-cta:hover,
  .hrs-cta:focus-visible {
    background: #C5A059;
    color: #0A0A0A;
    border-color: #C5A059;
    outline: none;
  }

  /* — Reveal —
     One observer on the wrapper; children stagger off descendant
     selectors, the same mechanism AboutSection.jsx uses. */
  .hrs-head,
  .hrs-fig,
  .hrs-row,
  .hrs-cta-wrap {
    opacity: 0;
    transition: opacity 800ms cubic-bezier(0.22, 1, 0.36, 1), transform 800ms cubic-bezier(0.22, 1, 0.36, 1);
    will-change: transform, opacity;
  }
  .hrs-head { transform: translate3d(0, 30px, 0); }
  .hrs-fig--a { transform: translate3d(-40px, 0, 0); }
  .hrs-fig--b { transform: translate3d(40px, 0, 0); }
  .hrs-row { transform: translate3d(0, 20px, 0); }
  .hrs-cta-wrap { transform: translate3d(0, 20px, 0); }

  .hrs-layout.is-visible .hrs-head,
  .hrs-layout.is-visible .hrs-fig,
  .hrs-layout.is-visible .hrs-row,
  .hrs-layout.is-visible .hrs-cta-wrap {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
  .hrs-layout.is-visible .hrs-fig--a,
  .hrs-layout.is-visible .hrs-fig--b { transition-delay: 120ms; }
  .hrs-layout.is-visible .hrs-row:nth-child(1) { transition-delay: 300ms; }
  .hrs-layout.is-visible .hrs-row:nth-child(2) { transition-delay: 370ms; }
  .hrs-layout.is-visible .hrs-row:nth-child(3) { transition-delay: 440ms; }
  .hrs-layout.is-visible .hrs-row:nth-child(4) { transition-delay: 510ms; }
  .hrs-layout.is-visible .hrs-row:nth-child(5) { transition-delay: 580ms; }
  .hrs-layout.is-visible .hrs-row:nth-child(6) { transition-delay: 650ms; }
  .hrs-layout.is-visible .hrs-row:nth-child(7) { transition-delay: 720ms; }
  .hrs-layout.is-visible .hrs-cta-wrap { transition-delay: 820ms; }

  @media (prefers-reduced-motion: reduce) {
    .hrs-head,
    .hrs-fig,
    .hrs-row,
    .hrs-cta-wrap {
      transition: none;
      transition-delay: 0ms;
      opacity: 1;
      transform: none;
    }
    .hrs-fig__frame,
    .hrs-fig__img,
    .hrs-cta { transition: none; }
  }
`;

// Same dependency-free reveal pattern used by AboutSection.jsx /
// MenuSection.jsx / ReviewsSection.jsx.
function useReveal(options = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      if (el) el.classList.add('is-visible');
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: options.rootMargin || '0px 0px -10% 0px',
        threshold: options.threshold || 0.12,
      }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [options.rootMargin, options.threshold]);

  return ref;
}

function HoursFigure({ src, alt, variant }) {
  if (!src) return null;
  return (
    <figure className={`hrs-fig hrs-fig--${variant}`}>
      <div className="hrs-fig__frame">
        <img
          src={src}
          alt={alt}
          className="hrs-fig__img"
          width={HOURS_IMAGE_NATURAL.width}
          height={HOURS_IMAGE_NATURAL.height}
          loading="lazy"
          decoding="async"
          draggable="false"
        />
      </div>
    </figure>
  );
}

export default function HoursSection() {
  const layoutRef = useReveal({ rootMargin: '0px 0px -5% 0px' });
  const [imageA, imageB] = HOURS_IMAGES;

  return (
    <section
      id="horaires"
      aria-labelledby="horaires-title"
      className="relative py-24 md:py-40 px-6 md:px-12 overflow-hidden"
    >
      <style dangerouslySetInnerHTML={{ __html: SECTION_STYLES }} />
      <div className="hrs-bg-base" aria-hidden="true" />
      <div className="hrs-bg-vignette" aria-hidden="true" />

      <div className="hrs-shell relative z-10">
        <div ref={layoutRef} className="hrs-layout">
          <header className="hrs-head text-center">
            <p className="font-body text-xs tracking-[0.3em] uppercase text-gold mb-4">Horaires</p>
            <h2
              id="horaires-title"
              className="font-heading text-4xl md:text-6xl font-light italic text-marble mb-4"
            >
              Horaires d&apos;Ouverture
            </h2>
            <div className="gold-line w-16 mx-auto" />
          </header>

          <HoursFigure src={imageA} alt={HOURS_IMAGE_ALTS[0]} variant="a" />

          <div className="hrs-panel">
            <dl className="hrs-list">
              {SCHEDULE.map(({ day, slots }) => (
                <div key={day} className="hrs-row">
                  <dt className="hrs-day">{day}</dt>
                  <dd className="hrs-slots">
                    {slots.length === 0 ? (
                      <span className="hrs-slot hrs-slot--closed">{CLOSED_LABEL}</span>
                    ) : (
                      slots.map((slot) => (
                        <span key={slot} className="hrs-slot">{slot}</span>
                      ))
                    )}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="hrs-cta-wrap">
              <button type="button" className="hrs-cta" onClick={openReservation}>
                Réserver
              </button>
            </div>
          </div>

          <HoursFigure src={imageB} alt={HOURS_IMAGE_ALTS[1]} variant="b" />
        </div>
      </div>
    </section>
  );
}
