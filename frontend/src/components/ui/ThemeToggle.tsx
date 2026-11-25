import React, { useRef } from 'react';
import { useTheme } from '../../lib/theme';

/**
 * Day/night switch. A single drop of blood is the thumb: by day it opens into a
 * sun, at night it crosses over and a bite turns it into a moon. The page
 * follows with a liquid spill from the thumb (see lib/liquid.ts).
 */
export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, toggle } = useTheme();
  const ref = useRef<HTMLButtonElement>(null);
  const night = theme === 'night';

  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={night}
      aria-label="Night mode"
      title={night ? 'Switch to day' : 'Switch to night'}
      onClick={() => {
        const r = ref.current!.getBoundingClientRect();
        toggle({ x: r.left + (night ? r.width - 20 : 20), y: r.top + r.height / 2 });
      }}
      data-night={night}
      className={`theme-toggle relative h-10 w-[70px] shrink-0 overflow-hidden rounded-full border border-line-strong ${className}`}
    >
      <svg viewBox="0 0 70 40" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <mask id="moon-bite" maskUnits="userSpaceOnUse" x="0" y="0" width="40" height="40">
            <rect width="40" height="40" fill="#fff" />
            <circle className="tt-bite" cx="46" cy="15.5" r="9.5" fill="#000" />
          </mask>
        </defs>
        <g className="tt-stars" fill="#fff">
          <circle cx="16" cy="13" r="1.4" />
          <circle cx="27" cy="22" r="1" opacity="0.7" />
          <circle cx="13" cy="27" r="1.1" opacity="0.6" />
          <circle cx="32" cy="11" r="0.9" opacity="0.8" />
        </g>
        <g className="tt-cloud" fill="#fff">
          <ellipse cx="50" cy="38" rx="16" ry="9" />
          <ellipse cx="62" cy="34" rx="12" ry="10" />
        </g>
        <g className="tt-thumb">
          <g className="tt-rays" fill="#e8a11c">
            {Array.from({ length: 8 }).map((_, i) => (
              <rect key={i} x="19" y="4.4" width="2" height="4.4" rx="1" transform={`rotate(${i * 45} 20 20)`} />
            ))}
          </g>
          <g mask="url(#moon-bite)">
            <circle className="tt-drop" cx="20" cy="20" r="8.6" />
          </g>
        </g>
      </svg>
    </button>
  );
};
