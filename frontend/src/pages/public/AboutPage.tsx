import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Check, Clock, Droplet, Lock, ShieldCheck, TriangleAlert } from 'lucide-react';
import ScrollReveal from '../../components/reactbits/ScrollReveal';
import TiltedCard from '../../components/reactbits/TiltedCard';
import { Reveal } from '../../components/ui/Reveal';
import { PageHead } from '../../components/site/PageHead';
import { useMedia, useReduced } from '../../lib/hooks';

const PROMISES = [
  ['Zero monetization', '100% voluntary, strictly prohibiting commercial blood transactions.'],
  ['Clinical governance', 'Strict adherence to the National Blood Policy and CDSCO protocols.'],
  ['Privacy by default', 'Donor contact details stay sealed until a mutual voluntary handshake.'],
];

const PILLARS = [
  {
    icon: Clock,
    title: 'Golden hour speed',
    body: 'Triage response latency under 6 minutes. Instant push notification to verified donors within a 15 km perimeter.',
    bg: 'var(--red)',
    fg: 'var(--on-red)',
    cls: 'md:col-span-7',
  },
  {
    icon: Activity,
    title: 'Biological rigor',
    body: 'Strict ABO/Rh compatibility indexing. Cross-match verification prevents mismatched donor dispatches.',
    bg: 'var(--surface)',
    fg: 'var(--ink)',
    cls: 'md:col-span-5',
  },
  {
    icon: Lock,
    title: 'Zero-knowledge RLS',
    body: 'PostgreSQL Row-Level Security protects donor numbers and private addresses against public harvesting.',
    bg: 'var(--surface)',
    fg: 'var(--ink)',
    cls: 'md:col-span-5',
  },
  {
    icon: ShieldCheck,
    title: 'Hospital accreditation',
    body: 'Every receiving trauma center and blood bank is vetted by platform administrators before intake verification.',
    bg: 'var(--venous)',
    fg: 'var(--on-venous)',
    cls: 'md:col-span-7',
  },
];

const Art: React.FC<{ src: string; alt: string; ratio: string }> = ({ src, alt, ratio }) => {
  const touch = useMedia('(hover: none)');
  const reduced = useReduced();
  if (touch || reduced)
    return <img src={src} alt={alt} className="w-full rounded-panel object-cover" style={{ aspectRatio: ratio }} loading="lazy" />;
  return (
    <div style={{ aspectRatio: ratio }} className="w-full">
      <TiltedCard
        imageSrc={src}
        altText={alt}
        containerHeight="100%"
        containerWidth="100%"
        imageHeight="100%"
        imageWidth="100%"
        rotateAmplitude={7}
        scaleOnHover={1.02}
        showTooltip={false}
        radius={34}
        glare={0.2}
      />
    </div>
  );
};

