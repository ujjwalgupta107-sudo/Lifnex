import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useScroll, useSpring } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import RubberSegment from '../../components/reactbits/RubberSegment';
import SloshGauge from '../../components/reactbits/SloshGauge';
import { Reveal } from '../../components/ui/Reveal';
import { PageHead } from '../../components/site/PageHead';
import { COMPONENT_GUIDE, TIMELINE_STEPS } from '../../data/content';
import { useReduced } from '../../lib/hooks';

const JOURNEYS = {
  patient: {
    steps: [
      ['Request desk', 'Submit the hospital name, required units, and urgency. Our AI instantly matches compatible donors.'],
      ['Live telemetry', 'Watch the live status timeline as donors accept and update their in-transit estimated time of arrival.'],
      ['Hospital handshake', 'The hospital confirms donor arrival, conducts blood cross-matching, and completes transfusion.'],
    ],
    cta: ['Create an emergency request', '/register'],
  },
  donor: {
    steps: [
      ['Set availability', 'Toggle your active status on your dashboard. You only receive alerts when you are ready and eligible.'],
      ['Review urgent alert', 'Receive a verified alert with hospital location, distance, and patient urgency. Accept with one tap.'],
      ['Save a life', 'Arrive at the accredited hospital, donate under professional supervision, and receive donation badges.'],
    ],
    cta: ['Register as a voluntary donor', '/register?role=donor'],
  },
} as const;

const GAUGES = [
  { v: 82, c: 'var(--red)' },
  { v: 24, c: 'var(--plasma)' },
  { v: 68, c: 'var(--plasma)' },
  { v: 12, c: 'var(--red-deep)' },
];

/** The five phases hang off one vessel that fills as you read down the page. */
const Timeline: React.FC = () => {
  const ref = useRef<HTMLOListElement>(null);
  const reduced = useReduced();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 62%', 'end 62%'] });
  const fill = useSpring(scrollYProgress, { stiffness: 120, damping: 28 });
  return (
    <ol ref={ref} className="relative">
      <span aria-hidden="true" className="absolute bottom-0 left-[13px] top-0 w-[10px] rounded-full bg-line md:left-[calc(22%_-_5px)]" />
      <motion.span
        aria-hidden="true"
        className="absolute bottom-0 left-[13px] top-0 w-[10px] origin-top rounded-full bg-red md:left-[calc(22%_-_5px)]"
        style={{ scaleY: reduced ? 1 : fill }}
      />
      {TIMELINE_STEPS.map((s, i) => (
        <li key={s.phase} className="relative pb-16 pl-14 last:pb-0 md:grid md:grid-cols-[22%_1fr] md:pb-24 md:pl-0">
          <span
            aria-hidden="true"
            className="absolute left-0 top-1 grid h-9 w-9 place-items-center rounded-full bg-red text-[15px] font-bold text-on-red ring-8 ring-ground md:left-[calc(22%_-_18px)]"
          >
            {i + 1}
          </span>
          <Reveal className="mb-2 text-xl font-semibold tracking-tight text-red-ink md:pr-14 md:text-right md:text-2xl">{s.time}</Reveal>
          <Reveal delay={60} className="md:pl-16">
            <h3 className="text-[clamp(1.6rem,3vw,2.5rem)]">{s.title}</h3>
            <p className="mt-2 font-semibold text-muted">{s.actor}</p>
            <p className="mt-4 max-w-[62ch] text-[1.05rem] text-muted">{s.desc}</p>
            <span className="tag tag-ok mt-5">{s.metric}</span>
          </Reveal>
        </li>
      ))}
    </ol>
  );
};

export const HowItWorksPage: React.FC = () => {
  const [persona, setPersona] = useState<'patient' | 'donor'>('patient');
  const j = JOURNEYS[persona];

  return (
    <>
      <PageHead flow lines={['Five minutes,', 'from request', 'to donor']}>
        <p className="lede">From emergency intake to bedside transfusion handshakes in five audited, clinical stages.</p>
      </PageHead>

      <section className="wrap pb-24 md:pb-36">
        <Reveal className="mb-16 grid gap-5 pt-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <h2 className="h-sec">The 5-minute golden hour protocol</h2>
          <p className="lede">Every phase is executed under strict clinical timeouts and audited event logs.</p>
        </Reveal>
        <Timeline />
      </section>

      <section className="border-y border-line bg-sunk py-24 md:py-32">
        <div className="wrap">
          <Reveal className="mb-12 flex flex-col items-start justify-between gap-7 lg:flex-row lg:items-end">
            <h2 className="h-sec">Your journey on the platform</h2>
            <RubberSegment
              items={[
                { value: 'patient', label: 'Patients' },
                { value: 'donor', label: 'Donors' },
              ]}
              value={persona}
              onChange={(v) => setPersona(v as 'patient' | 'donor')}
              size="lg"
              radius={16}
              inset={5}
              trackColor="var(--surface)"
              thumbColor="var(--red)"
              textColor="var(--ink)"
              activeTextColor="var(--on-red)"
              aria-label="Journey"
            />
          </Reveal>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={persona}
              initial={{ opacity: 0, transform: `translateX(${persona === 'donor' ? 40 : -40}px)`, filter: 'blur(6px)' }}
              animate={{ opacity: 1, transform: 'translateX(0px)', filter: 'blur(0px)' }}
              exit={{ opacity: 0, transform: `translateX(${persona === 'donor' ? 24 : -24}px)`, filter: 'blur(6px)' }}
              transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
            >
              <ol className="grid gap-x-10 md:grid-cols-3">
                {j.steps.map(([t, d], i) => (
                  <li key={t} className="border-t-2 border-red py-7">
                    <span className="display block text-[clamp(3.4rem,6vw,5.4rem)] text-red-ink">{i + 1}</span>
                    <h3 className="mt-5 text-2xl">{t}</h3>
                    <p className="mt-3 text-muted">{d}</p>
                  </li>
                ))}
              </ol>
              <Link to={j.cta[1]} className="btn btn-primary btn-lg mt-6">
                <span>{j.cta[0]}</span>
                <ArrowRight size={18} className="nudge" />
              </Link>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      <section className="wrap py-24 md:py-36">
        <Reveal className="mb-14 grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <h2 className="h-sec">Blood components and clinical indications</h2>
          <p className="lede">Storage requirements and clinical use cases according to blood banking guidelines.</p>
        </Reveal>
        <div className="grid gap-x-16 md:grid-cols-2">
          {COMPONENT_GUIDE.map((c, i) => (
            <Reveal key={c.name} delay={(i % 2) * 80} className="grid grid-cols-[84px_1fr] gap-6 border-t border-line py-9">
              <SloshGauge
                defaultValue={GAUGES[i].v}
                showValue={false}
                liquidColor={GAUGES[i].c}
                glassColor="var(--sunk)"
                width={76}
                height={170}
                radius={26}
                ticks={0}
                ariaLabel={`${c.name} vial`}
              />
              <div>
                <h3 className="text-[1.35rem]">{c.name}</h3>
                <dl className="mt-4 grid gap-3">
                  {[
                    ['Storage', c.lifespan],
                    ['Indication', c.usage],
                    ['Unit volume', c.volume],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-sm text-faint">{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
};

export default HowItWorksPage;
