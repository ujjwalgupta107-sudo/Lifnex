import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Building2, Check, Mail, MapPin, Send, ShieldAlert } from 'lucide-react';
import { Pulse } from '../../components/ui/Brand';
import { Reveal } from '../../components/ui/Reveal';
import { PageHead } from '../../components/site/PageHead';

const EMPTY = { name: '', email: '', phone: '', category: 'Emergency Clinical Dispatch', message: '' };

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState(EMPTY);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<any>) => setFormData({ ...formData, [k]: e.target.value });

  return (
    <>
      <PageHead lines={['Reach the', 'emergency desk']}>
        <p className="lede">
          Emergency coordination officers, hospital integration engineers, and the clinical compliance desk.
        </p>
      </PageHead>

      <section className="wrap pb-24 md:pb-36">
        <div className="note note-error mb-10">
          <ShieldAlert size={20} />
          <p>
            <strong>Life-threatening emergency?</strong> If you or a patient are in immediate cardiac or hemorrhagic
            shock, always call national ambulance services (112 or 108) or proceed to the nearest trauma emergency
            department. Lifnex provides voluntary donor coordination alongside clinical care.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="grid content-start gap-4">
            <Reveal>
              <div className="rounded-card bg-red p-7 text-on-red sm:p-10">
                <h2 className="text-xl">24/7 trauma escalation hotline</h2>
                <p className="mt-3 whitespace-nowrap text-[clamp(1.55rem,3.6vw,3.1rem)] font-extrabold leading-none tracking-tight" style={{ fontStretch: '120%' }}>
                  1800-LIFNEX-EMG
                </p>
                <p className="mt-3">Toll-free across India (1800-543-639)</p>
                <Pulse className="my-6 h-14 w-full" strokeWidth={3} />
                <p className="max-w-[48ch]">
                  Direct line to our human-in-the-loop clinical dispatch desk for rare blood group requisition support
                  and inter-hospital logistics.
                </p>
              </div>
            </Reveal>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: Mail, t: 'Clinical desk', m: 'clinical@lifnex.org', d: 'Physician inquiries and triage consultation.' },
                { icon: Building2, t: 'Hospital integration', m: 'hospital@lifnex.org', d: 'Cryo-reserve sync and accreditation desk.' },
              ].map((c, i) => (
                <Reveal key={c.t} delay={i * 80}>
                  <div className="panel h-full p-6">
                    <c.icon size={24} className="text-red-ink" />
                    <h3 className="mt-4 text-lg">{c.t}</h3>
                    <a href={`mailto:${c.m}`} className="link mt-2 inline-block">
                      {c.m}
                    </a>
                    <p className="mt-3 text-muted">{c.d}</p>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal>
              <div className="panel flex gap-5 p-6">
                <MapPin size={24} className="mt-0.5 shrink-0 text-red-ink" />
                <div>
                  <h3 className="text-lg">Central coordination hub</h3>
                  <address className="mt-2 not-italic text-muted">
                    Lifnex Emergency Health Network, Cyber-Med Technology Centre, Hazratganj, Lucknow, Uttar Pradesh
                    226001, India
                  </address>
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal delay={80}>
            <div className="panel h-full p-7 sm:p-10">
              <AnimatePresence mode="wait" initial={false}>
                {submitted ? (
                  <motion.div
                    key="ok"
                    role="status"
                    initial={{ opacity: 0, transform: 'scale(0.96)', filter: 'blur(6px)' }}
                    animate={{ opacity: 1, transform: 'scale(1)', filter: 'blur(0px)' }}
                    exit={{ opacity: 0, filter: 'blur(6px)' }}
                    transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                    className="grid h-full min-h-[420px] place-content-center justify-items-center text-center"
                  >
                    <svg width="112" height="112" viewBox="0 0 112 112" aria-hidden="true">
                      <motion.path
                        d="M56 8 C56 8 18 50 18 70 A38 38 0 0 0 94 70 C94 50 56 8 56 8 Z"
                        fill="var(--red)"
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', duration: 0.8, bounce: 0.45 }}
                        style={{ transformOrigin: '56px 70px' }}
                      />
                      <motion.path
                        d="M38 70l12 12 24-26"
                        fill="none"
                        stroke="#fff"
                        strokeWidth="7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ delay: 0.3, duration: 0.45, ease: [0.77, 0, 0.175, 1] }}
                      />
                    </svg>
                    <h2 className="mt-6 text-3xl">Message received</h2>
                    <p className="mt-3 max-w-[42ch] text-muted">
                      Your inquiry has been logged in the dispatch queue. A coordination officer will respond via email
                      or phone within 15 minutes.
                    </p>
                    <button
                      className="btn btn-ghost mt-7"
                      onClick={() => {
                        setSubmitted(false);
                        setFormData(EMPTY);
                      }}
                    >
                      <span>Send another message</span>
                    </button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    onSubmit={handleSubmit}
                    exit={{ opacity: 0, transform: 'translateY(-12px)', filter: 'blur(6px)' }}
                    transition={{ duration: 0.22 }}
                    className="grid gap-5"
                  >
                    <div>
                      <h2 className="text-[clamp(1.7rem,3vw,2.4rem)]">Send a message</h2>
                      <p className="mt-2 text-muted">All urgent dispatches are routed with high priority.</p>
                    </div>
                    <label className="field">
                      <span className="field-label">Full name</span>
                      <input className="input" type="text" autoComplete="name" required value={formData.name} onChange={set('name')} placeholder="Dr. Rajesh Mehra" />
                    </label>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <label className="field">
                        <span className="field-label">Official email</span>
                        <input className="input" type="email" autoComplete="email" required value={formData.email} onChange={set('email')} placeholder="mehra@apollo.org" />
                      </label>
                      <label className="field">
                        <span className="field-label">Contact phone (optional)</span>
                        <input className="input" type="tel" autoComplete="tel" value={formData.phone} onChange={set('phone')} placeholder="+91 98765 43210" />
                      </label>
                    </div>
                    <label className="field">
                      <span className="field-label">Category</span>
                      <select className="input" value={formData.category} onChange={set('category')}>
                        <option value="Emergency Clinical Dispatch">Emergency clinical dispatch</option>
                        <option value="Hospital & Cryo-Bank Accreditation">Hospital and cryo-bank accreditation</option>
                        <option value="Voluntary Donor Coordination">Voluntary donor coordination</option>
                        <option value="Technical or Security Escalation">Technical or security escalation</option>
                      </select>
                    </label>
                    <label className="field">
                      <span className="field-label">Case details or message</span>
                      <textarea className="input" required rows={4} value={formData.message} onChange={set('message')} placeholder="Hospital location, patient blood group requirement, or accreditation query" />
                    </label>
                    <button type="submit" className="btn btn-primary btn-lg">
                      <Send size={18} />
                      <span>Send to the desk</span>
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
};

export default ContactPage;
