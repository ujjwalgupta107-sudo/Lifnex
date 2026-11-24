import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Heart,
  Activity,
  Users,
  Award,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Lock,
  ArrowRight,
  Droplet,
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="bg-[#050811] text-slate-100 min-h-screen">
      {/* Hero Header */}
      <section className="relative py-20 border-b border-white/10 bg-gradient-to-b from-[#0B1222] to-[#050811] overflow-hidden">
        <div
          className="absolute top-0 right-1/4 w-96 h-96 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(255, 46, 84, 0.15) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center max-w-4xl">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#FF2E54] bg-[#FF2E54]/10 border border-[#FF2E54]/20 px-3 py-1 rounded-full mb-6">
            Purpose & Clinical Architecture
          </span>
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight mb-6 leading-tight">
            Bridging Critical Minutes <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF2E54] via-[#FF747E] to-[#38BDF8]">
              In Blood Emergencies.
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            When a life is on the line, technological delays and geographic confusion should never
            stand between a trauma patient and a compatible voluntary blood donor.
          </p>
        </div>
      </section>

      {/* Core Philosophy Section with Real Medical Image */}
      <section className="py-20 border-b border-white/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#38BDF8] bg-[#38BDF8]/10 border border-[#38BDF8]/20 px-3 py-1 rounded-full">
                The Lifnex Mission
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-4 mb-6 leading-snug">
                Why Sub-Second Coordination Saves Human Lives
              </h2>
              <p className="text-slate-300 text-base leading-relaxed mb-4">
                During major trauma surgeries, acute postpartum hemorrhages, and pediatric emergencies,
                packed red blood cells and platelets are strictly time-bound. A 30-minute delay in transfusion
                can dramatically decrease survival probabilities.
              </p>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Legacy blood request channels rely on chaotic social media group forwards. This leads to
                incompatible donors rushing to distant hospitals, panic, and wasted golden hours.
                Lifnex was engineered to replace chaos with a verified, audited, geospatial intelligence
                network.
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-300">
                    <strong>Zero Monetization:</strong> 100% voluntary, strictly prohibiting commercial blood transactions.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-300">
                    <strong>Clinical Governance:</strong> Strict adherence to National Blood Policy & CDSCO protocols.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-300">
                    <strong>Privacy by Default:</strong> Donor contact details sealed until mutual voluntary handshake.
                  </span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative">
                <img
                  src="/static/assets/images/compatibility-lab.jpg"
                  alt="Clinical Compatibility Testing"
                  className="w-full h-80 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050811] via-transparent to-transparent"></div>
              </div>
              <div className="mt-4 p-4 rounded-2xl bg-[#0F182B] border border-amber-500/30 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-200/90 leading-relaxed">
                  <strong>Clinical Boundary Notice:</strong> Lifnex coordinates communication between verified voluntary donors and hospitals. Transfusions and cross-matching are conducted exclusively by licensed medical personnel at accredited healthcare facilities.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Pillars of Excellence */}
      <section className="py-24 bg-[#080E1C] border-b border-white/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#FF2E54] bg-[#FF2E54]/10 border border-[#FF2E54]/20 px-3 py-1 rounded-full">
              System Foundations
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-4 mb-4">
              The Four Pillars of Lifnex
            </h2>
            <p className="text-slate-400 text-base">
              Engineered with medical rigor, mathematical precision, and uncompromising digital security.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-8 rounded-3xl bg-[#0D1526] border border-white/10">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 text-[#FF2E54] flex items-center justify-center mb-6">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Golden Hour Speed</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Triage response latency under 6 minutes. Instant push notification to verified donors within a 15km perimeter.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-[#0D1526] border border-white/10">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-[#38BDF8] flex items-center justify-center mb-6">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Biological Rigor</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Strict ABO/Rh compatibility indexing. Cross-match verification prevents mismatched donor dispatches.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-[#0D1526] border border-white/10">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-[#10B981] flex items-center justify-center mb-6">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Zero-Knowledge RLS</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                PostgreSQL Row-Level Security encrypts donor numbers and private addresses against public harvesting.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-[#0D1526] border border-white/10">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-[#F59E0B] flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Hospital Accreditation</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every receiving trauma center and cryo-bank is vetted by platform administrators before intake verification.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Clinical Verification Showcase */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
              <img
                src="/static/assets/images/clinical-verification.jpg"
                alt="Clinical Verification and Hospital Transfusion"
                className="w-full h-80 object-cover"
              />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#FF747E] bg-[#FF747E]/10 border border-[#FF747E]/20 px-3 py-1 rounded-full">
                Regulatory Alignment
              </span>
              <h2 className="text-3xl font-extrabold text-white mt-4 mb-4">
                Upholding the National Blood Policy
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">
                India's National Blood Policy firmly prohibits the commercialization of blood donation. Lifnex exists solely as an academic and technological humanitarian coordination mesh to connect voluntary, uncompensated blood donors with accredited facilities.
              </p>
              <p className="text-slate-400 text-xs leading-relaxed mb-6">
                Through real-time tracking, audited handshake protocols, and automated cooldown intervals (90 days for whole blood donations), Lifnex promotes donor well-being while maximizing emergency availability.
              </p>
              <div className="flex gap-4">
                <Link
                  to="/register?role=donor"
                  className="px-6 py-3 rounded-xl font-bold text-white bg-[#FF2E54] hover:bg-[#E11D48] transition-colors flex items-center gap-2 text-sm"
                >
                  <Droplet className="w-4 h-4" />
                  <span>Join Voluntary Registry</span>
                </Link>
                <Link
                  to="/hospitals"
                  className="px-6 py-3 rounded-xl font-bold text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-sm"
                >
                  <span>Hospital Directory</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
