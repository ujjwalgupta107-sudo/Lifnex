import React from 'react';
import { Link } from 'react-router-dom';
import { Droplet, PhoneCall, ShieldCheck, Heart, AlertTriangle } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#04060D] border-t border-white/10 text-slate-400 pt-16 pb-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF2E54] to-[#BE123C] flex items-center justify-center shadow-[0_0_15px_rgba(255,46,84,0.4)]">
                <Droplet className="w-5 h-5 text-white fill-white" />
              </div>
              <span className="text-xl font-black tracking-tight text-white leading-none">
                LIFNEX
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Connecting lives when every second matters. India's AI-powered emergency blood coordination platform connecting trauma patients, voluntary donors, and accredited cryo-banks with sub-second precision.
            </p>
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Protected by PostgreSQL Row-Level Security (RLS)</span>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Platform & Triage
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/register" className="hover:text-white transition-colors">
                  Request Emergency Blood
                </Link>
              </li>
              <li>
                <Link to="/register?role=donor" className="hover:text-white transition-colors">
                  Become a Voluntary Donor
                </Link>
              </li>
              <li>
                <Link to="/hospitals" className="hover:text-white transition-colors">
                  Accredited Hospital Network
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-white transition-colors">
                  5-Minute Golden Hour Protocol
                </Link>
              </li>
            </ul>
          </div>

          {/* Clinical Governance */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Governance & Safety
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  Clinical Architecture
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  CDSCO Regulatory Alignment
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  Clinical Advisory Board
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  Zero-Monetization Charter
                </Link>
              </li>
            </ul>
          </div>

          {/* Emergency Escalation */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#FF747E] mb-4">
              Emergency Dispatch
            </h4>
            <div className="space-y-3">
              <div>
                <div className="text-2xl font-black text-[#FF2E54] tracking-tight">
                  1800-LIFNEX-EMG
                </div>
                <div className="text-[11px] text-slate-400 font-mono">Toll-free 24/7 Desk</div>
              </div>
              <p className="text-xs text-slate-400">
                Direct clinical support line for rare blood units and critical trauma requisitions.
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#38BDF8] hover:underline"
              >
                <span>Open Communications Desk</span>
                <span>&rarr;</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Regulatory Governance Disclaimer */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-[11px] text-slate-400 leading-relaxed mb-8 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-300">Statutory Notice: </strong>
            Lifnex is an academic and technology coordination platform connecting voluntary blood donors with licensed healthcare providers. Lifnex is strictly a coordination network and NOT a blood bank. We do not store, collect, cross-match, or sell blood products. Transfusion safety and blood testing are executed exclusively by licensed physicians at accredited blood centers under the Drugs and Cosmetics Act (1940).
          </div>
        </div>

        {/* Bottom Credits */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>&copy; {new Date().getFullYear()} Lifnex Healthcare Network. All rights reserved.</div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Powered by Gemini Clinical AI</span>
            <span>•</span>
            <span>React Three Fiber WebGL</span>
            <span>•</span>
            <span>Supabase RLS</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
