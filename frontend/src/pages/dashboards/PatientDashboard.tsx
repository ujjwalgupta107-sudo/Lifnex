import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { 
  PlusCircle, Activity, ShieldCheck, Clock, MapPin, 
  CheckCircle, AlertCircle, RefreshCw, X, Send, Eye,
  Building2, Droplets, Zap, Check
} from 'lucide-react';

export const PatientDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'requests' | 'create'>('requests');
  const [bloodGroup, setBloodGroup] = useState('O-');
  const [units, setUnits] = useState(2);
  const [urgency, setUrgency] = useState<'routine' | 'urgent' | 'critical'>('critical');
  const [hospitalId, setHospitalId] = useState('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
  const [notes, setNotes] = useState('Immediate trauma surgery blood transfusion required.');
  
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [matchingDonors, setMatchingDonors] = useState<any[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load hospitals on mount
  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const res = await api.getHospitals();
        if (res.data && Array.isArray(res.data)) {
          setHospitals(res.data);
          if (res.data.length > 0 && !hospitalId) {
            setHospitalId(res.data[0].id);
          }
        }
      } catch (e) {
        console.warn('Could not load hospitals:', e);
      }
    };
    fetchHospitals();
  }, []);

  // Load patient's existing emergency requests from Flask backend
  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await api.getBloodRequests();
      if (res.success && Array.isArray(res.data)) {
        setMyRequests(res.data);
        if (res.data.length > 0) {
          const reqToSelect = selectedRequestId || res.data[0].id;
          setSelectedRequestId(reqToSelect);
          fetchMatchingDonors(reqToSelect);
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchingDonors = async (reqId: string) => {
    try {
      const res = await api.getMatchingDonors(reqId);
      if (res.success) {
        setMatchingDonors(res.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        hospital_id: hospitalId || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        blood_group: bloodGroup,
        units_required: Number(units),
        urgency_level: urgency,
        clinical_notes: notes,
      };

      const res = await api.createBloodRequest(payload);
      if (res.success) {
        setFeedback({ 
          type: 'success', 
          message: `Emergency requisition for ${units} Units of ${bloodGroup} dispatched successfully! Matching donors alerted.` 
        });
        
        // Refresh requests list and navigate to My Requests tab
        await loadRequests();
        if (res.data?.id) {
          setSelectedRequestId(res.data.id);
          fetchMatchingDonors(res.data.id);
        }
        setActiveTab('requests');
      } else {
        setFeedback({ type: 'error', message: res.error?.message || 'Failed to submit requisition.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Submission network error.' });
    } finally {
      setSubmitting(false);
    }
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleCancelRequest = async (reqId: string) => {
    try {
      const res = await api.cancelBloodRequest(reqId);
      if (res.success) {
        setFeedback({ type: 'success', message: 'Emergency request has been cancelled.' });
        setMyRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'cancelled' } : r));
      } else {
        setFeedback({ type: 'error', message: res.error?.message || 'Could not cancel request.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Cancellation error.' });
    }
    setTimeout(() => setFeedback(null), 3000);
  };

  const applyPreset = (presetGroup: string, presetUnits: number, presetUrgency: 'critical' | 'urgent' | 'routine', presetNotes: string) => {
    setBloodGroup(presetGroup);
    setUnits(presetUnits);
    setUrgency(presetUrgency);
    setNotes(presetNotes);
    setFeedback({ type: 'success', message: `Loaded ${presetUrgency.toUpperCase()} preset details.` });
    setTimeout(() => setFeedback(null), 2500);
  };

  return (
    <div className="container py-8 max-w-7xl">
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
            {feedback.type === 'success' ? <CheckCircle size={18} className="text-emerald-400 shrink-0" /> : <AlertCircle size={18} className="text-[#FF2E54] shrink-0" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Top Greeting Header */}
      <div className="dashboard-greeting-row mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Patient Emergency Portal</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">Broadcast immediate blood unit requirements to local voluntary donor meshes</p>
        </div>
        <button 
          onClick={() => setActiveTab('create')} 
          className="btn btn-primary text-xs py-2 px-4 rounded-xl flex items-center gap-2 shadow-lg"
          style={{
            background: 'linear-gradient(135deg, #FF2E54 0%, #D61238 100%)',
            boxShadow: '0 4px 15px rgba(255, 46, 84, 0.4)',
          }}
        >
          <PlusCircle size={15} />
          <span>Create Emergency Request</span>
        </button>
      </div>

      {/* 4 Stats Cards */}
      <div className="metrics-row mb-8">
        <div className="metric-card">
          <div className="metric-val val-crimson">{myRequests.filter(r => r.status === 'open' || r.status === 'in_progress').length || 1}</div>
          <div className="metric-lbl">Active Requisitions</div>
        </div>
        <div className="metric-card">
          <div className="metric-val val-teal">{matchingDonors.length || 17}</div>
          <div className="metric-lbl">Matching Donors</div>
        </div>
        <div className="metric-card">
          <div className="metric-val val-navy">City Care</div>
          <div className="metric-lbl">Receiving Hospital</div>
        </div>
        <div className="metric-card">
          <div className="metric-val val-navy">25 min</div>
          <div className="metric-lbl">Fastest Arrival ETA</div>
        </div>
      </div>

      {/* Upgraded Left-Aligned Tab Navigation Bar */}
      <div 
        className="flex items-center justify-between mb-6 pb-4 border-b border-white/10"
        style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}
      >
        {/* Left Side: Modern Dual Tabs */}
        <div 
          className="dashboard-tab-group"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '14px',
            padding: '5px',
            backdropFilter: 'blur(16px)',
          }}
        >
          {/* Tab 1: My Requests */}
          <button
            type="button"
            id="tab-btn-requests"
            onClick={() => setActiveTab('requests')}
            className={`dashboard-tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0.65rem 1.15rem',
              borderRadius: '10px',
              fontSize: '0.8125rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              border: activeTab === 'requests' ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid transparent',
              background: activeTab === 'requests' ? 'linear-gradient(135deg, #FF2E54 0%, #D61238 100%)' : 'transparent',
              color: activeTab === 'requests' ? '#FFFFFF' : '#94A3B8',
              boxShadow: activeTab === 'requests' ? '0 4px 14px rgba(255, 46, 84, 0.45)' : 'none',
            }}
          >
            <Activity size={15} />
            <span>My Requests</span>
            <span 
              className="dashboard-tab-badge"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2px 7px',
                borderRadius: '9999px',
                fontSize: '0.7rem',
                fontWeight: 800,
                background: activeTab === 'requests' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                color: activeTab === 'requests' ? '#FFFFFF' : '#CBD5E1',
              }}
            >
              {myRequests.length}
            </span>
          </button>

          {/* Tab 2: New Emergency Request */}
          <button
            type="button"
            id="tab-btn-create"
            onClick={() => setActiveTab('create')}
            className={`dashboard-tab-btn ${activeTab === 'create' ? 'active' : ''}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0.65rem 1.15rem',
              borderRadius: '10px',
              fontSize: '0.8125rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              border: activeTab === 'create' ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid transparent',
              background: activeTab === 'create' ? 'linear-gradient(135deg, #FF2E54 0%, #D61238 100%)' : 'transparent',
              color: activeTab === 'create' ? '#FFFFFF' : '#94A3B8',
              boxShadow: activeTab === 'create' ? '0 4px 14px rgba(255, 46, 84, 0.45)' : 'none',
            }}
          >
            <PlusCircle size={15} />
            <span>New Emergency Request</span>
            <span 
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: activeTab === 'create' ? '#FFFFFF' : '#FF2E54',
                display: 'inline-block',
                boxShadow: '0 0 6px #FF2E54',
              }}
            ></span>
          </button>
        </div>

        {/* Right Side: Live Triage Network Indicator */}
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
          <span 
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#10B981',
              display: 'inline-block',
              boxShadow: '0 0 8px #10B981',
            }}
          ></span>
          <span>Triage Grid Online • Sub-Second Dispatch</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1 CONTENT: MY REQUESTS & MATCHING DONORS             */}
      {/* ======================================================== */}
      {activeTab === 'requests' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Requisitions List */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Submitted Requests</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {myRequests.length} Total
                </span>
              </h2>
              
              {/* Upgraded Refresh Feed Button */}
              <button 
                onClick={loadRequests} 
                className="btn btn-secondary btn-sm"
                style={{
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#CBD5E1',
                  cursor: 'pointer',
                }}
              >
                <RefreshCw size={13} className={loading ? 'animate-spin text-[#FF2E54]' : ''} />
                <span>Refresh Feed</span>
              </button>
            </div>

            {myRequests.length === 0 ? (
              <div 
                className="card text-center text-slate-400"
                style={{
                  padding: '3rem 2rem',
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px dashed rgba(255, 255, 255, 0.15)',
                  borderRadius: '16px',
                }}
              >
                <Droplets size={36} className="mx-auto mb-3 text-slate-500 opacity-60" />
                <h3 className="text-base font-bold text-white mb-1">No Emergency Requests Dispatched</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
                  Broadcast an emergency blood requisition across our verified voluntary donor network in seconds.
                </p>
                <button 
                  onClick={() => setActiveTab('create')} 
                  className="btn btn-primary btn-sm text-xs font-bold py-2 px-4 rounded-xl"
                  style={{
                    background: 'linear-gradient(135deg, #FF2E54 0%, #D61238 100%)',
                    boxShadow: '0 4px 12px rgba(255, 46, 84, 0.35)',
                  }}
                >
                  Create Emergency Requisition →
                </button>
              </div>
            ) : (
              myRequests.map((req) => {
                const isSelected = selectedRequestId === req.id;
                const isCancelled = req.status === 'cancelled';
                return (
                  <div 
                    key={req.id} 
                    className="card transition-all"
                    style={{
                      padding: '1.25rem',
                      cursor: 'pointer',
                      borderRadius: '14px',
                      background: isSelected 
                        ? 'rgba(17, 24, 39, 0.95)' 
                        : 'rgba(15, 23, 42, 0.65)',
                      border: isSelected 
                        ? '1px solid #FF2E54' 
                        : '1px solid rgba(255, 255, 255, 0.08)',
                      boxShadow: isSelected 
                        ? '0 10px 25px rgba(255, 46, 84, 0.15), 0 0 15px rgba(255, 46, 84, 0.1)' 
                        : '0 4px 15px rgba(0, 0, 0, 0.3)',
                    }}
                    onClick={() => {
                      setSelectedRequestId(req.id);
                      fetchMatchingDonors(req.id);
                    }}
                  >
                    <div className="flex justify-between items-start mb-2.5">
                      <div className="flex items-center gap-2.5">
                        <span 
                          style={{
                            background: 'rgba(255, 46, 84, 0.15)',
                            color: '#FF2E54',
                            border: '1px solid rgba(255, 46, 84, 0.3)',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '6px',
                            fontWeight: 800,
                            fontSize: '0.85rem',
                          }}
                        >
                          {req.blood_group}
                        </span>
                        <span className="text-white font-bold text-sm tracking-tight">
                          {req.units_required} Units Required
                        </span>
                      </div>
                      
                      <span 
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.6rem',
                          borderRadius: '9999px',
                          textTransform: 'uppercase',
                          background: isCancelled 
                            ? 'rgba(100, 116, 139, 0.2)' 
                            : req.status === 'open' 
                              ? 'rgba(245, 158, 11, 0.2)' 
                              : 'rgba(16, 185, 129, 0.2)',
                          color: isCancelled 
                            ? '#94A3B8' 
                            : req.status === 'open' 
                              ? '#FBBF24' 
                              : '#34D399',
                          border: `1px solid ${isCancelled ? 'rgba(100, 116, 139, 0.3)' : req.status === 'open' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
                        }}
                      >
                        {req.status?.toUpperCase() || 'ACTIVE'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 font-medium mb-1.5 flex items-center gap-1.5">
                      <Building2 size={13} className="text-slate-400" />
                      <span>{req.hospital_name || 'City Care Super Specialty Hospital'}</span>
                    </p>
                    
                    <p className="text-[11px] text-slate-400 mb-3 bg-black/20 p-2 rounded-lg border border-white/5">
                      {req.clinical_notes || 'Trauma surgery priority requisition.'}
                    </p>

                    <div 
                      className="flex justify-between items-center text-xs pt-2.5 border-t border-white/10"
                      style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 text-[11px]">Urgency:</span>
                        <span 
                          style={{
                            fontWeight: 700,
                            color: req.urgency_level === 'critical' ? '#FF2E54' : req.urgency_level === 'urgent' ? '#F59E0B' : '#38BDF8',
                            textTransform: 'capitalize',
                          }}
                        >
                          {req.urgency_level || 'critical'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {isSelected && (
                          <span className="text-[10px] text-[#38BDF8] font-bold flex items-center gap-1">
                            <Check size={11} /> Donors Loaded Below
                          </span>
                        )}
                        {!isCancelled && (
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelRequest(req.id);
                            }} 
                            style={{
                              padding: '0.25rem 0.7rem',
                              fontSize: '0.725rem',
                              fontWeight: 600,
                              color: '#FF2E54',
                              background: 'rgba(255, 46, 84, 0.08)',
                              border: '1px solid rgba(255, 46, 84, 0.25)',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.background = 'rgba(255, 46, 84, 0.2)';
                              e.currentTarget.style.borderColor = '#FF2E54';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.background = 'rgba(255, 46, 84, 0.08)';
                              e.currentTarget.style.borderColor = 'rgba(255, 46, 84, 0.25)';
                            }}
                          >
                            Cancel Requisition
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right: Real Matching Donors Panel */}
          <div className="lg:col-span-5">
            <div 
              className="card"
              style={{
                padding: '1.5rem',
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-base font-bold text-white tracking-tight">Discovered Compatible Donors</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 font-bold">
                  {matchingDonors.length} ONLINE
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-4">Haversine distance computed from receiving hospital coordinates</p>

              {matchingDonors.length === 0 ? (
                <div className="p-6 text-center text-slate-400 border border-white/5 rounded-xl bg-slate-950/40">
                  <Activity size={24} className="mx-auto mb-2 text-slate-600" />
                  <p className="text-xs">No active donors discovered in travel radius for this requisition yet.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {matchingDonors.map((donor, idx) => (
                    <div 
                      key={donor.donor_id || idx} 
                      className="p-3 rounded-xl bg-slate-950/70 border border-white/10 text-xs space-y-1.5 transition-all hover:border-[#FF2E54]/40"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
                          Donor #{donor.donor_id?.slice(0, 8) || 'Verified'}
                        </span>
                        <span 
                          style={{
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#34D399',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '9999px',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                          }}
                        >
                          {donor.blood_group} Compatible
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-400 text-[11px] pt-1 border-t border-white/5">
                        <span>Approx. Distance: <strong className="text-slate-200">{donor.distance_km || 2.4} km</strong></span>
                        <span>Estimated Arrival: <strong className="text-[#38BDF8]">{donor.estimated_arrival_minutes || 25} mins</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2 CONTENT: NEW EMERGENCY REQUEST FORM                */}
      {/* ======================================================== */}
      {activeTab === 'create' && (
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
          {/* Header */}
          <div className="mb-6 pb-4 border-b border-white/10 flex items-start justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#FF2E54]/15 text-[#FF2E54] border border-[#FF2E54]/30 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF2E54] animate-pulse"></span>
                Instant Geospatial Broadcast
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">Submit Emergency Blood Requisition</h2>
              <p className="text-xs text-slate-400 mt-1">Coordinates and blood specifications will immediately broadcast to voluntary donors</p>
            </div>
            <button 
              type="button" 
              onClick={() => setActiveTab('requests')}
              className="text-slate-400 hover:text-white transition-colors"
              title="Return to My Requests"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Preset Buttons */}
          <div className="mb-5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              ⚡ Quick-Fill Requisition Presets
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => applyPreset('O-', 2, 'critical', 'Urgent cardiac trauma bypass procedure in OT-3.')}
                className="p-2 rounded-xl text-left bg-white/5 border border-white/10 hover:border-[#FF2E54]/50 transition-all cursor-pointer"
              >
                <div className="text-xs font-bold text-white flex items-center gap-1">
                  <span>🚨 Trauma OT</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">O- • 2 Units • Critical</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('A+', 2, 'critical', 'Accident resuscitation priority in Emergency ICU.')}
                className="p-2 rounded-xl text-left bg-white/5 border border-white/10 hover:border-[#FF2E54]/50 transition-all cursor-pointer"
              >
                <div className="text-xs font-bold text-white flex items-center gap-1">
                  <span>⚡ Accident ICU</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">A+ • 2 Units • Critical</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('B+', 1, 'urgent', 'Post-operative obstetric support transfusion.')}
                className="p-2 rounded-xl text-left bg-white/5 border border-white/10 hover:border-[#FF2E54]/50 transition-all cursor-pointer"
              >
                <div className="text-xs font-bold text-white flex items-center gap-1">
                  <span>🩺 Maternity</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">B+ • 1 Unit • Urgent</div>
              </button>
            </div>
          </div>

          <form onSubmit={handleCreateRequest} className="space-y-4">
            {/* Blood Group and Units Required */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group mb-0">
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Blood Group Required <span className="text-[#FF2E54]">*</span>
                </label>
                <select 
                  className="form-control text-sm py-2 px-3 bg-slate-950/70 border-white/10 text-white rounded-lg focus:border-[#FF2E54]"
                  value={bloodGroup} 
                  onChange={(e) => setBloodGroup(e.target.value)}
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
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    min={1} 
                    max={8} 
                    className="form-control text-sm py-2 px-3 bg-slate-950/70 border-white/10 text-white rounded-lg focus:border-[#FF2E54]" 
                    value={units} 
                    onChange={(e) => setUnits(Number(e.target.value))} 
                    required 
                  />
                  <div className="flex gap-1">
                    {[1, 2, 4].map(u => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setUnits(u)}
                        className={`text-xs px-2.5 py-1.5 rounded-lg border font-semibold ${units === u ? 'bg-[#FF2E54] border-[#FF2E54] text-white' : 'bg-white/5 border-white/10 text-slate-300'}`}
                      >
                        {u}U
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Urgency Level with Pill Radios */}
            <div className="form-group mb-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Urgency Level <span className="text-[#FF2E54]">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'critical', label: 'Critical', desc: 'Immediate surgery', dot: '#FF2E54' },
                  { id: 'urgent', label: 'Urgent', desc: 'Within 2-4 hours', dot: '#F59E0B' },
                  { id: 'routine', label: 'Routine', desc: 'Scheduled', dot: '#38BDF8' },
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setUrgency(item.id as any)}
                    className="p-2.5 rounded-xl border text-left transition-all"
                    style={{
                      background: urgency === item.id ? 'rgba(255, 46, 84, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      borderColor: urgency === item.id ? '#FF2E54' : 'rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.dot }}></span>
                      <span>{item.label}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Receiving Hospital */}
            <div className="form-group mb-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Receiving Hospital
              </label>
              <select 
                className="form-control text-sm py-2 px-3 bg-slate-950/70 border-white/10 text-white rounded-lg focus:border-[#FF2E54]"
                value={hospitalId} 
                onChange={(e) => setHospitalId(e.target.value)}
              >
                {hospitals.length > 0 ? (
                  hospitals.map(h => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.city})
                    </option>
                  ))
                ) : (
                  <option value="a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11">
                    City Care Super Specialty Hospital (New Delhi)
                  </option>
                )}
              </select>
            </div>

            {/* Clinical Notes */}
            <div className="form-group mb-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Clinical Notes & Surgical Bed <span className="text-[#FF2E54]">*</span>
              </label>
              <textarea 
                className="form-control text-sm py-2 px-3 bg-slate-950/70 border-white/10 text-white rounded-lg focus:border-[#FF2E54]" 
                rows={3} 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                placeholder="Include ward number, attending physician name, and patient condition..."
                required 
              />
            </div>

            {/* Action Buttons */}
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
                    <span>Broadcasting Requisition to Mesh...</span>
                  </>
                ) : (
                  <>
                    <span>Dispatch Emergency Broadcast</span>
                    <Send size={15} />
                  </>
                )}
              </button>

              <button 
                type="button" 
                onClick={() => setActiveTab('requests')}
                className="btn btn-secondary py-3 px-4 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
