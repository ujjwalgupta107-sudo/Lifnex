import React, { Suspense, lazy } from 'react';
import { useTheme } from '../../lib/theme';
import { useOnScreen, useReduced } from '../../lib/hooks';

const Radar = lazy(() => import('../reactbits/Radar'));

export const GeofenceRadar: React.FC = () => {
  const { theme } = useTheme();
  const [ref, on] = useOnScreen<HTMLDivElement>('0px');
  const reduced = useReduced();
  return (
    <div ref={ref} className="relative my-4 h-[300px] overflow-hidden rounded-2xl border border-line" aria-hidden="true">
      <Suspense fallback={null}>
        <Radar
          color={theme === 'night' ? '#ff4a57' : '#d3122e'}
          backgroundColor={theme === 'night' ? '#1f0c10' : '#fdfbfb'}
          lightMode={theme === 'day'}
          scale={0.95}
          speed={0.6}
          targets={5}
          paused={!on || reduced}
        />
      </Suspense>
    </div>
  );
};
