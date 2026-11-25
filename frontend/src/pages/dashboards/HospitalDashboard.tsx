import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { MetricValue } from '../../components/ui/MetricValue';
import { motion } from 'framer-motion';
import SloshGauge from '../../components/reactbits/SloshGauge';
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
    <div className="dash py-8 max-w-7xl">
      {/* Top Banner Alert */}
      {feedback && (
        <div 
          role="status" className={`dash-toast text-[15px] flex items-center justify-between  ${
            feedback.type === 'success' 
              ? 'toast-ok' 
              : 'bg-red-wash border border-line text-red-ink'
          }`}
          style={{  }}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? <CheckCircle2 size={18} className="text-ok-ink shrink-0" /> : <AlertTriangle size={18} className="text-red-ink shrink-0" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-muted hover:text-ink transition-colors">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Top Header Card */}
      <div className="dashboard-greeting-row mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="dash-title">
              Hospital Coordination Desk
            </h1>
            <span 
              className="badge"
              style={{
                background: 'var(--ok-wash)',
                color: 'var(--ok-ink)',
                border: '1px solid transparent',
                padding: '0.25rem 0.65rem',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--ok)', display: 'inline-block' }}></span>
              FACILITY VERIFIED
            </span>
          </div>
          <p className="text-[13.5px] sm:text-[15px] text-muted mt-1">
            City Care Super Specialty Hospital, Clinical Coordinator: <strong className="text-ink">Dr. Arthur Vance</strong>
          </p>
        </div>

        {/* Quick Broadcast Action */}
        <button
          onClick={() => setActiveTab('broadcast')}
          className="btn btn-primary text-[13.5px] py-2.5 px-4 rounded-xl flex items-center gap-2 font-bold "
          style={{
            background: 'var(--red)',
            boxShadow: 'none',
          }}
        >
          <PlusCircle size={15} />
          <span>Broadcast Emergency Shortage</span>
        </button>
      </div>

      {/* 4-Stat Metric Cards */}
      <div className="metrics-row mb-8">
        <div className="metric-card">
          <MetricValue className="metric-val val-crimson">{requests.length || 18} Active</MetricValue>
          <div className="metric-lbl">Trauma Cases</div>
        </div>
        <div className="metric-card">
          <MetricValue className="metric-val val-teal">{handshakes.length} Handshakes</MetricValue>
          <div className="metric-lbl">Coordinated In-Transit</div>
        </div>
        <div className="metric-card">
          <MetricValue className="metric-val val-navy">{totalReserveUnits} Units</MetricValue>
          <div className="metric-lbl">Cold-Chain Reserve</div>
        </div>
        <div className="metric-card">
          <MetricValue className="metric-val val-navy">14 min</MetricValue>
          <div className="metric-lbl">Avg Arrival Time</div>
        </div>
      </div>

      {/* 2-COLUMN LAYOUT: LEFT SIDEBAR + MAIN CONTENT */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* ======================================================== */}
        {/* LEFT SIDEBAR NAVIGATION PANEL                            */}
        {/* ======================================================== */}
        <aside className="dash-aside md:col-span-4 lg:col-span-3">
          <div 
            className="donor-sidebar-card"
          >
            {/* Hospital Mini Profile */}
            <div className="flex items-center gap-3 pb-4 mb-4 border-b border-line">
              <div 
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'var(--red)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--on-red)',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  boxShadow: 'none',
                }}
              >
                🏥
              </div>
              <div className="min-w-0">
                <div className="text-[15px] font-bold text-ink truncate">City Care Hospital</div>
                <div className="text-[12.5px] text-muted flex items-center gap-1.5">
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--ok)', display: 'inline-block' }}></span>
                  <span>Trauma Center, NBTC</span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs List */}
            <div className="text-[12.5px] font-bold  text-muted mb-2 px-1">
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
                  >
                    {isActive && <motion.span layoutId="dash-plate" className="dash-plate" transition={{ type: 'spring', duration: 0.5, bounce: 0.18 }} />}
                    <div className="flex items-center gap-2.5">
                      <Icon size={16} className={isActive ? 'text-on-red' : 'text-muted'} />
                      <span>{item.label}</span>
                    </div>

                    {item.count !== null && item.count > 0 && (
                      <span 
                        className="donor-sidebar-badge"
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Sidebar Bottom Hotline */}
            <div className="mt-5 pt-4 border-t border-line">
              <div className="p-3 rounded-xl bg-sunk border border-line space-y-1">
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="text-muted">Emergency Protocol</span>
                  <span className="text-ok-ink font-bold">Level-1 Trauma</span>
                </div>
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="text-muted">Blood Bank Desk</span>
                  <span className="text-ink font-mono text-[12.5px]">EXT: 4022</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ======================================================== */}
        {/* RIGHT MAIN CONTENT AREA                                  */}
        {/* ======================================================== */}
        <main key={activeTab} className="panel-in min-w-0 md:col-span-8 lg:col-span-9 space-y-6">

          {/* ======================================================== */}
          {/* TAB 1: DESK OVERVIEW                                     */}
          {/* ======================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Emergency Summary Table */}
              <div 
                className="card"
              >
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-ink tracking-tight flex items-center gap-2">
                      <Activity className="text-red-ink" size={18} />
                      <span>Live Emergency Requisition Roster</span>
                    </h2>
                    <p className="text-[13.5px] text-muted mt-0.5">Active clinical cases undergoing sub-second voluntary donor routing</p>
                  </div>
                  <button 
                    onClick={loadRequests} 
                    className="btn btn-secondary btn-sm flex items-center gap-1.5 text-[13.5px] py-1 px-3 rounded-lg"
                  >
                    <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                    <span>Refresh</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[13.5px] sm:text-[15px]">
                    <thead>
                      <tr className="border-b border-line text-muted text-[12.5px] font-bold ">
                        <th className="pb-3.5 px-3">Case ID</th>
                        <th className="pb-3.5 px-3">Blood Group</th>
                        <th className="pb-3.5 px-3">Volume Needed</th>
                        <th className="pb-3.5 px-3">Urgency Priority</th>
                        <th className="pb-3.5 px-3">Mesh Status</th>
                        <th className="pb-3.5 px-3 text-right">Triage Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line text-muted">
                      {[
                        { id: 'REQ-1042', group: 'A+', units: 2, urgency: 'critical', status: 'Coordinated', statusBadge: 'success' },
                        { id: 'REQ-1041', group: 'O-', units: 1, urgency: 'critical', status: 'En Route', statusBadge: 'warning' },
                        { id: 'REQ-1039', group: 'B+', units: 2, urgency: 'urgent', status: 'Searching', statusBadge: 'primary' },
                        { id: 'REQ-1035', group: 'O+', units: 4, urgency: 'routine', status: 'Coordinated', statusBadge: 'success' },
                      ].map((item) => (
                        <tr key={item.id} className="hover:bg-sunk transition-colors">
                          <td className="py-3.5 px-3 font-mono font-bold text-ink text-[13.5px]">{item.id}</td>
                          <td className="py-3.5 px-3">
                            <span 
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '34px',
                                height: '26px',
                                borderRadius: '6px',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                color: 'var(--red-ink)',
                                background: 'var(--red-wash)',
                                border: '1px solid transparent',
                              }}
                            >
                              {item.group}
                            </span>
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="font-bold text-ink text-[13.5px]">{item.units} Units</div>
                            <div className="text-[12.5px] text-faint font-medium">Whole Blood / RBC</div>
                          </td>
                          <td className="py-3.5 px-3">
                            {item.urgency === 'critical' ? (
                              <span className="px-2.5 py-1 rounded-full text-[12.5px] font-bold bg-red-wash text-red-ink border border-line inline-flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-red animate-pulse"></span>
                                CRITICAL
                              </span>
                            ) : item.urgency === 'urgent' ? (
                              <span className="px-2.5 py-1 rounded-full text-[12.5px] font-bold bg-plasma-wash text-plasma-ink border border-line inline-flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-plasma"></span>
                                URGENT
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[12.5px] font-bold bg-info-wash text-info-ink border border-line inline-flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-info-ink"></span>
                                ROUTINE
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-3">
                            {item.statusBadge === 'success' ? (
                              <span className="px-2.5 py-1 rounded-full text-[12.5px] font-bold bg-ok-wash text-ok-ink border border-line inline-flex items-center gap-1">
                                <Check size={11} />
                                {item.status}
                              </span>
                            ) : item.statusBadge === 'warning' ? (
                              <span className="px-2.5 py-1 rounded-full text-[12.5px] font-bold bg-plasma-wash text-plasma-ink border border-line inline-flex items-center gap-1">
                                <Clock size={11} />
                                {item.status}
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[12.5px] font-bold bg-red-wash text-red-ink border border-red inline-flex items-center gap-1">
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
                              className="btn btn-secondary text-[13.5px] py-1.5 px-3 rounded-lg font-bold inline-flex items-center gap-1 text-info-ink hover:text-ink border border-line hover:border-red-ink/40 transition-colors"
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
              >
                <div className="flex justify-between items-center mb-3.5 pb-2.5 border-b border-line">
                  <div className="flex items-center gap-2">
                    <Boxes size={18} className="text-info-ink" />
                    <h3 className="text-[15px] font-bold text-ink">Cold-Chain Inventory Status Snapshot</h3>
                  </div>
                  <button 
                    onClick={() => setActiveTab('inventory')}
                    className="text-[13.5px] text-info-ink hover:underline font-semibold flex items-center gap-1"
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
                        className="p-3 rounded-xl border transition-all hover:border-line-strong"
                        style={{
                          background: isCritical ? 'var(--red-wash)' : 'var(--sunk)',
                          borderColor: isCritical ? 'var(--red-wash)' : 'var(--sunk)',
                          boxShadow: 'none',
                        }}
                      >
                        <div className="text-[13.5px] font-bold text-ink">{group}</div>
                        <div className="text-xl font-bold mt-0.5" style={{ color: isCritical ? 'var(--red-ink)' : 'var(--ok-ink)' }}>
                          {qty}
                        </div>
                        <div 
                          className="text-[12.5px] font-bold  mt-1 px-1.5 py-0.5 rounded-full inline-block"
                          style={{
                            background: isCritical ? 'var(--red-wash)' : 'var(--ok-wash)',
                            color: isCritical ? 'var(--red-ink)' : 'var(--ok-ink)',
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
                  <h2 className="text-lg font-bold text-ink tracking-tight flex items-center gap-2">
                    <FileText className="text-red-ink" size={18} />
                    <span>Clinical Emergency Requisitions ({requests.length || 4})</span>
                  </h2>
                  <p className="text-[13.5px] text-muted mt-0.5">Real-time trauma intake requirements broadcast to nearby mesh</p>
                </div>
                <button 
                  onClick={loadRequests} 
                  className="btn btn-secondary btn-sm flex items-center gap-1.5 text-[13.5px] py-1.5 px-3 rounded-lg"
                >
                  <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                  <span>Refresh</span>
                </button>
              </div>

              {requests.length === 0 ? (
                <div className="card p-8 text-center text-muted">
                  <p className="text-[15px]">No live requests from backend yet. Use the broadcast tab to create one.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.map((req) => (
                    <div 
                      key={req.id} 
                      className="card p-4 rounded-xl border border-line bg-sunk flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[13.5px] font-bold text-ink bg-sunk px-2 py-0.5 rounded">
                            #{req.id?.slice(0, 8) || 'REQ'}
                          </span>
                          <span className="badge badge-primary font-bold text-[12.5px]">{req.blood_group}</span>
                          <span className="text-ink font-bold text-[15px]">{req.units_required} Units Required</span>
                          <span className="text-[13.5px] text-muted">• Urgency: <strong className="text-red-ink">{req.urgency_level || 'critical'}</strong></span>
                        </div>
                        <p className="text-[13.5px] text-muted">{req.clinical_notes || 'Trauma surgery transfusion requisition.'}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="badge badge-success text-[12.5px]">
                          {req.status?.toUpperCase() || 'ACTIVE'}
                        </span>
                        <button 
                          onClick={() => {
                            setFeedback({ type: 'success', message: `Case #${req.id?.slice(0, 8)} marked as fulfilled by receiving ward.` });
                            setTimeout(() => setFeedback(null), 3000);
                          }}
                          className="btn btn-secondary text-[13.5px] py-1.5 px-3 rounded-lg"
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
            >
              <div className="mb-6 pb-4 border-b border-line flex items-start justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12.5px] font-bold  bg-red-wash text-red-ink border border-red mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red animate-pulse"></span>
                    Clinical Emergency Broadcast
                  </div>
                  <h2 className="text-xl font-bold text-ink tracking-tight">Broadcast Hospital Blood Shortage</h2>
                  <p className="text-[13.5px] text-muted mt-1">
                    Instantly ping all voluntary blood donors in the New Delhi metropolitan geofence
                  </p>
                </div>
                <button 
                  type="button" 
                  onClick={() => setActiveTab('overview')}
                  className="text-muted hover:text-ink transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleBroadcast} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-group mb-0">
                    <label className="text-[13.5px] font-semibold text-muted block mb-1.5">
                      Blood Group Needed <span className="text-red-ink">*</span>
                    </label>
                    <select 
                      className="form-control text-[15px] py-2 px-3 bg-sunk border-line text-ink rounded-lg "
                      value={bBloodGroup} 
                      onChange={(e) => setBBloodGroup(e.target.value)}
                    >
                      {['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'].map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group mb-0">
                    <label className="text-[13.5px] font-semibold text-muted block mb-1.5">
                      Units Required (Whole Blood / RBC) <span className="text-red-ink">*</span>
                    </label>
                    <input 
                      type="number" 
                      min={1} 
                      max={20} 
                      className="form-control text-[15px] py-2 px-3 bg-sunk border-line text-ink rounded-lg " 
                      value={bUnits} 
                      onChange={(e) => setBUnits(Number(e.target.value))} 
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-group mb-0">
                    <label className="text-[13.5px] font-semibold text-muted block mb-1.5">
                      Urgency Level <span className="text-red-ink">*</span>
                    </label>
                    <select 
                      className="form-control text-[15px] py-2 px-3 bg-sunk border-line text-ink rounded-lg "
                      value={bUrgency} 
                      onChange={(e) => setBUrgency(e.target.value as any)}
                    >
                      <option value="critical">🔴 Critical (Immediate surgical transfusion)</option>
                      <option value="urgent">🟠 Urgent (Within 2-4 hours)</option>
                      <option value="routine">🟡 Routine (Resupply / Scheduled)</option>
                    </select>
                  </div>

                  <div className="form-group mb-0">
                    <label className="text-[13.5px] font-semibold text-muted block mb-1.5">
                      Operating Ward / Surgical Bed
                    </label>
                    <input 
                      type="text" 
                      className="form-control text-[15px] py-2 px-3 bg-sunk border-line text-ink rounded-lg " 
                      value={bWard} 
                      onChange={(e) => setBWard(e.target.value)} 
                      required 
                    />
                  </div>
                </div>

                <div className="form-group mb-0">
                  <label className="text-[13.5px] font-semibold text-muted block mb-1.5">
                    Attending Chief Physician
                  </label>
                  <input 
                    type="text" 
                    className="form-control text-[15px] py-2 px-3 bg-sunk border-line text-ink rounded-lg " 
                    value={bPhysician} 
                    onChange={(e) => setBPhysician(e.target.value)} 
                    required 
                  />
                </div>

                <div className="form-group mb-0">
                  <label className="text-[13.5px] font-semibold text-muted block mb-1.5">
                    Clinical Transfusion Protocol & Instructions
                  </label>
                  <textarea 
                    className="form-control text-[15px] py-2 px-3 bg-sunk border-line text-ink rounded-lg " 
                    rows={3} 
                    value={bNotes} 
                    onChange={(e) => setBNotes(e.target.value)} 
                    required 
                  />
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button 
                    type="submit" 
                    className="btn btn-primary flex-1 py-3 font-bold text-[15px]  flex items-center justify-center gap-2 rounded-xl"
                    style={{
                      background: 'var(--red)',
                      boxShadow: 'none',
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
                    className="btn btn-secondary py-3 px-4 text-[13.5px] font-semibold rounded-xl"
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
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 pb-4 border-b border-line">
                  <div>
                    <h2 className="text-lg font-bold text-ink tracking-tight flex items-center gap-2">
                      <Boxes className="text-info-ink" size={20} />
                      <span>Cold-Chain Blood Bank Cryo-Reserve</span>
                    </h2>
                    <p className="text-[13.5px] text-muted mt-0.5">Thermo-regulated cryo-reserve storage status (-20°C to 4°C) with real-time stock adjustment</p>
                  </div>
                  <div className="sm:text-right flex sm:flex-col items-center sm:items-end gap-2 sm:gap-0">
                    <span className="text-xl font-bold text-ink font-mono">{totalReserveUnits} Total Units</span>
                    <span className="text-[12.5px] text-ok-ink font-semibold flex items-center gap-1">
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
                        className="p-3.5 rounded-xl border relative transition-all hover:border-line-strong"
                        style={{
                          background: isCritical ? 'var(--red-wash)' : 'var(--surface)',
                          borderColor: isCritical ? 'var(--red-wash)' : 'var(--sunk)',
                          boxShadow: 'none',
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
                              fontWeight: 700,
                              fontSize: '0.9rem',
                              color: isCritical ? 'var(--on-red)' : 'var(--ink)',
                              background: isCritical ? 'var(--red)' : 'var(--sunk)',
                              border: isCritical ? '1px solid var(--red)' : '1px solid var(--line)',
                            }}
                          >
                            {group}
                          </span>
                          <span 
                            style={{
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              padding: '0.15rem 0.5rem',
                              borderRadius: '9999px',
                              background: isCritical ? 'var(--red-wash)' : 'var(--ok-wash)',
                              color: isCritical ? 'var(--red-ink)' : 'var(--ok-ink)',
                              border: '1px solid transparent',
                            }}
                          >
                            {isCritical ? 'LOW RESERVE' : 'ADEQUATE'}
                          </span>
                        </div>

                        <div className="my-4 flex items-end justify-between gap-3">
                          <div>
                            <div className="text-[2.6rem] font-bold leading-none tracking-tight text-ink">{qty}</div>
                            <div className="mt-2 text-[13.5px] text-muted">units, {qty * 450} ml</div>
                          </div>
                          <SloshGauge
                            value={fillPercent}
                            interactive={false}
                            showValue={false}
                            ticks={3}
                            liquidColor={isCritical ? 'var(--plasma)' : 'var(--red)'}
                            glassColor="var(--sunk)"
                            width={66}
                            height={104}
                            radius={20}
                            ariaLabel={`${group} reserve level`}
                          />
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-line text-[13.5px]">
                          <span className="text-muted text-[12.5px]">Adjust Stock:</span>
                          <div className="flex items-center gap-1.5 bg-sunk border border-line rounded-lg p-0.5">
                            <button
                              type="button"
                              onClick={() => handleInventoryChange(group, -1)}
                              className="w-6 h-6 rounded text-muted hover:text-ink hover:bg-sunk flex items-center justify-center font-bold text-[13.5px] transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                              disabled={qty <= 0}
                              title="Dispense 1 Unit"
                            >
                              -
                            </button>
                            <span className="w-5 text-center font-bold text-ink text-[13.5px]">{qty}</span>
                            <button
                              type="button"
                              onClick={() => handleInventoryChange(group, 1)}
                              className="w-6 h-6 rounded text-muted hover:text-ink hover:bg-sunk flex items-center justify-center font-bold text-[13.5px] transition-colors cursor-pointer"
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
                <div className="mt-6 pt-4 border-t border-line flex flex-wrap items-center justify-between gap-3 text-[13.5px] text-muted">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-muted">
                      <span className="w-2 h-2 rounded-full bg-ok inline-block"></span>
                      Temp: <strong className="text-ink">-20.4°C</strong> (Cryo-Storage Spec)
                    </span>
                    <span className="flex items-center gap-1.5 text-muted">
                      <span className="w-2 h-2 rounded-full bg-info-ink inline-block"></span>
                      Power: <strong className="text-ink">Dual UPS Grid Online</strong>
                    </span>
                  </div>
                  <span className="text-[12.5px] text-faint font-mono">Sensors: 8/8 Calibrated</span>
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
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 pb-4 border-b border-line">
                  <div>
                    <h2 className="text-lg font-bold text-ink tracking-tight flex items-center gap-2">
                      <HeartHandshake className="text-ok-ink" size={20} />
                      <span>In-Transit Voluntary Donor Handshakes</span>
                    </h2>
                    <p className="text-[13.5px] text-muted mt-0.5">Donors actively traveling toward hospital reception for immediate intake verification</p>
                  </div>
                  <span className="text-[13.5px] px-3 py-1 rounded-full bg-ok-wash text-ok-ink border border-line font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-ok animate-pulse"></span>
                    {handshakes.filter(h => h.status !== 'fulfilled').length} ACTIVE EN ROUTE
                  </span>
                </div>

                <div className="space-y-3.5">
                  {handshakes.map((hs) => (
                    <div 
                      key={hs.id} 
                      className="p-4 rounded-xl border border-line bg-sunk hover:border-line-strong transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-ok-wash border border-line flex items-center justify-center text-ok-ink shrink-0 mt-0.5">
                          <Activity size={20} />
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-[13.5px] text-muted font-bold">#{hs.id}</span>
                            <span className="font-bold text-ink text-[15px]">{hs.donorName}</span>
                            <span 
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                color: 'var(--red-ink)',
                                background: 'var(--red-wash)',
                                border: '1px solid transparent',
                              }}
                            >
                              {hs.bloodGroup}
                            </span>
                            <span className="text-[12.5px] px-2 py-0.5 rounded-full bg-ok-wash text-ok-ink border border-line font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-ok animate-pulse"></span>
                              DISPATCHED
                            </span>
                          </div>

                          <div className="text-[13.5px] text-muted flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5">
                            <span className="flex items-center gap-1 text-muted">
                              <MapPin size={12} className="text-muted" />
                              Distance: <strong className="text-ink">{hs.distance}</strong>
                            </span>
                            <span>•</span>
                            <span>Transport: <strong className="text-ink">{hs.transport}</strong></span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-info-ink font-bold">
                              <Clock size={12} />
                              ETA: {hs.eta}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 w-full sm:w-auto pt-2 sm:pt-0 flex justify-end">
                        {hs.status === 'fulfilled' ? (
                          <span className="px-3 py-1.5 rounded-lg bg-ok-wash text-ok-ink border border-line text-[13.5px] font-bold flex items-center gap-1.5">
                            <Check size={14} />
                            INTAKE CONFIRMED
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleConfirmHandshake(hs.id)}
                            className="text-[13.5px] py-2 px-4 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer border hover:bg-ok-wash"
                            style={{ 
                              background: 'var(--ok-wash)', 
                              borderColor: 'var(--ok-wash)',
                              color: 'var(--ok-ink)',
                              boxShadow: 'none' 
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
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: '16px',
                boxShadow: 'none',
                
              }}
            >
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-line">
                <div className="flex items-center gap-3">
                  <ShieldCheck size={26} className="text-ok-ink" />
                  <div>
                    <h2 className="text-lg font-bold text-ink tracking-tight">National Accreditation & Certification</h2>
                    <p className="text-[13.5px] text-muted mt-0.5">Verified by National Blood Transfusion Council (NBTC)</p>
                  </div>
                </div>
                <span className="text-[12.5px] px-2.5 py-1 rounded-full bg-ok-wash text-ok-ink border border-line font-bold">
                  ACCREDITED FACILITY
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left 7 cols: License Details */}
                <div className="lg:col-span-7 space-y-3 text-[13.5px] sm:text-[15px]">
                  <div className="p-3 rounded-xl bg-sunk border border-line flex justify-between items-center">
                    <span className="text-muted">Hospital Facility License</span>
                    <span className="font-mono text-ink font-bold text-[13.5px]">HOSP-DELHI-2026-001</span>
                  </div>

                  <div className="p-3 rounded-xl bg-sunk border border-line flex justify-between items-center">
                    <span className="text-muted">Clinical Verification Level</span>
                    <span className="text-ok-ink font-bold text-[13.5px] flex items-center gap-1">
                      <Check size={13} /> Level-1 Trauma & Critical Care
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-sunk border border-line flex justify-between items-center">
                    <span className="text-muted">Blood Bank License</span>
                    <span className="font-mono text-ink text-[13.5px]">DL-BB-2024-9844</span>
                  </div>

                  <div className="p-3 rounded-xl bg-sunk border border-line flex justify-between items-center">
                    <span className="text-muted">Cryo-Storage Certification</span>
                    <span className="text-info-ink font-bold text-[13.5px]">Compliant (ISO 15189)</span>
                  </div>

                  <div className="p-3 rounded-xl bg-sunk border border-line flex justify-between items-center">
                    <span className="text-muted">Chief Medical Officer</span>
                    <span className="text-ink font-medium text-[13.5px]">Dr. Arthur Vance, MD, FRCEM</span>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFeedback({ type: 'success', message: 'Hospital accreditation certificate downloaded.' });
                        setTimeout(() => setFeedback(null), 3000);
                      }}
                      className="btn btn-secondary text-[13.5px] py-2 px-4 rounded-xl flex items-center gap-2 font-semibold border border-line hover:border-line-strong text-ink cursor-pointer"
                    >
                      <ShieldCheck size={14} className="text-ok-ink" />
                      <span>Download Verified Certificate (PDF)</span>
                    </button>
                  </div>
                </div>

                {/* Right 5 cols: Seal & Status */}
                <div className="lg:col-span-5 p-4 rounded-xl bg-sunk border border-line space-y-4">
                  <div className="text-center py-2">
                    <div 
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '14px',
                        background: 'var(--ok-fill)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 0.75rem',
                        boxShadow: 'none',
                        color: 'var(--on-red)',
                      }}
                    >
                      <ShieldCheck size={26} />
                    </div>
                    <h3 className="text-[15px] font-bold text-ink">City Care Super Specialty</h3>
                    <p className="text-[12.5px] text-muted mt-0.5">Level-1 Trauma & Emergency Surgery Center</p>
                  </div>

                  <div className="space-y-2 text-[13.5px] pt-2 border-t border-line">
                    <div className="flex justify-between p-2 rounded-lg bg-sunk">
                      <span className="text-muted">Accreditation Validity</span>
                      <strong className="text-ink">Through Dec 2027</strong>
                    </div>
                    <div className="flex justify-between p-2 rounded-lg bg-sunk">
                      <span className="text-muted">Cryo-Storage Units</span>
                      <strong className="text-ok-ink font-bold">8 Dedicated Banks</strong>
                    </div>
                    <div className="flex justify-between p-2 rounded-lg bg-sunk">
                      <span className="text-muted">Mesh Dispatch Protocol</span>
                      <strong className="text-info-ink font-bold">Priority Hub #1</strong>
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

