import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import JellyRadio from '../reactbits/JellyRadio';
import RubberSegment from '../reactbits/RubberSegment';
import { BLOOD_MATRIX } from '../../data/home';
import { useMedia, useReduced } from '../../lib/hooks';

const GROUPS = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];
export const pretty = (g: string) => g.replace('-', '−');

type Mode = 'give' | 'receive';

/**
 * The compatibility rules as a circulation diagram. The chosen group is the heart;
 * vessels open to every group it can give to or receive from.
 */
export const Compatibility: React.FC = () => {
  const [group, setGroup] = useState('O-');
  const [mode, setMode] = useState<Mode>('give');
  const [part, setPart] = useState<'cells' | 'plasma'>('cells');
  const narrow = useMedia('(max-width: 640px)');
  const reduced = useReduced();

  const data = BLOOD_MATRIX[group];
  const open = useMemo(() => {
    if (part === 'cells') return mode === 'give' ? data.canDonateTo : data.canReceiveFrom;
    return mode === 'give' ? data.plasmaDonateTo : data.plasmaReceiveFrom;
  }, [data, mode, part]);

  const stroke = part === 'cells' ? 'var(--red)' : 'var(--plasma)';
  const W = narrow ? 360 : 760;
  const H = narrow ? 430 : 460;
  const x0 = narrow ? 56 : 120;
  const x1 = narrow ? 316 : 640;
  const rowY = (i: number) => 30 + i * ((H - 60) / 7);
  const heartY = H / 2;

  const path = (i: number) => {
    const y = rowY(i);
    const mx = (x0 + x1) / 2;
    return `M${x0} ${heartY} C ${mx - 20} ${heartY}, ${mx - 40} ${y}, ${x1} ${y}`;
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-14">
      <div className="flex flex-col gap-7">
        <div>
          <h3 className="mb-3 text-lg">Blood group</h3>
          <div className="-ml-4">
          <JellyRadio
            items={GROUPS.map((g) => ({ value: g, label: pretty(g) }))}
            value={group}
            onChange={(v) => setGroup(v)}
            size="lg"
            gap={8}
            radius={16}
            chipColor="var(--sunk)"
            textColor="var(--ink)"
            activeColor="var(--red)"
            activeTextColor="var(--on-red)"
            ariaLabel="Blood group"
          />
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <RubberSegment
            items={[
              { value: 'give', label: 'Gives to' },
              { value: 'receive', label: 'Receives from' },
            ]}
            value={mode}
            onChange={(v) => setMode(v as Mode)}
            trackColor="var(--sunk)"
            thumbColor="var(--raised)"
            textColor="var(--ink)"
            activeTextColor="var(--ink)"
            aria-label="Direction"
          />
          <RubberSegment
            items={[
              { value: 'cells', label: 'Red cells' },
              { value: 'plasma', label: 'Plasma' },
            ]}
            value={part}
            onChange={(v) => setPart(v as 'cells' | 'plasma')}
            trackColor="var(--sunk)"
            thumbColor={part === 'cells' ? 'var(--red)' : 'var(--plasma)'}
            textColor="var(--ink)"
            activeTextColor={part === 'cells' ? 'var(--on-red)' : 'oklch(0.25 0.06 60)'}
            aria-label="Component"
          />
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={group + mode + part}
            initial={{ opacity: 0, transform: 'translateY(8px)', filter: 'blur(4px)' }}
            animate={{ opacity: 1, transform: 'translateY(0px)', filter: 'blur(0px)' }}
            exit={{ opacity: 0, transform: 'translateY(-6px)', filter: 'blur(4px)' }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            aria-live="polite"
          >
            <p className="text-2xl font-semibold leading-snug tracking-tight">
              {mode === 'give'
                ? `${pretty(group)} ${part === 'cells' ? 'red cells' : 'plasma'} can go to `
                : `${pretty(group)} patients can receive ${part === 'cells' ? 'red cells' : 'plasma'} from `}
              {open.length === 8 ? 'every blood group' : open.map(pretty).join(', ')}.
            </p>
            <p className="mt-3 text-muted">{data.rarity}</p>
            <p className="mt-1 text-muted">{data.notes}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="panel relative overflow-hidden p-3 sm:p-6">
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={`${group} ${mode === 'give' ? 'gives' : 'receives'} ${part}: ${open.join(', ')}`}>
          {GROUPS.map((g, i) => {
            const on = open.includes(g);
            return (
              <g key={g}>
                <path d={path(i)} fill="none" stroke="var(--line)" strokeWidth={2} />
                <motion.path
                  d={path(i)}
                  fill="none"
                  stroke={stroke}
                  strokeLinecap="round"
                  initial={false}
                  animate={{ pathLength: on ? 1 : 0, opacity: on ? 1 : 0, strokeWidth: on ? (narrow ? 5 : 7) : 2 }}
                  transition={reduced ? { duration: 0 } : { duration: on ? 0.7 : 0.25, delay: on ? i * 0.04 : 0, ease: [0.77, 0, 0.175, 1] }}
                />
                {on && !reduced && (
                  <>
                    {[0, 0.5].map((off) => (
                      <circle key={off + mode + part} r={narrow ? 2.6 : 3.6} fill="#fff" opacity="0.9">
                        <animateMotion
                          dur={`${1.7 + i * 0.07}s`}
                          begin={`${0.5 + off * 1.7}s`}
                          repeatCount="indefinite"
                          path={path(i)}
                          keyPoints={mode === 'give' ? '0;1' : '1;0'}
                          keyTimes="0;1"
                          calcMode="linear"
                        />
                      </circle>
                    ))}
                  </>
                )}
                <g onClick={() => setGroup(g)} style={{ cursor: 'pointer' }}>
                  <motion.circle
                    cx={x1}
                    cy={rowY(i)}
                    initial={false}
                    animate={{ r: on ? (narrow ? 23 : 25) : narrow ? 18 : 19, fill: on ? stroke : 'var(--sunk)' }}
                    transition={{ type: 'spring', duration: 0.6, bounce: 0.35, delay: on && !reduced ? 0.3 + i * 0.04 : 0 }}
                  />
                  <text
                    x={x1}
                    y={rowY(i) + 5}
                    textAnchor="middle"
                    fontSize={narrow ? 14 : 15}
                    fontWeight={700}
                    fill={on ? (part === 'cells' ? '#fff' : '#3d2204') : 'var(--faint)'}
                    style={{ transition: 'fill 250ms ease', pointerEvents: 'none' }}
                  >
                    {pretty(g)}
                  </text>
                </g>
              </g>
            );
          })}
          <g className={reduced ? '' : 'beat'} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
            <path
              transform={`translate(${x0} ${heartY}) scale(${narrow ? 0.78 : 1.25})`}
              d="M0 -62 C 0 -62 -44 -14 -44 16 A 44 44 0 0 0 44 16 C 44 -14 0 -62 0 -62 Z"
              fill={stroke}
              style={{ transition: 'fill 300ms ease' }}
            />
          </g>
          <text
            x={x0}
            y={heartY + (narrow ? 22 : 34)}
            textAnchor="middle"
            fontSize={narrow ? 25 : 40}
            fontWeight={780}
            fill={part === 'cells' ? '#fff' : '#3d2204'}
            style={{ letterSpacing: '-0.04em' }}
          >
            {pretty(group)}
          </text>
        </svg>
      </div>
    </div>
  );
};
