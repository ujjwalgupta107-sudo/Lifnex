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
                      <tr className="border-b border-white/10 text-slate-400 text-xs">
                        <th className="pb-3">Case ID</th>
                        <th className="pb-3">Group</th>
                        <th className="pb-3">Units Needed</th>
                        <th className="pb-3">Urgency</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300">
                      {[
                        { id: 'REQ-1042', group: 'A+', units: 2, urgency: 'critical', status: 'Coordinated', statusBadge: 'success' },
                        { id: 'REQ-1041', group: 'O-', units: 1, urgency: 'critical', status: 'En Route', statusBadge: 'warning' },
                        { id: 'REQ-1039', group: 'B+', units: 2, urgency: 'urgent', status: 'Searching', statusBadge: 'primary' },
                        { id: 'REQ-1035', group: 'O+', units: 4, urgency: 'routine', status: 'Coordinated', statusBadge: 'success' },
                      ].map((item) => (
                        <tr key={item.id} className="hover:bg-white/[0.02]">
                          <td className="py-3 font-mono font-bold text-white">{item.id}</td>
                          <td>
                            <span className="font-extrabold text-[#FF2E54] bg-[#FF2E54]/10 px-2 py-0.5 rounded border border-[#FF2E54]/30">
                              {item.group}
                            </span>
                          </td>
                          <td className="font-semibold text-slate-200">{item.units} Units</td>
                          <td>
                            <span 
                              style={{
                                color: item.urgency === 'critical' ? '#FF2E54' : item.urgency === 'urgent' ? '#F59E0B' : '#38BDF8',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                fontSize: '0.7rem',
                              }}
                            >
                              {item.urgency}
                            </span>
                          </td>
                          <td>
                            <span className={`badge badge-${item.statusBadge} text-[10px]`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="text-right">
                            <button
                              onClick={() => {
                                setSelectedCase(item);
                                setActiveTab('roster');
                              }}
                              className="text-xs text-[#38BDF8] hover:underline font-semibold"
                            >
                              View Triage →
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
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <Boxes size={18} className="text-[#38BDF8]" />
                    <h3 className="text-sm font-bold text-white">Cold-Chain Inventory Status Snapshot</h3>
                  </div>
                  <button 
                    onClick={() => setActiveTab('inventory')}
                    className="text-xs text-[#38BDF8] hover:underline font-semibold"
                  >
                    Manage Full Inventory →
                  </button>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 text-center">
                  {Object.entries(inventory).map(([group, qty]) => {
                    const isCritical = qty <= 2;
                    return (
                      <div 
                        key={group}
                        className="p-2.5 rounded-xl border"
                        style={{
                          background: isCritical ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                          borderColor: isCritical ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                        }}
                      >
                        <div className="text-xs font-bold text-white">{group}</div>
                        <div className="text-base font-black mt-0.5" style={{ color: isCritical ? '#FF2E54' : '#10B981' }}>
                          {qty}
                        </div>
                        <div className="text-[9px] text-slate-500 uppercase tracking-tight">Units</div>
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
            <div 
              className="card"
              style={{
                padding: '2rem',
                background: 'rgba(15, 23, 42, 0.88)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '18px',
              }}
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                    <Boxes className="text-[#38BDF8]" size={18} />
                    <span>Cold-Chain Blood Bank Reserve</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Thermo-regulated cryo-reserve storage status (-20°C to 4°C)</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-white">{totalReserveUnits} Units</span>
                  <div className="text-[10px] text-slate-400">Total Cold Storage</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(inventory).map(([group, qty]) => {
                  const isCritical = qty <= 2;
                  return (
                    <div 
                      key={group}
                      className="p-4 rounded-xl border relative"
                      style={{
                        background: isCritical ? 'rgba(239, 68, 68, 0.08)' : 'rgba(15, 23, 42, 0.95)',
                        borderColor: isCritical ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-base font-extrabold text-white">{group}</span>
                        <span 
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.5rem',
                            borderRadius: '9999px',
                            background: isCritical ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                            color: isCritical ? '#F87171' : '#34D399',
                            border: `1px solid ${isCritical ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
                          }}
                        >
                          {isCritical ? 'LOW RESERVE' : 'ADEQUATE'}
                        </span>
                      </div>

                      <div className="text-3xl font-black text-white mb-3">
                        {qty} <span className="text-xs font-normal text-slate-400">Units</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleInventoryChange(group, 1)}
                          className="btn btn-secondary flex-1 py-1.5 text-xs font-bold rounded-lg"
                        >
                          + Add Unit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInventoryChange(group, -1)}
                          className="btn btn-secondary flex-1 py-1.5 text-xs font-bold rounded-lg text-slate-400"
                          disabled={qty <= 0}
                        >
                          - Dispense
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: IN-TRANSIT DONOR HANDSHAKES                       */}
          {/* ======================================================== */}
          {activeTab === 'handshakes' && (
            <div 
              className="card"
              style={{
                padding: '2rem',
                background: 'rgba(15, 23, 42, 0.88)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '18px',
              }}
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                    <HeartHandshake className="text-[#10B981]" size={18} />
                    <span>In-Transit Voluntary Donor Handshakes</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Donors actively traveling toward hospital reception for intake</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 font-bold">
                  {handshakes.filter(h => h.status !== 'fulfilled').length} EN ROUTE
                </span>
              </div>

              <div className="space-y-3">
                {handshakes.map((hs) => (
                  <div 
                    key={hs.id} 
                    className="p-4 rounded-xl border border-white/10 bg-slate-950/70 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-slate-400">#{hs.id}</span>
                        <span className="font-bold text-white text-sm">{hs.donorName}</span>
                        <span className="badge badge-primary font-bold text-[10px]">{hs.bloodGroup}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                        <span>Distance: <strong className="text-slate-200">{hs.distance}</strong></span>
                        <span>Transport: <strong className="text-slate-200">{hs.transport}</strong></span>
                        <span>Estimated Arrival: <strong className="text-[#38BDF8]">{hs.eta}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {hs.status === 'fulfilled' ? (
                        <span className="badge badge-success text-xs py-1 px-3">
                          INTAKE COMPLETED
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleConfirmHandshake(hs.id)}
                          className="btn btn-primary text-xs py-2 px-3.5 rounded-xl font-bold flex items-center gap-1.5 shadow-md"
                          style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}
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
          )}

          {/* ======================================================== */}
          {/* TAB 6: CLINICAL ACCREDITATION & VERIFICATION             */}
          {/* ======================================================== */}
          {activeTab === 'accreditation' && (
            <div 
              className="card max-w-2xl"
              style={{
                padding: '2rem',
                background: 'rgba(15, 23, 42, 0.88)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '18px',
              }}
            >
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                <ShieldCheck size={32} className="text-[#10B981]" />
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">National Accreditation & Certification</h2>
                  <p className="text-xs text-slate-400">Verified by National Blood Transfusion Council (NBTC)</p>
                </div>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-slate-300">
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-slate-400">Hospital Facility License:</span>
                  <span className="font-mono text-white font-bold">HOSP-DELHI-2026-001</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-slate-400">Clinical Verification Level:</span>
                  <span className="text-[#10B981] font-bold">Level-1 Trauma & Critical Care</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-slate-400">Blood Bank License Registration:</span>
                  <span className="font-mono text-white">DL-BB-2024-9844</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-slate-400">Cryo-Storage Certification:</span>
                  <span className="text-[#38BDF8] font-bold">Compliant (ISO 15189)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-slate-400">Chief Medical Officer:</span>
                  <span className="text-white font-semibold">Dr. Arthur Vance, MD, FRCEM</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setFeedback({ type: 'success', message: 'Hospital accreditation certificate downloaded.' });
                    setTimeout(() => setFeedback(null), 3000);
                  }}
                  className="btn btn-secondary text-xs py-2.5 px-4 rounded-xl flex items-center gap-2 font-semibold"
                >
                  <ShieldCheck size={15} className="text-emerald-400" />
                  <span>Download Verified Certificate (PDF)</span>
                </button>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

