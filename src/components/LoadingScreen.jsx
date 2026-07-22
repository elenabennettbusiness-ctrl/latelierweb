import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';

/* ============================================================
   LoadingScreen — the curtain that opens the site.

   A full-screen black overlay playing the animated L'Atelier
   logo (public/WebM/1.webm), which then dissolves to reveal the
   Hero. No text, no percentage, no spinner — the animation is
   the only visual element.

   It is mounted above AuthenticatedApp in App.jsx on purpose:
   the auth gate renders a generic slate spinner while base44
   resolves, and this curtain has to cover that too.

   Two details worth knowing about the media (read from the
   Matroska header): the file is VP9 1920x1080 with AlphaMode=1,
   so the logo is on a *transparent* background, and it runs for
   2980ms. The alpha channel is not reliably decoded by Safari,
   but since the backdrop here is pure black, a browser that
   ignores alpha renders the transparent areas black and the
   result looks identical. What would not be survivable is the
   video failing to play at all — hence the four independent
   ways `videoDone` can fire below.

   Only opacity animates. Nothing here writes to `document.body`,
   so the curtain cannot introduce a layout shift.
   ============================================================ */

const VIDEO_SRC = '/WebM/1.webm';
const LOGO_URL =
  'https://media.base44.com/images/public/user_6a41c4d745d7d2a779b8a3c7/560a45fdc_Logov1.png';

const FADE_MS = 600; // exit dissolve
const REDUCED_HOLD_MS = 800; // how long the static logo holds
const VIDEO_SAFETY_MS = 3600; // measured 2980ms + margin, if `ended` never fires
const HARD_CAP_MS = 6000; // absolute ceiling, whatever happens

/* Module scope, not state and not sessionStorage.

   It survives React re-renders and client-side navigation — so the
   curtain never replays mid-session — and resets on a real document
   load, so a genuine refresh does replay it. sessionStorage would
   get the refresh case backwards by suppressing it. */
let hasPlayed = false;

export default function LoadingScreen() {
  const { isLoadingAuth, isLoadingPublicSettings } = useAuth();

  const [mounted, setMounted] = useState(() => !hasPlayed);
  const [leaving, setLeaving] = useState(false);
  const [mediaIn, setMediaIn] = useState(false);
  const [videoDone, setVideoDone] = useState(false);
  const [reduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  const videoRef = useRef(null);
  const exitTimer = useRef(null);

  const appReady = !isLoadingAuth && !isLoadingPublicSettings;

  useEffect(() => {
    if (mounted) hasPlayed = true;
  }, [mounted]);

  // Fade the media up on the next frame so the transition actually runs.
  useEffect(() => {
    if (!mounted) return undefined;
    const id = requestAnimationFrame(() => setMediaIn(true));
    return () => cancelAnimationFrame(id);
  }, [mounted]);

  const finish = useCallback(() => {
    setLeaving(true);
    clearTimeout(exitTimer.current);
    // A timeout rather than transitionend: transitionend does not fire
    // if the element is never painted (background tab, reduced motion).
    exitTimer.current = setTimeout(() => setMounted(false), FADE_MS);
  }, []);

  useEffect(() => () => clearTimeout(exitTimer.current), []);

  /* Scroll lock without touching body styles.

     Setting body{overflow:hidden} would remove the scrollbar and shift
     the layout by ~15px — the one thing the brief rules out. Preventing
     the events instead costs two listeners and changes no geometry. */
  useEffect(() => {
    if (!mounted) return undefined;
    const block = (e) => e.preventDefault();
    window.addEventListener('wheel', block, { passive: false });
    window.addEventListener('touchmove', block, { passive: false });
    return () => {
      window.removeEventListener('wheel', block);
      window.removeEventListener('touchmove', block);
    };
  }, [mounted]);

  // Reduced motion: hold the static logo, then treat it as "played".
  useEffect(() => {
    if (!mounted || !reduced) return undefined;
    const id = setTimeout(() => setVideoDone(true), REDUCED_HOLD_MS);
    return () => clearTimeout(id);
  }, [mounted, reduced]);

  /* Autoplay, plus the safety net.

     autoPlay alone is not enough: a browser can reject playback even
     when muted, and a codec it cannot decode fires `error` — or, worse,
     nothing at all. The timer covers that last case. */
  useEffect(() => {
    if (!mounted || reduced) return undefined;
    const v = videoRef.current;
    if (v) {
      const attempt = v.play();
      if (attempt && typeof attempt.catch === 'function') {
        attempt.catch(() => setVideoDone(true));
      }
    }
    const id = setTimeout(() => setVideoDone(true), VIDEO_SAFETY_MS);
    return () => clearTimeout(id);
  }, [mounted, reduced]);

  // Leave once the animation has run *and* the app is ready.
  useEffect(() => {
    if (!mounted || leaving) return;
    if (videoDone && appReady) finish();
  }, [mounted, leaving, videoDone, appReady, finish]);

  // Absolute ceiling — the curtain can never outstay this.
  useEffect(() => {
    if (!mounted) return undefined;
    const id = setTimeout(finish, HARD_CAP_MS);
    return () => clearTimeout(id);
  }, [mounted, finish]);

  if (!mounted) return null;

  return (
    <>
      <style>{`
        .ldr {
          position: fixed;
          inset: 0;
          /* Above every existing layer. The high value is not
             defensive padding: FluidCursor renders its WebGL canvas at
             z-index 9999, and at anything lower its smoke drifts over
             the curtain — which would break both "pure black" and "the
             video is the only visual element". Clearing 9999 keeps
             FluidCursor itself untouched. Below it: toasts z-100,
             mobile menu z-60, reservation modal z-50, dock z-40. */
          z-index: 10000;
          background: #000000;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 1;
          transition: opacity ${FADE_MS}ms cubic-bezier(0.22, 1, 0.36, 1);
          will-change: opacity;
        }
        .ldr.is-leaving { opacity: 0; pointer-events: none; }

        .ldr-media {
          width: min(72vw, 560px);
          height: auto;
          display: block;
          object-fit: contain;   /* never stretched, never cropped */
          opacity: 0;
          transition: opacity 400ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .ldr-media.is-in { opacity: 1; }

        @media (prefers-reduced-motion: reduce) {
          .ldr-media { transition-duration: 200ms; }
        }
      `}</style>

      <div className={`ldr${leaving ? ' is-leaving' : ''}`} aria-hidden="true">
        {reduced ? (
          <img
            className={`ldr-media${mediaIn ? ' is-in' : ''}`}
            src={LOGO_URL}
            alt=""
            onError={() => setVideoDone(true)}
          />
        ) : (
          <video
            ref={videoRef}
            className={`ldr-media${mediaIn ? ' is-in' : ''}`}
            src={VIDEO_SRC}
            autoPlay
            muted
            playsInline
            preload="auto"
            disablePictureInPicture
            disableRemotePlayback
            onEnded={() => setVideoDone(true)}
            onError={() => setVideoDone(true)}
          />
        )}
      </div>
    </>
  );
}
