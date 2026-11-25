import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Check, Droplet, Plus, Lock, Phone } from 'lucide-react';
import VariableProximity from '../../components/reactbits/VariableProximity';
import CountUp from '../../components/reactbits/CountUp';
import ScrollVelocity from '../../components/reactbits/ScrollVelocity';
import ScrollReveal from '../../components/reactbits/ScrollReveal';
import Magnet from '../../components/reactbits/Magnet';
import SpotlightCard from '../../components/reactbits/SpotlightCard';
import DecryptedText from '../../components/reactbits/DecryptedText';
import SloshGauge from '../../components/reactbits/SloshGauge';
import CircularText from '../../components/reactbits/CircularText';
import { Expand, Reveal } from '../../components/ui/Reveal';
import { Mark, Pulse } from '../../components/ui/Brand';
import { Compatibility, pretty } from '../../components/site/Compatibility';
import { FAQS, PROTOCOL_STEPS } from '../../data/home';
import { useTheme } from '../../lib/theme';
import { useMedia, useOnScreen, useReduced, useSeen } from '../../lib/hooks';

const BloodStream = lazy(() => import('../../components/3d/BloodStream'));
const Silk = lazy(() => import('../../components/reactbits/Silk'));
const Radar = lazy(() => import('../../components/reactbits/Radar'));

/* ── Hero ───────────────────────────────────────────────── */

const Hero: React.FC = () => {
  const ref = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const reduced = useReduced();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : 130]);
  const fade = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  const lines = ['Connecting', 'lives when', 'every second', 'matters.'];

  return (
    <section ref={ref} className="relative -mt-[76px] flex min-h-[100svh] items-end overflow-hidden pt-[130px] lg:items-center">
      <Suspense fallback={null}>
        <BloodStream />
      </Suspense>
      <motion.div style={{ y, opacity: fade }} className="wrap relative z-10 pb-12 lg:pb-16">
        <h1 ref={titleRef} className="display text-[clamp(2.75rem,min(7.6vw,11.5svh),7.4rem)]" aria-label={lines.join(' ')}>
          {lines.map((l, i) => (
            <span key={l} aria-hidden="true" className="rise-in block whitespace-nowrap" style={{ ['--d' as any]: `${120 + i * 85}ms` }}>
              <VariableProximity
                label={l}
                containerRef={titleRef}
                fromFontVariationSettings="'wght' 700, 'wdth' 118"
                toFontVariationSettings="'wght' 900, 'wdth' 125"
                radius={170}
                falloff="gaussian"
              />
            </span>
          ))}
        </h1>
        <p className="lede rise-in mt-7 !max-w-[46ch]" style={{ ['--d' as any]: '520ms' }}>
          The emergency coordination platform for trauma patients, verified voluntary blood donors and accredited
          hospital blood banks.
        </p>
        <div className="rise-in mt-8 flex flex-col gap-3 sm:flex-row" style={{ ['--d' as any]: '620ms' }}>
          <Magnet padding={50} magnetStrength={3.5} disabled={reduced}>
            <Link to="/register" className="btn btn-primary btn-lg w-full sm:w-auto">
              <span>Request blood now</span>
              <ArrowRight size={19} className="nudge" />
            </Link>
          </Magnet>
          <Magnet padding={50} magnetStrength={3.5} disabled={reduced}>
            <Link to="/register?role=donor" className="btn btn-solid btn-lg w-full sm:w-auto">
              <Droplet size={18} className="text-red-ink" />
              <span>Become a donor</span>
            </Link>
          </Magnet>
        </div>
      </motion.div>
    </section>
  );
};

/* ── Moving band of blood groups ────────────────────────── */

const Band: React.FC = () => (
  <div className="overflow-hidden border-y border-line bg-surface py-5" aria-hidden="true">
    <ScrollVelocity
      texts={[
        <span key="a" className="inline-flex items-center gap-[0.5em] pr-[0.5em]">
          {['O-', 'A+', 'B+', 'AB-', 'O+', 'A-', 'B-', 'AB+'].map((g, i) => (
            <React.Fragment key={g}>
              <span className={i % 3 === 0 ? 'text-red-ink' : 'text-ink'}>{pretty(g)}</span>
              <span className="inline-block h-[0.3em] w-[0.3em] rounded-[50%_50%_50%_0] rotate-[135deg] bg-red" />
            </React.Fragment>
          ))}
        </span>,
      ]}
      velocity={46}
      numCopies={5}
      className="display text-[clamp(2.4rem,5.4vw,4.8rem)]"
    />
  </div>
);

