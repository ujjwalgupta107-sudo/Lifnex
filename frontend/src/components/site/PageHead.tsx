import React, { Suspense, lazy, useRef } from 'react';
import VariableProximity from '../reactbits/VariableProximity';

const BloodStream = lazy(() => import('../3d/BloodStream'));

interface Props {
  /** run the blood stream behind the title */
  flow?: boolean;
  lines: string[];
  children?: React.ReactNode;
  aside?: React.ReactNode;
}

/** Shared page opening: the title reacts to the pointer like the home hero. */
export const PageHead: React.FC<Props> = ({ lines, children, aside, flow }) => {
  const ref = useRef<HTMLHeadingElement>(null);
  return (
    <section className={flow ? 'relative -mt-[76px] flex min-h-[86svh] items-end overflow-hidden border-b border-line pt-[130px]' : ''}>
      {flow && (
        <Suspense fallback={null}>
          <BloodStream />
        </Suspense>
      )}
      <div
        className={`wrap relative grid gap-x-16 gap-y-8 pb-16 md:pb-24 ${
          flow ? '' : 'pt-14 md:pt-24 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-end'
        }`}
      >
      <h1 ref={ref} className="display text-[clamp(2.5rem,min(6.1vw,11svh),5.8rem)]" aria-label={lines.join(' ')}>
        {lines.map((l, i) => (
          <span key={l} aria-hidden="true" className="rise-in block whitespace-nowrap" style={{ ['--d' as any]: `${80 + i * 80}ms` }}>
            <VariableProximity
              label={l}
              containerRef={ref}
              fromFontVariationSettings="'wght' 700, 'wdth' 118"
              toFontVariationSettings="'wght' 900, 'wdth' 125"
              radius={150}
              falloff="gaussian"
            />
          </span>
        ))}
      </h1>
      <div className="rise-in grid gap-6" style={{ ['--d' as any]: '300ms' }}>
        {children}
        {aside}
      </div>
      </div>
    </section>
  );
};
