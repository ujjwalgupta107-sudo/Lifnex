import React from 'react';

export const Mark: React.FC<{ size?: number; className?: string }> = ({ size = 40, className = '' }) => (
  <img
    src="/static/assets/logo/lifnex-mark.png"
    width={size}
    height={size}
    alt=""
    className={className}
    style={{ width: size, height: 'auto' }}
  />
);

export const Wordmark: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span
    className={`italic leading-none ${className}`}
    style={{ fontStretch: '112%', fontWeight: 800, letterSpacing: '-0.045em' }}
  >
    Lifnex
  </span>
);

/** The heartbeat trace from the logo, drawn continuously. */
export const Pulse: React.FC<{ className?: string; strokeWidth?: number }> = ({ className = '', strokeWidth = 2 }) => (
  <svg viewBox="0 0 240 40" className={className} fill="none" aria-hidden="true" preserveAspectRatio="none">
    <path
      d="M0 20H84l7-9 8 22 10-32 9 28 6-9H240"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
      strokeLinecap="round"
      opacity="0.22"
      vectorEffect="non-scaling-stroke"
    />
    <path
      d="M0 20H84l7-9 8 22 10-32 9 28 6-9H240"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
      strokeLinecap="round"
      pathLength={100}
      strokeDasharray="16 84"
      vectorEffect="non-scaling-stroke"
      style={{ animation: 'ecg-run 2.6s linear infinite' }}
    />
  </svg>
);
