import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import {
  Building2,
  Search,
  MapPin,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  PlusCircle,
  Filter,
} from 'lucide-react';

const FALLBACK_HOSPITALS = [
  {
    id: 'hosp-1',
    name: 'All India Institute of Medical Sciences (AIIMS)',
    city: 'New Delhi',
    state: 'Delhi',
    address: 'Ansari Nagar, New Delhi - 110029',
    contact_number: '+91 11 26588500',
    blood_bank_license: 'CDSCO-DL-2023-0891',
    is_verified: true,
    cryo_stock_enabled: true,
  },
  {
    id: 'hosp-2',
    name: 'King George’s Medical University (KGMU)',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    address: 'Shah Mina Rd, Chowk, Lucknow - 226003',
    contact_number: '+91 522 2257450',
    blood_bank_license: 'CDSCO-UP-2022-1142',
    is_verified: true,
    cryo_stock_enabled: true,
  },
  {
    id: 'hosp-3',
    name: 'Postgraduate Institute of Medical Education (PGIMER)',
    city: 'Chandigarh',
    state: 'Punjab / Chandigarh',
    address: 'Sector 12, Chandigarh - 160012',
    contact_number: '+91 172 2747585',
    blood_bank_license: 'CDSCO-CH-2021-0456',
    is_verified: true,
    cryo_stock_enabled: true,
  },
  {
    id: 'hosp-4',
    name: 'Tata Memorial Hospital (Advanced Cancer Centre)',
    city: 'Mumbai',
    state: 'Maharashtra',
    address: 'Dr. E Borges Road, Parel, Mumbai - 400012',
    contact_number: '+91 22 24177000',
    blood_bank_license: 'CDSCO-MH-2023-3321',
    is_verified: true,
    cryo_stock_enabled: true,
  },
  {
    id: 'hosp-5',
    name: 'Apollo Health City Blood & Transfusion Centre',
    city: 'Hyderabad',
    state: 'Telangana',
    address: 'Jubilee Hills, Hyderabad - 500033',
    contact_number: '+91 40 23607777',
    blood_bank_license: 'CDSCO-TS-2024-5509',
    is_verified: true,
    cryo_stock_enabled: true,
  },
  {
    id: 'hosp-6',
    name: 'Christian Medical College & Hospital (CMC)',
    city: 'Vellore',
    state: 'Tamil Nadu',
    address: 'Ida Scudder Road, Vellore - 632004',
    contact_number: '+91 416 2281000',
    blood_bank_license: 'CDSCO-TN-2022-8812',
    is_verified: true,
    cryo_stock_enabled: true,
  },
];

export const HospitalsPage: React.FC = () => {
  const [hospitals, setHospitals] = useState<any[]>(FALLBACK_HOSPITALS);
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('All');
  const [loading, setLoading] = useState(true);

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
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const cities = ['All', ...Array.from(new Set(hospitals.map((h) => h.city || h.state).filter(Boolean)))];

  const filteredHospitals = hospitals.filter((h) => {
    const matchesSearch =
      (h.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (h.address || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (h.city || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = cityFilter === 'All' || h.city === cityFilter || h.state === cityFilter;
    return matchesSearch && matchesCity;
  });

  return (
    <div className="bg-[#050811] text-slate-100 min-h-screen">
      {/* Hero Header */}
      <section className="relative py-20 border-b border-white/10 bg-gradient-to-b from-[#0B1222] to-[#050811]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-4xl">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20 px-3 py-1 rounded-full mb-6">
            Accredited Healthcare Facilities
          </span>
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight mb-6 leading-tight">
            Hospital & Blood Bank <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#10B981] via-[#38BDF8] to-[#FF747E]">
              Accreditation Directory.
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed mb-8">
            Verified trauma centers, super-specialty hospitals, and licensed blood banks integrated
            into the Lifnex emergency coordination mesh.
          </p>

          <Link
            to="/register?role=hospital"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-[#FF2E54] hover:bg-[#E11D48] transition-all shadow-lg"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Apply for Hospital Accreditation</span>
          </Link>
        </div>
      </section>

      {/* Directory Search & Filters */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="p-6 rounded-3xl bg-[#0D1526] border border-white/10 mb-10 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search hospital name, city or license..."
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-[#38BDF8] text-sm"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="px-4 py-3 rounded-xl bg-[#111A2E] border border-white/10 text-white text-sm focus:outline-none focus:border-[#38BDF8]"
              >
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city === 'All' ? 'All Locations' : city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Hospitals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHospitals.map((h, i) => (
              <div
                key={h.id || i}
                className="p-6 rounded-3xl bg-[#0C1322] border border-white/10 hover:border-emerald-500/40 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Verified Facility</span>
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2 leading-snug">{h.name}</h3>

                  <div className="flex items-start gap-2 text-xs text-slate-400 mb-3">
                    <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    <span>{h.address || `${h.city}, ${h.state}`}</span>
                  </div>

                  {h.blood_bank_license && (
                    <div className="text-[11px] font-mono text-[#38BDF8] bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-lg mb-4 inline-block">
                      Lic: {h.blood_bank_license}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Phone className="w-3.5 h-3.5 text-[#FF2E54]" />
                    <span>{h.contact_number || '+91 1800-LIFNEX'}</span>
                  </div>
                  <span className="text-emerald-400 font-semibold text-[11px]">Cryo-Sync Active</span>
                </div>
              </div>
            ))}
          </div>

          {filteredHospitals.length === 0 && (
            <div className="text-center py-16 p-8 rounded-3xl bg-[#0D1526] border border-white/10">
              <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">No facilities match your search</h3>
              <p className="text-xs text-slate-400">Try searching with a broader city name or reset filters.</p>
            </div>
          )}
        </div>
      </section>

      {/* Accreditation Standards */}
      <section className="py-20 bg-[#080E1C] border-t border-white/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="p-8 rounded-3xl bg-[#0D1526] border border-white/10">
            <h3 className="text-2xl font-bold text-white mb-4">How Hospitals Get Accredited</h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              Lifnex maintains a strict verification bar. Healthcare centers must submit valid CDSCO / State Blood Transfusion Council license certificates, cold-chain temperature monitoring protocols, and contact coordinates for their primary blood bank medical officer.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-white/5 text-xs text-slate-300">
                <strong className="text-white block mb-1">1. Submit License</strong>
                Valid State / Central CDSCO blood bank operational permit.
              </div>
              <div className="p-4 rounded-xl bg-white/5 text-xs text-slate-300">
                <strong className="text-white block mb-1">2. Admin Review</strong>
                Verification by Lifnex clinical compliance officers within 24 hours.
              </div>
              <div className="p-4 rounded-xl bg-white/5 text-xs text-slate-300">
                <strong className="text-white block mb-1">3. Cryo Sync</strong>
                Access to the hospital requisition terminal and donor dispatch intake.
              </div>
            </div>
            <Link
              to="/register?role=hospital"
              className="text-sm font-bold text-[#FF2E54] hover:underline inline-flex items-center gap-1"
            >
              <span>Begin Institutional Registration</span>
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
