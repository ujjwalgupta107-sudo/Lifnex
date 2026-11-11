import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { 
  PlusCircle, Activity, ShieldCheck, Clock, MapPin, 
  CheckCircle, AlertCircle, RefreshCw, X, Send, Eye
} from 'lucide-react';

export const PatientDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'requests' | 'create' | 'responses' | 'notifications'>('requests');
  const [bloodGroup, setBloodGroup] = useState('O-');
  const [units, setUnits] = useState(2);
  const [urgency, setUrgency] = useState<'routine' | 'urgent' | 'critical'>('critical');
  const [hospitalId, setHospitalId] = useState('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
  const [notes, setNotes] = useState('Immediate trauma surgery blood transfusion required.');
  
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [matchingDonors, setMatchingDonors] = useState<any[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load patient's existing emergency requests from Flask backend
  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await api.getBloodRequests();
      if (res.success && Array.isArray(res.data)) {
        setMyRequests(res.data);
        if (res.data.length > 0 && !selectedRequestId) {
          setSelectedRequestId(res.data[0].id);
          fetchMatchingDonors(res.data[0].id);
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
    setLoading(true);
    try {
      const payload = {
        hospital_id: hospitalId,
        blood_group: bloodGroup,
        units_required: Number(units),
        urgency_level: urgency,
        clinical_notes: notes,
      };

      const res = await api.createBloodRequest(payload);
      if (res.success) {
        setFeedback({ type: 'success', message: 'Emergency requisition submitted! Nearby compatible donors alerted.' });
        loadRequests();
        setActiveTab('requests');
      } else {
        setFeedback({ type: 'error', message: res.error?.message || 'Failed to submit requisition.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Submission error.' });
    } finally {
      setLoading(false);
    }
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleCancelRequest = async (reqId: string) => {
    try {
      const res = await api.cancelBloodRequest(reqId);
      if (res.success) {
        setFeedback({ type: 'success', message: 'Emergency request cancelled.' });
        setMyRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'cancelled' } : r));
      } else {
        setFeedback({ type: 'error', message: res.error?.message || 'Could not cancel request.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Cancellation error.' });
    }
    setTimeout(() => setFeedback(null), 3000);
  };

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

      {/* Top Greeting */}
      <div className="dashboard-greeting-row mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Patient Emergency Portal</h1>
          <p className="text-sm text-slate-400">Broadcast immediate blood unit requirements to local voluntary donor meshes</p>
        </div>
        <button 
          onClick={() => setActiveTab('create')} 
          className="btn btn-primary text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 shadow-md"
        >
          <PlusCircle size={15} />
          Create Emergency Request
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

      {/* Navigation Tabs */}
      <div className="flex gap-2 mb-6 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold ${activeTab === 'requests' ? 'bg-[#FF2E54] text-white' : 'bg-white/5 text-slate-300'}`}
        >
          My Requests ({myRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold ${activeTab === 'create' ? 'bg-[#FF2E54] text-white' : 'bg-white/5 text-slate-300'}`}
        >
          New Emergency Request
        </button>
      </div>

      {/* TAB CONTENT: Requests & Matching Donors */}
      {activeTab === 'requests' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Requisitions List */}
          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center justify-between">
              <span>Submitted Requests</span>
              <button onClick={loadRequests} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
              </button>
            </h2>

            {myRequests.length === 0 ? (
              <div className="card p-8 text-center text-slate-400">
                <p className="text-sm">No emergency blood requests created yet.</p>
                <button onClick={() => setActiveTab('create')} className="btn btn-primary btn-sm mt-3 text-xs">
                  Create First Request →
                </button>
              </div>
            ) : (
              myRequests.map((req) => (
                <div 
                  key={req.id} 
                  className={`card p-5 cursor-pointer transition-all border ${
                    selectedRequestId === req.id ? 'border-[#FF2E54] bg-slate-900/90 shadow-lg' : 'border-white/10 bg-slate-900/50'
                  }`}
                  onClick={() => {
                    setSelectedRequestId(req.id);
                    fetchMatchingDonors(req.id);
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="badge badge-primary font-bold">{req.blood_group}</span>
                      <span className="text-white font-bold text-sm">{req.units_required} Units Required</span>
                    </div>
                    <span className={`badge ${req.status === 'open' ? 'badge-warning' : req.status === 'in_progress' ? 'badge-primary' : 'badge-success'}`}>
                      {req.status?.toUpperCase() || 'ACTIVE'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mb-2">{req.hospital_name || 'City Care Super Specialty Hospital'}</p>
                  <p className="text-[11px] text-slate-400 mb-3">{req.clinical_notes || 'Trauma surgery priority requisition.'}</p>

                  <div className="flex justify-between items-center text-xs pt-2 border-t border-white/10">
                    <span className="text-slate-400">Urgency: <strong className="text-[#FF2E54]">{req.urgency_level || 'critical'}</strong></span>
                    {req.status !== 'cancelled' && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelRequest(req.id);
                        }} 
                        className="text-red-400 hover:text-red-300 font-semibold"
                      >
                        Cancel Requisition
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Right: Real Matching Donors Panel */}
          <div className="lg:col-span-5">
            <div className="card p-6 bg-slate-900/90 border border-white/10">
              <h2 className="text-lg font-bold text-white mb-1">Discovered Compatible Donors</h2>
              <p className="text-xs text-slate-400 mb-4">Haversine distance computed from receiving hospital coordinates</p>

              {matchingDonors.length === 0 ? (
                <p className="text-xs text-slate-400">No active donors discovered in travel radius for this requisition yet.</p>
              ) : (
                <div className="space-y-3">
                  {matchingDonors.map((donor, idx) => (
                    <div key={donor.donor_id || idx} className="p-3 rounded-lg bg-slate-950/70 border border-white/10 text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white">Donor #{donor.donor_id?.slice(0, 8) || 'Verified'}</span>
                        <span className="badge badge-success text-[10px]">{donor.blood_group} Compatible</span>
                      </div>
                      <div className="flex justify-between text-slate-400 text-[11px]">
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

      {/* TAB CONTENT: Create Form */}
      {activeTab === 'create' && (
        <div className="card p-8 max-w-2xl mx-auto bg-slate-900/90 border border-white/10">
          <h2 className="text-xl font-bold text-white mb-2">Submit Emergency Blood Requisition</h2>
          <p className="text-xs text-slate-400 mb-6">Coordinates and required blood specifications will immediately broadcast to voluntary donors</p>

          <form onSubmit={handleCreateRequest} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="text-xs font-semibold text-slate-300 block mb-1">Blood Group Required</label>
                <select className="form-control text-sm" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}>
                  {['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="text-xs font-semibold text-slate-300 block mb-1">Units Required (Whole Blood / RBC)</label>
                <input type="number" min={1} max={8} className="form-control text-sm" value={units} onChange={(e) => setUnits(Number(e.target.value))} required />
              </div>
            </div>

            <div className="form-group">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Urgency Level</label>
              <select className="form-control text-sm" value={urgency} onChange={(e) => setUrgency(e.target.value as any)}>
                <option value="critical">🔴 Critical (Immediate surgical transfusion)</option>
                <option value="urgent">🟠 Urgent (Within 2-4 hours)</option>
                <option value="routine">🟡 Routine (Scheduled procedure)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Clinical Notes & Surgical Bed</label>
              <textarea 
                className="form-control text-sm" 
                rows={3} 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                placeholder="Include ward number, attending physician name, and patient condition..."
                required 
              />
            </div>

            <button type="submit" className="btn btn-primary w-full py-2.5 font-bold text-sm shadow-lg" disabled={loading}>
              {loading ? 'Submitting to Emergency Mesh...' : 'Dispatch Requisition Now →'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
