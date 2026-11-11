import React from 'react';

export const HowItWorksPage: React.FC = () => {
  const steps = [
    { num: '01', title: 'Emergency Intake & AI Triage', desc: 'Patients or emergency personnel submit request specifics. Gemini AI parses required blood groups, units, and urgency level.' },
    { num: '02', title: 'Geospatial Mesh Matching', desc: 'The matching engine computes Haversine distances to rank nearby verified donors within travel range.' },
    { num: '03', title: 'Realtime Alert & Acceptance', desc: 'Nearby donors receive notification pulses and acknowledge availability with estimated times of arrival.' },
    { num: '04', title: 'Hospital Handshake & Transfusion', desc: 'Hospital coordinators verify arrival and supervise the donation under accredited blood banking protocols.' },
  ];

  return (
    <div>
      <section className="page-hero">
        <div className="container">
          <span className="section-tag">System Architecture</span>
          <h1 className="page-hero-title">How the Lifnex Emergency Grid Works</h1>
          <p className="page-hero-desc">From initial request triage to bedside transfusion handshakes in four clinical phases.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid-2 gap-6">
            {steps.map((s) => (
              <div key={s.num} className="card p-6">
                <div className="stat-icon red mb-4">{s.num}</div>
                <h3 className="text-xl font-bold text-white mb-2">{s.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