/* ── Impact ─────────────────────────────────────────────── */

const Impact: React.FC = () => (
  <section className="wrap py-24 md:py-36" aria-label="Network figures">
    <div className="grid gap-y-16">
      <Reveal className="flex flex-col gap-x-10 gap-y-3 lg:flex-row lg:items-end">
        <p className="display whitespace-nowrap text-[clamp(4.2rem,17.5vw,15rem)] !leading-[0.8] text-red-ink">
          <CountUp to={14800} separator="," duration={2.2} suffix="+" />
        </p>
        <p className="max-w-[12ch] text-2xl font-semibold leading-tight tracking-tight">verified donors across 28 states and UTs</p>
      </Reveal>
      <dl className="grid gap-x-10 md:grid-cols-3">
        {[
          { n: <CountUp to={3420} separator="," suffix="+" duration={2} />, t: 'Dispatched responses', d: 'Trauma and surgery handshakes' },
          { n: <CountUp to={98.4} decimals={1} suffix="%" duration={2} />, t: 'Fulfillment rate', d: 'Geospatially routed matches' },
          { n: <CountUp to={6} prefix="< " suffix=" min" duration={1.4} />, t: 'Average triage time', d: 'From request to donor alert' },
        ].map((s, i) => (
          <Reveal key={s.t} delay={i * 90} className="flex flex-col gap-3 border-t border-line-strong py-6">
            <dd className="order-first whitespace-nowrap text-[clamp(2.4rem,4vw,3.6rem)] font-bold leading-none tracking-tight" style={{ fontStretch: '112%' }}>
              {s.n}
            </dd>
            <dt>
              <span className="block font-semibold">{s.t}</span>
              <span className="text-muted">{s.d}</span>
            </dt>
          </Reveal>
        ))}
        <p className="mt-4 text-sm text-faint md:col-span-3">Figures are simulated for this demonstration. Lifnex does not operate a commercial marketplace.</p>
      </dl>
    </div>
  </section>
);

/* ── Protocol: five cards that stack as you scroll ──────── */

const STEP_TONES = [
  { bg: 'var(--red)', fg: 'var(--on-red)', soft: 'oklch(0.2 0.08 20 / 0.34)' },
  { bg: 'var(--venous)', fg: 'var(--on-venous)', soft: 'oklch(1 0 0 / 0.1)' },
  { bg: 'var(--plasma)', fg: 'oklch(0.23 0.055 50)', soft: 'oklch(0.23 0.055 50 / 0.12)' },
  { bg: 'var(--ink)', fg: 'var(--ground)', soft: 'color-mix(in oklch, var(--ground) 14%, transparent)' },
  { bg: 'var(--red-deep)', fg: 'var(--on-red)', soft: 'oklch(1 0 0 / 0.14)' },
];

