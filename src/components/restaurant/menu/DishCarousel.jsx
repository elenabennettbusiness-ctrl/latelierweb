import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import DishCard from './DishCard';
import { prefersReducedMotion, usePointerDrag } from './usePointerDrag';

/* ============================================================
   DishCarousel — native-scroll infinite dish carousel.

   Same architecture as CategoryNav.jsx: native `overflow-x: auto`
   + `scroll-snap-type` gives free browser-owned momentum/inertia
   on every input device (touch, trackpad, mouse wheel), with a
   thin mouse-only drag-to-scroll layer on top via usePointerDrag.

   Infinite loop: the dish list is rendered 3x back-to-back
   (only the middle group is real/accessible); a passive `scroll`
   listener silently corrects `scrollLeft` by exactly one
   group-width whenever it crosses a group boundary — imperceptible
   since all three groups are pixel-identical, the same
   "identical repeated groups" trick used by the site's CSS
   marquees, driven off native scroll instead of a transform.

   Fallback mode (too few dishes to loop, e.g. Grillades=3):
   a single group is rendered — centered if it fits, or left to
   scroll/clamp natively if it overflows a narrow viewport.
   ============================================================ */

function getVisibleCount(width) {
  if (width <= 640) return 1.2;
  if (width <= 1024) return 2.4;
  return 4;
}

// Desktop-only autoplay: how long it takes to glide past one card's
// width, and how long to wait after the user stops interacting
// (wheel/drag/keyboard) before resuming.
const AUTOPLAY_SECONDS_PER_CARD = 8;
const AUTOPLAY_RESUME_DELAY_MS = 2500;
const AUTOPLAY_START_DELAY_MS = 600; // let the category-switch fade/slide finish first

// Quiet gap after the last scroll event that marks a touch fling as finished
// and its momentum as safe to interrupt. Comfortably longer than the frame
// cadence momentum scrolling emits, short enough to always land before the
// next gesture.
const TOUCH_SETTLE_MS = 160;

// Sub-pixel tolerance for the loop-boundary test. Group width is fractional
// (getBoundingClientRect on a hi-DPI viewport), while scrollLeft quantises to
// device pixels, so the two straddle an exact boundary by a fraction of a
// pixel — enough for a bare `scrollLeft < groupWidth` to fire a pointless
// ±groupWidth correction on a carousel that is already parked correctly.
const LOOP_EPSILON_PX = 1;

