import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import VariableProximity from '../reactbits/VariableProximity';
import { Mark, Pulse } from '../ui/Brand';

const COLS = [
  {
    title: 'Platform',
    links: [
      ['Request emergency blood', '/register'],
      ['Become a voluntary donor', '/register?role=donor'],
      ['Hospital network', '/hospitals'],
      ['5-minute golden hour protocol', '/how-it-works'],
    ],
  },
  {
    title: 'Governance',
    links: [
      ['Clinical architecture', '/about'],
      ['CDSCO regulatory alignment', '/about'],
      ['Clinical advisory board', '/contact'],
      ['Zero-monetization charter', '/about'],
    ],
  },
];

export const Footer: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <footer className="relative overflow-hidden border-t border-line bg-sunk">
      <div className="wrap pb-10 pt-16 md:pt-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.1fr]">
          <div>
            <Mark size={52} />
            <p className="mt-5 max-w-[38ch] text-muted">
              Connecting lives when every second matters. India's AI-powered emergency blood coordination platform for
              trauma patients, voluntary donors and accredited blood banks.
            </p>
            <p className="mt-4 text-sm text-faint">Protected by PostgreSQL Row-Level Security (RLS)</p>
          </div>
          {COLS.map((c) => (
            <nav key={c.title} aria-label={c.title}>
              <h2 className="mb-3 text-[17px]">{c.title}</h2>
              <ul>
                {c.links.map(([label, to]) => (
                  <li key={label}>
                    <Link to={to} className="flink">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
          <div>
            <h2 className="mb-3 text-[17px]">Emergency dispatch</h2>
            <p className="text-2xl font-bold tracking-tight text-red-ink" style={{ fontStretch: '112%' }}>
              1800-LIFNEX-EMG
            </p>
            <p className="mt-1 text-sm text-faint">Toll-free, 24/7 desk</p>
            <p className="mt-4 text-muted">
              Direct clinical support line for rare blood units and critical trauma requisitions.
            </p>
            <Link to="/contact" className="link mt-4 inline-block">
              Contact the desk
            </Link>
          </div>
        </div>

        <p className="mt-14 max-w-[110ch] text-sm leading-relaxed text-faint">
          <strong className="text-muted">Statutory notice.</strong> Lifnex is an academic and technology coordination
          platform connecting voluntary blood donors with licensed healthcare providers. Lifnex is strictly a
          coordination network and NOT a blood bank. We do not store, collect, cross-match, or sell blood products.
          Transfusion safety and blood testing are executed exclusively by licensed physicians at accredited blood
          centers under the Drugs and Cosmetics Act (1940).
        </p>

        <Pulse className="mt-10 h-12 w-full text-red" />
      </div>

      <div ref={ref} aria-hidden="true" className="wrap select-none pb-2 text-center text-[clamp(4.6rem,24.5vw,24rem)] leading-[0.78] tracking-[-0.06em] text-ink">
        <VariableProximity
          label="Lifnex"
          containerRef={ref}
          fromFontVariationSettings="'wght' 300, 'wdth' 100"
          toFontVariationSettings="'wght' 900, 'wdth' 118"
          radius={260}
          falloff="gaussian"
        />
      </div>

      <div className="wrap flex flex-col justify-between gap-2 py-6 text-sm text-faint sm:flex-row">
        <span>&copy; {new Date().getFullYear()} Lifnex Healthcare Network. All rights reserved.</span>
        <span>Powered by Gemini Clinical AI, Supabase and Three.js</span>
      </div>
    </footer>
  );
};
