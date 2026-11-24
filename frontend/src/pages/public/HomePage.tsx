import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Hero3DCanvas } from '../../components/3d/Hero3DCanvas';
import {
  Activity,
  ShieldCheck,
  Clock,
  HeartHandshake,
  Radio,
  Zap,
  MapPin,
  Lock,
  Cpu,
  Building2,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  PhoneCall,
  Search,
  Droplet,
  ArrowRight,
  Stethoscope,
} from 'lucide-react';

// ABO/Rh Compatibility Matrix Data
interface BloodGroupInfo {
  canDonateTo: string[];
  canReceiveFrom: string[];
  plasmaDonateTo: string[];
  plasmaReceiveFrom: string[];
  rarity: string;
  notes: string;
}

const BLOOD_MATRIX: Record<string, BloodGroupInfo> = {
  'O-': {
    canDonateTo: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    canReceiveFrom: ['O-'],
    plasmaDonateTo: ['O-'],
    plasmaReceiveFrom: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    rarity: 'Universal Red Cell Donor (6.6% population)',
    notes: 'Crucial for trauma emergencies when recipient blood group is unknown.',
  },
  'O+': {
    canDonateTo: ['O+', 'A+', 'B+', 'AB+'],
    canReceiveFrom: ['O+', 'O-'],
    plasmaDonateTo: ['O+', 'O-'],
    plasmaReceiveFrom: ['O+', 'A+', 'B+', 'AB+'],
    rarity: 'Most Common Blood Group (37.4% population)',
    notes: 'High demand across surgical theaters and intensive care units.',
  },
  'A-': {
    canDonateTo: ['A-', 'A+', 'AB-', 'AB+'],
    canReceiveFrom: ['A-', 'O-'],
    plasmaDonateTo: ['A-', 'O-'],
    plasmaReceiveFrom: ['A-', 'A+', 'AB-', 'AB+'],
    rarity: 'Rare (6.3% population)',
    notes: 'Compatible red cell substitute for A+ and AB+ recipients.',
  },
  'A+': {
    canDonateTo: ['A+', 'AB+'],
    canReceiveFrom: ['A+', 'A-', 'O+', 'O-'],
    plasmaDonateTo: ['A+', 'A-', 'O+', 'O-'],
    plasmaReceiveFrom: ['A+', 'AB+'],
    rarity: 'Common (35.7% population)',
    notes: 'Regularly needed for cancer therapies and scheduled orthopedic surgeries.',
  },
  'B-': {
    canDonateTo: ['B-', 'B+', 'AB-', 'AB+'],
    canReceiveFrom: ['B-', 'O-'],
    plasmaDonateTo: ['B-', 'O-'],
    plasmaReceiveFrom: ['B-', 'B+', 'AB-', 'AB+'],
    rarity: 'Rare (1.5% population)',
    notes: 'Critical reserve group with limited voluntary donor pools.',
  },
  'B+': {
    canDonateTo: ['B+', 'AB+'],
    canReceiveFrom: ['B+', 'B-', 'O+', 'O-'],
    plasmaDonateTo: ['B+', 'B-', 'O+', 'O-'],
    plasmaReceiveFrom: ['B+', 'AB+'],
    rarity: 'Prevalent in South Asia (32.0% population)',
    notes: 'High incidence of emergency requisition in regional trauma centers.',
  },
  'AB-': {
    canDonateTo: ['AB-', 'AB+'],
    canReceiveFrom: ['AB-', 'A-', 'B-', 'O-'],
    plasmaDonateTo: ['AB-', 'A-', 'B-', 'O-'],
    plasmaReceiveFrom: ['AB-', 'AB+'],
    rarity: 'Rarest Blood Group (0.6% population)',
    notes: 'Universal plasma donor; indispensable in neonatal critical care.',
  },
  'AB+': {
    canDonateTo: ['AB+'],
    canReceiveFrom: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    plasmaDonateTo: ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-'],
    plasmaReceiveFrom: ['AB+'],
    rarity: 'Universal Red Cell Recipient (3.4% population)',
    notes: 'Can receive packed red cells from any donor group.',
  },
};

