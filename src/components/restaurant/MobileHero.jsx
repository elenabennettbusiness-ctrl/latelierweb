import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CTA, MOBILE_HERO_SLIDES as SLIDES } from './mobileHeroSlides';

/* ============================================================
   MobileHero — the phone-only cinematic Hero.

   A full-screen story: one 1440x2560 frame at a time, slow Ken
   Burns, cross-fade between slides, Instagram-style segmented
   progress, swipe, and a floating scroll cue. It exists purely
   to replace the desktop four-column Hero (HeroPanels.jsx) on
   phones — that component is never touched.

   Two guarantees keep desktop pixel-identical:

     1. This component returns null above BREAKPOINT. Above it
        nothing mounts: no DOM, no image requests, no timers, no
        listeners. Verified by the absence of any /PhoneHero/
        request on a desktop-width load.
     2. The one rule that hides the desktop Hero lives in THIS
        component's own <style> block, scoped to the same media
        query. Because the block only exists while this component
        is mounted, and it only mounts below the breakpoint, the
        rule and the desktop Hero can never both be live.

   Timing is driven by a single `dwell` value that both the
   setTimeout and the progress-bar CSS animation read, so the bar
   always finishes exactly when the slide changes — including
   after a swipe, which simply grants a longer dwell instead of
   introducing a separate paused state to keep in sync.

   Every animation is transform/opacity only. No rAF loop, no
   per-frame JS, no blur.

   Copy lives in mobileHeroSlides.js.
   ============================================================ */

const BREAKPOINT = '(max-width: 768px)';

// Normal time on screen, ms. Also the progress-fill duration.
const SLIDE_MS = 4500;
// A swiped-to slide holds longer — this is the "pause autoplay
// briefly, then resume" behaviour, expressed as one duration so
// the progress bar cannot drift out of sync with the timer.
const SWIPE_DWELL_MS = 7000;
// Cross-fade. Also how long the outgoing slide keeps its Ken
// Burns running so the image never snaps back mid-fade.
const FADE_MS = 1200;
// Horizontal travel required before a drag counts as a swipe.
const SWIPE_PX = 45;
// How many slides ahead of the current one keep a mounted <img>.
// The frames are ~3MB each, and every slide fills the viewport, so
// loading="lazy" alone defers nothing — the browser counts them all
// as visible and fetches 19MB up front. Deferring the mount is what
// actually staggers the download; 2 ahead buys ~9s of lead time.
const PRELOAD_AHEAD = 2;

const COUNT = SLIDES.length;
const wrap = (i) => (i + COUNT) % COUNT;

function useIsPhone() {
  const [isPhone, setIsPhone] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(BREAKPOINT).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(BREAKPOINT);
    const onChange = (e) => setIsPhone(e.matches);
    mql.addEventListener('change', onChange);
    setIsPhone(mql.matches);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isPhone;
}