export const AboutPage: React.FC = () => (
  <>
    <PageHead flow lines={['Bridging', 'critical minutes', 'in blood', 'emergencies']}>
      <p className="lede">
        When a life is on the line, technological delays and geographic confusion should never stand between a trauma
        patient and a compatible voluntary blood donor.
      </p>
    </PageHead>

    <section className="border-b border-line bg-sunk">
      <div className="wrap grid items-center gap-14 py-24 md:py-32 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24">
        <Reveal>
          <Art src="/static/assets/images/hero-medical-team.jpg" alt="Collage of physicians against a red disc and handwritten figures" ratio="998 / 1150" />
        </Reveal>
        <div>
          <Reveal>
            <h2 className="h-sec">Why sub-second coordination saves lives</h2>
            <p className="lede mt-7">
              During major trauma surgeries, acute postpartum hemorrhages, and pediatric emergencies, packed red blood
              cells and platelets are strictly time-bound. A 30-minute delay in transfusion can dramatically decrease
              survival probabilities.
            </p>
            <p className="mt-5 max-w-[62ch] text-muted">
              Legacy blood request channels rely on chaotic social media group forwards. This leads to incompatible
              donors rushing to distant hospitals, panic, and wasted golden hours. Lifnex was engineered to replace
              chaos with a verified, audited, geospatial network.
            </p>
          </Reveal>
          <dl className="mt-10">
            {PROMISES.map(([t, d], i) => (
              <Reveal key={t} delay={i * 80} className="flex gap-4 border-t border-line py-5 last:border-b">
                <Check size={22} className="mt-0.5 shrink-0 text-ok-ink" />
                <div>
                  <dt className="font-semibold">{t}</dt>
                  <dd className="text-muted">{d}</dd>
                </div>
              </Reveal>
            ))}
          </dl>
        </div>
      </div>
    </section>

    <section className="wrap py-28 md:py-40">
      <div className="mx-auto max-w-[1100px]">
        <ScrollReveal
          baseOpacity={0.12}
          enableBlur
          blurStrength={5}
          baseRotation={1.5}
          textClassName="!text-[clamp(1.6rem,3.9vw,3.3rem)] !leading-[1.16] !font-semibold tracking-tight"
        >
          Lifnex exists solely as an academic and technological humanitarian mesh, connecting voluntary, uncompensated blood donors with accredited facilities.
        </ScrollReveal>
      </div>
    </section>

    <section className="wrap pb-24 md:pb-36">
      <Reveal className="mb-12 grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
        <h2 className="h-sec">The four pillars of Lifnex</h2>
        <p className="lede">Medical rigor, mathematical precision, and uncompromising digital security.</p>
      </Reveal>
      <div className="grid gap-4 md:grid-cols-12">
        {PILLARS.map((p, i) => (
          <Reveal key={p.title} delay={(i % 2) * 90} className={p.cls}>
            <article
              className="group flex h-full min-h-[280px] flex-col justify-between gap-10 overflow-hidden rounded-card border border-line p-7 sm:p-9"
              style={{ background: p.bg, color: p.fg }}
            >
              <p.icon
                size={54}
                strokeWidth={1.4}
                className="transition-transform duration-500 [transition-timing-function:var(--ease-out)] group-hover:-rotate-12 group-hover:scale-110"
              />
              <div>
                <h3 className="text-[clamp(1.5rem,2.4vw,2.1rem)]">{p.title}</h3>
                <p className="mt-3 max-w-[48ch]">{p.body}</p>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>

    <section className="border-t border-line bg-sunk">
      <div className="wrap grid items-center gap-14 py-24 md:py-32 lg:grid-cols-[1.1fr_0.9fr] lg:gap-24">
        <Reveal>
          <h2 className="h-sec">Upholding the National Blood Policy</h2>
          <p className="lede mt-7">
            India's National Blood Policy firmly prohibits the commercialization of blood donation. Through real-time
            tracking, audited handshake protocols, and automated cooldown intervals (90 days for whole blood donations),
            Lifnex promotes donor well-being while maximizing emergency availability.
          </p>
          <div className="note note-warn mt-7 max-w-[64ch]">
            <TriangleAlert size={19} />
            <p>
              <strong>Clinical boundary.</strong> Lifnex coordinates communication between verified voluntary donors and
              hospitals. Transfusions and cross-matching are conducted exclusively by licensed medical personnel at
              accredited healthcare facilities.
            </p>
          </div>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link to="/register?role=donor" className="btn btn-primary btn-lg">
              <Droplet size={18} />
              <span>Join the registry</span>
            </Link>
            <Link to="/hospitals" className="btn btn-ghost btn-lg">
              <span>Hospital directory</span>
            </Link>
          </div>
        </Reveal>
        <Reveal delay={100}>
          <Art src="/static/assets/images/clinical-verification.jpg" alt="Gloved hand holding a blood sample vial" ratio="735 / 903" />
        </Reveal>
      </div>
    </section>
  </>
);

export default AboutPage;
