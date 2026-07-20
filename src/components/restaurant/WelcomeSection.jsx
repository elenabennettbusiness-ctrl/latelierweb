import React, { useEffect, useRef } from 'react';

/* ============================================================
   WelcomeSection — "Bienvenue"

   The greeting that follows the hero: a full-bleed photo of the
   room (public/Welcome/) under a light gradient + vignette, with
   a centred gold label / heading / divider / paragraph / CTA
   stack floating above it. The overlay is deliberately lighter
   than ReviewsSection's — here the photograph is the subject.

   Two motion layers, both cheap:
   - a slow cinematic scale 1 → 1.04 on the photo when the
     section first enters the viewport (pure CSS),
   - a ±8px / ±6px mouse parallax on the background wrapper,
     desktop pointers only.
   They live on separate elements so they never contend for the
   same `transform`.
   ============================================================ */

const WELCOME_BACKGROUND = '/Welcome/1.webp';

// Desktop-only cursor drift bounds, in px.
const PARALLAX_X = 8;
const PARALLAX_Y = 6;
const LERP = 0.08;
// Scroll glide: ± this many px over the section's full pass through the
// viewport. .welcome-bg-wrap must overscan by at least this much.
const SCROLL_TRAVEL = 60;

const SECTION_STYLES = `
  .welcome-section {
    min-height: 52vh;
    display: flex;
    align-items: center;
    padding: 4rem 0;
    /* The section already clips with overflow-hidden, so one radius here
       rounds the photo and both overlays together — nothing can escape
       it, and the overscanned .welcome-bg-wrap is clipped to the same
       shape. ~32px at 1440, ~18px at 834, 16px at 390. */
    border-radius: clamp(16px, 2.2vw, 32px);
  }
  @media (min-width: 768px) {
    .welcome-section { min-height: 60vh; padding: 5rem 0; }
  }
  @media (min-width: 1025px) {
    .welcome-section { min-height: 70vh; padding: 6rem 0; }
  }

  /* — Background —
     The wrapper overscans the section so neither the scroll glide
     (±60px vertical) nor the cursor drift (±8/±6px) can ever expose
     a gap at the borders. */
  .welcome-bg-wrap {
    position: absolute;
    inset: -80px -20px;
    z-index: 0;
  }
  .welcome-bg-parallax {
    position: absolute;
    inset: 0;
    transform: translate3d(0, 0, 0);
    will-change: transform;
  }
  .welcome-bg-photo {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center center;
    background-repeat: no-repeat;
    transform: scale(1);
    transform-origin: center;
    transition: transform 2400ms cubic-bezier(0.22, 1, 0.36, 1);
    will-change: transform;
  }
  .welcome-bg-wrap.is-visible .welcome-bg-photo {
    transform: scale(1.04);
  }

  /* Same construction as ReviewsSection's .avis-bg-overlay /
     .avis-bg-vignette, but much lighter: the photograph should read
     close to the original. Neutral black only — no tint, no filter,
     no blend mode — so the image's colour and temperature are
     untouched. Darker at top and bottom, clearest through the middle,
     so the text still has something to sit against; the bottom stop
     stays heaviest because the CTA sits there. */
  .welcome-bg-overlay {
    position: absolute;
    inset: 0;
    z-index: 1;
    background: linear-gradient(180deg, rgba(10, 10, 10, 0.24) 0%, rgba(10, 10, 10, 0.14) 45%, rgba(10, 10, 10, 0.38) 100%);
  }
  .welcome-bg-vignette {
    position: absolute;
    inset: 0;
    z-index: 1;
    background: radial-gradient(120% 100% at 50% 40%, transparent 46%, rgba(10, 10, 10, 0.42) 100%);
  }

  /* — Typography —
     A soft shadow instead of a heavier overlay: it buys legibility
     where the photo is bright (windows, service counter) without
     darkening the room itself. */
  .welcome-label,
  .welcome-text {
    text-shadow: 0 2px 18px rgba(10, 10, 10, 0.55);
  }
  .welcome-title {
    /* Pure white rather than the site-wide marble (#EBEBEB), so the
       greeting reads crisply against the photograph. A tighter halo
       than the label/paragraph keeps the glyph edges sharp. */
    color: #FFFFFF;
    opacity: 1;
    text-shadow: 0 2px 12px rgba(10, 10, 10, 0.5);
    font-size: clamp(2.25rem, 6vw, 4.5rem);
    line-height: 1.12;
    margin-bottom: 1.5rem;
  }
  .welcome-text {
    max-width: 650px;
    margin: 1.5rem auto 0;
    font-size: clamp(0.9rem, 1.6vw, 1.05rem);
    line-height: 1.9;
    color: rgba(235, 235, 235, 0.78);
  }
  /* The site-wide .gold-line hairline is built for solid dark
     backgrounds; over a photo it needs a shadow to stay readable. */
  .welcome-divider {
    box-shadow: 0 0 8px rgba(10, 10, 10, 0.7);
  }

  /* — CTA —
     Same rules as Navigation.jsx's .nav-cta, the site-wide gold
     button. Duplicated rather than imported because .nav-cta lives
     inside that component's own <style> string; this section
     follows the project's per-section style-block convention.
     Adds a lift + soft glow on top of the shared gold fill. */
  .welcome-cta-wrap {
    margin-top: 2.5rem;
  }
  .welcome-cta {
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
                border-color 300ms cubic-bezier(0.22, 1, 0.36, 1),
                transform 300ms cubic-bezier(0.22, 1, 0.36, 1),
                box-shadow 300ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .welcome-cta:hover,
  .welcome-cta:focus-visible {
    background: #C5A059;
    color: #0A0A0A;
    border-color: #C5A059;
    outline: none;
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(197, 160, 89, 0.28);
  }
  @media (max-width: 480px) {
    .welcome-cta { width: 100%; }
  }

  /* — Reveal —
     One observer on the wrapper; children stagger off descendant
     selectors, the same mechanism HoursSection.jsx uses. */
  .welcome-label,
  .welcome-title,
  .welcome-divider,
  .welcome-text,
  .welcome-cta-wrap {
    opacity: 0;
    transform: translate3d(0, 24px, 0);
    transition: opacity 900ms cubic-bezier(0.22, 1, 0.36, 1), transform 900ms cubic-bezier(0.22, 1, 0.36, 1);
    will-change: transform, opacity;
  }
  .welcome-content.is-visible .welcome-label,
  .welcome-content.is-visible .welcome-title,
  .welcome-content.is-visible .welcome-divider,
  .welcome-content.is-visible .welcome-text,
  .welcome-content.is-visible .welcome-cta-wrap {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
  .welcome-content.is-visible .welcome-title { transition-delay: 140ms; }
  .welcome-content.is-visible .welcome-divider { transition-delay: 280ms; }
  .welcome-content.is-visible .welcome-text { transition-delay: 380ms; }
  .welcome-content.is-visible .welcome-cta-wrap { transition-delay: 520ms; }

  @media (prefers-reduced-motion: reduce) {
    .welcome-bg-photo,
    .welcome-cta,
    .welcome-label,
    .welcome-title,
    .welcome-divider,
    .welcome-text,
    .welcome-cta-wrap {
      transition: none;
      transition-delay: 0ms;
      opacity: 1;
      transform: none;
    }
    .welcome-bg-wrap.is-visible .welcome-bg-photo { transform: none; }
  }
`;

