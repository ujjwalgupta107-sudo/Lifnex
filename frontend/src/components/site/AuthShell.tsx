import React, { Suspense, lazy } from 'react';
import { Mark } from '../ui/Brand';
import { useMedia, useReduced } from '../../lib/hooks';

const Silk = lazy(() => import('../reactbits/Silk'));

interface Props {
  title: string;
  sub: React.ReactNode;
  pitch: string;
  children: React.ReactNode;
}

/** Form on one side, moving silk of blood on the other. */
export const AuthShell: React.FC<Props> = ({ title, sub, pitch, children }) => {
  const wide = useMedia('(min-width: 1024px)');
  const reduced = useReduced();
  return (
    <section className="px-3 pb-3 pt-4 sm:px-5 sm:pb-5">
      <div className="mx-auto grid max-w-[1420px] grid-cols-1 gap-4 lg:min-h-[calc(100svh-150px)] lg:grid-cols-[1fr_1fr]">
        <div className="flex min-w-0 flex-col justify-center px-3 py-12 sm:px-10 lg:px-16">
          <div className="mx-auto w-full max-w-[460px]">
            <h1 className="rise-in display text-[clamp(2.3rem,4.6vw,3.7rem)]">{title}</h1>
            <p className="rise-in mt-4 text-muted" style={{ ['--d' as any]: '80ms' }}>
              {sub}
            </p>
            <div className="rise-in mt-8" style={{ ['--d' as any]: '150ms' }}>
              {children}
            </div>
          </div>
        </div>
        {wide && (
          <div className="venous-panel sticky top-[96px] isolate h-[calc(100svh-150px)] overflow-hidden rounded-panel" aria-hidden="true">
            <div className="absolute inset-0 -z-10">
              <Suspense fallback={null}>
                <Silk color="#b3102a" sheenColor="#ff6a62" speed={3.2} scale={0.85} noiseIntensity={0.45} rotation={1.1} paused={reduced} />
              </Suspense>
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, oklch(0.2 0.085 17 / 0.85), transparent 62%)' }} />
            </div>
            <span className="absolute left-9 top-9 grid h-[84px] w-[84px] place-items-center rounded-[26px] bg-on-venous">
              <Mark size={54} className="beat" />
            </span>
            <p className="display absolute bottom-10 left-9 right-9 text-[clamp(2.2rem,3.9vw,4rem)]">{pitch}</p>
          </div>
        )}
      </div>
    </section>
  );
};