const StepCard: React.FC<{ i: number; total: number }> = ({ i, total }) => {
  const s = PROTOCOL_STEPS[i];
  const tone = STEP_TONES[i];
  const Icon = s.icon;
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReduced();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const depth = total - 1 - i;
  const scale = useTransform(scrollYProgress, [0, 1], [1, reduced || !depth ? 1 : 0.93]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, reduced || !depth ? 0 : i % 2 ? 1.6 : -1.6]);

  return (
    <div ref={ref} className="sticky" style={{ top: `calc(var(--nav-h) + ${16 + i * 12}px)`, paddingBottom: i === total - 1 ? 0 : '7vh' }}>
      <motion.article
        style={{ scale, rotate, background: tone.bg, color: tone.fg, transformOrigin: 'center top', boxShadow: 'var(--shadow-float)' }}
        className="relative grid min-h-[min(60vh,520px)] overflow-hidden rounded-panel p-7 sm:p-11 lg:grid-cols-[1fr_auto] lg:gap-12"
      >
        <div className="flex max-w-[62ch] flex-col justify-between gap-8">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-2xl" style={{ background: tone.soft }}>
              <Icon size={26} />
            </span>
            <span className="rounded-full px-4 py-1.5 text-[15px] font-semibold" style={{ background: tone.soft }}>
              {s.badge}
            </span>
          </div>
          <div>
            <h3 className="text-[clamp(1.9rem,4vw,3.4rem)] font-bold tracking-tight" style={{ fontStretch: '118%' }}>
              {s.title}
            </h3>
            <p className="mt-2 text-lg font-semibold">{s.subtitle}</p>
            <p className="mt-4 max-w-[58ch] text-[1.06rem] leading-relaxed">{s.desc}</p>
          </div>
        </div>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-[0.16em] right-[0.06em] text-[clamp(9rem,27vw,24rem)] font-black leading-none lg:static lg:self-end"
          style={{ fontStretch: '125%', letterSpacing: '-0.07em', color: tone.soft }}
        >
          {i + 1}
        </span>
      </motion.article>
    </div>
  );
};

const Protocol: React.FC = () => (
  <section className="wrap pb-24 md:pb-36">
    <Reveal className="mb-14 grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
      <h2 className="h-sec">The Lifnex emergency protocol</h2>
      <p className="lede">
        How the coordination grid turns a desperate search into a structured, audited, five-stage clinical response
        within the golden hour.
      </p>
    </Reveal>
    {PROTOCOL_STEPS.map((s, i) => (
      <StepCard key={s.step} i={i} total={PROTOCOL_STEPS.length} />
    ))}
  </section>
);

/* ── Capabilities: each tile shows the thing it describes ── */

const tile = 'h-full rounded-card border border-line bg-surface';

const RadarTile: React.FC = () => {
  const { theme } = useTheme();
  const wide = useMedia('(min-width: 768px)');
  const [ref, on] = useOnScreen<HTMLDivElement>('0px');
  return (
    <div ref={ref} className="absolute inset-x-0 bottom-0 top-[190px] md:top-0">
      <Suspense fallback={null}>
        <Radar
          color={theme === 'night' ? '#ff4a57' : '#d3122e'}
          backgroundColor={theme === 'night' ? '#1f0c10' : '#fdfbfb'}
          lightMode={theme === 'day'}
          scale={0.9}
          speed={0.7}
          targets={7}
          centerX={wide ? 0.66 : 0.5}
          paused={!on}
        />
      </Suspense>
    </div>
  );
};

const ETA = [
  { d: 'Donor A', km: '3.1 km', min: 9 },
  { d: 'Donor B', km: '2.4 km', min: 14 },
  { d: 'Donor C', km: '4.8 km', min: 17 },
];

const EtaTile: React.FC = () => {
  const [ref, seen] = useSeen<HTMLDivElement>();
  return (
    <div ref={ref} className="mt-6 grid gap-3">
      {ETA.map((r, i) => (
        <div key={r.d} className="grid grid-cols-[4.6rem_1fr_3.6rem] items-center gap-3 text-sm">
          <span className="text-muted">{r.d}</span>
          <span className="h-9 overflow-hidden rounded-[10px] bg-sunk">
            <span
              className="flex h-full origin-left items-center rounded-[10px] px-3 text-[13px] font-semibold"
              style={{
                width: `${r.min * 5}%`,
                background: i === 0 ? 'var(--red)' : 'var(--line-strong)',
                color: i === 0 ? 'var(--on-red)' : 'var(--ink)',
                transform: seen ? 'scaleX(1)' : 'scaleX(0.02)',
                transition: `transform 900ms var(--ease-out) ${150 + i * 120}ms`,
              }}
            >
              <span className="whitespace-nowrap">{r.km}</span>
            </span>
          </span>
          <span className="text-right font-semibold">{r.min} min</span>
        </div>
      ))}
    </div>
  );
};

