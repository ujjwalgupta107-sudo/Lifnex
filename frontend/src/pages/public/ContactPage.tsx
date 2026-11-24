import React, { useState } from 'react';
import {
  PhoneCall,
  Mail,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Send,
  Building2,
  ShieldAlert,
} from 'lucide-react';

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    category: 'Emergency Clinical Dispatch',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="bg-[#050811] text-slate-100 min-h-screen">
      {/* Hero Header */}
      <section className="relative py-20 border-b border-white/10 bg-gradient-to-b from-[#0B1222] to-[#050811]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-4xl">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#FF2E54] bg-[#FF2E54]/10 border border-[#FF2E54]/20 px-3 py-1 rounded-full mb-6">
            24/7 Clinical Communications Desk
          </span>
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight mb-6 leading-tight">
            Emergency Dispatch & <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF2E54] via-[#FF747E] to-[#38BDF8]">
              Institutional Support.
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Reach the Lifnex emergency coordination officers, hospital integration engineers, and clinical compliance desk.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          {/* Urgent Warning Banner */}
          <div className="mb-12 p-5 rounded-2xl bg-[#170E1A] border border-red-500/30 flex items-start gap-4">
            <ShieldAlert className="w-6 h-6 text-[#FF2E54] shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-slate-300">
              <strong className="text-white">Active Life-Threatening Trauma Notice: </strong>
              If you or a patient are in immediate cardiac or hemorrhagic shock, always call national ambulance services (112 or 108) or proceed to the nearest trauma emergency department immediately. Lifnex provides voluntary donor coordination alongside clinical care.
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left: Contact Channels */}
            <div className="space-y-6">
              {/* Emergency Hotline Card */}
              <div className="p-8 rounded-3xl bg-[#0D1526] border border-red-500/40 shadow-[0_0_30px_rgba(255,46,84,0.15)]">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-[#FF2E54] flex items-center justify-center mb-4">
                  <PhoneCall className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold uppercase tracking-wider text-[#FF747E] mb-1">
                  24/7 Trauma Escalation Hotline
                </div>
                <div className="text-3xl sm:text-4xl font-black text-white mb-2">
                  1800-LIFNEX-EMG
                </div>
                <div className="text-xs font-mono text-slate-400 mb-4">Toll-free across India • (1800-543-639)</div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Direct line to our human-in-the-loop clinical dispatch desk for rare blood group requisition support and inter-hospital logistics.
                </p>
              </div>

              {/* Department Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-6 rounded-2xl bg-[#0C1322] border border-white/10">
                  <Mail className="w-6 h-6 text-[#38BDF8] mb-3" />
                  <h4 className="font-bold text-white text-sm mb-1">Clinical Desk</h4>
                  <div className="text-xs font-mono text-[#38BDF8] mb-2">clinical@lifnex.org</div>
                  <p className="text-xs text-slate-400">Physician inquiries and triage consultation.</p>
                </div>

                <div className="p-6 rounded-2xl bg-[#0C1322] border border-white/10">
                  <Building2 className="w-6 h-6 text-emerald-400 mb-3" />
                  <h4 className="font-bold text-white text-sm mb-1">Hospital Integration</h4>
                  <div className="text-xs font-mono text-emerald-400 mb-2">hospital@lifnex.org</div>
                  <p className="text-xs text-slate-400">Cryo-reserve sync and accreditation desk.</p>
                </div>
              </div>

              {/* Office Address */}
              <div className="p-6 rounded-2xl bg-[#0C1322] border border-white/10 flex items-start gap-4">
                <MapPin className="w-6 h-6 text-[#FF2E54] shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-white text-sm mb-1">Central Coordination Hub</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Lifnex Emergency Health Network <br />
                    Cyber-Med Technology Centre, Hazratganj <br />
                    Lucknow, Uttar Pradesh - 226001, India
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Message Form */}
            <div className="p-8 sm:p-10 rounded-3xl bg-[#0D1526] border border-white/10 shadow-2xl">
              <h3 className="text-2xl font-bold text-white mb-2">Transmit a Message</h3>
              <p className="text-xs sm:text-sm text-slate-400 mb-6">
                Fill out the transmission form below. All urgent dispatches are routed with high priority.
              </p>

              {submitted ? (
                <div className="p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                  <h4 className="text-lg font-bold text-white mb-2">Transmission Acknowledged</h4>
                  <p className="text-xs text-slate-300 leading-relaxed mb-6">
                    Your inquiry has been logged in the dispatch queue. A coordination officer will respond via email or phone within 15 minutes.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({
                        name: '',
                        email: '',
                        phone: '',
                        category: 'Emergency Clinical Dispatch',
                        message: '',
                      });
                    }}
                    className="px-6 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                  >
                    Submit Another Query
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Dr. Rajesh Mehra"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#FF2E54]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Official Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="mehra@apollo.org"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#FF2E54]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Contact Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#FF2E54]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Inquiry Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-[#111A2E] border border-white/10 text-white text-sm focus:outline-none focus:border-[#FF2E54]"
                    >
                      <option value="Emergency Clinical Dispatch">Emergency Clinical Dispatch</option>
                      <option value="Hospital & Cryo-Bank Accreditation">Hospital & Cryo-Bank Accreditation</option>
                      <option value="Voluntary Donor Coordination">Voluntary Donor Coordination</option>
                      <option value="Technical or Security Escalation">Technical or Security Escalation</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Case Details or Message *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Specify hospital location, patient blood group requirement, or accreditation query..."
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#FF2E54]"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-[#FF2E54] to-[#BE123C] hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm shadow-lg"
                  >
                    <Send className="w-4 h-4" />
                    <span>Transmit to Coordination Desk</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