const CAROUSEL_STYLES = `
  .carte-carousel {
    position: relative;
    width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    overscroll-behavior-x: contain;
    outline: none;
    cursor: grab;
    /* Both axes, deliberately: 'pan-x' alone does not merely prioritise
       horizontal panning, it forbids the vertical one, so a finger landing
       on a card could never scroll the page. Allowing both hands the axis
       decision to the browser's own compositor-side direction lock — the
       same first-few-pixels heuristic native apps use, for free, off the
       main thread. 'manipulation' = pan-x + pan-y + pinch-zoom (zoom kept
       for accessibility; only double-tap-zoom is dropped). */
    touch-action: manipulation;
    scroll-snap-type: x proximity;
    scrollbar-width: none;
    -ms-overflow-style: none;
    -webkit-mask-image: linear-gradient(to right, transparent 0%, #000 3%, #000 97%, transparent 100%);
            mask-image: linear-gradient(to right, transparent 0%, #000 3%, #000 97%, transparent 100%);
  }
  .carte-carousel::-webkit-scrollbar { display: none; }
  .carte-carousel--dragging { cursor: grabbing; scroll-behavior: auto; scroll-snap-type: none; }
  .carte-carousel--centered { cursor: default; }
  .carte-carousel:focus-visible {
    outline: 2px solid #C5A059;
    outline-offset: 6px;
  }
  .carte-carousel__track {
    display: flex;
    width: max-content;
    padding: 2.5rem 0 3rem;
    user-select: none;
    -webkit-user-select: none;
  }
  .carte-carousel--centered .carte-carousel__track { margin: 0 auto; }
  .carte-carousel__group {
    display: flex;
    flex-shrink: 0;
  }

  .carte-card {
    flex: 0 0 var(--card-w, 280px);
    box-sizing: border-box;
    padding: 0 0.75rem;
    scroll-snap-align: start;
    opacity: 1;
    transform: none;
  }
  .carte-card__figure {
    position: relative;
    margin: 0;
    border-radius: 18px;
    overflow: hidden;
    aspect-ratio: 2 / 3;
    background: #111;
    border: 1px solid transparent;
    box-shadow: 0 24px 50px -22px rgba(0, 0, 0, 0.65), 0 12px 24px -14px rgba(0, 0, 0, 0.45);
    transition:
      box-shadow 500ms cubic-bezier(0.22, 1, 0.36, 1),
      border-color 500ms cubic-bezier(0.22, 1, 0.36, 1);
    animation: carte-float 7s ease-in-out infinite;
    animation-delay: calc(min(var(--i, 0), 10) * 220ms);
  }
  /* DishCard wraps the <img> in <picture> to serve mobile derivatives.
     <picture> is display:inline by default, which would break the img's
     height:100% (it resolves against its parent). This makes the wrapper
     a transparent pass-through box so geometry is unchanged. */
  .carte-card__figure > picture {
    display: block;
    width: 100%;
    height: 100%;
  }
  .carte-card__img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    user-select: none;
    -webkit-user-drag: none;
    transition: transform 700ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .carte-card:hover .carte-card__figure,
  .carte-card:focus-within .carte-card__figure {
    border-color: rgba(197, 160, 89, 0.45);
    box-shadow:
      0 34px 70px -20px rgba(0, 0, 0, 0.8),
      0 18px 36px -16px rgba(0, 0, 0, 0.55),
      0 0 0 1px rgba(197, 160, 89, 0.25);
  }
  .carte-card:hover .carte-card__img,
  .carte-card:focus-within .carte-card__img {
    transform: scale(1.06);
  }
  .carte-card__name {
    margin: 1.1rem 0 0;
    text-align: center;
    font-family: 'Cormorant Garamond', serif;
    font-weight: 300;
    font-style: italic;
    font-size: 1.15rem;
    color: #EBEBEB;
    transition: transform 500ms cubic-bezier(0.22, 1, 0.36, 1), color 500ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .carte-card:hover .carte-card__name,
  .carte-card:focus-within .carte-card__name {
    transform: translateY(-4px);
    color: #C5A059;
  }
  .carte-carousel--dragging .carte-card__figure { animation-play-state: paused; }

  @keyframes carte-float {
    0%, 100% { transform: translate3d(0, 0, 0); }
    50% { transform: translate3d(0, -6px, 0); }
  }

  /* First-appearance stagger, driven by MenuSection's scroll-reveal wrapper. */
  .carte-reveal .carte-card {
    opacity: 0;
    transform: translate3d(0, 24px, 0);
    transition: opacity 700ms cubic-bezier(0.22, 1, 0.36, 1), transform 700ms cubic-bezier(0.22, 1, 0.36, 1);
    transition-delay: calc(min(var(--i, 0), 8) * 70ms);
  }
  .carte-reveal.is-visible .carte-card {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }

  @media (prefers-reduced-motion: reduce) {
    .carte-card__figure { animation: none; }
    .carte-card__figure, .carte-card__img, .carte-card__name, .carte-reveal .carte-card {
      transition: none;
    }
  }
`;

