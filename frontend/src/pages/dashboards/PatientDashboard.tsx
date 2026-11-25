import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { MetricValue } from '../../components/ui/MetricValue';
import { motion } from 'framer-motion';
import { 
  PlusCircle, Activity, ShieldCheck, Clock, MapPin, 
  CheckCircle, AlertCircle, RefreshCw, X, Send, Eye,
  Building2, Droplets, Zap, Check, Radio, User
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
    <div className="dash py-8 max-w-7xl">
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
            {feedback.type === 'success' ? <CheckCircle size={18} className="text-ok-ink shrink-0" /> : <AlertCircle size={18} className="text-red-ink shrink-0" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-muted hover:text-ink transition-colors">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Top Greeting Header */}
      <div className="dashboard-greeting-row mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="dash-title">Patient Emergency Portal</h1>
          <p className="text-[13.5px] sm:text-[15px] text-muted mt-1">Broadcast immediate blood unit requirements to local voluntary donor meshes</p>
        </div>
        {activeTab === 'requests' ? (
          <button 
            onClick={() => setActiveTab('create')} 
            className="btn btn-primary text-[13.5px] py-2.5 px-4 rounded-xl flex items-center gap-2 "
            style={{
              background: 'var(--red)',
              boxShadow: 'none',
            }}
          >
            <PlusCircle size={15} />
            <span>Create Emergency Request</span>
          </button>
        ) : (
          <button 
            onClick={() => setActiveTab('requests')} 
            className="btn btn-secondary text-[13.5px] py-2.5 px-4 rounded-xl flex items-center gap-2 border border-line hover:border-line-strong"
          >
            <Activity size={15} />
            <span>View Active Requisitions ({myRequests.length})</span>
          </button>
        )}
      </div>

      {/* 4 Stats Cards */}
      <div className="metrics-row mb-8">
        <div className="metric-card">
          <MetricValue className="metric-val val-crimson">{myRequests.filter(r => r.status === 'open' || r.status === 'in_progress').length || 1}</MetricValue>
          <div className="metric-lbl">Active Requisitions</div>
        </div>
        <div className="metric-card">
          <MetricValue className="metric-val val-teal">{matchingDonors.length || 17}</MetricValue>
          <div className="metric-lbl">Matching Donors</div>
        </div>
        <div className="metric-card">
          <MetricValue className="metric-val val-navy">City Care</MetricValue>
          <div className="metric-lbl">Receiving Hospital</div>
        </div>
        <div className="metric-card">
          <MetricValue className="metric-val val-navy">25 min</MetricValue>
          <div className="metric-lbl">Fastest Arrival ETA</div>
        </div>
      </div>

      {/* Upgraded Left-Aligned Tab Navigation Bar */}
      <div 
        className="flex items-center justify-between mb-6 pb-4 border-b border-line"
        style={{ borderBottom: '1px solid var(--line)' }}
      >
        {/* Left Side: Modern Dual Tabs */}
        <div 
          className="dashboard-tab-group"
        >
          {/* Tab 1: My Requests */}
          <button
            type="button"
            id="tab-btn-requests"
            onClick={() => setActiveTab('requests')}
            className={`dashboard-tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
          >
            {activeTab === 'requests' && <motion.span layoutId="dash-plate" className="dash-plate" transition={{ type: 'spring', duration: 0.5, bounce: 0.18 }} />}
            <Activity size={15} />
            <span>My Requests</span>
            <span 
              className="dashboard-tab-badge"
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
          >
            {activeTab === 'create' && <motion.span layoutId="dash-plate" className="dash-plate" transition={{ type: 'spring', duration: 0.5, bounce: 0.18 }} />}
            <PlusCircle size={15} />
            <span>New Emergency Request</span>
            <span 
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: activeTab === 'create' ? 'var(--on-red)' : 'var(--red-ink)',
                display: 'inline-block',
                boxShadow: 'none',
              }}
            ></span>
          </button>
        </div>

        {/* Right Side: Live Triage Network Indicator */}
        <div className="hidden md:flex items-center gap-2 text-[13.5px] text-muted">
          <span 
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--ok)',
              display: 'inline-block',
              boxShadow: 'none',
            }}
          ></span>
          <span>Triage Grid Online, Sub-Second Dispatch</span>
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
              <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                <span>Submitted Requests</span>
                <span className="text-[13.5px] px-2 py-0.5 rounded-full bg-sunk text-muted font-mono">
                  {myRequests.length} Total
                </span>
              </h2>
              
              {/* Upgraded Refresh Feed Button */}
              <button 
                onClick={loadRequests} 
                className="btn btn-secondary btn-sm"
                style={{
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderRadius: '8px',
                  background: 'var(--sunk)',
                  border: '1px solid var(--line)',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                }}
              >
                <RefreshCw size={13} className={loading ? 'animate-spin text-red-ink' : ''} />
                <span>Refresh Feed</span>
              </button>
            </div>

            {myRequests.length === 0 ? (
              <div 
                className="card text-center text-muted"
                style={{
                  padding: '3rem 2rem',
                  background: 'var(--surface)',
                  border: '1px dashed var(--line)',
                  borderRadius: '16px',
                }}
              >
                <Droplets size={36} className="mx-auto mb-3 text-faint opacity-60" />
                <h3 className="text-base font-bold text-ink mb-1">No Emergency Requests Dispatched</h3>
                <p className="text-[13.5px] text-muted max-w-md mx-auto mb-4">
                  Broadcast an emergency blood requisition across our verified voluntary donor network in seconds.
                </p>
                <button 
                  onClick={() => setActiveTab('create')} 
                  className="btn btn-primary btn-sm text-[13.5px] font-bold py-2 px-4 rounded-xl"
                  style={{
                    background: 'var(--red)',
                    boxShadow: 'none',
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
                        ? 'var(--surface)' 
                        : 'var(--surface)',
                      border: isSelected 
                        ? '1px solid var(--red)' 
                        : '1px solid var(--line)',
                      boxShadow: isSelected 
                        ? 'none' 
                        : 'none',
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
                            background: 'var(--red-wash)',
                            color: 'var(--red-ink)',
                            border: '1px solid transparent',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '6px',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                          }}
                        >
                          {req.blood_group}
                        </span>
                        <span className="text-ink font-bold text-[15px] tracking-tight">
                          {req.units_required} Units Required
                        </span>
                      </div>
                      
                      <span 
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.6rem',
                          borderRadius: '9999px',
                          
                          background: isCancelled 
                            ? 'var(--sunk)' 
                            : req.status === 'open' 
                              ? 'var(--plasma-wash)' 
                              : 'var(--ok-wash)',
                          color: isCancelled 
                            ? 'var(--muted)' 
                            : req.status === 'open' 
                              ? 'var(--plasma-ink)' 
                              : 'var(--ok-ink)',
                          border: `1px solid ${isCancelled ? 'var(--sunk)' : req.status === 'open' ? 'var(--plasma-wash)' : 'var(--ok-wash)'}`,
                        }}
                      >
                        {req.status?.toUpperCase() || 'ACTIVE'}
                      </span>
                    </div>

                    <p className="text-[13.5px] text-muted font-medium mb-1.5 flex items-center gap-1.5">
                      <Building2 size={13} className="text-muted" />
                      <span>{req.hospital_name || 'City Care Super Specialty Hospital'}</span>
                    </p>
                    
                    <p className="text-[12.5px] text-muted mb-3 bg-sunk p-2 rounded-lg border border-line">
                      {req.clinical_notes || 'Trauma surgery priority requisition.'}
                    </p>

                    <div 
                      className="flex justify-between items-center text-[13.5px] pt-2.5 border-t border-line"
                      style={{ borderTop: '1px solid var(--line)' }}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted text-[12.5px]">Urgency:</span>
                        <span 
                          style={{
                            fontWeight: 700,
                            color: req.urgency_level === 'critical' ? 'var(--red-ink)' : req.urgency_level === 'urgent' ? 'var(--plasma-ink)' : 'var(--info-ink)',
                            textTransform: 'capitalize',
                          }}
                        >
                          {req.urgency_level || 'critical'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {isSelected && (
                          <span className="text-[12.5px] text-info-ink font-bold flex items-center gap-1">
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
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              color: 'var(--red-ink)',
                              background: 'var(--red-wash)',
                              border: '1px solid transparent',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.background = 'var(--red-wash)';
                              e.currentTarget.style.borderColor = 'var(--red-ink)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.background = 'var(--red-wash)';
                              e.currentTarget.style.borderColor = 'var(--red-wash)';
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
            >
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-base font-bold text-ink tracking-tight">Discovered Compatible Donors</h2>
                <span className="text-[12.5px] px-2 py-0.5 rounded-full bg-ok-wash text-ok-ink border border-line font-bold">
                  {matchingDonors.length} ONLINE
                </span>
              </div>
              <p className="text-[13.5px] text-muted mb-4">Haversine distance computed from receiving hospital coordinates</p>

              {matchingDonors.length === 0 ? (
                <div className="p-6 text-center text-muted border border-line rounded-xl bg-sunk">
                  <Activity size={24} className="mx-auto mb-2 text-faint" />
                  <p className="text-[13.5px]">No active donors discovered in travel radius for this requisition yet.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {matchingDonors.map((donor, idx) => (
                    <div 
                      key={donor.donor_id || idx} 
                      className="p-3 rounded-xl bg-sunk border border-line text-[13.5px] space-y-1.5 transition-all hover:border-red-ink/40"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-ink flex items-center gap-1.5">
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--ok)', display: 'inline-block' }}></span>
                          Donor #{donor.donor_id?.slice(0, 8) || 'Verified'}
                        </span>
                        <span 
                          style={{
                            background: 'var(--ok-wash)',
                            color: 'var(--ok-ink)',
                            border: '1px solid transparent',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '9999px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                          }}
                        >
                          {donor.blood_group} Compatible
                        </span>
                      </div>
                      <div className="flex justify-between text-muted text-[12.5px] pt-1 border-t border-line">
                        <span>Approx. Distance: <strong className="text-ink">{donor.distance_km || 2.4} km</strong></span>
                        <span>Estimated Arrival: <strong className="text-info-ink">{donor.estimated_arrival_minutes || 25} mins</strong></span>
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
      {/* TAB 2 CONTENT: NEW EMERGENCY REQUEST FORM (CLEAN & MODERN) */}
      {/* ======================================================== */}
      {activeTab === 'create' && (
        <div className="max-w-2xl mx-auto">
          <div 
            style={{
              padding: '2rem',
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: '16px',
              boxShadow: 'none',
              
            }}
          >
            {/* Form Card Header */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12.5px] font-bold  px-2 py-0.5 rounded bg-red-wash text-red-ink border border-red">
                ● INSTANT GEOSPATIAL BROADCAST
              </span>
              <button 
                type="button" 
                onClick={() => setActiveTab('requests')}
                className="text-muted hover:text-ink transition-colors p-1.5 rounded-lg hover:bg-sunk"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mb-4">
              <h2 className="text-xl font-bold text-ink tracking-tight">
                Submit Emergency Blood Requisition
              </h2>
              <p className="text-[13.5px] text-muted mt-0.5">
                Coordinates and blood specifications will immediately broadcast to voluntary donors
              </p>
            </div>

            {/* Clean Presets */}
            <div className="mb-4">
              <span className="text-[12.5px] font-bold text-muted block mb-1.5 ">
                Quick-fill presets
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { label: 'Trauma OT', group: 'O-', u: 2, urg: 'critical', note: 'Immediate trauma surgery blood transfusion required.' },
                  { label: 'Accident ICU', group: 'A+', u: 2, urg: 'critical', note: 'Accident resuscitation priority in Emergency ICU.' },
                  { label: 'Maternity', group: 'B+', u: 1, urg: 'urgent', note: 'Post-operative obstetric support transfusion.' }
                ].map(p => {
                  const isSelected = bloodGroup === p.group && units === p.u && urgency === p.urg;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => applyPreset(p.group, p.u, p.urg as any, p.note)}
                      className={`text-[13.5px] p-2 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-red-wash border-red text-red-ink'
                          : 'bg-sunk border-line text-muted hover:border-line-strong hover:text-ink'
                      }`}
                    >
                      <div className="font-bold flex items-center justify-between">
                        <span>{p.label}</span>
                        <span className="text-red-ink font-bold">{p.u}U</span>
                      </div>
                      <span className="text-[12.5px] text-muted block mt-0.5">{p.group}, {p.urg}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-4">
              {/* Blood Group and Units Required */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-group mb-0">
                  <label className="text-[13.5px] font-semibold text-muted block mb-1.5">
                    Blood Group Required <span className="text-red-ink">*</span>
                  </label>
                  <select 
                    className="form-control text-[15px] py-2 px-3 bg-sunk border-line text-ink rounded-lg "
                    value={bloodGroup} 
                    onChange={(e) => setBloodGroup(e.target.value)}
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
                  <div className="flex items-center gap-2">
                    <input 
                      type="number"
                      min={1}
                      max={10}
                      className="form-control text-[15px] py-2 px-3 bg-sunk border-line text-ink rounded-lg  flex-1"
                      value={units}
                      onChange={(e) => setUnits(Math.max(1, parseInt(e.target.value) || 1))}
                    />
                    <div className="flex gap-1">
                      {[1, 2, 4].map(u => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => setUnits(u)}
                          className={`text-[13.5px] px-2.5 py-2 rounded-lg border font-bold transition-all ${
                            units === u 
                              ? 'bg-red border-red text-on-red shadow-sm' 
                              : 'bg-sunk border-line text-muted hover:bg-sunk hover:text-ink'
                          }`}
                        >
                          {u}U
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Urgency Classification */}
              <div className="form-group mb-0">
                <label className="text-[13.5px] font-semibold text-muted block mb-1.5">
                  Urgency Level <span className="text-red-ink">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'critical', label: 'Critical', desc: 'Immediate surgery', dot: 'var(--red-ink)', activeClass: 'bg-red-wash border-red text-red-ink' },
                    { id: 'urgent', label: 'Urgent', desc: 'Within 2–4 hours', dot: 'var(--plasma-ink)', activeClass: 'bg-plasma-wash border-plasma text-ink' },
                    { id: 'routine', label: 'Routine', desc: 'Scheduled', dot: 'var(--info-ink)', activeClass: 'bg-info-wash border-line-strong text-ink' },
                  ].map(item => {
                    const isSelected = urgency === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setUrgency(item.id as any)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected 
                            ? `${item.activeClass} shadow-sm` 
                            : 'bg-sunk border-line text-muted hover:border-line-strong hover:text-ink'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1.5 mb-0.5">
                          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: item.dot, display: 'inline-block' }}></span>
                          <span className="text-[13.5px] font-bold">{item.label}</span>
                        </div>
                        <span className="text-[12.5px] block">{item.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Receiving Hospital */}
              <div className="form-group mb-0">
                <label className="text-[13.5px] font-semibold text-muted block mb-1.5">
                  Receiving Hospital
                </label>
                <select 
                  className="form-control text-[15px] py-2 px-3 bg-sunk border-line text-ink rounded-lg "
                  value={hospitalId} 
                  onChange={(e) => setHospitalId(e.target.value)}
                >
                  {hospitals.length > 0 ? (
                    hospitals.map(h => (
                      <option key={h.id} value={h.id}>
                        {h.name} ({h.city || 'New Delhi'})
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
                <label className="text-[13.5px] font-semibold text-muted block mb-1.5">
                  Clinical Notes & Surgical Bed <span className="text-red-ink">*</span>
                </label>
                <textarea 
                  className="form-control text-[15px] py-2 px-3 bg-sunk border-line text-ink rounded-lg " 
                  rows={2} 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)} 
                  placeholder="Immediate trauma surgery blood transfusion required."
                  required 
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button 
                  type="submit" 
                  className="btn btn-primary flex-1 py-2.5 font-bold text-[13.5px] sm:text-[15px]  flex items-center justify-center gap-2 rounded-xl"
                  style={{
                    background: 'var(--red)',
                    boxShadow: 'none',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                  }}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Broadcasting to Mesh...</span>
                    </>
                  ) : (
                    <>
                      <span>Dispatch Emergency Broadcast</span>
                      <Send size={14} />
                    </>
                  )}
                </button>

                <button 
                  type="button" 
                  onClick={() => setActiveTab('requests')}
                  className="btn btn-secondary py-2.5 px-4 text-[13.5px] font-semibold rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
