import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, MapPin, Phone, Plus, Search, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api';
import SpotlightCard from '../../components/reactbits/SpotlightCard';
import { Reveal } from '../../components/ui/Reveal';
import { PageHead } from '../../components/site/PageHead';
import { FALLBACK_HOSPITALS } from '../../data/content';
import { useTheme } from '../../lib/theme';
import { useReduced } from '../../lib/hooks';

const STANDARDS = [
  ['Submit license', 'Valid State or Central CDSCO blood bank operational permit.'],
  ['Admin review', 'Verification by Lifnex clinical compliance officers within 24 hours.'],
  ['Cryo sync', 'Access to the hospital requisition terminal and donor dispatch intake.'],
];

export const HospitalsPage: React.FC = () => {
  const [hospitals, setHospitals] = useState<any[]>(FALLBACK_HOSPITALS);
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('All');
  const { theme } = useTheme();
  const reduced = useReduced();

  useEffect(() => {
    api
      .getHospitals()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setHospitals(data);
        } else if (data?.hospitals && Array.isArray(data.hospitals) && data.hospitals.length > 0) {
          setHospitals(data.hospitals);
        }
      })
      .catch(() => {
        // Keeps fallback list
      });
  }, []);

  const cities = ['All', ...Array.from(new Set(hospitals.map((h) => h.city || h.state).filter(Boolean)))];

  const filteredHospitals = hospitals.filter((h) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      (h.name || '').toLowerCase().includes(q) ||
      (h.address || '').toLowerCase().includes(q) ||
      (h.city || '').toLowerCase().includes(q) ||
      (h.blood_bank_license || '').toLowerCase().includes(q);
    const matchesCity = cityFilter === 'All' || h.city === cityFilter || h.state === cityFilter;
    return matchesSearch && matchesCity;
  });

  return (
    <>
      <PageHead
        lines={['Hospitals and', 'blood banks', 'you can trust']}
        aside={
          <Link to="/register?role=hospital" className="btn btn-primary btn-lg justify-self-start">
            <Plus size={19} />
            <span>Apply for accreditation</span>
          </Link>
        }
      >
        <p className="lede">
          Verified trauma centers, super-specialty hospitals, and licensed blood banks in the Lifnex emergency mesh.
        </p>
      </PageHead>

      <section className="wrap pb-24 md:pb-36">
        <div className="mb-8 grid gap-3 md:grid-cols-[1fr_auto]">
          <div className="field-box">
            <Search size={19} className="input-icon" />
            <input
              type="search"
              aria-label="Search hospitals"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search hospital name, city or license"
              className="input has-icon"
            />
          </div>
          <select
            aria-label="Filter by city"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="input md:w-60"
          >
            {cities.map((city) => (
              <option key={city} value={city}>
                {city === 'All' ? 'All locations' : city}
              </option>
            ))}
          </select>
        </div>

        <p className="mb-5 text-muted" aria-live="polite">
          {filteredHospitals.length} {filteredHospitals.length === 1 ? 'facility' : 'facilities'}
        </p>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {filteredHospitals.map((h, i) => (
              <motion.div
                key={h.id || i}
                layout={!reduced}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', duration: 0.5, bounce: 0.12 }}
              >
                <SpotlightCard
                  className="h-full overflow-hidden rounded-card border border-line p-7"
                  style={{ background: 'var(--surface)', borderColor: 'var(--line)' }}
                  theme={theme === 'night' ? 'dark' : 'light'}
                  spotlightColor={theme === 'night' ? 'rgba(255, 74, 87, 0.2)' : 'rgba(211, 18, 46, 0.09)'}
                >
                  <div className="relative flex h-full flex-col justify-between gap-8">
                    <div>
                      <p className="flex items-center justify-between gap-3">
                        <span className="text-lg font-semibold text-red-ink">{h.city}</span>
                        <span className="tag tag-ok">
                          <ShieldCheck size={15} /> Verified
                        </span>
                      </p>
                      <h2 className="mt-5 text-[1.4rem] leading-[1.15]">{h.name}</h2>
                      <p className="mt-4 flex gap-2.5 text-muted">
                        <MapPin size={18} className="mt-1 shrink-0" />
                        <span>{h.address || `${h.city}, ${h.state}`}</span>
                      </p>
                    </div>
                    <div className="border-t border-line pt-5">
                      <p className="flex items-center gap-2.5 font-semibold">
                        <Phone size={17} className="text-red-ink" />
                        {h.contact_number || '+91 1800-LIFNEX'}
                      </p>
                      <p className="mt-2 flex flex-wrap justify-between gap-2 text-sm text-faint">
                        {h.blood_bank_license && <span>License {h.blood_bank_license}</span>}
                        <span className="text-ok-ink">Cryo-sync active</span>
                      </p>
                    </div>
                  </div>
                </SpotlightCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredHospitals.length === 0 && (
          <div className="panel grid place-items-center gap-4 px-6 py-20 text-center">
            <h2 className="text-2xl">No facilities match your search</h2>
            <p className="text-muted">Try a broader city name, or clear the filters.</p>
            <button
              className="btn btn-ghost"
              onClick={() => {
                setSearchTerm('');
                setCityFilter('All');
              }}
            >
              <span>Clear filters</span>
            </button>
          </div>
        )}
      </section>

      <section className="border-t border-line bg-sunk py-24 md:py-32">
        <div className="wrap grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <Reveal>
            <h2 className="h-sec">How hospitals get accredited</h2>
            <p className="lede mt-6">
              Healthcare centers must submit valid CDSCO or State Blood Transfusion Council license certificates,
              cold-chain temperature monitoring protocols, and contact coordinates for their primary blood bank medical
              officer.
            </p>
            <Link to="/register?role=hospital" className="btn btn-ghost btn-lg mt-8">
              <span>Begin registration</span>
              <ArrowRight size={18} className="nudge" />
            </Link>
          </Reveal>
          <ol>
            {STANDARDS.map(([t, d], i) => (
              <Reveal key={t} delay={i * 90} className="grid grid-cols-[4.2rem_1fr] items-baseline gap-4 border-t border-line py-7 last:border-b">
                <span className="display text-[3.2rem] text-red-ink">{i + 1}</span>
                <span>
                  <span className="block text-xl font-semibold tracking-tight">{t}</span>
                  <span className="mt-1 block text-muted">{d}</span>
                </span>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
};

export default HospitalsPage;