export default function DishCarousel({ dishes, categoryName }) {
  const scrollRef = useRef(null);
  const realGroupRef = useRef(null);
  const groupWidthRef = useRef(0);
  const prevMetricsRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => (typeof window !== 'undefined' ? window.innerWidth > 1024 : true));
  const reduceMotionRef = useRef(prefersReducedMotion());
  const isHoveredRef = useRef(false);
  const isDraggingRef = useRef(false);
  const autoplayReadyRef = useRef(false);
  const resumeDelayActiveRef = useRef(false);
  const resumeTimerRef = useRef(null);

  const scheduleAutoplayResume = useCallback(() => {
    resumeDelayActiveRef.current = true;
    clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      resumeDelayActiveRef.current = false;
    }, AUTOPLAY_RESUME_DELAY_MS);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const mq = window.matchMedia('(min-width: 1025px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    setContainerWidth(el.getBoundingClientRect().width);
    const ro = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect?.width;
      if (width) setContainerWidth(width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fallbackWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const visibleCount = getVisibleCount(containerWidth || fallbackWidth);
  const cardWidth = containerWidth > 0 ? containerWidth / visibleCount : 0;
  const loop = dishes.length > Math.ceil(visibleCount) + 1;
  const eagerSlice = Math.ceil(visibleCount) + 1;
  const realGroupIndex = loop ? 1 : 0;
  const centered = !loop && dishes.length * cardWidth <= containerWidth;

  const groups = useMemo(() => (loop ? [dishes, dishes, dishes] : [dishes]), [dishes, loop]);

  // Mount + resize: (re)anchor scrollLeft so the dish in view never
  // silently jumps when cardWidth/groupWidth change, and reset cleanly
  // if loop/fallback mode itself flips across a breakpoint.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    const groupEl = realGroupRef.current;
    if (!el || !groupEl || cardWidth <= 0) return;
    const groupWidth = groupEl.getBoundingClientRect().width;
    if (groupWidth <= 0) return;

    const prev = prevMetricsRef.current;
    if (!prev || prev.loop !== loop) {
      el.scrollLeft = loop ? groupWidth : 0;
    } else {
      const prevBase = prev.loop ? prev.groupWidth : 0;
      const newBase = loop ? groupWidth : 0;
      const ratio = prev.cardWidth > 0 ? (el.scrollLeft - prevBase) / prev.cardWidth : 0;
      el.scrollLeft = newBase + ratio * cardWidth;
    }

    groupWidthRef.current = groupWidth;
    prevMetricsRef.current = { cardWidth, groupWidth, loop };
  }, [cardWidth, loop]);

  // Desktop-only autoplay: begins shortly after the category-switch
  // transition finishes, glides right-to-left, and is paused (not
  // reset) by hover/drag/wheel/keyboard — resuming from the exact
  // scrollLeft it was at, never restarting from the beginning.
  useEffect(() => {
    autoplayReadyRef.current = false;
    if (!loop || !isDesktop || reduceMotionRef.current) return undefined;
    const timer = setTimeout(() => {
      autoplayReadyRef.current = true;
    }, AUTOPLAY_START_DELAY_MS);
    return () => clearTimeout(timer);
  }, [loop, isDesktop]);

  useEffect(() => {
    if (!loop || !isDesktop || reduceMotionRef.current || cardWidth <= 0) return undefined;
    const el = scrollRef.current;
    if (!el) return undefined;

    // Scroll-snap fights any programmatic scrollLeft write that isn't a
    // full native gesture, silently re-snapping arbitrary offsets back
    // to the nearest card. That caused both the earlier hover-freeze
    // jump and the drag-release jump: keep snap fully disabled for the
    // whole time autoplay owns this element, across every transition
    // (drag end, hover end, wheel idle) - never re-enabled.
    el.style.scrollSnapType = 'none';

    const speed = cardWidth / AUTOPLAY_SECONDS_PER_CARD; // px per second
    let rafId;
    let lastTime = null;

    const tick = (now) => {
      if (lastTime === null) lastTime = now;
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      const autoplayActive =
        autoplayReadyRef.current && !isHoveredRef.current && !isDraggingRef.current && !resumeDelayActiveRef.current;
      if (autoplayActive) {
        el.scrollLeft += speed * dt;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      el.style.scrollSnapType = '';
    };
  }, [loop, isDesktop, cardWidth]);

  // Loop-boundary correction.
  //
  // Mouse / wheel / keyboard / autoplay keep the original behaviour:
  // correct the moment scrollLeft leaves the middle group.
  //
  // Touch cannot afford that. Writing scrollLeft while native momentum is
  // in flight cancels the momentum outright (iOS Safari especially), and
  // since mount anchors scrollLeft at exactly `gw` — the boundary itself —
  // the first left-ward fling crossed it immediately and died on the spot.
  // That was the "can't reach the first items" bug, and the same write,
  // landing mid-gesture, was the jitter and the phantom jumps.
  //
  // All three groups are pixel-identical, so a touch scroll is simply left
  // to roam the outer clones untouched — visually indistinguishable — and
  // silently re-centred once it has settled, when there is no momentum left
  // to break.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !loop) return undefined;

    let touchDown = false;
    let touchScroll = false;
    let settleTimer = null;

    const recenter = () => {
      const gw = groupWidthRef.current;
      if (gw <= 0) return;
      const x = el.scrollLeft;
      if (x < gw - LOOP_EPSILON_PX) el.scrollLeft = x + gw;
      else if (x >= gw * 2 - LOOP_EPSILON_PX) el.scrollLeft = x - gw;
    };

    // Safety net for a fling long enough to threaten running off the end of
    // the rendered track. Only fires within a quarter-group of a real edge —
    // three-quarters of a group is several screens of slack, so in practice
    // this stays silent and the momentum is never touched.
    const guardEdges = () => {
      const gw = groupWidthRef.current;
      if (gw <= 0) return;
      if (el.scrollLeft < gw * 0.25) el.scrollLeft += gw;
      else if (el.scrollLeft > gw * 2.75) el.scrollLeft -= gw;
    };

    const scheduleSettle = () => {
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        if (touchDown) return;
        touchScroll = false;
        recenter();
      }, TOUCH_SETTLE_MS);
    };

    const handleScroll = () => {
      if (!touchScroll) {
        recenter();
        return;
      }
      guardEdges();
      if (!touchDown) scheduleSettle();
    };

    const handleTouchStart = () => {
      touchDown = true;
      touchScroll = true;
      clearTimeout(settleTimer);
    };

    const handleTouchEnd = () => {
      touchDown = false;
      scheduleSettle();
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });
    el.addEventListener('touchcancel', handleTouchEnd, { passive: true });
    return () => {
      clearTimeout(settleTimer);
      el.removeEventListener('scroll', handleScroll);
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [loop]);

  const { onPointerDown, onPointerMove, onPointerUp } = usePointerDrag({
    activationPointerTypes: ['mouse'],
    onDragStart: () => {
      isDraggingRef.current = true;
      clearTimeout(resumeTimerRef.current);
      setIsDragging(true);
    },
    onDragMove: ({ dx }) => {
      if (scrollRef.current) scrollRef.current.scrollLeft -= dx;
    },
    onDragEnd: () => {
      isDraggingRef.current = false;
      scheduleAutoplayResume();
      setIsDragging(false);
    },
  });

  const onMouseEnter = useCallback(() => {
    isHoveredRef.current = true;
  }, []);

  const onMouseLeave = useCallback(() => {
    isHoveredRef.current = false;
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    const handleWheel = (e) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      el.scrollLeft += e.deltaY;
      e.preventDefault();
      scheduleAutoplayResume();
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [scheduleAutoplayResume]);

  const onKeyDown = useCallback(
    (e) => {
      const el = scrollRef.current;
      if (!el || cardWidth <= 0) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        el.scrollTo({ left: el.scrollLeft + cardWidth, behavior: reduceMotionRef.current ? 'auto' : 'smooth' });
        scheduleAutoplayResume();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        el.scrollTo({ left: el.scrollLeft - cardWidth, behavior: reduceMotionRef.current ? 'auto' : 'smooth' });
        scheduleAutoplayResume();
      }
    },
    [cardWidth, scheduleAutoplayResume]
  );

  return (
    <div
      ref={scrollRef}
      className={`carte-carousel${isDragging ? ' carte-carousel--dragging' : ''}${centered ? ' carte-carousel--centered' : ''}`}
      style={{ '--card-w': `${cardWidth || 0}px` }}
      role="region"
      aria-roledescription="carrousel"
      aria-label={`Plats — ${categoryName}`}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <style dangerouslySetInnerHTML={{ __html: CAROUSEL_STYLES }} />
      <div className="carte-carousel__track">
        {groups.map((groupDishes, g) => (
          <div
            key={g}
            className="carte-carousel__group"
            ref={g === realGroupIndex ? realGroupRef : undefined}
            aria-hidden={g !== realGroupIndex ? 'true' : undefined}
          >
            {groupDishes.map((dish, i) => (
              <DishCard
                key={`${dish.id}-${g}`}
                dish={dish}
                index={i}
                ariaHidden={g !== realGroupIndex}
                eager={g === realGroupIndex && i < eagerSlice}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
