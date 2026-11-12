import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { 
  Building2, Activity, Droplets, Clock, PlusCircle, 
  CheckCircle2, AlertTriangle, ShieldCheck, Boxes, 
  HeartHandshake, RefreshCw, X, Send, FileText, 
  Radio, Check, ArrowRight, Bed, User, MapPin
} from 'lucide-react';

export const HospitalDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'roster' | 'broadcast' | 'inventory' | 'handshakes' | 'accreditation'>('overview');
  
  const [user, setUser] = useState<any>(() => {
    try {
      return JSON.parse(localStorage.getItem('lifnex_user') || '{}');
    } catch {
      return {};
    }
  });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Live Requests
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedCase, setSelectedCase] = useState<any | null>(null);

  // Broadcast Form State
  const [bBloodGroup, setBBloodGroup] = useState('O-');
  const [bUnits, setBUnits] = useState(4);
  const [bUrgency, setBUrgency] = useState<'critical' | 'urgent' | 'routine'>('critical');
  const [bWard, setBWard] = useState('OT-3 Trauma Surgery');
  const [bPhysician, setBPhysician] = useState('Dr. Arthur Vance');
  const [bNotes, setBNotes] = useState('Level-1 trauma center mass transfusion protocol active.');

  // Blood Inventory State (8 groups)
  const [inventory, setInventory] = useState<Record<string, number>>({
    'O-': 2,
    'O+': 14,
    'A-': 3,
    'A+': 12,
    'B-': 1,
    'B+': 8,
    'AB-': 2,
    'AB+': 4,
  });

  // Active Handshakes in Transit
  const [handshakes, setHandshakes] = useState<any[]>([
    {
      id: 'HS-701',
      donorName: 'Donor #8f2a (Anita D.)',
      bloodGroup: 'O+',
      units: 1,
      distance: '2.4 km',
      eta: '14 min',
      status: 'en_route',
      caseId: 'REQ-1042',
      transport: 'Personal Vehicle',
    },
    {
      id: 'HS-702',
      donorName: 'Donor #4c11 (Rahul S.)',
      bloodGroup: 'O-',
      units: 1,
      distance: '4.8 km',
      eta: '22 min',
      status: 'en_route',
      caseId: 'REQ-1041',
      transport: 'Metro Route',
    },
    {
      id: 'HS-703',
      donorName: 'Donor #9b3d (Vikram M.)',
      bloodGroup: 'A+',
      units: 2,
      distance: '6.1 km',
      eta: '28 min',
      status: 'dispatched',
      caseId: 'REQ-1039',
      transport: 'Cab Shuttle',
    },
  ]);

  // Load real blood requests from backend
  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await api.getBloodRequests();
      if (res.success && Array.isArray(res.data)) {
        setRequests(res.data);
        if (res.data.length > 0 && !selectedCase) {
          setSelectedCase(res.data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  // Broadcast Emergency Shortage
  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        hospital_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        blood_group: bBloodGroup,
        units_required: Number(bUnits),
        urgency_level: bUrgency,
        clinical_notes: `[Ward: ${bWard} | Chief: ${bPhysician}] ${bNotes}`,
      };

      const res = await api.createBloodRequest(payload);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `🚨 Emergency Shortage Broadcasted! Dispatched alert for ${bUnits} units of ${bBloodGroup} across regional donor network.`,
        });
        await loadRequests();
        setActiveTab('roster');
      } else {
        setFeedback({ type: 'error', message: res.error?.message || 'Failed to dispatch broadcast.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Network error broadcasting shortage.' });
    } finally {
      setSubmitting(false);
    }
    setTimeout(() => setFeedback(null), 5000);
  };

  // Adjust Inventory Units
  const handleInventoryChange = (group: string, delta: number) => {
    setInventory(prev => {
      const nextVal = Math.max(0, (prev[group] || 0) + delta);
      return { ...prev, [group]: nextVal };
    });
    setFeedback({
      type: 'success',
      message: `Cold-chain reserve updated for ${group}: ${(inventory[group] || 0) + delta} Units.`,
    });
    setTimeout(() => setFeedback(null), 2500);
  };

  // Confirm Handshake Intake
  const handleConfirmHandshake = (hsId: string) => {
    setHandshakes(prev => prev.map(h => h.id === hsId ? { ...h, status: 'fulfilled' } : h));
    setFeedback({
      type: 'success',
      message: `Intake confirmed for Handshake #${hsId}. Blood unit logged to cold-chain quarantine.`,
    });
    setTimeout(() => setFeedback(null), 3500);
  };

  const totalReserveUnits = Object.values(inventory).reduce((a, b) => a + b, 0);

  const navItems = [
    { id: 'overview', label: 'Desk Overview', icon: Activity, count: null },
    { id: 'roster', label: 'Live Requisitions', icon: FileText, count: requests.length || 18 },
    { id: 'broadcast', label: 'Broadcast Shortage', icon: PlusCircle, count: null },
    { id: 'inventory', label: 'Cold-Chain Reserve', icon: Boxes, count: totalReserveUnits },
    { id: 'handshakes', label: 'In-Transit Donors', icon: HeartHandshake, count: handshakes.filter(h => h.status !== 'fulfilled').length },
    { id: 'accreditation', label: 'Accreditation', icon: ShieldCheck, count: null },
  ];

  return (
    <div className="container py-8 max-w-7xl">
      {/* Top Banner Alert */}
      {feedback && (
        <div 
          className={`mb-5 p-3.5 rounded-xl text-sm flex items-center justify-between shadow-lg ${
            feedback.type === 'success' 
              ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-200' 
              : 'bg-red-950/80 border border-red-500/50 text-red-200'
          }`}
          style={{ backdropFilter: 'blur(16px)' }}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-400 shrink-0" /> : <AlertTriangle size={18} className="text-[#FF2E54] shrink-0" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Top Header Card */}
      <div className="dashboard-greeting-row mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Hospital Coordination Desk
            </h1>
            <span 
              className="badge"
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34D399',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                padding: '0.25rem 0.65rem',
                borderRadius: '9999px',
                fontSize: '0.725rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
              FACILITY VERIFIED
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            City Care Super Specialty Hospital • Clinical Coordinator: <strong className="text-slate-200">Dr. Arthur Vance</strong>
          </p>
        </div>

        {/* Quick Broadcast Action */}
        <button
          onClick={() => setActiveTab('broadcast')}
          className="btn btn-primary text-xs py-2.5 px-4 rounded-xl flex items-center gap-2 font-bold shadow-lg"
          style={{
            background: 'linear-gradient(135deg, #FF2E54 0%, #D61238 100%)',
            boxShadow: '0 4px 15px rgba(255, 46, 84, 0.4)',
          }}
        >
          <PlusCircle size={15} />
          <span>Broadcast Emergency Shortage</span>
        </button>
      </div>

      {/* 4-Stat Metric Cards */}
      <div className="metrics-row mb-8">
        <div className="metric-card">
          <div className="metric-val val-crimson">{requests.length || 18} Active</div>
          <div className="metric-lbl">Trauma Cases</div>
        </div>
        <div className="metric-card">
          <div className="metric-val val-teal">{handshakes.length} Handshakes</div>
          <div className="metric-lbl">Coordinated In-Transit</div>
        </div>
        <div className="metric-card">
          <div className="metric-val val-navy">{totalReserveUnits} Units</div>
          <div className="metric-lbl">Cold-Chain Reserve</div>
        </div>
        <div className="metric-card">
          <div className="metric-val val-navy">14 min</div>
          <div className="metric-lbl">Avg Arrival Time</div>
        </div>
      </div>

      {/* 2-COLUMN LAYOUT: LEFT SIDEBAR + MAIN CONTENT */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* ======================================================== */}
        {/* LEFT SIDEBAR NAVIGATION PANEL                            */}
        {/* ======================================================== */}
        <aside className="md:col-span-4 lg:col-span-3 space-y-4">
          <div 
            className="donor-sidebar-card"
            style={{
              background: 'rgba(15, 23, 42, 0.88)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '18px',
              padding: '1.25rem',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 15px 35px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Hospital Mini Profile */}
            <div className="flex items-center gap-3 pb-4 mb-4 border-b border-white/10">
              <div 
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #FF2E54 0%, #D61238 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  fontWeight: 900,
                  fontSize: '1.1rem',
                  boxShadow: '0 4px 12px rgba(255, 46, 84, 0.35)',
                }}
              >
                🏥
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-white truncate">City Care Hospital</div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
                  <span>Trauma Center • NBTC</span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs List */}
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
              Clinical Desk Navigation
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`hosp-tab-${item.id}`}
                    type="button"
                    onClick={() => setActiveTab(item.id as any)}
                    className={`donor-sidebar-item ${isActive ? 'active' : ''}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '0.75rem 0.9rem',
                      borderRadius: '12px',
                      fontSize: '0.825rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      border: isActive ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid transparent',
                      background: isActive ? 'linear-gradient(135deg, #FF2E54 0%, #D61238 100%)' : 'transparent',
                      color: isActive ? '#FFFFFF' : '#94A3B8',
                      boxShadow: isActive ? '0 4px 14px rgba(255, 46, 84, 0.4)' : 'none',
                      textAlign: 'left',
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400'} />
                      <span>{item.label}</span>
                    </div>

                    {item.count !== null && item.count > 0 && (
                      <span 
                        className="donor-sidebar-badge"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '2px 7px',
                          borderRadius: '9999px',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          background: isActive ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                          color: isActive ? '#FFFFFF' : '#CBD5E1',
                        }}
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Sidebar Bottom Hotline */}
            <div className="mt-5 pt-4 border-t border-white/10">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Emergency Protocol</span>
                  <span className="text-emerald-400 font-bold">Level-1 Trauma</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Blood Bank Desk</span>
                  <span className="text-white font-mono text-[10px]">EXT: 4022</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ======================================================== */}
        {/* RIGHT MAIN CONTENT AREA                                  */}
        {/* ======================================================== */}
        <main className="md:col-span-8 lg:col-span-9 space-y-6">

          {/* ======================================================== */}
          {/* TAB 1: DESK OVERVIEW                                     */}
          {/* ======================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Emergency Summary Table */}
              <div 
                className="card"
                style={{
                  padding: '1.75rem',
                  background: 'rgba(15, 23, 42, 0.88)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '18px',
                }}
              >
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                      <Activity className="text-[#FF2E54]" size={18} />
                      <span>Live Emergency Requisition Roster</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">Active clinical cases undergoing sub-second voluntary donor routing</p>
                  </div>
                  <button 
                    onClick={loadRequests} 
                    className="btn btn-secondary btn-sm flex items-center gap-1.5 text-xs py-1 px-3 rounded-lg"
                  >
                    <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                    <span>Refresh</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                        <th className="pb-3.5 px-3">Case ID</th>
                        <th className="pb-3.5 px-3">Blood Group</th>
                        <th className="pb-3.5 px-3">Volume Needed</th>
                        <th className="pb-3.5 px-3">Urgency Priority</th>
                        <th className="pb-3.5 px-3">Mesh Status</th>
                        <th className="pb-3.5 px-3 text-right">Triage Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300">
                      {[
                        { id: 'REQ-1042', group: 'A+', units: 2, urgency: 'critical', status: 'Coordinated', statusBadge: 'success' },
                        { id: 'REQ-1041', group: 'O-', units: 1, urgency: 'critical', status: 'En Route', statusBadge: 'warning' },
                        { id: 'REQ-1039', group: 'B+', units: 2, urgency: 'urgent', status: 'Searching', statusBadge: 'primary' },
                        { id: 'REQ-1035', group: 'O+', units: 4, urgency: 'routine', status: 'Coordinated', statusBadge: 'success' },
                      ].map((item) => (
                        <tr key={item.id} className="hover:bg-white/[0.03] transition-colors">
                          <td className="py-3.5 px-3 font-mono font-bold text-white text-xs">{item.id}</td>
                          <td className="py-3.5 px-3">
                            <span 
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '34px',
                                height: '26px',
                                borderRadius: '6px',
                                fontWeight: 900,
                                fontSize: '0.85rem',
                                color: '#FF2E54',
                                background: 'rgba(255, 46, 84, 0.15)',
                                border: '1px solid rgba(255, 46, 84, 0.4)',
                              }}
                            >
                              {item.group}
                            </span>
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="font-bold text-white text-xs">{item.units} Units</div>
                            <div className="text-[10px] text-slate-500 font-medium">Whole Blood / RBC</div>
                          </td>
                          <td className="py-3.5 px-3">
                            {item.urgency === 'critical' ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-red-950/80 text-red-400 border border-red-500/30 inline-flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>
                                CRITICAL
                              </span>
                            ) : item.urgency === 'urgent' ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-950/80 text-amber-400 border border-amber-500/30 inline-flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                URGENT
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-sky-950/80 text-sky-400 border border-sky-500/30 inline-flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                                ROUTINE
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-3">
                            {item.statusBadge === 'success' ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1">
                                <Check size={11} />
                                {item.status}
                              </span>
                            ) : item.statusBadge === 'warning' ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-950/80 text-amber-300 border border-amber-500/30 inline-flex items-center gap-1">
                                <Clock size={11} />
                                {item.status}
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-[#FF2E54]/15 text-[#FF2E54] border border-[#FF2E54]/30 inline-flex items-center gap-1">
                                <Radio size={11} className="animate-pulse" />
                                {item.status}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <button
                              onClick={() => {
                                setSelectedCase(item);
                                setActiveTab('roster');
                              }}
                              className="btn btn-secondary text-xs py-1.5 px-3 rounded-lg font-bold inline-flex items-center gap-1 text-[#38BDF8] hover:text-white border border-white/10 hover:border-[#38BDF8]/40 transition-colors"
                            >
                              <span>View Triage</span>
                              <ArrowRight size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Quick Cold-Chain Snapshot Grid */}
              <div 
                className="card"
                style={{
                  padding: '1.5rem',
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                }}
              >
                <div className="flex justify-between items-center mb-3.5 pb-2.5 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <Boxes size={18} className="text-[#38BDF8]" />
                    <h3 className="text-sm font-bold text-white">Cold-Chain Inventory Status Snapshot</h3>
                  </div>
                  <button 
                    onClick={() => setActiveTab('inventory')}
                    className="text-xs text-[#38BDF8] hover:underline font-semibold flex items-center gap-1"
                  >
                    <span>Manage Full Inventory</span>
                    <ArrowRight size={12} />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 text-center">
                  {Object.entries(inventory).map(([group, qty]) => {
                    const isCritical = qty <= 2;
                    return (
                      <div 
                        key={group}
                        className="p-3 rounded-xl border transition-all hover:border-white/20"
                        style={{
                          background: isCritical ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                          borderColor: isCritical ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.08)',
                          boxShadow: isCritical ? '0 0 12px rgba(239, 68, 68, 0.15)' : 'none',
                        }}
                      >
                        <div className="text-xs font-black text-white">{group}</div>
                        <div className="text-xl font-extrabold mt-0.5" style={{ color: isCritical ? '#FF2E54' : '#10B981' }}>
                          {qty}
                        </div>
                        <div 
                          className="text-[9px] font-bold uppercase tracking-wider mt-1 px-1.5 py-0.5 rounded-full inline-block"
                          style={{
                            background: isCritical ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.15)',
                            color: isCritical ? '#F87171' : '#34D399',
                          }}
                        >
                          {isCritical ? 'LOW' : 'OPTIMAL'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: LIVE REQUISITIONS & CLINICAL TRIAGE               */}
          {/* ======================================================== */}
          {activeTab === 'roster' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                    <FileText className="text-[#FF2E54]" size={18} />
                    <span>Clinical Emergency Requisitions ({requests.length || 4})</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Real-time trauma intake requirements broadcast to nearby mesh</p>
                </div>
                <button 
                  onClick={loadRequests} 
                  className="btn btn-secondary btn-sm flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg"
                >
                  <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                  <span>Refresh</span>
                </button>
              </div>

              {requests.length === 0 ? (
                <div className="card p-8 text-center text-slate-400">
                  <p className="text-sm">No live requests from backend yet. Use the broadcast tab to create one.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.map((req) => (
                    <div 
                      key={req.id} 
                      className="card p-4 rounded-xl border border-white/10 bg-slate-900/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                            #{req.id?.slice(0, 8) || 'REQ'}
                          </span>
                          <span className="badge badge-primary font-bold text-[11px]">{req.blood_group}</span>
                          <span className="text-white font-bold text-sm">{req.units_required} Units Required</span>
                          <span className="text-xs text-slate-400">• Urgency: <strong className="text-[#FF2E54]">{req.urgency_level || 'critical'}</strong></span>
                        </div>
                        <p className="text-xs text-slate-300">{req.clinical_notes || 'Trauma surgery transfusion requisition.'}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="badge badge-success text-[10px]">
                          {req.status?.toUpperCase() || 'ACTIVE'}
                        </span>
                        <button 
                          onClick={() => {
                            setFeedback({ type: 'success', message: `Case #${req.id?.slice(0, 8)} marked as fulfilled by receiving ward.` });
                            setTimeout(() => setFeedback(null), 3000);
                          }}
                          className="btn btn-secondary text-xs py-1.5 px-3 rounded-lg"
                        >
                          Mark Fulfilled
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: BROADCAST EMERGENCY SHORTAGE FORM                 */}
          {/* ======================================================== */}
          {activeTab === 'broadcast' && (
            <div 
              className="card max-w-2xl mx-auto"
              style={{
                padding: '2rem',
                background: 'rgba(15, 23, 42, 0.92)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '18px',
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(255, 46, 84, 0.1)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <div className="mb-6 pb-4 border-b border-white/10 flex items-start justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#FF2E54]/15 text-[#FF2E54] border border-[#FF2E54]/30 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF2E54] animate-pulse"></span>
                    Clinical Emergency Broadcast
                  </div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Broadcast Hospital Blood Shortage</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Instantly ping all voluntary blood donors in the New Delhi metropolitan geofence
                  </p>
                </div>
                <button 
                  type="button" 
                  onClick={() => setActiveTab('overview')}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleBroadcast} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-group mb-0">
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Blood Group Needed <span className="text-[#FF2E54]">*</span>
                    </label>
                    <select 
                      className="form-control text-sm py-2 px-3 bg-slate-950/70 border-white/10 text-white rounded-lg focus:border-[#FF2E54]"
                      value={bBloodGroup} 
                      onChange={(e) => setBBloodGroup(e.target.value)}
                    >
                      {['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'].map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group mb-0">
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Units Required (Whole Blood / RBC) <span className="text-[#FF2E54]">*</span>
                    </label>
                    <input 
                      type="number" 
                      min={1} 
                      max={20} 
                      className="form-control text-sm py-2 px-3 bg-slate-950/70 border-white/10 text-white rounded-lg focus:border-[#FF2E54]" 
                      value={bUnits} 
                      onChange={(e) => setBUnits(Number(e.target.value))} 
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-group mb-0">
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Urgency Level <span className="text-[#FF2E54]">*</span>
                    </label>
                    <select 
                      className="form-control text-sm py-2 px-3 bg-slate-950/70 border-white/10 text-white rounded-lg focus:border-[#FF2E54]"
                      value={bUrgency} 
                      onChange={(e) => setBUrgency(e.target.value as any)}
                    >
                      <option value="critical">🔴 Critical (Immediate surgical transfusion)</option>
                      <option value="urgent">🟠 Urgent (Within 2-4 hours)</option>
                      <option value="routine">🟡 Routine (Resupply / Scheduled)</option>
                    </select>
                  </div>

                  <div className="form-group mb-0">
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Operating Ward / Surgical Bed
                    </label>
                    <input 
                      type="text" 
                      className="form-control text-sm py-2 px-3 bg-slate-950/70 border-white/10 text-white rounded-lg focus:border-[#FF2E54]" 
                      value={bWard} 
                      onChange={(e) => setBWard(e.target.value)} 
                      required 
                    />
                  </div>
                </div>

                <div className="form-group mb-0">
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Attending Chief Physician
                  </label>
                  <input 
                    type="text" 
                    className="form-control text-sm py-2 px-3 bg-slate-950/70 border-white/10 text-white rounded-lg focus:border-[#FF2E54]" 
                    value={bPhysician} 
                    onChange={(e) => setBPhysician(e.target.value)} 
                    required 
                  />
                </div>

                <div className="form-group mb-0">
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Clinical Transfusion Protocol & Instructions
                  </label>
                  <textarea 
                    className="form-control text-sm py-2 px-3 bg-slate-950/70 border-white/10 text-white rounded-lg focus:border-[#FF2E54]" 
                    rows={3} 
                    value={bNotes} 
                    onChange={(e) => setBNotes(e.target.value)} 
                    required 
                  />
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button 
                    type="submit" 
                    className="btn btn-primary flex-1 py-3 font-bold text-sm shadow-xl flex items-center justify-center gap-2 rounded-xl"
                    style={{
                      background: 'linear-gradient(135deg, #FF2E54 0%, #D61238 100%)',
                      boxShadow: '0 4px 18px rgba(255, 46, 84, 0.45)',
                      cursor: submitting ? 'not-allowed' : 'pointer',
                    }}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Broadcasting to Regional Mesh...</span>
                      </>
                    ) : (
                      <>
                        <span>Dispatch Emergency Shortage Broadcast</span>
                        <Send size={15} />
                      </>
                    )}
                  </button>

                  <button 
                    type="button" 
                    onClick={() => setActiveTab('overview')}
                    className="btn btn-secondary py-3 px-4 text-xs font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: COLD-CHAIN INVENTORY MANAGEMENT                   */}
          {/* ======================================================== */}
          {activeTab === 'inventory' && (
            <div className="space-y-6">
              <div 
                className="card"
                style={{
                  padding: '2rem',
                  background: 'rgba(15, 23, 42, 0.88)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '18px',
                  boxShadow: '0 15px 35px rgba(0, 0, 0, 0.5)',
                }}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 pb-4 border-b border-white/10">
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                      <Boxes className="text-[#38BDF8]" size={20} />
                      <span>Cold-Chain Blood Bank Cryo-Reserve</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">Thermo-regulated cryo-reserve storage status (-20°C to 4°C) with real-time stock adjustment</p>
                  </div>
                  <div className="sm:text-right flex sm:flex-col items-center sm:items-end gap-2 sm:gap-0">
                    <span className="text-xl font-black text-white font-mono">{totalReserveUnits} Total Units</span>
                    <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                      <Check size={12} /> Cold-Chain Reserve Active
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(inventory).map(([group, qty]) => {
                    const isCritical = qty <= 2;
                    const fillPercent = Math.min(100, Math.round((qty / 15) * 100));
                    return (
                      <div 
                        key={group}
                        className="p-3.5 rounded-xl border relative transition-all hover:border-white/20"
                        style={{
                          background: isCritical ? 'rgba(239, 68, 68, 0.06)' : 'rgba(15, 23, 42, 0.85)',
                          borderColor: isCritical ? 'rgba(239, 68, 68, 0.35)' : 'rgba(255, 255, 255, 0.08)',
                          boxShadow: isCritical ? '0 0 15px rgba(239, 68, 68, 0.1)' : 'none',
                        }}
                      >
                        <div className="flex justify-between items-center mb-2.5">
                          <span 
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '3px 10px',
                              borderRadius: '6px',
                              fontWeight: 900,
                              fontSize: '0.9rem',
                              color: '#FFFFFF',
                              background: isCritical ? 'linear-gradient(135deg, #FF2E54 0%, #D61238 100%)' : 'rgba(255, 255, 255, 0.1)',
                              border: isCritical ? '1px solid #FF2E54' : '1px solid rgba(255, 255, 255, 0.15)',
                            }}
                          >
                            {group}
                          </span>
                          <span 
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              padding: '0.15rem 0.5rem',
                              borderRadius: '9999px',
                              background: isCritical ? 'rgba(239, 68, 68, 0.18)' : 'rgba(16, 185, 129, 0.15)',
                              color: isCritical ? '#F87171' : '#34D399',
                              border: `1px solid ${isCritical ? 'rgba(239, 68, 68, 0.35)' : 'rgba(16, 185, 129, 0.25)'}`,
                            }}
                          >
                            {isCritical ? 'LOW RESERVE' : 'ADEQUATE'}
                          </span>
                        </div>

                        <div className="my-2.5">
                          <div className="text-2xl font-black text-white flex items-baseline gap-1.5">
                            <span>{qty}</span>
                            <span className="text-xs font-normal text-slate-400">Units ({qty * 450} ml)</span>
                          </div>
                          
                          {/* Mini visual reserve meter */}
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1.5">
                            <div 
                              className="h-full rounded-full transition-all duration-300"
                              style={{ 
                                width: `${fillPercent}%`,
                                background: isCritical ? '#FF2E54' : '#10B981',
                              }}
                            ></div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                          <span className="text-slate-400 text-[11px]">Adjust Stock:</span>
                          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-white/10 rounded-lg p-0.5">
                            <button
                              type="button"
                              onClick={() => handleInventoryChange(group, -1)}
                              className="w-6 h-6 rounded text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                              disabled={qty <= 0}
                              title="Dispense 1 Unit"
                            >
                              -
                            </button>
                            <span className="w-5 text-center font-bold text-white text-xs">{qty}</span>
                            <button
                              type="button"
                              onClick={() => handleInventoryChange(group, 1)}
                              className="w-6 h-6 rounded text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer"
                              title="Add 1 Unit"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Telemetry Status Banner */}
                <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                      Temp: <strong className="text-white">-20.4°C</strong> (Cryo-Storage Spec)
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block"></span>
                      Power: <strong className="text-white">Dual UPS Grid Online</strong>
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">Sensors: 8/8 Calibrated</span>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: IN-TRANSIT DONOR HANDSHAKES                       */}
          {/* ======================================================== */}
          {activeTab === 'handshakes' && (
            <div className="space-y-6">
              <div 
                className="card"
                style={{
                  padding: '2rem',
                  background: 'rgba(15, 23, 42, 0.88)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '18px',
                  boxShadow: '0 15px 35px rgba(0, 0, 0, 0.5)',
                }}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 pb-4 border-b border-white/10">
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                      <HeartHandshake className="text-[#10B981]" size={20} />
                      <span>In-Transit Voluntary Donor Handshakes</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">Donors actively traveling toward hospital reception for immediate intake verification</p>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    {handshakes.filter(h => h.status !== 'fulfilled').length} ACTIVE EN ROUTE
                  </span>
                </div>

                <div className="space-y-3.5">
                  {handshakes.map((hs) => (
                    <div 
                      key={hs.id} 
                      className="p-4 rounded-xl border border-white/10 bg-slate-950/70 hover:border-white/20 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                          <Activity size={20} />
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs text-slate-400 font-bold">#{hs.id}</span>
                            <span className="font-bold text-white text-sm">{hs.donorName}</span>
                            <span 
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontWeight: 900,
                                fontSize: '0.8rem',
                                color: '#FF2E54',
                                background: 'rgba(255, 46, 84, 0.15)',
                                border: '1px solid rgba(255, 46, 84, 0.4)',
                              }}
                            >
                              {hs.bloodGroup}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              DISPATCHED
                            </span>
                          </div>

                          <div className="text-xs text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5">
                            <span className="flex items-center gap-1 text-slate-300">
                              <MapPin size={12} className="text-slate-400" />
                              Distance: <strong className="text-white">{hs.distance}</strong>
                            </span>
                            <span>•</span>
                            <span>Transport: <strong className="text-slate-200">{hs.transport}</strong></span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-[#38BDF8] font-bold">
                              <Clock size={12} />
                              ETA: {hs.eta}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 w-full sm:w-auto pt-2 sm:pt-0 flex justify-end">
                        {hs.status === 'fulfilled' ? (
                          <span className="px-3 py-1.5 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5">
                            <Check size={14} />
                            INTAKE CONFIRMED
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleConfirmHandshake(hs.id)}
                            className="text-xs py-2 px-4 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer border hover:bg-emerald-500/25"
                            style={{ 
                              background: 'rgba(16, 185, 129, 0.15)', 
                              borderColor: 'rgba(16, 185, 129, 0.4)',
                              color: '#34D399',
                              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)' 
                            }}
                          >
                            <Check size={14} />
                            <span>Confirm Intake</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: CLINICAL ACCREDITATION & VERIFICATION (UNIFIED & CLEAN) */}
          {activeTab === 'accreditation' && (
            <div 
              style={{
                padding: '2rem',
                background: 'rgba(11, 17, 32, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <ShieldCheck size={26} className="text-[#10B981]" />
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-tight">National Accreditation & Certification</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Verified by National Blood Transfusion Council (NBTC)</p>
                  </div>
                </div>
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 font-bold">
                  ACCREDITED FACILITY
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left 7 cols: License Details */}
                <div className="lg:col-span-7 space-y-3 text-xs sm:text-sm">
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5 flex justify-between items-center">
                    <span className="text-slate-400">Hospital Facility License</span>
                    <span className="font-mono text-white font-bold text-xs">HOSP-DELHI-2026-001</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5 flex justify-between items-center">
                    <span className="text-slate-400">Clinical Verification Level</span>
                    <span className="text-[#10B981] font-bold text-xs flex items-center gap-1">
                      <Check size={13} /> Level-1 Trauma & Critical Care
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5 flex justify-between items-center">
                    <span className="text-slate-400">Blood Bank License</span>
                    <span className="font-mono text-white text-xs">DL-BB-2024-9844</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5 flex justify-between items-center">
                    <span className="text-slate-400">Cryo-Storage Certification</span>
                    <span className="text-[#38BDF8] font-bold text-xs">Compliant (ISO 15189)</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5 flex justify-between items-center">
                    <span className="text-slate-400">Chief Medical Officer</span>
                    <span className="text-white font-medium text-xs">Dr. Arthur Vance, MD, FRCEM</span>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFeedback({ type: 'success', message: 'Hospital accreditation certificate downloaded.' });
                        setTimeout(() => setFeedback(null), 3000);
                      }}
                      className="btn btn-secondary text-xs py-2 px-4 rounded-xl flex items-center gap-2 font-semibold border border-white/10 hover:border-emerald-500/40 text-white cursor-pointer"
                    >
                      <ShieldCheck size={14} className="text-emerald-400" />
                      <span>Download Verified Certificate (PDF)</span>
                    </button>
                  </div>
                </div>

                {/* Right 5 cols: Seal & Status */}
                <div className="lg:col-span-5 p-4 rounded-xl bg-slate-950/60 border border-white/10 space-y-4">
                  <div className="text-center py-2">
                    <div 
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '14px',
                        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 0.75rem',
                        boxShadow: '0 0 16px rgba(16, 185, 129, 0.35)',
                        color: '#FFFFFF',
                      }}
                    >
                      <ShieldCheck size={26} />
                    </div>
                    <h3 className="text-sm font-bold text-white">City Care Super Specialty</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Level-1 Trauma & Emergency Surgery Center</p>
                  </div>

                  <div className="space-y-2 text-xs pt-2 border-t border-white/5">
                    <div className="flex justify-between p-2 rounded-lg bg-white/5">
                      <span className="text-slate-400">Accreditation Validity</span>
                      <strong className="text-white">Through Dec 2027</strong>
                    </div>
                    <div className="flex justify-between p-2 rounded-lg bg-white/5">
                      <span className="text-slate-400">Cryo-Storage Units</span>
                      <strong className="text-emerald-400 font-bold">8 Dedicated Banks</strong>
                    </div>
                    <div className="flex justify-between p-2 rounded-lg bg-white/5">
                      <span className="text-slate-400">Mesh Dispatch Protocol</span>
                      <strong className="text-[#38BDF8] font-bold">Priority Hub #1</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