const PrivacyTile: React.FC = () => (
  <div className="mt-6 flex items-center gap-4 rounded-2xl bg-sunk p-4">
    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-ok-wash text-ok-ink">
      <Lock size={19} />
    </span>
    <div className="min-w-0">
      <p className="text-sm text-muted">Donor contact, hover to see the handshake</p>
      <p className="text-lg font-semibold tabular-nums">
        <DecryptedText
          text="Released to hospital"
          animateOn="hover"
          sequential
          speed={34}
          revealDirection="start"
          characters="0123456789+#*"
          encryptedClassName="text-faint"
        />
      </p>
    </div>
  </div>
);

const NOTES = [
  { t: 'Postpartum hemorrhage, 4 units O−', s: 'Prioritised', tone: 'tag-red' },
  { t: 'Same request, sent twice', s: 'Duplicate', tone: '' },
  { t: 'Pediatric ICU, platelets B+', s: 'Prioritised', tone: 'tag-red' },
  { t: 'Elective surgery, Friday', s: 'Routine', tone: 'tag-ok' },
];

const TriageTile: React.FC = () => {
  const [order, setOrder] = useState(NOTES.map((_, i) => i));
  const [ref, on] = useOnScreen<HTMLDivElement>('0px');
  const reduced = useReduced();
  useEffect(() => {
    if (!on || reduced) return;
    const id = setInterval(() => setOrder((o) => [o[o.length - 1], ...o.slice(0, -1)]), 2600);
    return () => clearInterval(id);
  }, [on, reduced]);
  return (
    <div ref={ref} className="mt-6 grid h-[176px] grid-cols-1 content-start gap-2 overflow-hidden">
      {order.map((i, pos) => (
        <motion.div
          key={i}
          layout={!reduced}
          initial={false}
          animate={{ opacity: pos > 2 ? 0 : 1 }}
          transition={{ type: 'spring', duration: 0.7, bounce: 0.18 }}
          className="flex items-center justify-between gap-3 rounded-[14px] bg-sunk px-4 py-3 text-[15px]"
        >
          <span className={`min-w-0 truncate ${NOTES[i].s === 'Duplicate' ? 'text-faint line-through' : ''}`}>{NOTES[i].t}</span>
          <span className={`tag shrink-0 ${NOTES[i].tone}`}>{NOTES[i].s}</span>
        </motion.div>
      ))}
    </div>
  );
};

const StockTile: React.FC = () => (
  <div className="mt-6 flex flex-wrap items-end gap-5">
    {[
      { g: 'O−', v: 34, c: 'var(--red)' },
      { g: 'A+', v: 72, c: 'var(--red)' },
      { g: 'FFP', v: 58, c: 'var(--plasma)' },
    ].map((s) => (
      <div key={s.g} className="text-center">
        <SloshGauge defaultValue={s.v} liquidColor={s.c} glassColor="var(--sunk)" width={78} height={148} radius={24} ariaLabel={`${s.g} stock level`} />
        <p className="mt-2 font-semibold">{s.g}</p>
      </div>
    ))}
  </div>
);

