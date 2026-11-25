import React from 'react';
import { useSeen } from '../../lib/hooks';

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  delay?: number;
}

export const Reveal: React.FC<Props> = ({ delay = 0, className = '', style, children, ...rest }) => {
  const [ref, seen] = useSeen<HTMLDivElement>();
  return (
    <div
      ref={ref}
      data-in={seen}
      className={`reveal ${className}`}
      style={{ ...style, ['--d' as any]: `${delay}ms` }}
      {...rest}
    >
      {children}
    </div>
  );
};

/** Accessible height accordion body (grid-rows trick, interruptible). */
export const Expand: React.FC<{ open: boolean; id?: string; children: React.ReactNode }> = ({ open, id, children }) => (
  <div
    id={id}
    className="grid transition-[grid-template-rows,opacity] duration-300 [transition-timing-function:var(--ease-out)]"
    style={{ gridTemplateRows: open ? '1fr' : '0fr', opacity: open ? 1 : 0 }}
    aria-hidden={!open}
  >
    <div className="overflow-hidden" style={{ visibility: open ? 'visible' : 'hidden', transition: 'visibility 300ms' }}>
      {children}
    </div>
  </div>
);
