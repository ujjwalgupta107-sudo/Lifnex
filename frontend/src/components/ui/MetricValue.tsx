import React from 'react';
import Counter from '../reactbits/Counter';

/** A metric that rolls when its number changes. Non-numeric values render as they are. */
export const MetricValue: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => {
  const text = React.Children.toArray(children).join('');
  const m = text.match(/^([\d,]+)(\s.*)?$/);
  if (!m) return <div className={className}>{children}</div>;
  const n = Number(m[1].replace(/,/g, ''));
  return (
    <div className={`${className} flex items-baseline gap-2`}>
      <Counter value={n} intro textColor="currentColor" fontSize="1em" fontWeight={700} fade={0} padding={0} tabular={false} />
      {m[2] && <span className="metric-unit">{m[2].trim()}</span>}
    </div>
  );
};
