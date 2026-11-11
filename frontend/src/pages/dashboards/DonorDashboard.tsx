import React, { useState } from 'react';

export const DonorDashboard: React.FC = () => {
  const [available, setAvailable] = useState(true);
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="container py-12">
      <div className="dashboard-topbar flex justify-between items-center mb-8">
        <div>
          <h1 className="page-title text-3xl font-extrabold text-white">Voluntary Donor Terminal</h1>
          <p className="page-subtitle text-slate-400">Emergency alerts matched to your blood group</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-300">Availability:</span>
          <button
            onClick={() => setAvailable(!available)}
            className={`btn btn-sm ${available ? 'btn-success' : 'btn-secondary'}`}
          >
            {available ? '🟢 Active & Ready' : '⚪ Paused'}
          </button>
        </div>
      </div>

      <div className="stats-grid mb-8">
        <div className="stat-card">
          <div className="stat-icon red">🩸</div>
          <div><div className="stat-value">8 Times</div><div className="stat-label">Total Donations</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon cyan">⚡</div>
          <div><div className="stat-value">24 Lives</div><div className="stat-label">Estimated Impact</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon emerald">⭐</div>
          <div><div className="stat-value">A+</div><div className="stat-label">Registered Group</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber">📍</div>
          <div><div className="stat-value">10 km</div><div className="stat-label">Response Radius</div></div>
        </div>
      </div>

      <div className="card p-8">
        <h2 className="text-xl font-bold text-white mb-4">Nearby Emergency Requests</h2>
        <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge badge-primary">CRITICAL</span>
              <span className="font-bold text-white">KGMU Trauma Center (ICU Bed 4)</span>
            </div>
            <p className="text-xs text-slate-400">Requires 2 Units of A+ Blood • Distance: 3.2 km away</p>
          </div>
          <div>
            {accepted ? (
              <span className="badge badge-success p-2">Response Accepted • ETA 20m</span>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={() => setAccepted(true)}>
                I'm Available to Donate →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

