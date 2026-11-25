import React, { useCallback, useEffect, useRef, useState } from 'react';
import introVideoUrl from '../../../../Lifnex_brand_logo_reveal_intro_9d9c5a20_1080p-clipwipe.mp4';

const INTRO_SESSION_KEY = 'lifnex_intro_seen';
const FADE_DURATION_MS = 500;
const SAFETY_TIMEOUT_MS = 7000;

type Phase = 'playing' | 'fading' | 'done';

function shouldSkipInitially(): boolean {
  if (typeof window === 'undefined') return true;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    return true;
  }
  try {
    return window.sessionStorage.getItem(INTRO_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

function markIntroSeen(): void {
  try {
    window.sessionStorage.setItem(INTRO_SESSION_KEY, '1');
  } catch {
    // Ignore storage restrictions in private browsing modes
  }
}

/**
 * Fullscreen cinematic video intro played once per browser session.
 * Respects prefers-reduced-motion and handles autoplay or media errors gracefully.
 */
export const IntroOverlay: React.FC = React.memo(() => {
  const [phase, setPhase] = useState<Phase>(() => (shouldSkipInitially() ? 'done' : 'playing'));
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const dismissedRef = useRef(phase !== 'playing');

  const dismiss = useCallback((immediate = false) => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    markIntroSeen();
    if (immediate) {
      setPhase('done');
    } else {
      setPhase('fading');
    }
  }, []);

  // Lock background scroll only while video is actively visible
  useEffect(() => {
    if (phase === 'done') return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [phase]);

  // Trigger muted autoplay and watch reduced-motion / keyboard Escape / safety timeout
  useEffect(() => {
    if (phase !== 'playing') return;

    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const onMotionChange = (e: MediaQueryListEvent) => {
      if (e.matches) dismiss(true);
    };
    mq?.addEventListener?.('change', onMotionChange);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss(false);
    };
    window.addEventListener('keydown', onKeyDown);

    // Safety fallback so visitors are never blocked if playback stalls silently
    const safetyTimer = window.setTimeout(() => dismiss(false), SAFETY_TIMEOUT_MS);

    const video = videoRef.current;
    if (video) {
      video.muted = true;
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => dismiss(true));
      }
    }

    return () => {
      window.clearTimeout(safetyTimer);
      window.removeEventListener('keydown', onKeyDown);
      mq?.removeEventListener?.('change', onMotionChange);
    };
  }, [phase, dismiss]);

  // Complete fade-out transition cleanly
  useEffect(() => {
    if (phase !== 'fading') return;
    const timer = window.setTimeout(() => setPhase('done'), FADE_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  if (phase === 'done') {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Lifnex introductory reveal"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black"
      style={{
        opacity: phase === 'fading' ? 0 : 1,
        pointerEvents: phase === 'fading' ? 'none' : 'auto',
        transition: `opacity ${FADE_DURATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
      }}
    >
      <video
        ref={videoRef}
        src={introVideoUrl}
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={() => dismiss(false)}
        onError={() => dismiss(true)}
        className="aspect-video max-h-full w-full max-w-full object-contain select-none"
      />

      <button
        type="button"
        onClick={() => dismiss(false)}
        aria-label="Skip intro video"
        className="fixed right-4 top-4 z-10 cursor-pointer rounded-full border border-white/25 bg-black/55 px-4 py-1.5 text-[13px] font-medium tracking-wide text-white/90 backdrop-blur-md transition-colors duration-200 hover:border-white/50 hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 sm:right-6 sm:top-6"
      >
        Skip Intro
      </button>
    </div>
  );
});

IntroOverlay.displayName = 'IntroOverlay';
