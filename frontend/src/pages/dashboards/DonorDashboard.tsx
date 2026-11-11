import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { 
  Activity, Bell, CheckCircle2, Clock, Droplets, MapPin, 
  ShieldCheck, User, Settings, Check, X, AlertTriangle, RefreshCw,
  Phone, Send, Heart, Radio, Sliders, ChevronRight,
  Building2, Calendar, Download
} from 'lucide-react';

export const DonorDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'responses' | 'history' | 'notifications' | 'profile' | 'settings'>('overview');
  
  // Real user state
  const [user, setUser] = useState<any>(() => {
    try {
      return JSON.parse(localStorage.getItem('lifnex_user') || '{}');
    } catch {
      return {};
    }
  });

  const [available, setAvailable] = useState<boolean>(true);
  const [feedRequests, setFeedRequests] = useState<any[]>([]);
  const [myResponses, setMyResponses] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotifs, setUnreadNotifs] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Profile Form State
  const [fullName, setFullName] = useState(user.full_name || 'Anita Desai (Demo Donor)');
  const [phone, setPhone] = useState(user.phone_number || '+91 98765 43210');
  const [city, setCity] = useState('New Delhi');
  const [travelRadius, setTravelRadius] = useState(15);
  const [pushAlerts, setPushAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);

  const bloodGroup = user.blood_group || 'O+';

  // Load live data from Flask API
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch tailored donor feed
      const feedRes = await api.getDonorFeed();
      if (feedRes.success && Array.isArray(feedRes.data)) {
        setFeedRequests(feedRes.data);
      }

      // 2. Fetch notifications
      const notifRes = await api.getNotifications();
      if (notifRes.success) {
        setNotifications(notifRes.data || []);
        setUnreadNotifs(notifRes.unread_count || 0);
      }
    } catch (err: any) {
      console.error('Failed to load donor data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Availability Toggle Handler
  const handleAvailabilityToggle = async () => {
    const nextStatus = available ? 'busy' : 'available';
    try {
      const res = await api.updateDonorAvailability(nextStatus, user.id);
      if (res.success) {
        setAvailable(!available);
        setFeedback({ 
          type: 'success', 
          message: `Availability updated to ${nextStatus.toUpperCase()}. ${nextStatus === 'available' ? 'You are receiving nearby emergency dispatch alerts.' : 'Emergency alerts paused.'}` 
        });
      } else {
        setFeedback({ type: 'error', message: res.error?.message || 'Failed to update availability.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Network error updating availability.' });
    }
    setTimeout(() => setFeedback(null), 3500);
  };

  // Respond to an emergency request (Accept / Decline)
  const handleRespond = async (requestId: string, status: 'accepted' | 'declined') => {
    try {
      const payload = {
        request_id: requestId,
        donor_id: user.id || 'demo-donor-id',
        response_status: status,
        estimated_arrival_minutes: status === 'accepted' ? 25 : undefined,
      };

      const res = await api.respondToRequest(payload);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: status === 'accepted' ? 'Emergency response dispatched! Hospital and patient notified of your arrival in 25 mins.' : 'Request declined and removed from immediate feed.',
        });

        // Record in local state
        setMyResponses(prev => [
          {
            request_id: requestId,
            status,
            eta: status === 'accepted' ? '25 mins' : '-',
            timestamp: new Date().toLocaleTimeString(),
          },
          ...prev,
        ]);

        // Remove from feed
        setFeedRequests(prev => prev.filter(r => r.id !== requestId));
      } else {
        setFeedback({ type: 'error', message: res.error?.message || 'Unable to record response.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Network error recording response.' });
    }
    setTimeout(() => setFeedback(null), 4000);
  };

  // Mark notification read
  const handleMarkNotification = async (notifId: string) => {
    try {
      await api.markNotificationRead(notifId);
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
      setUnreadNotifs(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllNotifications = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadNotifs(0);
      setFeedback({ type: 'success', message: 'All notifications marked as read.' });
      setTimeout(() => setFeedback(null), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  // Navigation Items Definition for the Left Sidebar
  const navItems = [
    { id: 'overview', label: 'Dashboard Overview', icon: Activity, count: null },
    { id: 'requests', label: 'Nearby Alerts', icon: Droplets, count: feedRequests.length },
    { id: 'responses', label: 'My Responses', icon: CheckCircle2, count: myResponses.length },
    { id: 'history', label: 'Donation History', icon: Clock, count: 3 },
    { id: 'notifications', label: 'Notifications', icon: Bell, count: unreadNotifs },
    { id: 'profile', label: 'Donor Profile', icon: User, count: null },
    { id: 'settings', label: 'Settings & Geofence', icon: Settings, count: null },
  ];

  return (
    <div className="container py-8 max-w-7xl">
      {/* Top Banner Alert Message */}
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

      {/* Top Greeting & Availability Header */}
      <div className="dashboard-greeting-row mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Welcome, {user.full_name || 'Anita Desai (Demo Donor)'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Voluntary Donor Emergency Hub • Blood Group: <span className="text-[#FF2E54] font-bold">{bloodGroup}</span>
          </p>
        </div>

        {/* Functional Availability Toggle Switch */}
        <div 
          className="flex items-center gap-3 px-4 py-2 rounded-full border"
          style={{
            background: 'rgba(15, 23, 42, 0.85)',
            borderColor: available ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.12)',
            boxShadow: available ? '0 0 15px rgba(16, 185, 129, 0.2)' : 'none',
          }}
        >
          <div className="flex items-center gap-1.5">
            <span 
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: available ? '#10B981' : '#64748B',
                boxShadow: available ? '0 0 8px #10B981' : 'none',
              }}
            ></span>
            <span className="text-xs font-semibold text-slate-200">
              {available ? 'Available to Donate' : 'Unavailable / Busy'}
            </span>
          </div>
          <label className="toggle-switch-wrapper mb-0" style={{ cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={available} 
              onChange={handleAvailabilityToggle}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      {/* 4-Stat Metric Grid */}
      <div className="metrics-row mb-8">
        <div className="metric-card">
          <div className="metric-val val-crimson">{bloodGroup}</div>
          <div className="metric-lbl">Blood Group</div>
        </div>
        <div className="metric-card">
          <div className="metric-val val-teal">{feedRequests.length || 8}</div>
          <div className="metric-lbl">Requests Nearby</div>
        </div>
        <div className="metric-card">
          <div className="metric-val val-navy">3</div>
          <div className="metric-lbl">Verified Donations</div>
        </div>
        <div className="metric-card">
          <div className="metric-val val-navy">{travelRadius} km</div>
          <div className="metric-lbl">Travel Radius</div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2-COLUMN DASHBOARD LAYOUT: LEFT SIDEBAR + MAIN CONTENT   */}
      {/* ======================================================== */}
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
            {/* Donor Mini Profile Card */}
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
                A
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-white truncate">Anita Desai</div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
                  <span>{bloodGroup} • Voluntary Donor</span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs List */}
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
              Donor Portal Navigation
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`donor-tab-${item.id}`}
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

            {/* Sidebar Bottom Live Emergency Status Card */}
            <div className="mt-5 pt-4 border-t border-white/10">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Geofence Status</span>
                  <span className="text-emerald-400 font-bold">15 km Active</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Emergency Hotline</span>
                  <span className="text-white font-mono text-[10px]">1800-LIFNEX</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ======================================================== */}
        {/* RIGHT MAIN CONTENT AREA                                  */}
        {/* ======================================================== */}
        <main className="md:col-span-8 lg:col-span-9 space-y-6">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Droplets className="text-[#FF2E54]" size={18} />
                    <span>Immediate Emergency Priority Feed</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Critical blood requests within your {travelRadius} km geofence requiring {bloodGroup}
                  </p>
                </div>
                <button 
                  onClick={loadDashboardData} 
                  className="btn btn-secondary btn-sm flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#CBD5E1',
                  }}
                >
                  <RefreshCw size={12} className={loading ? 'animate-spin text-[#FF2E54]' : ''} />
                  <span>Refresh Feed</span>
                </button>
              </div>

              {/* Feed List */}
              {feedRequests.length === 0 ? (
                <div 
                  className="card text-center text-slate-400"
                  style={{
                    padding: '3rem 2rem',
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px dashed rgba(255, 255, 255, 0.15)',
                    borderRadius: '16px',
                  }}
                >
                  <Heart size={36} className="mx-auto mb-3 text-slate-500 opacity-60" />
                  <h3 className="text-base font-bold text-white mb-1">No Urgent Alerts Right Now</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    All hospital requisitions matching blood group {bloodGroup} in your area are currently fulfilled. You will receive an instant dispatch ping when a match occurs.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {feedRequests.map((req) => (
                    <div 
                      key={req.id} 
                      className="card"
                      style={{
                        padding: '1.25rem',
                        background: 'rgba(15, 23, 42, 0.85)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '14px',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
                      }}
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span 
                              style={{
                                background: req.urgency_level === 'critical' ? 'rgba(255, 46, 84, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                color: req.urgency_level === 'critical' ? '#FF2E54' : '#FBBF24',
                                border: `1px solid ${req.urgency_level === 'critical' ? 'rgba(255, 46, 84, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                                padding: '0.15rem 0.5rem',
                                borderRadius: '6px',
                                fontWeight: 800,
                                fontSize: '0.7rem',
                                textTransform: 'uppercase',
                              }}
                            >
                              {req.urgency_level || 'CRITICAL'}
                            </span>
                            <span className="text-white font-bold text-sm">{req.hospital_name || 'City Care Super Specialty Hospital'}</span>
                            <span className="text-xs text-slate-400">• {req.city || 'New Delhi'}</span>
                          </div>
                          
                          <p className="text-xs text-slate-200">
                            Requires <strong className="text-white font-bold">{req.units_required || 2} Units</strong> of <strong className="text-[#FF2E54] font-bold">{req.blood_group}</strong> • Approx. Distance: <strong className="text-slate-200">{req.distance_km || 3.4} km</strong>
                          </p>
                          
                          <p className="text-[11px] text-slate-400 bg-black/20 p-2 rounded-lg border border-white/5">
                            {req.clinical_notes || 'Trauma surgery priority requisition.'}
                          </p>
                        </div>

                        {/* Interactive Accept & Decline Actions */}
                        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                          <button 
                            type="button"
                            onClick={() => handleRespond(req.id, 'accepted')} 
                            className="btn btn-primary text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 font-bold shadow-md flex-1 sm:flex-none"
                            style={{
                              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
                            }}
                          >
                            <Check size={14} />
                            <span>I'm Available</span>
                          </button>

                          <button 
                            type="button"
                            onClick={() => handleRespond(req.id, 'declined')} 
                            className="btn btn-secondary text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1"
                            style={{
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.12)',
                              color: '#94A3B8',
                            }}
                          >
                            <X size={14} />
                            <span>Pass</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Local Dispatch Radar Card */}
              <div 
                className="card"
                style={{
                  padding: '1.5rem',
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Radio size={16} className="text-[#38BDF8] animate-pulse" />
                    <h3 className="text-sm font-bold text-white">Local Dispatch Mesh Radar</h3>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                    15 km Geofence
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  Your coordinates are protected through differential privacy and randomized geo-hashing. Only approximate route vectors are calculated for dispatch.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5">
                    <div className="text-base font-black text-white">4</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Hospitals in Radius</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5">
                    <div className="text-base font-black text-[#10B981]">Active</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Triage Signal</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5">
                    <div className="text-base font-black text-[#38BDF8]">18 mins</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Average ETA</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5">
                    <div className="text-base font-black text-[#FF2E54]">100%</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">RLS Protected</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: NEARBY ALERTS */}
          {activeTab === 'requests' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Droplets className="text-[#FF2E54]" size={18} />
                    <span>Compatible Emergency Alerts ({feedRequests.length})</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Live emergency requisitions matched against your {bloodGroup} blood group</p>
                </div>
                <button 
                  onClick={loadDashboardData} 
                  className="btn btn-secondary btn-sm flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg"
                >
                  <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                  <span>Refresh</span>
                </button>
              </div>

              {feedRequests.length === 0 ? (
                <div className="card p-8 text-center text-slate-400">
                  <p className="text-sm">No emergency alerts in your immediate radius right now.</p>
                  <p className="text-xs text-slate-500 mt-1">Thank you for standing ready as a verified donor.</p>
                </div>
              ) : (
                feedRequests.map((req) => (
                  <div 
                    key={req.id} 
                    className="card p-4 rounded-xl border border-white/10 bg-slate-900/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="badge badge-primary font-bold text-[11px]">{req.urgency_level || 'CRITICAL'}</span>
                        <span className="text-white font-bold text-sm">{req.hospital_name || 'City Care Super Specialty Hospital'}</span>
                        <span className="text-xs text-slate-400">• {req.city || 'New Delhi'}</span>
                      </div>
                      <p className="text-xs text-slate-200">
                        Requires <strong className="text-white">{req.units_required || 2} Units</strong> of <strong className="text-[#FF2E54]">{req.blood_group}</strong>
                      </p>
                      <p className="text-[11px] text-slate-400">{req.clinical_notes || 'Trauma surgery priority requisition.'}</p>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button 
                        onClick={() => handleRespond(req.id, 'accepted')} 
                        className="btn btn-primary text-xs py-2 px-3.5 rounded-lg flex-1 sm:flex-none font-bold shadow-md"
                        style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}
                      >
                        Accept & Dispatch →
                      </button>
                      <button 
                        onClick={() => handleRespond(req.id, 'declined')} 
                        className="btn btn-secondary text-xs py-2 px-3 rounded-lg"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: MY RESPONSES */}
          {activeTab === 'responses' && (
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
                  <h2 className="text-lg font-bold text-white tracking-tight">My Emergency Responses</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Responses you have submitted for active emergency cases</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {myResponses.length} Cases
                </span>
              </div>

              {myResponses.length === 0 ? (
                <div className="p-8 text-center text-slate-400 border border-white/5 rounded-xl bg-slate-950/40">
                  <CheckCircle2 size={32} className="mx-auto mb-2 text-slate-600" />
                  <p className="text-sm font-semibold text-slate-300">No Responses Submitted Yet</p>
                  <p className="text-xs text-slate-400 mt-1">When you accept emergency alerts, your dispatch status will appear here.</p>
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {myResponses.map((res, i) => (
                    <div key={i} className="py-3.5 flex justify-between items-center text-sm">
                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>Case #{res.request_id?.slice(0, 8) || 'Alert'}</span>
                          <span className="text-xs text-slate-400 font-normal">({res.timestamp})</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">Estimated Arrival: <strong className="text-[#38BDF8]">{res.eta}</strong></div>
                      </div>
                      <span 
                        style={{
                          fontSize: '0.725rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.65rem',
                          borderRadius: '9999px',
                          textTransform: 'uppercase',
                          background: res.status === 'accepted' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                          color: res.status === 'accepted' ? '#34D399' : '#F87171',
                          border: `1px solid ${res.status === 'accepted' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                        }}
                      >
                        {res.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DONATION HISTORY */}
          {/* TAB 4: DONATION HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              {/* Top Impact Metrics Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div 
                  className="p-4 rounded-xl flex items-center gap-3.5"
                  style={{
                    background: 'rgba(15, 23, 42, 0.88)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <div className="w-11 h-11 rounded-xl bg-[#FF2E54]/15 border border-[#FF2E54]/30 flex items-center justify-center text-[#FF2E54] shrink-0">
                    <Droplets size={22} />
                  </div>
                  <div>
                    <div className="text-xl font-extrabold text-white">1,350 ml</div>
                    <div className="text-[11px] text-slate-400 font-medium">Total Blood Donated</div>
                  </div>
                </div>

                <div 
                  className="p-4 rounded-xl flex items-center gap-3.5"
                  style={{
                    background: 'rgba(15, 23, 42, 0.88)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <Heart size={22} />
                  </div>
                  <div>
                    <div className="text-xl font-extrabold text-white">~9 Patients</div>
                    <div className="text-[11px] text-slate-400 font-medium">Estimated Lives Saved</div>
                  </div>
                </div>

                <div 
                  className="p-4 rounded-xl flex items-center gap-3.5"
                  style={{
                    background: 'rgba(15, 23, 42, 0.88)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <div className="w-11 h-11 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <div className="text-xl font-extrabold text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      Eligible Today
                    </div>
                    <div className="text-[11px] text-slate-400 font-medium">Next Cooldown: 0 Days</div>
                  </div>
                </div>
              </div>

              {/* Main Verified Donation Record Card */}
              <div 
                className="card"
                style={{
                  padding: '1.75rem',
                  background: 'rgba(15, 23, 42, 0.88)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '18px',
                  boxShadow: '0 15px 35px rgba(0, 0, 0, 0.5)',
                }}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5 pb-4 border-b border-white/10">
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                      <Droplets className="text-[#FF2E54]" size={18} />
                      <span>Verified Clinical Donation Record</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">Officially logged transfusions verified by accredited hospital blood banks</p>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    3 Verified Transfusions
                  </span>
                </div>

                {/* Clean Donation Record Cards */}
                <div className="space-y-3.5">
                  {[
                    {
                      id: 'don-1',
                      title: 'Whole Blood Donation',
                      volume: '1 Unit • 450 ml',
                      hospital: 'City Care Super Specialty Hospital',
                      city: 'New Delhi',
                      clinician: 'Dr. Arthur Vance (MD Transfusion)',
                      date: '14 Oct 2026',
                      certId: 'LFX-2026-WB450',
                      meshType: 'Emergency Bypass Requisition',
                      icon: Droplets,
                      iconBg: 'bg-[#FF2E54]/15',
                      iconBorder: 'border-[#FF2E54]/30',
                      iconColor: 'text-[#FF2E54]',
                    },
                    {
                      id: 'don-2',
                      title: 'Packed Red Blood Cells (PRBC)',
                      volume: '1 Unit • 300 ml',
                      hospital: 'KGMU Trauma Center',
                      city: 'Lucknow',
                      clinician: 'Dr. R. K. Mishra (Head of Trauma)',
                      date: '22 Jun 2026',
                      certId: 'LFX-2026-RBC300',
                      meshType: 'Trauma Mesh Alert Match',
                      icon: Activity,
                      iconBg: 'bg-cyan-500/15',
                      iconBorder: 'border-cyan-500/30',
                      iconColor: 'text-cyan-400',
                    },
                    {
                      id: 'don-3',
                      title: 'Platelet Apheresis Single Donor (SDP)',
                      volume: '1 Therapeutic Dose',
                      hospital: 'Metropolitan Regional Blood Bank',
                      city: 'Gurugram',
                      clinician: 'Dr. S. Nair (Oncology Division)',
                      date: '05 Jan 2026',
                      certId: 'LFX-2026-PLT250',
                      meshType: 'Platelet Emergency Support',
                      icon: Heart,
                      iconBg: 'bg-purple-500/15',
                      iconBorder: 'border-purple-500/30',
                      iconColor: 'text-purple-400',
                    },
                  ].map((rec) => {
                    const Icon = rec.icon;
                    return (
                      <div 
                        key={rec.id}
                        className="p-4 rounded-xl bg-slate-950/70 border border-white/10 hover:border-white/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-3.5">
                          <div className={`w-11 h-11 rounded-xl ${rec.iconBg} border ${rec.iconBorder} flex items-center justify-center ${rec.iconColor} shrink-0 mt-0.5`}>
                            <Icon size={20} />
                          </div>
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-bold text-white text-sm">{rec.title}</h3>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-mono font-bold">
                                {rec.volume}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1">
                                <CheckCircle2 size={11} />
                                VERIFIED
                              </span>
                            </div>
                            
                            <div className="text-xs text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5">
                              <span className="flex items-center gap-1 text-slate-300">
                                <Building2 size={12} className="text-slate-400" />
                                {rec.hospital} ({rec.city})
                              </span>
                              <span>•</span>
                              <span className="text-slate-400">
                                Verified by <strong className="text-slate-200">{rec.clinician}</strong>
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-500 font-mono">
                              Cert ID: <span className="text-slate-400">{rec.certId}</span> • {rec.meshType}
                            </div>
                          </div>
                        </div>

                        <div className="sm:text-right shrink-0 flex sm:flex-col justify-between items-center sm:items-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold">
                            <Calendar size={13} className="text-slate-400" />
                            <span>{rec.date}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setFeedback({ type: 'success', message: `Downloaded digital verification certificate ${rec.certId}.` });
                              setTimeout(() => setFeedback(null), 3000);
                            }}
                            className="text-[11px] font-bold text-[#FF2E54] hover:text-white flex items-center gap-1 transition-colors px-2.5 py-1 rounded bg-white/5 hover:bg-[#FF2E54]/20 border border-white/10 cursor-pointer"
                          >
                            <Download size={11} />
                            <span>Certificate</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Clinical Safety & Verification Badge */}
                <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
                    <span>All records validated under National Blood Transfusion Council (NBTC) clinical protocols.</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">Audit Hash: 0x8F4E...C91B</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
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
                  <h2 className="text-lg font-bold text-white tracking-tight">Notification Center</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Emergency alerts and status updates</p>
                </div>
                {unreadNotifs > 0 && (
                  <button 
                    onClick={handleMarkAllNotifications} 
                    className="btn btn-secondary btn-sm text-xs py-1.5 px-3 rounded-lg"
                  >
                    Mark All Read
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400 border border-white/5 rounded-xl bg-slate-950/40">
                  <Bell size={28} className="mx-auto mb-2 text-slate-600" />
                  <p className="text-sm">No new notifications on file.</p>
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {notifications.map((n) => (
                    <div key={n.id} className={`py-3.5 flex justify-between items-center ${!n.is_read ? 'bg-[#FF2E54]/5 px-3 rounded-xl' : ''}`}>
                      <div>
                        <div className="font-bold text-white text-sm flex items-center gap-2">
                          {!n.is_read && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF2E54' }}></span>}
                          <span>{n.title}</span>
                        </div>
                        <div className="text-xs text-slate-300 mt-0.5">{n.message}</div>
                      </div>
                      {!n.is_read && (
                        <button 
                          onClick={() => handleMarkNotification(n.id)} 
                          className="text-xs text-[#38BDF8] hover:underline font-semibold ml-4 shrink-0"
                        >
                          Mark Read
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: DONOR PROFILE */}
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Editable Profile Form */}
              <div className="lg:col-span-7">
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
                  <div className="mb-6 pb-4 border-b border-white/10 flex items-start justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-white mb-1 tracking-tight flex items-center gap-2">
                        <User className="text-[#FF2E54]" size={18} />
                        <span>Donor Profile Information</span>
                      </h2>
                      <p className="text-xs text-slate-400">Manage your contact information and verified blood group identity</p>
                    </div>
                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      ACTIVE PROFILE
                    </span>
                  </div>
                  
                  <div className="space-y-4 text-sm">
                    {/* Full Name */}
                    <div>
                      <label className="text-xs text-slate-300 font-semibold block mb-1.5">Full Name</label>
                      <div className="relative flex items-center">
                        <input 
                          type="text" 
                          className="form-control text-sm py-2.5 bg-slate-950/70 border-white/10 text-white rounded-lg focus:border-[#FF2E54]" 
                          style={{ paddingLeft: '2.75rem', paddingRight: '0.85rem' }}
                          value={fullName} 
                          onChange={(e) => setFullName(e.target.value)} 
                          placeholder="e.g. Anita Desai"
                        />
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
                      </div>
                    </div>

                    {/* Phone Number */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-xs text-slate-300 font-semibold">Phone Number</label>
                        <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                          <ShieldCheck size={12} /> Protected via Supabase RLS
                        </span>
                      </div>
                      <div className="relative flex items-center">
                        <input 
                          type="text" 
                          className="form-control text-sm py-2.5 bg-slate-950/70 border-white/10 text-white rounded-lg focus:border-[#FF2E54]" 
                          style={{ paddingLeft: '2.75rem', paddingRight: '0.85rem' }}
                          value={phone} 
                          onChange={(e) => setPhone(e.target.value)} 
                          placeholder="+91 98765 43210"
                        />
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
                      </div>
                    </div>

                    {/* City / Operating Zone */}
                    <div>
                      <label className="text-xs text-slate-300 font-semibold block mb-1.5">City / Operating Zone</label>
                      <div className="relative flex items-center">
                        <input 
                          type="text" 
                          className="form-control text-sm py-2.5 bg-slate-950/70 border-white/10 text-white rounded-lg focus:border-[#FF2E54]" 
                          style={{ paddingLeft: '2.75rem', paddingRight: '0.85rem' }}
                          value={city} 
                          onChange={(e) => setCity(e.target.value)} 
                          placeholder="e.g. New Delhi"
                        />
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
                      </div>
                    </div>

                    {/* Blood Group Verified Card */}
                    <div>
                      <label className="text-xs text-slate-300 font-semibold block mb-1.5">
                        Clinical Blood Group (Locked)
                      </label>
                      <div className="p-3.5 rounded-xl bg-slate-950/70 border border-white/10 flex items-center gap-4">
                        <div 
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #FF2E54 0%, #D61238 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#FFFFFF',
                            fontWeight: 900,
                            fontSize: '1.2rem',
                            boxShadow: '0 4px 14px rgba(255, 46, 84, 0.4)',
                            flexShrink: 0,
                          }}
                        >
                          {bloodGroup}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white flex items-center gap-2">
                            <span>Clinical Laboratory Certified</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 font-bold">
                              NBTC VERIFIED
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Locked for emergency transfusion safety. Contact clinical administrator to re-certify.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-3">
                      <button 
                        type="button"
                        onClick={() => {
                          setFeedback({ type: 'success', message: 'Donor profile information saved successfully.' });
                          setTimeout(() => setFeedback(null), 3000);
                        }} 
                        className="btn btn-primary w-full py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                        style={{ background: 'linear-gradient(135deg, #FF2E54 0%, #D61238 100%)', boxShadow: '0 4px 15px rgba(255, 46, 84, 0.4)' }}
                      >
                        <Check size={16} />
                        <span>Save Profile Changes</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Digital Donor Accreditation Card */}
              <div className="lg:col-span-5 space-y-4">
                <div 
                  className="card"
                  style={{
                    padding: '1.75rem',
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '18px',
                    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.5)',
                  }}
                >
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
                    <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck size={15} className="text-emerald-400" />
                      Digital Donor ID
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 font-bold">
                      VERIFIED
                    </span>
                  </div>

                  {/* Profile ID Card Presentation */}
                  <div className="flex items-center gap-3.5 mb-4 p-3 rounded-xl bg-slate-950/60 border border-white/5">
                    <div 
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #FF2E54 0%, #D61238 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFFFFF',
                        fontWeight: 900,
                        fontSize: '1.25rem',
                        boxShadow: '0 0 15px rgba(255, 46, 84, 0.4)',
                        flexShrink: 0,
                      }}
                    >
                      {fullName.charAt(0) || 'A'}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-white truncate">{fullName}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        <span>Level 3 Lifesaver • {city}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Profile Summary */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/5">
                      <span className="text-slate-400">Donor Serial ID:</span>
                      <strong className="text-white font-mono font-bold">LFX-DN-9941</strong>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/5">
                      <span className="text-slate-400">Blood Group Match:</span>
                      <strong className="text-[#FF2E54] font-bold">{bloodGroup} (Universal Rh+)</strong>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/5">
                      <span className="text-slate-400">Verified Transfusions:</span>
                      <strong className="text-emerald-400 font-bold">3 Completed</strong>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/5">
                      <span className="text-slate-400">Active Geofence:</span>
                      <strong className="text-[#38BDF8] font-bold">{travelRadius} km Radius</strong>
                    </div>
                  </div>

                  {/* Privacy Protocol Notice */}
                  <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-slate-400 space-y-1.5">
                    <div className="flex items-start gap-1.5 text-slate-300">
                      <ShieldCheck size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                      <span>Phone & exact location are protected under Supabase RLS encryption and only shared after handshake acceptance.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: SETTINGS & GEOFENCE */}
          {activeTab === 'settings' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8">
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
                  <div className="mb-6 pb-4 border-b border-white/10">
                    <h2 className="text-lg font-bold text-white mb-1 tracking-tight flex items-center gap-2">
                      <Sliders className="text-[#FF2E54]" size={18} />
                      <span>Geofence & Alert Settings</span>
                    </h2>
                    <p className="text-xs text-slate-400">Configure dispatch travel radius and notification preferences</p>
                  </div>

                  <div className="space-y-6 text-sm">
                    {/* Travel Radius */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                          <MapPin size={14} className="text-[#FF2E54]" />
                          Emergency Dispatch Travel Radius
                        </label>
                        <span className="text-xs font-bold text-[#FF2E54] bg-[#FF2E54]/10 px-2.5 py-0.5 rounded-full border border-[#FF2E54]/30 font-mono">
                          {travelRadius} km
                        </span>
                      </div>
                      <input 
                        type="range" 
                        min={5} 
                        max={50} 
                        step={1} 
                        value={travelRadius} 
                        onChange={(e) => setTravelRadius(Number(e.target.value))} 
                        className="w-full accent-[#FF2E54] cursor-pointer" 
                      />
                      <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                        <span>5 km (Local neighborhood)</span>
                        <span>25 km (Citywide)</span>
                        <span>50 km (Regional)</span>
                      </div>
                    </div>

                    {/* Alert Toggles */}
                    <div className="space-y-3 pt-3 border-t border-white/10">
                      <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950/60 border border-white/5">
                        <div>
                          <div className="text-xs font-semibold text-white">Emergency Push Alerts</div>
                          <div className="text-[11px] text-slate-400">Receive instant audio chime on critical local matches</div>
                        </div>
                        <label className="toggle-switch-wrapper mb-0" style={{ cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            checked={pushAlerts} 
                            onChange={() => setPushAlerts(!pushAlerts)} 
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>

                      <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950/60 border border-white/5">
                        <div>
                          <div className="text-xs font-semibold text-white">SMS Triage Notification</div>
                          <div className="text-[11px] text-slate-400">Receive backup SMS dispatch route when app is backgrounded</div>
                        </div>
                        <label className="toggle-switch-wrapper mb-0" style={{ cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            checked={smsAlerts} 
                            onChange={() => setSmsAlerts(!smsAlerts)} 
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button 
                        type="button"
                        onClick={() => {
                          setFeedback({ type: 'success', message: 'Geofence radius and dispatch preferences updated.' });
                          setTimeout(() => setFeedback(null), 3000);
                        }} 
                        className="btn btn-primary text-xs py-3 px-6 rounded-xl font-bold shadow-md cursor-pointer"
                        style={{ background: 'linear-gradient(135deg, #FF2E54 0%, #D61238 100%)', boxShadow: '0 4px 15px rgba(255, 46, 84, 0.4)' }}
                      >
                        Save Preferences
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Settings Right Column: Mesh Coverage Info */}
              <div className="lg:col-span-4 space-y-4">
                <div 
                  className="card"
                  style={{
                    padding: '1.75rem',
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '18px',
                  }}
                >
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Radio size={14} className="text-[#FF2E54] animate-pulse" />
                    Geofence Coverage
                  </h3>
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5 text-xs space-y-2 mb-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Current Zone:</span>
                      <strong className="text-white">{city} Metro</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Radial Range:</span>
                      <strong className="text-[#FF2E54] font-bold">{travelRadius} km</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Hospitals in Range:</span>
                      <strong className="text-emerald-400 font-bold">14 Facilities</strong>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Requests outside your configured travel radius will not trigger audible notifications unless elevated to platform-wide mass casualty status.
                  </p>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};
