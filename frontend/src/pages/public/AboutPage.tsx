import React from 'react';

export const AboutPage: React.FC = () => {
  return (
    <div>
      <section className="page-hero">
        <div className="container">
          <span className="section-tag">Purpose & Clinical Architecture</span>
          <h1 className="page-hero-title">Bridging Critical Minutes in Blood Emergencies</h1>
          <p className="page-hero-desc">
            When a life is on the line, technological delays and geographic confusion should never stand between a patient and a compatible voluntary donor.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid-2 items-center">
            <div>
              <span className="badge badge-primary mb-3">Our Core Philosophy</span>
              <h2 className="section-title mb-4">Every Second Matters When Blood Is Needed</h2>
              <p className="mb-4">
                During major surgeries and trauma emergencies, packed red blood cells are strictly time-bound. Chaotic social media broadcasts often result in delayed responses, incompatible donor arrivals, and communication breakdowns.
              </p>
              <p>
                Lifnex combines real-time geospatial proximity, strict biological compatibility matrices, and verified hospital checkpoints to organize voluntary donors with clarity and speed.
              </p>
            </div>
            <div className="card p-4">
              <img src="/static/assets/images/compatibility-lab.jpg" alt="Compatibility Lab" style={{ borderRadius: 'var(--radius-md)', maxHeight: '280px', width: '100%', objectFit: 'cover' }} />
              <div className="p-3 mt-3 text-xs" style={{ background: 'rgba(255,46,84,0.1)', border: '1px solid rgba(255,46,84,0.3)', borderRadius: 'var(--radius-sm)' }}>
                <span className="font-bold text-[#FF2E54]">Clinical Safety Rule:</span> Lifnex coordinates communication; licensed healthcare professionals conduct physical testing and bedside transfusions.
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

