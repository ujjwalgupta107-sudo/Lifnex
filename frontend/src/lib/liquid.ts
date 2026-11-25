import { flushSync } from 'react-dom';

/**
 * Liquid view transitions.
 * - spillFrom(): the new view spreads out of a point like a drop hitting a surface (theme toggle)
 * - tide():      the new view rises as a wave from the bottom edge (page change)
 * Both fall back to an instant swap when the View Transitions API is missing
 * or the visitor prefers reduced motion.
 */

type VT = { ready: Promise<void>; finished: Promise<void> };
type StartVT = (cb: () => void | Promise<void>) => VT;

const startVT = (): StartVT | null => {
  const d = document as any;
  return typeof d.startViewTransition === 'function' ? d.startViewTransition.bind(d) : null;
};

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3.2);

let busy = false;

async function run(
  kind: 'theme' | 'route',
  apply: () => void,
  frames: () => { next: Keyframe[]; prev?: Keyframe[]; duration: number },
) {
  const start = startVT();
  if (!start || prefersReducedMotion() || busy || document.visibilityState === 'hidden') {
    flushSync(apply);
    return;
  }
  busy = true;
  const root = document.documentElement;
  root.dataset.vt = kind;
  let applied = false;
  try {
    const vt = start(() => {
      applied = true;
      flushSync(apply);
    });
    await vt.ready;
    const { next, prev, duration } = frames();
    root.animate(next, { duration, easing: 'linear', fill: 'both', pseudoElement: '::view-transition-new(root)' });
    if (prev) {
      root.animate(prev, {
        duration,
        easing: 'cubic-bezier(0.77, 0, 0.175, 1)',
        fill: 'both',
        pseudoElement: '::view-transition-old(root)',
      });
    }
    await vt.finished;
  } catch {
    if (!applied) flushSync(apply);
  } finally {
    delete root.dataset.vt;
    busy = false;
  }
}

export function spillFrom(x: number, y: number, apply: () => void) {
  return run('theme', apply, () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const rMax = Math.hypot(Math.max(x, w - x), Math.max(y, h - y)) * 1.1;
    const N = 72;
    const STEPS = 24;
    const seed = Math.random() * 6;
    const next: Keyframe[] = [];
    for (let s = 0; s <= STEPS; s++) {
      const p = s / STEPS;
      const r = rMax * easeInOut(p);
      // surface tension: the edge wobbles hard while small and calms as it spreads
      const amp = Math.min(r * 0.16, 70) * (1 - p * 0.75);
      const pts: string[] = [];
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2;
        const wob =
          Math.sin(a * 3 + seed + p * 3.4) * 0.55 +
          Math.sin(a * 5 - seed * 1.7 - p * 5) * 0.3 +
          Math.sin(a * 8 + seed * 0.6 + p * 7) * 0.15;
        const rr = Math.max(0, r + wob * amp);
        pts.push(`${(x + Math.cos(a) * rr).toFixed(1)}px ${(y + Math.sin(a) * rr).toFixed(1)}px`);
      }
      next.push({ clipPath: `polygon(${pts.join(',')})`, offset: p });
    }
    return { next, duration: 950 };
  });
}

export function tide(apply: () => void, fromX = window.innerWidth / 2) {
  return run('route', apply, () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const N = 36;
    const STEPS = 24;
    const amp = Math.min(150, h * 0.17);
    const bias = fromX / w;
    const next: Keyframe[] = [];
    for (let s = 0; s <= STEPS; s++) {
      const p = s / STEPS;
      const base = h + amp * 1.6 - (h + amp * 3.4) * easeOut(p);
      const pts: string[] = [`${w}px ${h}px`, `0px ${h}px`];
      for (let i = 0; i <= N; i++) {
        const u = i / N;
        // the crest sits where the visitor clicked
        const crest = Math.exp(-Math.pow((u - bias) * 2.6, 2));
        const swell = Math.sin(u * Math.PI * 2.4 + p * 5.2) * 0.34;
        const y = base - amp * (crest * (1 - p * 0.6) + swell);
        pts.push(`${(u * w).toFixed(1)}px ${y.toFixed(1)}px`);
      }
      next.push({ clipPath: `polygon(${pts.join(',')})`, offset: p });
    }
    const prev: Keyframe[] = [
      { transform: 'none', filter: 'brightness(1)' },
      { transform: 'translateY(-9vh) scale(0.965)', filter: 'brightness(0.72)' },
    ];
    return { next, prev, duration: 900 };
  });
}
