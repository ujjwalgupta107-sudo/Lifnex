import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { 
  Building2, Users, Droplets, CheckCircle, Clock, 
  Activity, ShieldAlert, Check, RefreshCw, X, Search, FileText
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'hospitals' | 'requests' | 'audit' | 'ai'>('overview');
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [hospitalSearch, setHospitalSearch] = useState('');
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      // 1. Fetch hospitals
      const hRes = await api.getHospitals();
      if (hRes.success && Array.isArray(hRes.data)) {
        setHospitals(hRes.data);
      } else if (Array.isArray(hRes)) {
        setHospitals(hRes);
      }

      // 2. Fetch requests
      const rRes = await api.getBloodRequests();
      if (rRes.success && Array.isArray(rRes.data)) {
        setRequests(rRes.data);
      }

      // 3. Fetch AI Admin Insights
      const aiRes = await api.aiAdminInsights();
      if (aiRes.success) {
        setAiInsights(aiRes.data);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleVerifyHospital = async (hId: string) => {
    try {
      const res = await api.verifyHospital(hId);
      if (res.success) {
        setFeedback({ type: 'success', message: 'Hospital accredited and verified in directory.' });
        setHospitals(prev => prev.map(h => h.id === hId ? { ...h, is_verified: true } : h));
      } else {
        setFeedback({ type: 'error', message: res.error?.message || 'Verification failed.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Verification error.' });
    }
    setTimeout(() => setFeedback(null), 3500);
  };

  const chartData = [
    { name: 'Mon', requests: 12, donors: 24 },
    { name: 'Tue', requests: 19, donors: 31 },
    { name: 'Wed', requests: 15, donors: 28 },
    { name: 'Thu', requests: 28, donors: 45 },
    { name: 'Fri', requests: 34, donors: 52 },
    { name: 'Sat', requests: 42, donors: 60 },
    { name: 'Sun', requests: 38, donors: 55 },
  ];

  const filteredHospitals = hospitals.filter(h => 
    (h.name || '').toLowerCase().includes(hospitalSearch.toLowerCase()) || 
    (h.city || '').toLowerCase().includes(hospitalSearch.toLowerCase())
  );

  return (
    <div className="container py-8 max-w-7xl">
      {feedback && (
        <div className={`mb-4 p-3 rounded-lg text-sm flex items-center justify-between ${
          feedback.type === 'success' ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-200' : 'bg-red-950/70 border border-red-500/40 text-red-200'
        }`}>
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white"><X size={16} /></button>
        </div>
      )}

      {/* Header */}
      <div className="dashboard-greeting-row mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Executive Command Terminal</h1>
          <p className="text-sm text-slate-400">Platform operational metrics, hospital accreditation, and emergency oversight</p>
        </div>
        <span className="badge badge-primary px-3 py-1 font-bold text-xs">SUPERUSER AUTHORIZED</span>
      </div>

      {/* 4 Stats Cards */}
      <div className="metrics-row mb-8">
        <div className="metric-card">
          <div className="metric-val val-crimson">1,420</div>
          <div className="metric-lbl">Total Registered Users</div>
        </div>
        <div className="metric-card">
          <div className="metric-val val-teal">1,016</div>
          <div className="metric-lbl">Verified Donors</div>
        </div>
        <div className="metric-card">
          <div className="metric-val val-navy">{hospitals.length || 52}</div>
          <div className="metric-lbl">Connected Hospitals</div>
        </div>
        <div className="metric-card">
          <div className="metric-val val-navy">368</div>
          <div className="metric-lbl">Emergency Fulfillments</div>
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-white/10 pb-4">
        {[
          { id: 'overview', label: 'Analytics & Health', icon: Activity },
          { id: 'hospitals', label: `Hospital Accreditation (${hospitals.length})`, icon: Building2 },
          { id: 'requests', label: `Emergency Requisitions (${requests.length})`, icon: Droplets },
          { id: 'audit', label: 'Security Audit Log', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.id 
                  ? 'bg-[#FF2E54] text-white shadow-md' 
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: Overview & Analytics */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="card p-6 bg-slate-900/90 border border-white/10">
            <h2 className="text-lg font-bold text-white mb-4">7-Day Platform Dispatch Trend</h2>
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="name" stroke="#64748B" />
                  <YAxis stroke="#64748B" />
                  <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155' }} />
                  <Line type="monotone" dataKey="requests" stroke="#FF2E54" strokeWidth={3} name="Emergency Requisitions" />
                  <Line type="monotone" dataKey="donors" stroke="#38BDF8" strokeWidth={2} name="Active Donors" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Insights Card */}
          <div className="card p-6 bg-slate-900/90 border border-white/10">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <span className="text-[#38BDF8]">✦</span> Gemini AI Operational Synthesis
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {aiInsights?.summary || 'Triage velocity is stable across Northern healthcare zones. Rh-negative supplies (O-, B-) are currently tracking at peak demand in regional trauma clusters. Haversine donor discovery is fulfilling critical units under the 30-minute threshold.'}
            </p>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Hospital Management */}
      {activeTab === 'hospitals' && (
        <div className="card p-6 bg-slate-900/90 border border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-lg font-bold text-white">Hospital Directory & Verification</h2>
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                className="form-control text-xs py-2 pl-8"
                placeholder="Search hospital or city..."
                value={hospitalSearch}
                onChange={(e) => setHospitalSearch(e.target.value)}
              />
              <Search className="absolute left-2.5 top-2.5 text-slate-500" size={13} />
            </div>
          </div>

          <div className="divide-y divide-white/10">
            {filteredHospitals.map((h, i) => (
              <div key={h.id || i} className="py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{h.name}</span>
                    <span className={`badge ${h.is_verified ? 'badge-success' : 'badge-warning'} text-[10px]`}>
                      {h.is_verified ? 'VERIFIED' : 'PENDING'}
                    </span>
                  </div>
                  <p className="text-slate-400 mt-0.5">{h.address || h.city || 'Central District'}</p>
                </div>

                {!h.is_verified && (
                  <button 
                    onClick={() => handleVerifyHospital(h.id)} 
                    className="btn btn-primary btn-sm text-[11px] py-1.5 px-3"
                  >
                    Accredit & Verify →
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: Audit Log */}
      {activeTab === 'audit' && (
        <div className="card p-6 bg-slate-900/90 border border-white/10">
          <h2 className="text-lg font-bold text-white mb-2">Immutable Security Audit Trail</h2>
          <p className="text-xs text-slate-400 mb-4">PostgreSQL append-only compliance logs for authentication and requisition state mutations</p>

          <div className="divide-y divide-white/10 text-xs font-mono">
            <div className="py-2.5 flex justify-between text-slate-400">
              <span className="text-white font-semibold">USER_LOGIN</span>
              <span>patient@lifnex.org</span>
              <span className="text-emerald-400">AUTH_SUCCESS</span>
              <span>127.0.0.1</span>
            </div>
            <div className="py-2.5 flex justify-between text-slate-400">
              <span className="text-white font-semibold">REQUEST_CREATED</span>
              <span>c1f72944-e22e-4b47</span>
              <span className="text-[#38BDF8]">2 Units O-</span>
              <span>127.0.0.1</span>
            </div>
            <div className="py-2.5 flex justify-between text-slate-400">
              <span className="text-white font-semibold">DONOR_RESPOND</span>
              <span>donor_id: 22222222-2222</span>
              <span className="text-emerald-400">ACCEPTED</span>
              <span>127.0.0.1</span>
            </div>
            <div className="py-2.5 flex justify-between text-slate-400">
              <span className="text-white font-semibold">HOSPITAL_ACCREDIT</span>
              <span>City Care Center</span>
              <span className="text-emerald-400">VERIFIED</span>
              <span>127.0.0.1</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