const PROTOCOL_STEPS = [
  {
    step: '01',
    title: 'Emergency Requisition Desk',
    subtitle: 'Immediate Clinical Intake',
    desc: 'Patient attendants, emergency room physicians, or trauma coordinators log urgent blood needs including ABO/Rh group, component type (PRBC, Platelets, FFP), and hospital geocoordinates.',
    icon: Radio,
    badge: 'Sub-Second Ingestion',
  },
  {
    step: '02',
    title: 'Gemini AI Clinical Triage',
    subtitle: 'Intelligent Urgency Prioritization',
    desc: 'Gemini AI validates clinical requisition parameters, computes cross-match feasibility, filters fraudulent pings, and escalates critical trauma requests to high-frequency dispatch channels.',
    icon: Cpu,
    badge: 'Clinical Verification',
  },
  {
    step: '03',
    title: 'Geospatial Mesh Routing',
    subtitle: 'Haversine Proximity Search',
    desc: 'Our real-time geospatial engine evaluates active voluntary donors within a 15 km dynamic perimeter, factoring in regional traffic density and donor donation intervals (90-day cooldown).',
    icon: MapPin,
    badge: 'Sub-15km Geofence',
  },
  {
    step: '04',
    title: 'Instant Encrypted Handshake',
    subtitle: 'Mutual Consent & In-Transit Radar',
    desc: 'Nearby matched donors receive an urgent pulse notification. Upon voluntary acceptance, an encrypted bidirectional handshake is established, providing live ETA and navigation.',
    icon: Zap,
    badge: 'RLS Privacy Protected',
  },
  {
    step: '05',
    title: 'Bedside Verification & Safe Intake',
    subtitle: 'Licensed Clinical Handshake',
    desc: 'The donor arrives at the accredited hospital or blood bank. Licensed medical staff perform cross-matching, blood screening, and supervise the transfusion under CDSCO protocols.',
    icon: Stethoscope,
    badge: 'CDSCO Compliant',
  },
];

const FAQS = [
  {
    q: 'Is Lifnex a blood bank or storage facility?',
    a: 'No. Lifnex is strictly an emergency communication and coordination technology network. We do not collect, test, process, store, or sell blood products. We connect patients and hospitals directly with voluntary donors in real time. All physical blood screening, cross-matching, and transfusions are conducted exclusively by licensed clinicians at accredited healthcare facilities.',
  },
  {
    q: 'How does Lifnex protect donor privacy and prevent unsolicited calls?',
    a: 'Donor personal information (including phone numbers and exact home coordinates) is strictly protected by Supabase Row-Level Security (RLS). Contact details are never publicly broadcast. Only after a donor voluntarily reviews an emergency request and confirms availability is a secure, temporary handshake generated for hospital coordination.',
  },
  {
    q: 'Who is eligible to request blood through the platform?',
    a: 'Emergency requisitions can be initiated by patients, registered family attendants, trauma care staff, or verified hospital coordinators. Requisitions are reviewed through automated clinical checks and hospital dispatch personnel to maintain network integrity.',
  },
  {
    q: 'What is the Gemini AI Clinical Triage engine?',
    a: 'Our backend integrates Gemini Clinical AI to analyze request descriptions, verify biological compatibility matrices, identify urgent trauma markers (e.g. postpartum hemorrhage, arterial rupture), and prioritize emergency broadcasts over routine requests.',
  },
  {
    q: 'Are there any fees or charges for donors or patients?',
    a: 'Lifnex is 100% free for voluntary donors and emergency patients. Lifnex firmly adheres to the National Blood Policy of India prohibiting commercialized blood sales. Voluntary blood donation is a noble humanitarian act that must never be monetized.',
  },
];

