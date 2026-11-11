import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';

export const HospitalsPage: React.FC = () => {
  const [hospitals, setHospitals] = useState<any[]>([]);

  useEffect(() => {
    api.getHospitals().then((data) => {
      if (Array.isArray(data)) setHospitals(data);
      else if (data.hospitals) setHospitals(data.hospitals);
    }).catch(() => {});
  }, []);

  return (
    <div>
      <section className="page-hero">
        <div className="container">
          <span className="section-tag">Accredited Network</span>
          <h1 className="page-hero-title">Hospital & Blood Bank Directory</h1>
          <p className="page-hero-desc">Directory of healthcare centers integrated into the Lifnex emergency coordination mesh.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid-3 gap-6">
            {hospitals.map((h, i) => (
              <div key={h.id || i} className="card p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-white">{h.name}</h3>
                  <span className="badge badge-success">Verified</span>
                </div>
                <p className="text-xs text-slate-400 mb-2">{h.address || h.city}</p>
                <div className="text-xs text-[#38BDF8] font-mono">Contact: {h.contact_number || '+91 522 2257450'}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

