import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Radio,
  Cpu,
  MapPin,
  Zap,
  Stethoscope,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Users,
  Building2,
  Droplet,
  ChevronRight,
} from 'lucide-react';

const TIMELINE_STEPS = [
  {
    phase: 'Phase 01',
    time: '0 - 30 seconds',
    title: 'Emergency Intake & Ingestion',
    actor: 'Patient / Attendant / Trauma Physician',
    desc: 'The requisition is submitted with required ABO/Rh group, clinical units needed (Whole Blood, PRBC, Platelets, Cryo), receiving trauma hospital, and severity flags.',
    metric: '< 30s Intake Latency',
  },
  {
    phase: 'Phase 02',
    time: '30 - 60 seconds',
    title: 'Gemini AI Clinical Triage & Compatibility',
    actor: 'Gemini Clinical AI Engine',
    desc: 'The triage system validates requisition parameters against biological compatibility matrices, cross-references cold-chain hospital inventory, and prioritizes critical trauma requisitions.',
    metric: '100% Matrix Verification',
  },
  {
    phase: 'Phase 03',
    time: '1 - 3 minutes',
    title: 'Geospatial Radar Mesh Dispatch',
    actor: 'Haversine Proximity Router',
    desc: 'The platform geofences active voluntary donors within a 15km perimeter, filtering for donation cooldown eligibility (90-day whole blood, 14-day platelet recovery) and pushing emergency alerts.',
    metric: '15km Geofence Perimeter',
  },
  {
    phase: 'Phase 04',
    time: '3 - 5 minutes',
    title: 'Mutual Handshake & In-Transit Radar',
    actor: 'Voluntary Donor & Dispatcher',
    desc: 'The donor reviews hospital details and accepts the mission. A temporary encrypted handshake connects the donor and hospital intake desk with live estimated arrival times.',
    metric: 'Zero-Knowledge Privacy',
  },
  {
    phase: 'Phase 05',
    time: 'Hospital Arrival',
    title: 'Bedside Intake & Supervised Transfusion',
    actor: 'Licensed Hospital Transfusion Team',
    desc: 'The donor is welcomed at the accredited hospital or blood center. Licensed clinical staff execute cross-matching, hemoglobin checks, and supervise transfusion protocols.',
    metric: 'CDSCO Compliance Sign-Off',
  },
];

const COMPONENT_GUIDE = [
  {
    name: 'Packed Red Blood Cells (PRBC)',
    lifespan: '42 days at 2-6°C',
    usage: 'Acute trauma, severe anemia, major surgical hemorrhage',
    volume: 'Approx. 250-350 mL per unit',
  },
  {
    name: 'Platelet Concentrates (RDP/SDP)',
    lifespan: '5 days at 20-24°C with continuous agitation',
    usage: 'Thrombocytopenia, leukemia, dengue hemorrhagic fever',
    volume: 'Approx. 50-70 mL (RDP) / 250 mL (SDP)',
  },
  {
    name: 'Fresh Frozen Plasma (FFP)',
    lifespan: '1 year at -18°C or colder',
    usage: 'Massive transfusion protocol, coagulopathy, liver disease',
    volume: 'Approx. 200-250 mL per unit',
  },
  {
    name: 'Cryoprecipitate',
    lifespan: '1 year frozen at -18°C',
    usage: 'Hypofibrinogenemia, hemophilia A, von Willebrand disease',
    volume: 'Approx. 15-20 mL per unit',
  },
];