const STYLES = `
  /* The desktop Hero, hidden on phones without editing it.
     Scoped to the same query this component mounts under. */
  @media ${BREAKPOINT} {
    .features-service-wrapper { display: none !important; }
  }

  .mhero {
    position: relative;
    z-index: 1;              /* above the fixed .wp-root wallpaper,
                                below the fixed .nav-glass (z-50) */
    width: 100%;
    height: 100vh;
    height: 100svh;          /* no jump when the iOS URL bar hides */
    overflow: hidden;
    display: flex;
    flex-direction: column;
    background: #0A0A0A;
    /* Let vertical scrolling through the Hero stay native while we
       read horizontal drags ourselves. */
    touch-action: pan-y;
  }

  /* ---------- image stage ---------- */
  .mhero-stage { position: absolute; inset: 0; z-index: 0; }

  .mhero-slide {
    position: absolute;
    inset: 0;
    opacity: 0;
    will-change: opacity;
    transition: opacity ${FADE_MS}ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .mhero-slide.is-active { opacity: 1; }

  .mhero-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    display: block;
    transform: scale(1) translate3d(-1%, 0, 0);
  }

  /* Ken Burns. The identical declaration on .is-active and
     .is-leaving means swapping the class does NOT restart the
     animation — the outgoing image keeps drifting through the
     whole cross-fade instead of snapping back to scale(1). */
  @keyframes mhero-kenburns {
    from { transform: scale(1)    translate3d(-1%, 0, 0); }
    to   { transform: scale(1.05) translate3d( 1%, 0, 0); }
  }
  .mhero-slide.is-active .mhero-img,
  .mhero-slide.is-leaving .mhero-img {
    animation: mhero-kenburns 14s ease-out both;
    will-change: transform;
  }

  /* ---------- scrim ----------
     Static gradient. A light wash up top keeps the logo baked
     into the artwork legible; the deep foot carries the text. */
  .mhero-scrim {
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    background: linear-gradient(
      to bottom,
      rgba(10, 10, 10, 0.38) 0%,
      rgba(10, 10, 10, 0.14) 26%,
      rgba(10, 10, 10, 0.30) 52%,
      rgba(10, 10, 10, 0.72) 78%,
      rgba(10, 10, 10, 0.92) 100%
    );
  }

  /* ---------- foreground ---------- */
  .mhero-fg {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 0 1.5rem calc(1.75rem + env(safe-area-inset-bottom));
  }

  .mhero-content { margin-top: auto; }

  @keyframes mhero-rise {
    from { opacity: 0; transform: translate3d(0, 16px, 0); }
    to   { opacity: 1; transform: translate3d(0, 0, 0); }
  }
  .mhero-label,
  .mhero-title,
  .mhero-desc,
  .mhero-cta-row {
    animation: mhero-rise 700ms cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  .mhero-title   { animation-delay:  80ms; }
  .mhero-desc    { animation-delay: 160ms; }
  .mhero-cta-row { animation-delay: 240ms; }

  .mhero-label {
    display: block;
    font-family: 'Inter', sans-serif;
    font-size: 0.6875rem;
    font-weight: 500;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #C5A059;
    margin-bottom: 0.85rem;
  }

  .mhero-title {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 300;
    font-size: clamp(2rem, 9.5vw, 2.75rem);
    line-height: 1.12;
    letter-spacing: 0.01em;
    color: #FFFFFF;
    margin: 0;
  }

  .mhero-desc {
    font-family: 'Inter', sans-serif;
    font-size: 0.875rem;
    font-weight: 300;
    line-height: 1.6;
    color: rgba(235, 235, 235, 0.82);
    margin: 0.9rem 0 0;
    /* Hard ceiling of three lines, per the brief. */
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .mhero-cta-row { margin-top: 1.5rem; }
  .mhero-cta {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    font-family: 'Inter', sans-serif;
    font-size: 0.72rem;
    font-weight: 500;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    padding: 0.8rem 1.6rem;
    border: 1px solid rgba(197, 160, 89, 0.7);
    border-radius: var(--btn-radius);
    color: #C5A059;
    background: transparent;
    text-decoration: none;
    transition: background-color 300ms cubic-bezier(0.22, 1, 0.36, 1),
                color 300ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .mhero-cta:active { background: #C5A059; color: #0A0A0A; }

  /* ---------- progress ---------- */
  .mhero-progress {
    display: flex;
    gap: 0.375rem;
    margin-top: 1.75rem;
  }
  .mhero-seg {
    flex: 1 1 0;
    height: 3px;
    border-radius: 2px;
    background: rgba(255, 255, 255, 0.22);
    overflow: hidden;
  }
  .mhero-seg-fill {
    display: block;
    width: 100%;
    height: 100%;
    border-radius: 2px;
    transform-origin: left center;
    transform: scaleX(0);
    background: linear-gradient(90deg, #C5A059, #EBEBEB);
  }
  .mhero-seg.is-past .mhero-seg-fill { transform: scaleX(1); }

  @keyframes mhero-fill {
    from { transform: scaleX(0); }
    to   { transform: scaleX(1); }
  }
  .mhero-seg.is-active .mhero-seg-fill {
    animation-name: mhero-fill;
    animation-timing-function: linear;
    animation-fill-mode: both;
    /* duration + play-state come from the inline style */
  }

  /* ---------- scroll cue ---------- */
  .mhero-scroll {
    align-self: center;
    margin-top: 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.3rem;
    background: none;
    border: 0;
    padding: 0.25rem 0.75rem;
    color: rgba(235, 235, 235, 0.7);
    font-family: 'Inter', sans-serif;
    font-size: 0.625rem;
    letter-spacing: 0.24em;
    text-transform: uppercase;
    cursor: pointer;
  }
  @keyframes mhero-float {
    0%, 100% { transform: translate3d(0, 0, 0); }
    50%      { transform: translate3d(0, 6px, 0); }
  }
  .mhero-scroll-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.3rem;
    animation: mhero-float 2.4s ease-in-out infinite;
  }
  .mhero-arrow { font-size: 0.9rem; line-height: 1; }

  /* ---------- reduced motion ---------- */
  @media (prefers-reduced-motion: reduce) {
    .mhero-slide { transition-duration: 300ms; }
    .mhero-slide .mhero-img {
      animation: none !important;
      transform: none !important;
    }
    .mhero-label,
    .mhero-title,
    .mhero-desc,
    .mhero-cta-row,
    .mhero-scroll-inner {
      animation: none !important;
      opacity: 1 !important;
      transform: none !important;
    }
    /* No sweeping fill — the active segment simply reads as lit. */
    .mhero-seg.is-active .mhero-seg-fill {
      animation: none !important;
      transform: scaleX(1) !important;
    }
  }
`;

