import React from 'react';

export const HospitalDashboard: React.FC = () => {
  return (
    <div className="container py-12">
      <div className="dashboard-topbar flex justify-between items-center mb-8">
        <div>
          <h1 className="page-title text-3xl font-extrabold text-white">Hospital Coordination Desk</h1>
          <p className="page-subtitle text-slate-400">Manage patient intake, blood inventory, and donor handshakes</p>
        </div>
        <span className="badge badge-success">Facility Verified</span>
      </div>

      <div className="stats-grid mb-8">
        <div className="stat-card">
          <div className="stat-icon red">🏥</div>
          <div><div className="stat-value">18 Active</div><div className="stat-label">Trauma Cases</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon cyan">🤝</div>
          <div><div className="stat-value">12 Handshakes</div><div className="stat-label">Coordinated</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon emerald">📦</div>
          <div><div className="stat-value">42 Units</div><div className="stat-label">Cold-Chain Reserve</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber">⏱️</div>
          <div><div className="stat-value">14 min</div><div className="stat-label">Avg Arrival Time</div></div>
        </div>
      </div>

      <div className="card p-8">
        <h2 className="text-xl font-bold text-white mb-4">Live Emergency Roster</h2>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="pb-3">Case ID</th>
              <th className="pb-3">Group</th>
              <th className="pb-3">Units</th>
              <th className="pb-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            <tr>
              <td className="py-3">REQ-1042</td>
              <td>A+</td>
              <td>2</td>
              <td><span className="badge badge-success">Coordinated</span></td>
            </tr>
            <tr>
              <td className="py-3">REQ-1041</td>
              <td>O-</td>
              <td>1</td>
              <td><span className="badge badge-warning">En Route</span></td>
            </tr>
            <tr>
              <td className="py-3">REQ-1039</td>
              <td>B+</td>
              <td>2</td>
              <td><span className="badge badge-primary">Searching</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