// Same dependency-free reveal pattern used by ReviewsSection.jsx/HoursSection.jsx.
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

export default function WelcomeSection() {
  const sectionRef = useRef(null);
  const parallaxRef = useRef(null);
  const bgRef = useReveal({ threshold: 0.05 });
  const contentRef = useReveal({ rootMargin: '0px 0px -12% 0px' });

  /* Background motion. Only .welcome-bg-parallax moves; it carries the
     sum of two contributions in a single transform, driven by one RAF
     loop that runs only while the section is on screen:

       translate3d(mouseX, mouseY + scrollOffset, 0)

     - scrollOffset: tied to the section's travel through the viewport,
       so the photo glides continuously against the section as you
       scroll. This is the effect ReviewsSection gets from
       `background-attachment: fixed`, but composited instead of
       repainted — which is why it can stay enabled on touch devices,
       where Reviews disables its own.
     - mouseX/mouseY: the ±8/±6px cursor drift, desktop pointers only. */
  useEffect(() => {
    const section = sectionRef.current;
    const layer = parallaxRef.current;
    if (!section || !layer || typeof window === 'undefined') return undefined;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    // Coarse-pointer check mirrors FluidCursor.jsx's touch guard. Only the
    // cursor drift is gated on it; the scroll glide runs everywhere.
    const pointerFine =
      !window.matchMedia('(pointer: coarse)').matches && window.innerWidth >= 1025;

    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    let scrollOffset = 0;
    let rect = section.getBoundingClientRect();
    let frame = null;
    let running = false;

    const measure = () => {
      rect = section.getBoundingClientRect();
    };

    const tick = () => {
      // One layout read per frame, then one style write. Never interleaved,
      // so this cannot thrash.
      const box = section.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const progress = (box.top + box.height / 2 - vh / 2) / ((vh + box.height) / 2);
      scrollOffset = Math.max(-1, Math.min(1, progress)) * SCROLL_TRAVEL;

      current.x += (target.x - current.x) * LERP;
      current.y += (target.y - current.y) * LERP;

      const x = current.x;
      const y = current.y + scrollOffset;
      layer.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;

      frame = running ? requestAnimationFrame(tick) : null;
    };

    // The loop is bound to visibility rather than to input: the scroll
    // glide has to keep updating whenever the section is on screen, and
    // must cost nothing when it is not.
    const visibility = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!running) {
            running = true;
            measure();
            frame = requestAnimationFrame(tick);
          }
        } else {
          running = false;
          if (frame !== null) {
            cancelAnimationFrame(frame);
            frame = null;
          }
        }
      },
      { root: null, threshold: 0 }
    );
    visibility.observe(section);

    const handleMove = (event) => {
      if (!rect.width || !rect.height) return;
      const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      target.x = Math.max(-1, Math.min(1, nx)) * PARALLAX_X;
      target.y = Math.max(-1, Math.min(1, ny)) * PARALLAX_Y;
    };

    const handleLeave = () => {
      target.x = 0;
      target.y = 0;
    };

    if (pointerFine) {
      section.addEventListener('mouseenter', measure, { passive: true });
      section.addEventListener('mousemove', handleMove, { passive: true });
      section.addEventListener('mouseleave', handleLeave, { passive: true });
    }
    window.addEventListener('resize', measure, { passive: true });

    return () => {
      visibility.disconnect();
      if (pointerFine) {
        section.removeEventListener('mouseenter', measure);
        section.removeEventListener('mousemove', handleMove);
        section.removeEventListener('mouseleave', handleLeave);
      }
      window.removeEventListener('resize', measure);
      running = false;
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, []);

  const goToAbout = () => {
    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="welcome"
      ref={sectionRef}
      className="welcome-section relative overflow-hidden"
      aria-label="Bienvenue à L'Atelier Restaurant"
    >
      <style dangerouslySetInnerHTML={{ __html: SECTION_STYLES }} />

      <div ref={bgRef} className="welcome-bg-wrap" aria-hidden="true">
        <div ref={parallaxRef} className="welcome-bg-parallax">
          <div
            className="welcome-bg-photo"
            style={{ backgroundImage: `url('${WELCOME_BACKGROUND}')` }}
          />
        </div>
      </div>
      <div className="welcome-bg-overlay" aria-hidden="true" />
      <div className="welcome-bg-vignette" aria-hidden="true" />

      <div
        ref={contentRef}
        className="welcome-content max-w-6xl mx-auto relative z-10 w-full text-center px-6 md:px-12"
      >
        <p className="welcome-label font-body text-xs tracking-[0.3em] uppercase text-gold mb-4">
          Bienvenue
        </p>
        <h2 className="welcome-title font-heading font-light italic">
          Bienvenue à
          <br />
          L&apos;Atelier Restaurant
        </h2>
        <div className="welcome-divider gold-line w-16 mx-auto" />
        <p className="welcome-text font-body">
          Découvrez une expérience gastronomique où la tradition rencontre la créativité, dans une
          ambiance élégante et chaleureuse.
        </p>
        <div className="welcome-cta-wrap">
          <button type="button" className="welcome-cta" onClick={goToAbout}>
            Découvrir notre histoire
          </button>
        </div>
      </div>
    </section>
  );
}