export const HowItWorksPage: React.FC = () => {
  const [selectedPersona, setSelectedPersona] = useState<'patient' | 'donor'>('patient');

  return (
    <div className="bg-[#050811] text-slate-100 min-h-screen">
      {/* Hero Header */}
      <section className="relative py-20 border-b border-white/10 bg-gradient-to-b from-[#0B1222] to-[#050811]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-4xl">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#38BDF8] bg-[#38BDF8]/10 border border-[#38BDF8]/20 px-3 py-1 rounded-full mb-6">
            System Architecture & SLA
          </span>
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight mb-6 leading-tight">
            How the Lifnex Emergency <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF2E54] via-[#FF747E] to-[#38BDF8]">
              Coordination Grid Works.
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            From emergency intake to bedside transfusion handshakes in five audited, clinical stages.
          </p>
        </div>
      </section>

      {/* 5-Stage Interactive Timeline */}
      <section className="py-24 border-b border-white/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#FF2E54] bg-[#FF2E54]/10 border border-[#FF2E54]/20 px-3 py-1 rounded-full">
              SLA Execution Sequence
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-4 mb-3">
              The 5-Minute Golden Hour Protocol
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Every phase is executed under strict clinical timeouts and audited event logs.
            </p>
          </div>

          <div className="space-y-8 relative before:absolute before:inset-0 before:left-8 md:before:left-1/2 before:w-0.5 before:bg-white/10 before:-translate-x-1/2">
            {TIMELINE_STEPS.map((step, idx) => {
              const isEven = idx % 2 === 0;
              return (
                <div
                  key={step.phase}
                  className={`relative flex flex-col md:flex-row items-start ${
                    isEven ? 'md:flex-row-reverse' : ''
                  } gap-8`}
                >
                  {/* Central Node Badge */}
                  <div className="absolute left-8 md:left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-[#111827] border-2 border-[#FF2E54] text-white font-bold text-xs flex items-center justify-center shadow-[0_0_15px_rgba(255,46,84,0.5)] z-10">
                    {idx + 1}
                  </div>

                  {/* Card */}
                  <div className={`w-full md:w-[calc(50%-2rem)] pl-16 md:pl-0 ${isEven ? 'md:text-left' : 'md:text-left'}`}>
                    <div className="p-6 sm:p-8 rounded-3xl bg-[#0C1322] border border-white/10 hover:border-red-500/30 transition-all duration-300 shadow-xl">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <span className="text-xs font-black uppercase text-[#FF2E54]">
                          {step.phase} • {step.time}
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          {step.metric}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-1">{step.title}</h3>
                      <div className="text-xs font-semibold text-[#38BDF8] mb-3">
                        Key Actor: {step.actor}
                      </div>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Persona Journey Switcher */}
      <section className="py-20 bg-[#080E1C] border-b border-white/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-[#38BDF8] bg-[#38BDF8]/10 border border-[#38BDF8]/20 px-3 py-1 rounded-full">
              User Experience
            </span>
            <h2 className="text-3xl font-black text-white mt-4 mb-4">
              Your Journey on the Platform
            </h2>
            <div className="inline-flex p-1.5 rounded-2xl bg-[#0D1526] border border-white/10">
              <button
                onClick={() => setSelectedPersona('patient')}
                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  selectedPersona === 'patient'
                    ? 'bg-[#FF2E54] text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                For Patients & Emergency Attendants
              </button>
              <button
                onClick={() => setSelectedPersona('donor')}
                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  selectedPersona === 'donor'
                    ? 'bg-[#FF2E54] text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                For Voluntary Blood Donors
              </button>
            </div>
          </div>

          {selectedPersona === 'patient' ? (
            <div className="p-8 rounded-3xl bg-[#0D1526] border border-white/10 shadow-2xl">
              <h3 className="text-2xl font-bold text-white mb-4">Patient & Attendant Experience</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="p-4 rounded-xl bg-white/5">
                  <div className="text-lg font-black text-[#FF2E54] mb-2">1. Request Desk</div>
                  <p className="text-xs text-slate-300">
                    Submit the hospital name, required units, and urgency. Our AI instantly matches compatible donors.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <div className="text-lg font-black text-[#38BDF8] mb-2">2. Live Telemetry</div>
                  <p className="text-xs text-slate-300">
                    Watch the live status timeline as donors accept and update their in-transit estimated time of arrival.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <div className="text-lg font-black text-emerald-400 mb-2">3. Hospital Handshake</div>
                  <p className="text-xs text-slate-300">
                    The hospital confirms donor arrival, conducts blood cross-matching, and completes transfusion.
                  </p>
                </div>
              </div>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 text-sm font-bold text-[#FF747E] hover:underline"
              >
                <span>Create an Emergency Requisition</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-[#0D1526] border border-white/10 shadow-2xl">
              <h3 className="text-2xl font-bold text-white mb-4">Voluntary Donor Experience</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="p-4 rounded-xl bg-white/5">
                  <div className="text-lg font-black text-[#FF2E54] mb-2">1. Set Availability</div>
                  <p className="text-xs text-slate-300">
                    Toggle your active status on your dashboard. You only receive alerts when you are ready and eligible.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <div className="text-lg font-black text-[#38BDF8] mb-2">2. Review Urgent Alert</div>
                  <p className="text-xs text-slate-300">
                    Receive a verified alert with hospital location, distance, and patient urgency. Accept with one tap.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <div className="text-lg font-black text-emerald-400 mb-2">3. Save a Life</div>
                  <p className="text-xs text-slate-300">
                    Arrive at the accredited hospital, donate under professional supervision, and receive donation badges.
                  </p>
                </div>
              </div>
              <Link
                to="/register?role=donor"
                className="inline-flex items-center gap-2 text-sm font-bold text-[#38BDF8] hover:underline"
              >
                <span>Register as a Voluntary Donor</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Blood Components Reference Guide */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-[#FF747E] bg-[#FF747E]/10 border border-[#FF747E]/20 px-3 py-1 rounded-full">
              Clinical Reference
            </span>
            <h2 className="text-3xl font-black text-white mt-4 mb-3">
              Blood Components & Clinical Indications
            </h2>
            <p className="text-slate-400 text-sm">
              Standard storage requirements and clinical use cases according to blood banking guidelines.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {COMPONENT_GUIDE.map((c) => (
              <div key={c.name} className="p-6 rounded-2xl bg-[#0D1526] border border-white/10">
                <h3 className="text-lg font-bold text-white mb-2">{c.name}</h3>
                <div className="text-xs text-[#38BDF8] font-mono mb-2">Storage: {c.lifespan}</div>
                <div className="text-xs text-slate-300 mb-2">
                  <strong>Indication:</strong> {c.usage}
                </div>
                <div className="text-xs text-slate-400">
                  <strong>Unit Volume:</strong> {c.volume}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
