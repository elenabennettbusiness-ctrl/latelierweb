import { useCallback, useRef } from 'react';

/* ============================================================
   usePointerDrag — shared, presentation-agnostic drag primitive.

   Wraps the Pointer Events API (unifies mouse + touch + pen into
   one code path) and reports raw delta/velocity to the caller,
   which decides what to do with it (scroll a native container,
   drive a framer-motion value, etc). Also flags whether a given
   interaction was a genuine drag vs. a simple click/tap so
   consumers can suppress an accidental click after dragging.
   ============================================================ */

export function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

const DRAG_THRESHOLD_PX = 6;

export function usePointerDrag({
  axis = 'x',
  activationPointerTypes,
  onDragStart,
  onDragMove,
  onDragEnd,
} = {}) {
  const state = useRef({
    active: false,
    captured: false,
    pointerId: null,
    lastX: 0,
    lastY: 0,
    lastT: 0,
    velocity: 0,
    totalDelta: 0,
  });

  const onPointerDown = useCallback(
    (e) => {
      if (activationPointerTypes && !activationPointerTypes.includes(e.pointerType)) return;
      const s = state.current;
      s.active = true;
      s.captured = false;
      s.pointerId = e.pointerId;
      s.lastX = e.clientX;
      s.lastY = e.clientY;
      s.lastT = performance.now();
      s.velocity = 0;
      s.totalDelta = 0;
      // Pointer capture is deferred to the first real pointermove (below),
      // not taken here. Capturing on pointerdown retargets the browser's
      // mouseup/click synthesis to this element, which silently swallows
      // a plain click on a descendant (e.g. a category tab button) even
      // though the pointer never actually moved.
      onDragStart?.(e);
    },
    [activationPointerTypes, onDragStart]
  );

  const onPointerMove = useCallback(
    (e) => {
      const s = state.current;
      if (!s.active || e.pointerId !== s.pointerId) return;
      if (!s.captured) {
        e.currentTarget.setPointerCapture?.(e.pointerId);
        s.captured = true;
      }
      const now = performance.now();
      const dx = e.clientX - s.lastX;
      const dy = e.clientY - s.lastY;
      const dt = Math.max(now - s.lastT, 1);
      const delta = axis === 'x' ? dx : dy;
      s.velocity = (delta / dt) * 1000;
      s.totalDelta += Math.abs(delta);
      s.lastX = e.clientX;
      s.lastY = e.clientY;
      s.lastT = now;
      onDragMove?.({ delta, dx, dy, totalDelta: s.totalDelta, velocity: s.velocity, sourceEvent: e });
    },
    [axis, onDragMove]
  );

  const endDrag = useCallback(
    (e) => {
      const s = state.current;
      if (!s.active || e.pointerId !== s.pointerId) return;
      s.active = false;
      if (s.captured) {
        e.currentTarget.releasePointerCapture?.(e.pointerId);
        s.captured = false;
      }
      const wasDrag = s.totalDelta > DRAG_THRESHOLD_PX;
      onDragEnd?.({ velocity: s.velocity, wasDrag, sourceEvent: e });
    },
    [onDragEnd]
  );

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
  };
}
