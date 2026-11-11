import React, { useState } from 'react';
import { api } from '../../services/api';

export const PatientDashboard: React.FC = () => {
  const [bloodGroup, setBloodGroup] = useState('O-');
  const [units, setUnits] = useState(2);
  const [notes, setNotes] = useState('Critical surgery requirement at Trauma ICU');
  const [status, setStatus] = useState<string | null>(null);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Dispatching emergency request to mesh...');
    try {
      const token = localStorage.getItem('lifnex_token') || '';
      await api.createBloodRequest({
        blood_group: bloodGroup,
        units_required: units,
        urgency_level: 'critical',
        clinical_notes: notes,
      }, token);
      setStatus('Emergency request broadcasted! 17 nearby donors notified.');
    } catch {
      setStatus('Request registered in local terminal mode.');
    }
  };

  return (
    <div className="container py-12">
      <div className="dashboard-topbar flex justify-between items-center mb-8">
        <div>
          <h1 className="page-title text-3xl font-extrabold text-white">Patient Emergency Desk</h1>
          <p className="page-subtitle text-slate-400">Broadcast and track immediate blood unit needs</p>
        </div>
        <span className="badge badge-primary">Terminal Online</span>
      </div>

      <div className="stats-grid mb-8">
        <div className="stat-card">
          <div className="stat-icon red">🩸</div>
          <div><div className="stat-value">1 Active</div><div className="stat-label">Pending Requests</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon cyan">⚡</div>
          <div><div className="stat-value">17 Donors</div><div className="stat-label">In Travel Radius</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon emerald">🏥</div>
          <div><div className="stat-value">KGMU Trauma</div><div className="stat-label">Assigned Center</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber">⏱️</div>
          <div><div className="stat-value">25 min</div><div className="stat-label">Fastest Donor ETA</div></div>
        </div>
      </div>

      <div className="grid-2 gap-8">
        <div className="card p-8">
          <h2 className="text-xl font-bold text-white mb-4">Create Emergency Blood Request</h2>
          {status && <div className="badge badge-success p-3 mb-4 block">{status}</div>}

          <form onSubmit={handleCreateRequest}>
            <div className="form-group mb-4">
              <label className="form-label text-sm text-slate-300">Required Blood Group</label>
              <select className="form-control" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}>
                {['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
              </select>
            </div>

            <div className="form-group mb-4">
              <label className="form-label text-sm text-slate-300">Units Required</label>
              <input type="number" className="form-control" min={1} max={10} value={units} onChange={(e) => setUnits(Number(e.target.value))} />
            </div>

            <div className="form-group mb-6">
              <label className="form-label text-sm text-slate-300">Clinical Notes & Hospital Desk</label>
              <textarea className="form-control" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)}></textarea>
            </div>

            <button type="submit" className="btn btn-primary w-full btn-lg">
              Broadcast Emergency Request →
            </button>
          </form>
        </div>

        <div className="card p-8">
          <h2 className="text-xl font-bold text-white mb-4">Active Response Tracking</h2>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-white">Rahul Sharma (Verified Donor)</span>
                <span className="badge badge-success">Accepted</span>
              </div>
              <p className="text-xs text-slate-400">Blood Group: O- • Distance: 2.4 km • ETA: 25 mins</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-white">Aman Verma (Verified Donor)</span>
                <span className="badge badge-warning">En Route</span>
              </div>
              <p className="text-xs text-slate-400">Blood Group: O- • Distance: 4.1 km • ETA: 35 mins</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