const Cap: React.FC<{ title: string; body: string; className?: string; children?: React.ReactNode; delay?: number; bodyClass?: string }> = ({
  title, body, className = '', children, delay = 0, bodyClass = '',
}) => {
  const { theme } = useTheme();
  return (
    <Reveal delay={delay} className={className}>
      <SpotlightCard
        className={`${tile} relative overflow-hidden p-6 sm:p-8`}
        spotlightColor={theme === 'night' ? 'rgba(255, 74, 87, 0.2)' : 'rgba(211, 18, 46, 0.09)'}
        theme={theme === 'night' ? 'dark' : 'light'}
        style={{ background: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        <div className={`relative z-10 ${bodyClass}`}>
          <h3 className="text-[1.45rem]">{title}</h3>
          <p className="mt-3 text-muted">{body}</p>
        </div>
        {children}
      </SpotlightCard>
    </Reveal>
  );
};

const Capabilities: React.FC = () => (
  <section className="border-y border-line bg-sunk py-24 md:py-36">
    <div className="wrap">
      <Reveal className="mb-14 grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
        <h2 className="h-sec">Engineered for critical response</h2>
        <p className="lede">
          Six foundations that separate Lifnex from unstructured social media broadcasts and legacy directories.
        </p>
      </Reveal>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
        <Cap
          className="md:col-span-6 lg:col-span-4"
          title="Emergency requisition radar"
          body="Requisitions go only to biologically compatible, active voluntary donors located within travel radius. Real-time WebSocket and push."
          bodyClass="max-w-[34ch] min-h-[500px] md:min-h-[330px]"
        >
          <RadarTile />
        </Cap>
        <Cap
          className="md:col-span-3 lg:col-span-2"
          delay={80}
          title="Zero-knowledge donor privacy"
          body="Contact numbers and home addresses stay invisible to public scrapers and are released only on an authenticated hospital handshake."
        >
          <PrivacyTile />
        </Cap>
        <Cap
          className="md:col-span-3"
          title="Geospatial proximity mesh"
          body="Donors are sorted by estimated travel time instead of straight-line radius, inside an adaptive 15 km perimeter."
        >
          <EtaTile />
        </Cap>
        <Cap
          className="md:col-span-3"
          delay={80}
          title="Gemini clinical governance"
          body="Emergency notes are cross-verified, duplicates discarded, and pediatric and obstetric requests go first."
        >
          <TriageTile />
        </Cap>
        <Cap
          className="md:col-span-3 lg:col-span-2"
          title="Hospital cryo-stock sync"
          body="Accredited hospitals broadcast live availability, with a cold-chain audit trail. Tap or drag a vial."
        >
          <StockTile />
        </Cap>
        <Reveal delay={80} className="md:col-span-3 lg:col-span-4">
          <div className="relative flex h-full min-h-[300px] flex-col justify-between overflow-hidden rounded-card bg-red p-6 text-on-red sm:p-8">
            <div className="max-w-[46ch]">
              <h3 className="text-[1.45rem]">24/7 clinical dispatch hotline</h3>
              <p className="mt-3">
                A human-in-the-loop desk ready to assist intensive care physicians when rare blood groups are critically
                needed.
              </p>
            </div>
            <Pulse className="my-4 h-16 w-full" strokeWidth={3} />
            <Link to="/contact" className="group flex flex-wrap items-center gap-4">
              <span className="text-[clamp(1.8rem,4.6vw,3.6rem)] font-extrabold tracking-tight" style={{ fontStretch: '120%' }}>
                1800-LIFNEX-EMG
              </span>
              <span className="grid h-14 w-14 place-items-center rounded-full bg-on-red text-red transition-transform duration-300 [transition-timing-function:var(--ease-out)] group-hover:rotate-[-14deg] group-hover:scale-110">
                <Phone size={22} />
              </span>
            </Link>
          </div>
        </Reveal>
      </div>
    </div>
  </section>
);

/* ── Governance ─────────────────────────────────────────── */

const Governance: React.FC = () => (
  <section className="wrap py-28 md:py-44">
    <div className="mx-auto max-w-[1080px]">
      <h2 className="sr-only">Clinical and legal governance notice</h2>
      <ScrollReveal
        baseOpacity={0.12}
        enableBlur
        blurStrength={5}
        baseRotation={1.5}
        textClassName="!text-[clamp(1.6rem,3.9vw,3.3rem)] !leading-[1.16] !font-semibold tracking-tight"
      >
        Lifnex is an emergency communication and coordination platform, and not a blood bank. We do not collect, process, test, store, transport, or sell blood products.
      </ScrollReveal>
      <p className="lede mt-8 !max-w-[74ch]">
        All physical blood screening, cross-matching, donor eligibility verification and transfusions are conducted
        exclusively by licensed healthcare professionals at accredited medical institutions and licensed blood centers,
        in strict compliance with the Drugs and Cosmetics Act (1940) and the National Blood Policy of India.
      </p>
      <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-3 font-semibold">
        {['Non-commercial voluntary network', 'Supabase RLS data protection', 'CDSCO guidelines aligned'].map((t) => (
          <li key={t} className="flex items-center gap-2.5">
            <Check size={19} className="text-ok-ink" /> {t}
          </li>
        ))}
      </ul>
    </div>
  </section>
);

/* ── FAQ ────────────────────────────────────────────────── */

const Faq: React.FC = () => {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="wrap pb-24 md:pb-36">
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <Reveal className="lg:sticky lg:top-32 lg:self-start">
          <h2 className="h-sec">Clear answers on clinical safety</h2>
          <p className="lede mt-5">
            How Lifnex coordinates voluntary donation while upholding medical privacy and national healthcare standards.
          </p>
        </Reveal>
        <div>
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q} className="border-t border-line last:border-b">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-${i}`}
                  className="group flex w-full items-center justify-between gap-6 py-6 text-left text-[1.15rem] font-semibold leading-snug tracking-tight"
                >
                  <span className="transition-transform duration-300 [transition-timing-function:var(--ease-out)] group-hover:translate-x-1.5">{f.q}</span>
                  <span
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full transition-[background-color,color,transform] duration-300 [transition-timing-function:var(--ease-out)]"
                    style={{
                      background: isOpen ? 'var(--red)' : 'var(--sunk)',
                      color: isOpen ? 'var(--on-red)' : 'var(--ink)',
                      transform: isOpen ? 'rotate(135deg)' : 'none',
                    }}
                  >
                    <Plus size={19} />
                  </span>
                </button>
                <Expand open={isOpen} id={`faq-${i}`}>
                  <p className="max-w-[68ch] pb-7 pr-12 text-muted">{f.a}</p>
                </Expand>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

/* ── Close ──────────────────────────────────────────────── */

const Close: React.FC = () => {
  const [ref, on] = useOnScreen<HTMLElement>('0px');
  const reduced = useReduced();
  const wide = useMedia('(min-width: 1024px)');
  return (
    <section ref={ref} className="px-3 pb-3 sm:px-5 sm:pb-5">
      <div className="venous-panel relative isolate overflow-hidden rounded-panel">
        <div className="absolute inset-0 -z-10">
          <Suspense fallback={null}>
            <Silk color="#a30f26" sheenColor="#ff5a5a" speed={3.4} scale={0.9} noiseIntensity={0.5} rotation={0.4} paused={!on || reduced} />
          </Suspense>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(100deg, oklch(0.22 0.09 17 / 0.82), oklch(0.22 0.09 17 / 0.2))' }} />
        </div>
        <div className="wrap flex flex-col gap-12 py-20 md:py-28 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="display max-w-[12ch] text-[clamp(2.6rem,6.6vw,6.2rem)]">Every second is a heartbeat.</h2>
            <p className="mt-6 max-w-[50ch] text-lg opacity-90">
              Whether you are a voluntary donor ready to answer the call or an attendant coordinating an urgent
              transfusion, Lifnex puts life-saving speed on your side.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Magnet padding={40} magnetStrength={4} disabled={reduced}>
                <Link to="/register?role=donor" className="btn btn-inverse btn-lg w-full sm:w-auto">
                  <Droplet size={18} />
                  <span>Register as a donor</span>
                </Link>
              </Magnet>
              <Link to="/register" className="btn btn-outline-inverse btn-lg">
                <span>Request blood now</span>
                <ArrowRight size={18} className="nudge" />
              </Link>
            </div>
          </div>
          {wide && (
            <div aria-hidden="true" className="relative grid shrink-0 place-items-center">
              <CircularText text="every second matters, every drop counts, " size={300} fontSize={21} spinDuration={26} color="var(--on-venous)" />
              <span className="absolute grid h-[150px] w-[150px] place-items-center rounded-full bg-on-venous">
                <Mark size={92} className="beat" />
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export const HomePage: React.FC = () => (
  <>
    <Hero />
    <Band />
    <Impact />
    <Protocol />
    <section className="border-t border-line py-24 md:py-36">
      <div className="wrap">
        <Reveal className="mb-14 grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <h2 className="h-sec">Who can give to whom</h2>
          <p className="lede">
            The red cell and plasma compatibility rules enforced by our triage algorithm. Pick a blood group to see its
            matching profile.
          </p>
        </Reveal>
        <Compatibility />
      </div>
    </section>
    <Capabilities />
    <Governance />
    <Faq />
    <Close />
  </>
);

export default HomePage;
