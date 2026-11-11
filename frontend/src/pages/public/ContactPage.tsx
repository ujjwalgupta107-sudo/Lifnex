import React, { useState } from 'react';

export const ContactPage: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div>
      <section className="page-hero">
        <div className="container">
          <span className="section-tag">24/7 Support</span>
          <h1 className="page-hero-title">Emergency Communications Desk</h1>
          <p className="page-hero-desc">Reach the Lifnex engineering, triage support, and hospital integration team.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid-2 gap-8 items-start">
            <div className="card p-6">
              <div className="stat-icon red mb-4">🚨</div>
              <h3 className="text-xl font-bold text-white mb-2">Emergency Hotline</h3>
              <p className="text-sm text-slate-400 mb-4">Immediate clinical coordination desk.</p>
              <div className="text-2xl font-black text-[#FF2E54]">1800-LIFNEX-EMG</div>
              <div className="text-xs text-slate-400 mt-1">24/7 Monitored Dispatch Hotline</div>
            </div>

            <div className="card p-8">
              <h2 className="text-xl font-bold text-white mb-4">Transmit a Message</h2>
              {submitted ? (
                <div className="badge badge-success p-4 block text-center">
                  Message transmitted to dispatch officer.
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="form-group mb-4">
                    <label className="form-label text-sm text-slate-300">Name</label>
                    <input type="text" className="form-control" required placeholder="Dr. S. Nair" />
                  </div>
                  <div className="form-group mb-4">
                    <label className="form-label text-sm text-slate-300">Email</label>
                    <input type="email" className="form-control" required placeholder="nair@apollo.org" />
                  </div>
                  <div className="form-group mb-4">
                    <label className="form-label text-sm text-slate-300">Details</label>
                    <textarea className="form-control" rows={4} required placeholder="Specify request or query..."></textarea>
                  </div>
                  <button type="submit" className="btn btn-primary w-full">Send Message →</button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