export default function MobileHero() {
  const isPhone = useIsPhone();
  return isPhone ? <MobileHeroInner /> : null;
}

function MobileHeroInner() {
  const [active, setActive] = useState(0);
  const [leaving, setLeaving] = useState(null);
  // Time this slide holds before advancing. Read by both the
  // timer and the progress-bar animation, so they cannot drift.
  const [dwell, setDwell] = useState(SLIDE_MS);
  // Bumped on every transition so the progress fill remounts and
  // replays from zero, even when the duration is unchanged.
  const [cycle, setCycle] = useState(0);
  // Autoplay only runs while the Hero is on screen and the tab is
  // visible — no point burning transitions nobody can see.
  const [running, setRunning] = useState(true);
  // Indices whose <img> has been mounted. Grows as the story plays;
  // never shrinks, so revisiting a slide hits the browser cache.
  const [primed, setPrimed] = useState(
    () => new Set(Array.from({ length: PRELOAD_AHEAD + 1 }, (_, i) => wrap(i)))
  );

  const sectionRef = useRef(null);
  const leaveTimer = useRef(null);

  const go = useCallback((next, hold) => {
    setActive((current) => {
      const target = wrap(next);
      if (target === current) return current;
      setLeaving(current);
      clearTimeout(leaveTimer.current);
      leaveTimer.current = setTimeout(() => setLeaving(null), FADE_MS);
      return target;
    });
    setDwell(hold);
    setCycle((c) => c + 1);
  }, []);

  // Autoplay. One timeout, re-armed on each change — no interval,
  // no requestAnimationFrame loop.
  useEffect(() => {
    if (!running) return undefined;
    const id = setTimeout(() => go(active + 1, SLIDE_MS), dwell);
    return () => clearTimeout(id);
  }, [active, dwell, cycle, running, go]);

  useEffect(() => () => clearTimeout(leaveTimer.current), []);

  // Mount the frames just ahead of the playhead. Swiping backwards
  // reaches an already-primed slide, so it is never blank.
  useEffect(() => {
    setPrimed((prev) => {
      const want = [];
      for (let n = 0; n <= PRELOAD_AHEAD; n += 1) want.push(wrap(active + n));
      if (want.every((i) => prev.has(i))) return prev;
      const next = new Set(prev);
      want.forEach((i) => next.add(i));
      return next;
    });
  }, [active]);

  // Coming back from hidden/off-screen restarts the current slide's
  // clock and its progress bar together.
  useEffect(() => {
    if (running) setCycle((c) => c + 1);
  }, [running]);

  useEffect(() => {
    const onVisibility = () => setRunning(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);

    let observer;
    const el = sectionRef.current;
    if (el && typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        ([entry]) => setRunning(entry.isIntersecting && !document.hidden),
        { threshold: 0.25 }
      );
      observer.observe(el);
    }

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      if (observer) observer.disconnect();
    };
  }, []);

  /* ---- swipe ----
     Never calls preventDefault, so vertical page scrolling stays
     entirely native. A drag only counts when it is both long
     enough and more horizontal than vertical, so a diagonal
     scroll can't flick the story sideways. */
  const touch = useRef({ x: 0, y: 0, dx: 0, dy: 0 });

  const onTouchStart = (e) => {
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY, dx: 0, dy: 0 };
  };
  const onTouchMove = (e) => {
    const t = e.touches[0];
    touch.current.dx = t.clientX - touch.current.x;
    touch.current.dy = t.clientY - touch.current.y;
  };
  const onTouchEnd = () => {
    const { dx, dy } = touch.current;
    if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) <= Math.abs(dy)) return;
    go(active + (dx < 0 ? 1 : -1), SWIPE_DWELL_MS);
  };

  const scrollToNext = () => {
    document.getElementById('welcome')?.scrollIntoView({ behavior: 'smooth' });
  };

  const slide = SLIDES[active];

  return (
    <>
      <style>{STYLES}</style>

      <section
        id="hero"
        ref={sectionRef}
        className="mhero"
        aria-roledescription="carousel"
        aria-label="L'Atelier — nos expériences"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="mhero-stage">
          {SLIDES.map((s, i) => (
            <div
              key={s.image}
              className={
                'mhero-slide' +
                (i === active ? ' is-active' : '') +
                (i === leaving ? ' is-leaving' : '')
              }
              aria-hidden={i !== active}
            >
              {primed.has(i) && (
                <img
                  className="mhero-img"
                  src={s.image}
                  alt=""
                  width="1440"
                  height="2560"
                  decoding="async"
                  loading={i === 0 ? 'eager' : 'lazy'}
                  fetchPriority={i === 0 ? 'high' : 'low'}
                />
              )}
            </div>
          ))}
        </div>

        <div className="mhero-scrim" />

        <div className="mhero-fg">
          {/* Re-keying remounts the block, replaying the staggered
              entrance on every slide change. */}
          <div className="mhero-content" key={active}>
            <span className="mhero-label">{slide.label}</span>
            <h2 className="mhero-title">{slide.title}</h2>
            <p className="mhero-desc">{slide.description}</p>
            <div className="mhero-cta-row">
              <a className="mhero-cta" href={CTA.href}>
                {CTA.label}
              </a>
            </div>
          </div>

          <div
            className="mhero-progress"
            role="group"
            aria-label={`Diapositive ${active + 1} sur ${COUNT}`}
          >
            {SLIDES.map((s, i) => (
              <div
                key={s.image}
                className={
                  'mhero-seg' +
                  (i === active ? ' is-active' : '') +
                  (i < active ? ' is-past' : '')
                }
              >
                <span
                  /* Remount on every cycle so the sweep replays. */
                  key={i === active ? `fill-${cycle}` : 'fill'}
                  className="mhero-seg-fill"
                  style={
                    i === active
                      ? {
                          animationDuration: `${dwell}ms`,
                          animationPlayState: running ? 'running' : 'paused',
                        }
                      : undefined
                  }
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            className="mhero-scroll"
            onClick={scrollToNext}
            aria-label="Découvrir la suite"
          >
            <span className="mhero-scroll-inner">
              <span className="mhero-arrow" aria-hidden="true">
                ↓
              </span>
              <span>Découvrir</span>
            </span>
          </button>
        </div>
      </section>
    </>
  );
}