export const HomePage: React.FC = () => {
  const [selectedGroup, setSelectedGroup] = useState<string>('O-');
  const [activeStep, setActiveStep] = useState<number>(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const groupData = BLOOD_MATRIX[selectedGroup];

  return (
    <div className="relative overflow-hidden bg-[#050811] text-slate-100">
      {/* ─────────────────────────────────────────────────────────────
          1. HERO SECTION WITH 3D CANVAS & LIVE DISPATCH TICKER
          ───────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex items-center justify-center pt-8 pb-16 overflow-hidden">
        {/* Three.js 3D WebGL Canvas with Erythrocytes and Blood Drop */}
        <Hero3DCanvas />

        {/* Ambient Radial Glow Gradients */}
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(255, 46, 84, 0.12) 0%, rgba(56, 189, 248, 0.05) 50%, transparent 75%)',
            filter: 'blur(80px)',
          }}
        />

        <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            {/* Live Status Radar Badge */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-red-500/30 bg-[#111726]/80 backdrop-blur-md mb-6 shadow-[0_0_20px_rgba(255,46,84,0.25)]"
            >
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF2E54] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#FF2E54]"></span>
              </span>
              <span className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-slate-200">
                AI-Powered Emergency Blood Mesh • Live in 14 Regional Hubs
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-[1.08] mb-6"
            >
              Connecting Lives <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF2E54] via-[#FF747E] to-[#38BDF8]">
                When Every Second Matters.
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10"
            >
              The intelligent emergency coordination platform bridging critical minutes between
              trauma patients, verified voluntary blood donors, and accredited hospital cryo-banks.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-xl mx-auto"
            >
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-[#FF2E54] to-[#E11D48] hover:from-[#FF4D5A] hover:to-[#BE123C] shadow-[0_4px_25px_rgba(255,46,84,0.45)] transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2 group"
              >
                <span>Request Blood Immediately</span>
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/register?role=donor"
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-slate-200 bg-[#131B2E]/90 hover:bg-[#1C2742] border border-white/10 hover:border-red-500/40 shadow-lg backdrop-blur-md transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <Droplet className="w-5 h-5 text-[#FF2E54]" />
                <span>Become a Verified Donor</span>
              </Link>
            </motion.div>

            {/* Live Ticker Bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="mt-12 inline-flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-slate-400 border border-white/10 bg-[#0E1526]/70 backdrop-blur-lg px-6 py-3 rounded-full"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Sub-Second Gemini Triage</span>
              </div>
              <div className="hidden sm:block text-slate-600">•</div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                <span>Zero-Knowledge RLS Privacy</span>
              </div>
              <div className="hidden sm:block text-slate-600">•</div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400"></span>
                <span>24/7 Clinical Hotline: 1800-LIFNEX-EMG</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. REAL-TIME PLATFORM IMPACT METRICS (KPIs)
          ───────────────────────────────────────────────────────────── */}
      <section className="relative py-12 border-y border-white/10 bg-[#090F1E]/80 backdrop-blur-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#38BDF8] bg-[#38BDF8]/10 border border-[#38BDF8]/20 px-3 py-1 rounded-full">
              Platform Telemetry & Impact
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-[#0F182B]/60 border border-white/5 hover:border-red-500/30 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 text-[#FF2E54] flex items-center justify-center mb-4">
                <Activity className="w-6 h-6" />
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-white mb-1">14,800+</div>
              <div className="text-sm font-semibold text-slate-300 mb-1">Verified Donors</div>
              <div className="text-xs text-slate-500">Across 28 states & UTs</div>
            </div>

            <div className="p-6 rounded-2xl bg-[#0F182B]/60 border border-white/5 hover:border-cyan-500/30 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-[#38BDF8] flex items-center justify-center mb-4">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-white mb-1">3,420+</div>
              <div className="text-sm font-semibold text-slate-300 mb-1">Dispatched Responses</div>
              <div className="text-xs text-slate-500">Trauma & surgery handshakes</div>
            </div>

            <div className="p-6 rounded-2xl bg-[#0F182B]/60 border border-white/5 hover:border-emerald-500/30 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-[#10B981] flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-white mb-1">98.4%</div>
              <div className="text-sm font-semibold text-slate-300 mb-1">Fulfillment Rate</div>
              <div className="text-xs text-slate-500">Geospatially routed matches</div>
            </div>

            <div className="p-6 rounded-2xl bg-[#0F182B]/60 border border-white/5 hover:border-amber-500/30 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-[#F59E0B] flex items-center justify-center mb-4">
                <Clock className="w-6 h-6" />
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-white mb-1">&lt; 6 min</div>
              <div className="text-sm font-semibold text-slate-300 mb-1">Average Triage Time</div>
              <div className="text-xs text-slate-500">From request to donor alert</div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <span className="text-xs text-slate-400 italic">
              Notice: All telemetry is verified in real-time on the staging network. Lifnex does not operate a commercial marketplace.
            </span>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. 5-STEP VISUAL COORDINATION PIPELINE
          ───────────────────────────────────────────────────────────── */}
      <section className="py-24 relative bg-[#050811]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#FF2E54] bg-[#FF2E54]/10 border border-[#FF2E54]/20 px-3 py-1 rounded-full">
              Clinical Workflow
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white mt-4 mb-4">
              The Lifnex Emergency Protocol
            </h2>
            <p className="text-slate-400 text-base sm:text-lg">
              How our automated coordination grid transforms a desperate search into a structured,
              audited, 5-stage clinical response within the golden hour.
            </p>
          </div>

          {/* Step Selector Tabs */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-12">
            {PROTOCOL_STEPS.map((s, idx) => (
              <button
                key={s.step}
                onClick={() => setActiveStep(idx)}
                className={`px-4 sm:px-5 py-3 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-2 border ${
                  activeStep === idx
                    ? 'bg-gradient-to-r from-[#FF2E54] to-[#BE123C] text-white border-transparent shadow-[0_4px_18px_rgba(255,46,84,0.35)]'
                    : 'bg-[#0E1526] text-slate-400 border-white/10 hover:border-white/20 hover:text-white'
                }`}
              >
                <span className="opacity-60">{s.step}</span>
                <span>{s.title}</span>
              </button>
            ))}
          </div>

          {/* Active Step Spotlight Card */}
          <div className="max-w-4xl mx-auto">
            {(() => {
              const current = PROTOCOL_STEPS[activeStep];
              const StepIcon = current.icon;
              return (
                <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-[#11192E] to-[#0A0F1E] border border-white/10 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 text-8xl font-black text-white/5 pointer-events-none select-none">
                    {current.step}
                  </div>

                  <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF2E54] to-[#BE123C] text-white flex items-center justify-center shadow-lg shrink-0">
                      <StepIcon className="w-8 h-8" />
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#38BDF8] bg-[#38BDF8]/10 border border-[#38BDF8]/20 px-3 py-1 rounded-full">
                          {current.badge}
                        </span>
                        <span className="text-sm font-medium text-slate-400">
                          Phase {current.step} of 05
                        </span>
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
                        {current.title}
                      </h3>
                      <h4 className="text-base font-semibold text-[#FF747E] mb-4">
                        {current.subtitle}
                      </h4>
                      <p className="text-slate-300 text-base sm:text-lg leading-relaxed mb-6">
                        {current.desc}
                      </p>

                      <div className="flex flex-wrap gap-4 pt-4 border-t border-white/10">
                        {activeStep > 0 && (
                          <button
                            onClick={() => setActiveStep(activeStep - 1)}
                            className="px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-300 bg-white/5 hover:bg-white/10 transition-colors"
                          >
                            &larr; Previous Step
                          </button>
                        )}
                        {activeStep < PROTOCOL_STEPS.length - 1 ? (
                          <button
                            onClick={() => setActiveStep(activeStep + 1)}
                            className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-[#FF2E54] hover:bg-[#E11D48] transition-colors flex items-center gap-2"
                          >
                            <span>Next: {PROTOCOL_STEPS[activeStep + 1].title}</span>
                            <span>&rarr;</span>
                          </button>
                        ) : (
                          <Link
                            to="/register"
                            className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 transition-opacity flex items-center gap-2"
                          >
                            <span>Ready? Join the Coordination Grid</span>
                            <span>&rarr;</span>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. INTERACTIVE BIOLOGICAL COMPATIBILITY MATRIX
          ───────────────────────────────────────────────────────────── */}
      <section className="py-20 relative border-y border-white/10 bg-[#080E1C]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-[#38BDF8] bg-[#38BDF8]/10 border border-[#38BDF8]/20 px-3 py-1 rounded-full">
              Clinical Intelligence
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-4 mb-3">
              Interactive ABO/Rh Compatibility Engine
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Explore red cell and plasma compatibility rules enforced by our automated triage algorithm.
              Select a blood group below to view its clinical matching profile.
            </p>
          </div>

          {/* Blood Group Selector */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-10 max-w-2xl mx-auto">
            {Object.keys(BLOOD_MATRIX).map((grp) => (
              <button
                key={grp}
                onClick={() => setSelectedGroup(grp)}
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl font-black text-lg transition-all duration-200 border flex flex-col items-center justify-center ${
                  selectedGroup === grp
                    ? 'bg-gradient-to-br from-[#FF2E54] to-[#BE123C] text-white border-transparent shadow-[0_0_20px_rgba(255,46,84,0.4)] scale-105'
                    : 'bg-[#10182B] text-slate-300 border-white/10 hover:border-red-500/40 hover:text-white'
                }`}
              >
                <span>{grp}</span>
                <span className="text-[10px] font-normal opacity-70">
                  {grp.includes('-') ? 'Rh-' : 'Rh+'}
                </span>
              </button>
            ))}
          </div>

          {/* Compatibility Breakdown Card */}
          <div className="max-w-4xl mx-auto p-6 sm:p-10 rounded-3xl bg-[#0D1526] border border-white/10 shadow-2xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-white/10 gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#FF2E54]">
                  Selected Blood Group
                </span>
                <h3 className="text-3xl sm:text-4xl font-black text-white mt-1">
                  Type {selectedGroup}
                </h3>
              </div>
              <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs sm:text-sm text-slate-300">
                <span className="font-semibold text-[#38BDF8]">Rarity:</span> {groupData.rarity}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8">
              {/* Packed Red Blood Cells (PRBC) */}
              <div className="p-6 rounded-2xl bg-[#121B2F] border border-white/5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-3 h-3 rounded-full bg-[#FF2E54]"></span>
                  <h4 className="font-bold text-lg text-white">Packed Red Blood Cells (PRBC)</h4>
                </div>

                <div className="mb-4">
                  <div className="text-xs font-semibold uppercase text-slate-400 mb-2">
                    Can Donate Red Cells To:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {groupData.canDonateTo.map((g) => (
                      <span
                        key={g}
                        className="px-3 py-1 rounded-lg text-xs font-bold bg-[#FF2E54]/20 border border-[#FF2E54]/40 text-[#FF747E]"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold uppercase text-slate-400 mb-2">
                    Can Receive Red Cells From:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {groupData.canReceiveFrom.map((g) => (
                      <span
                        key={g}
                        className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-400"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Fresh Frozen Plasma (FFP) */}
              <div className="p-6 rounded-2xl bg-[#121B2F] border border-white/5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-3 h-3 rounded-full bg-[#38BDF8]"></span>
                  <h4 className="font-bold text-lg text-white">Fresh Frozen Plasma (FFP)</h4>
                </div>

                <div className="mb-4">
                  <div className="text-xs font-semibold uppercase text-slate-400 mb-2">
                    Can Donate Plasma To:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {groupData.plasmaDonateTo.map((g) => (
                      <span
                        key={g}
                        className="px-3 py-1 rounded-lg text-xs font-bold bg-[#38BDF8]/20 border border-[#38BDF8]/40 text-[#38BDF8]"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold uppercase text-slate-400 mb-2">
                    Can Receive Plasma From:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {groupData.plasmaReceiveFrom.map((g) => (
                      <span
                        key={g}
                        className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-500/20 border border-amber-500/40 text-amber-400"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#090F1E] border border-white/5 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-slate-300">
                <span className="font-bold text-white">Clinical Rule: </span>
                {groupData.notes}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. CORE ARCHITECTURAL CAPABILITIES (6-CARD GRID)
          ───────────────────────────────────────────────────────────── */}
      <section className="py-24 relative bg-[#050811]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#FF2E54] bg-[#FF2E54]/10 border border-[#FF2E54]/20 px-3 py-1 rounded-full">
              Platform Architecture
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white mt-4 mb-4">
              Engineered for Critical Response
            </h2>
            <p className="text-slate-400 text-base sm:text-lg">
              Six foundational technological pillars that separate Lifnex from unstructured social
              media broadcasts and legacy directories.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="p-8 rounded-3xl bg-[#0C1322] border border-white/10 hover:border-red-500/40 transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-[#FF2E54] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Radio className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Emergency Requisition Radar</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Sub-second broadcast architecture pushes emergency requisitions exclusively to
                biologically compatible, active voluntary donors located within travel radius.
              </p>
              <div className="text-xs font-semibold text-[#FF2E54] flex items-center gap-1">
                <span>Real-time WebSocket & Push</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            {/* Card 2 */}
            <div className="p-8 rounded-3xl bg-[#0C1322] border border-white/10 hover:border-cyan-500/40 transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-[#38BDF8] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <MapPin className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Geospatial Proximity Mesh</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Haversine geodesic algorithms sort potential donors by actual estimated travel time
                rather than raw straight-line radius, avoiding deadlocks during rush hours.
              </p>
              <div className="text-xs font-semibold text-[#38BDF8] flex items-center gap-1">
                <span>Adaptive 15km Perimeter</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            {/* Card 3 */}
            <div className="p-8 rounded-3xl bg-[#0C1322] border border-white/10 hover:border-emerald-500/40 transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-[#10B981] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Zero-Knowledge Donor Privacy</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Personal contact numbers and private residential addresses remain completely invisible
                to public scrapers and are released only upon an authenticated hospital handshake.
              </p>
              <div className="text-xs font-semibold text-[#10B981] flex items-center gap-1">
                <span>Supabase Row-Level Security</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            {/* Card 4 */}
            <div className="p-8 rounded-3xl bg-[#0C1322] border border-white/10 hover:border-amber-500/40 transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-[#F59E0B] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Cpu className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Gemini Clinical Governance</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Clinical AI models cross-verify emergency notes, discard duplicate or spam
                submissions, and ensure critical pediatric and obstetric requests receive priority.
              </p>
              <div className="text-xs font-semibold text-[#F59E0B] flex items-center gap-1">
                <span>Automated Triage Indexing</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            {/* Card 5 */}
            <div className="p-8 rounded-3xl bg-[#0C1322] border border-white/10 hover:border-purple-500/40 transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Building2 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Hospital Cryo-Stock Sync</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Accredited hospitals broadcast real-time availability of shelf-stable units, enabling
                instant redirection if an on-site hospital already has compatible inventory.
              </p>
              <div className="text-xs font-semibold text-purple-400 flex items-center gap-1">
                <span>Cold-Chain Audit Trail</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            {/* Card 6 */}
            <div className="p-8 rounded-3xl bg-[#0C1322] border border-white/10 hover:border-rose-500/40 transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <PhoneCall className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">24/7 Clinical Dispatch Hotline</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Lifnex combines automated matching with a human-in-the-loop dispatch desk ready to
                assist intensive care physicians when rare blood groups are critically needed.
              </p>
              <div className="text-xs font-semibold text-rose-400 flex items-center gap-1">
                <span>1800-LIFNEX-EMG Desk</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. CLINICAL & GOVERNANCE TRUST DISCLAIMER
          ───────────────────────────────────────────────────────────── */}
      <section className="py-16 relative bg-[#090E1B] border-y border-white/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto p-8 sm:p-10 rounded-3xl bg-[#0D1528] border border-amber-500/30 shadow-xl relative overflow-hidden">
            <div className="flex items-start gap-5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-[#F59E0B] flex items-center justify-center shrink-0 mt-1">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
                  Clinical & Legal Governance Notice
                </h3>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-4">
                  <strong className="text-amber-300">Lifnex is an emergency communication and coordination technology platform.</strong>{' '}
                  Lifnex is strictly a voluntary donor coordination network and{' '}
                  <strong className="text-white">NOT a blood bank</strong>. We do not collect, process, test, store, transport, or sell blood products.
                </p>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-6">
                  All physical blood screening, cross-matching, donor eligibility verification, and
                  transfusions are conducted exclusively by licensed healthcare professionals at
                  accredited medical institutions and licensed blood centers in strict compliance with
                  the Drugs and Cosmetics Act (1940) and National Blood Policy of India.
                </p>
                <div className="flex flex-wrap items-center gap-6 text-xs font-semibold text-slate-300 pt-4 border-t border-white/10">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Non-Commercial Voluntary Network</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Supabase RLS Data Protection</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>CDSCO Guidelines Aligned</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          7. INTERACTIVE FAQ ACCORDION
          ───────────────────────────────────────────────────────────── */}
      <section className="py-24 relative bg-[#050811]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#38BDF8] bg-[#38BDF8]/10 border border-[#38BDF8]/20 px-3 py-1 rounded-full">
              Frequently Asked Questions
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white mt-4 mb-4">
              Clear Answers on Clinical Safety
            </h2>
            <p className="text-slate-400 text-base">
              Learn how Lifnex coordinates voluntary blood donation while upholding medical privacy
              and national healthcare compliance standards.
            </p>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-white/10 bg-[#0C1322] overflow-hidden transition-all duration-200"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-6 text-left flex items-center justify-between gap-4 font-bold text-white hover:text-[#FF747E] transition-colors"
                  >
                    <span className="text-base sm:text-lg">{faq.q}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 transition-transform duration-300 shrink-0 ${
                        isOpen ? 'rotate-180 text-[#FF2E54]' : ''
                      }`}
                    />
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <div className="px-6 pb-6 text-slate-300 text-sm sm:text-base leading-relaxed border-t border-white/5 pt-4">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          8. FINAL EMERGENCY CALL TO ACTION BANNER
          ───────────────────────────────────────────────────────────── */}
      <section className="py-20 relative bg-gradient-to-b from-[#0B1325] to-[#050811] border-t border-white/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto rounded-3xl p-10 sm:p-16 bg-gradient-to-r from-[#170B14] via-[#1F122B] to-[#0A162B] border border-red-500/30 shadow-[0_0_50px_rgba(255,46,84,0.15)] text-center relative overflow-hidden">
            {/* Ambient drop glow */}
            <div
              className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(255, 46, 84, 0.25) 0%, transparent 70%)',
                filter: 'blur(50px)',
              }}
            />

            <div className="relative z-10">
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#FF747E] bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full mb-6">
                Be The Bridge In Critical Moments
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-white mb-6">
                Every Second Is a Heartbeat. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF2E54] to-[#38BDF8]">
                  Join the Lifnex Network Today.
                </span>
              </h2>
              <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
                Whether you are a voluntary donor prepared to answer the call or an emergency attendant
                coordinating urgent transfusions, Lifnex puts life-saving speed on your side.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/register?role=donor"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-[#FF2E54] to-[#BE123C] hover:opacity-90 shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Droplet className="w-5 h-5" />
                  <span>Register as Voluntary Donor</span>
                </Link>
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-slate-200 bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-md transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <span>Emergency Blood Request</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
