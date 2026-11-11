import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const AdminDashboard: React.FC = () => {
  const chartData = [
    { name: 'Mon', requests: 12 },
    { name: 'Tue', requests: 19 },
    { name: 'Wed', requests: 15 },
    { name: 'Thu', requests: 28 },
    { name: 'Fri', requests: 34 },
    { name: 'Sat', requests: 42 },
    { name: 'Sun', requests: 38 },
  ];

  return (
    <div className="container py-12">
      <div className="dashboard-topbar flex justify-between items-center mb-8">
        <div>
          <h1 className="page-title text-3xl font-extrabold text-white">Executive Command Terminal</h1>
          <p className="page-subtitle text-slate-400">System metrics, RLS compliance, and node activity</p>
        </div>
        <span className="badge badge-primary">Superuser Console</span>
      </div>

      <div className="stats-grid mb-8">
        <div className="stat-card">
          <div className="stat-icon red">👥</div>
          <div><div className="stat-value">1,420</div><div className="stat-label">Registered Users</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon cyan">🩸</div>
          <div><div className="stat-value">1,016</div><div className="stat-label">Verified Donors</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon emerald">🏥</div>
          <div><div className="stat-value">52</div><div className="stat-label">Hospitals Connected</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber">⚡</div>
          <div><div className="stat-value">368</div><div className="stat-label">Cases Fulfilled</div></div>
        </div>
      </div>

      <div className="card p-8">
        <h2 className="text-xl font-bold text-white mb-6">7-Day Emergency Dispatch Trend</h2>
        <div style={{ width: '100%', height: 320 }}>
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="name" stroke="#64748B" />
              <YAxis stroke="#64748B" />
              <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155' }} />
              <Line type="monotone" dataKey="requests" stroke="#FF2E54" strokeWidth={3} dot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

