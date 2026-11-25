import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { MetricValue } from '../../components/ui/MetricValue';
import { motion } from 'framer-motion';
import SquishSwitch from '../../components/reactbits/SquishSwitch';
import { GeofenceRadar } from '../../components/site/GeofenceRadar';
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
    <div className="dash py-8 max-w-7xl">
      {/* Top Banner Alert Message */}
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

      {/* Top Greeting & Availability Header */}
      <div className="dashboard-greeting-row mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="dash-title">
            Welcome, {user.full_name || 'Anita Desai (Demo Donor)'}
          </h1>
          <p className="text-[13.5px] sm:text-[15px] text-muted mt-1">
            Voluntary Donor Emergency Hub, Blood Group: <span className="text-red-ink font-bold">{bloodGroup}</span>
          </p>
        </div>

        {/* Functional Availability Toggle Switch */}
        <div 
          className="flex items-center gap-3 px-4 py-2 rounded-full border"
          style={{
            background: 'var(--surface)',
            borderColor: available ? 'var(--ok-wash)' : 'var(--sunk)',
            boxShadow: 'none',
          }}
        >
          <div className="flex items-center gap-1.5">
            <span 
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: available ? 'var(--ok-ink)' : 'var(--muted)',
                boxShadow: 'none',
              }}
            ></span>
            <span className="text-[13.5px] font-semibold text-ink">
              {available ? 'Available to Donate' : 'Unavailable / Busy'}
            </span>
          </div>
          <SquishSwitch checked={available} onChange={handleAvailabilityToggle} trackColor="var(--line-strong)" trackOnColor="var(--ok)" thumbColor="#fff" thumbOnColor="#fff" ariaLabel="Available to donate" />
        </div>
      </div>

      {/* 4-Stat Metric Grid */}
      <div className="metrics-row mb-8">
        <div className="metric-card">
          <MetricValue className="metric-val val-crimson">{bloodGroup}</MetricValue>
          <div className="metric-lbl">Blood Group</div>
        </div>
        <div className="metric-card">
          <MetricValue className="metric-val val-teal">{feedRequests.length || 8}</MetricValue>
          <div className="metric-lbl">Requests Nearby</div>
        </div>
        <div className="metric-card">
          <MetricValue className="metric-val val-navy">3</MetricValue>
          <div className="metric-lbl">Verified Donations</div>
        </div>
        <div className="metric-card">
          <MetricValue className="metric-val val-navy">{travelRadius} km</MetricValue>
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
        <aside className="dash-aside md:col-span-4 lg:col-span-3">
          <div 
            className="donor-sidebar-card"
          >
            {/* Donor Mini Profile Card */}
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
                A
              </div>
              <div className="min-w-0">
                <div className="text-[15px] font-bold text-ink truncate">Anita Desai</div>
                <div className="text-[12.5px] text-muted flex items-center gap-1.5">
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--ok)', display: 'inline-block' }}></span>
                  <span>{bloodGroup}, Voluntary Donor</span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs List */}
            <div className="text-[12.5px] font-bold  text-muted mb-2 px-1">
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

            {/* Sidebar Bottom Live Emergency Status Card */}
            <div className="mt-5 pt-4 border-t border-line">
              <div className="p-3 rounded-xl bg-sunk border border-line space-y-1">
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="text-muted">Geofence Status</span>
                  <span className="text-ok-ink font-bold">15 km Active</span>
                </div>
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="text-muted">Emergency Hotline</span>
                  <span className="text-ink font-mono text-[12.5px]">1800-LIFNEX</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ======================================================== */}
        {/* RIGHT MAIN CONTENT AREA                                  */}
        {/* ======================================================== */}
        <main key={activeTab} className="panel-in min-w-0 md:col-span-8 lg:col-span-9 space-y-6">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                    <Droplets className="text-red-ink" size={18} />
                    <span>Immediate Emergency Priority Feed</span>
                  </h2>
                  <p className="text-[13.5px] text-muted mt-0.5">
                    Critical blood requests within your {travelRadius} km geofence requiring {bloodGroup}
                  </p>
                </div>
                <button 
                  onClick={loadDashboardData} 
                  className="btn btn-secondary btn-sm flex items-center gap-1.5 text-[13.5px] py-1.5 px-3 rounded-lg"
                  style={{
                    background: 'var(--sunk)',
                    border: '1px solid var(--line)',
                    color: 'var(--muted)',
                  }}
                >
                  <RefreshCw size={12} className={loading ? 'animate-spin text-red-ink' : ''} />
                  <span>Refresh Feed</span>
                </button>
              </div>

              {/* Feed List */}
              {feedRequests.length === 0 ? (
                <div 
                  className="card text-center text-muted"
                  style={{
                    padding: '3rem 2rem',
                    background: 'var(--surface)',
                    border: '1px dashed var(--line)',
                    borderRadius: '16px',
                  }}
                >
                  <Heart size={36} className="mx-auto mb-3 text-faint opacity-60" />
                  <h3 className="text-base font-bold text-ink mb-1">No Urgent Alerts Right Now</h3>
                  <p className="text-[13.5px] text-muted max-w-md mx-auto">
                    All hospital requisitions matching blood group {bloodGroup} in your area are currently fulfilled. You will receive an instant dispatch ping when a match occurs.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {feedRequests.map((req) => (
                    <div 
                      key={req.id} 
                      className="card"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span 
                              style={{
                                background: req.urgency_level === 'critical' ? 'var(--red-wash)' : 'var(--plasma-wash)',
                                color: req.urgency_level === 'critical' ? 'var(--red-ink)' : 'var(--plasma-ink)',
                                border: `1px solid ${req.urgency_level === 'critical' ? 'var(--red-wash)' : 'var(--plasma-wash)'}`,
                                padding: '0.15rem 0.5rem',
                                borderRadius: '6px',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                
                              }}
                            >
                              {req.urgency_level || 'CRITICAL'}
                            </span>
                            <span className="text-ink font-bold text-[15px]">{req.hospital_name || 'City Care Super Specialty Hospital'}</span>
                            <span className="text-[13.5px] text-muted">• {req.city || 'New Delhi'}</span>
                          </div>
                          
                          <p className="text-[13.5px] text-ink">
                            Requires <strong className="text-ink font-bold">{req.units_required || 2} Units</strong> of <strong className="text-red-ink font-bold">{req.blood_group}</strong>, Approx. Distance: <strong className="text-ink">{req.distance_km || 3.4} km</strong>
                          </p>
                          
                          <p className="text-[12.5px] text-muted bg-sunk p-2 rounded-lg border border-line">
                            {req.clinical_notes || 'Trauma surgery priority requisition.'}
                          </p>
                        </div>

                        {/* Interactive Accept & Decline Actions */}
                        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                          <button 
                            type="button"
                            onClick={() => handleRespond(req.id, 'accepted')} 
                            className="btn btn-primary text-[13.5px] py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 font-bold  flex-1 sm:flex-none"
                            style={{
                              background: 'var(--ok-fill)',
                              boxShadow: 'none',
                            }}
                          >
                            <Check size={14} />
                            <span>I'm Available</span>
                          </button>

                          <button 
                            type="button"
                            onClick={() => handleRespond(req.id, 'declined')} 
                            className="btn btn-secondary text-[13.5px] py-2.5 px-3 rounded-xl flex items-center justify-center gap-1"
                            style={{
                              background: 'var(--sunk)',
                              border: '1px solid var(--line)',
                              color: 'var(--muted)',
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
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Radio size={16} className="text-info-ink animate-pulse" />
                    <h3 className="text-[15px] font-bold text-ink">Local Dispatch Mesh Radar</h3>
                  </div>
                  <span className="text-[12.5px] px-2 py-0.5 rounded-full bg-sunk text-muted font-mono">
                    15 km Geofence
                  </span>
                </div>
                <GeofenceRadar />
                <p className="text-[13.5px] text-muted mb-3">
                  Your coordinates are protected through differential privacy and randomized geo-hashing. Only approximate route vectors are calculated for dispatch.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-sunk border border-line">
                    <div className="text-base font-bold text-ink">4</div>
                    <div className="text-[12.5px] text-muted mt-0.5">Hospitals in Radius</div>
                  </div>
                  <div className="p-3 rounded-xl bg-sunk border border-line">
                    <div className="text-base font-bold text-ok-ink">Active</div>
                    <div className="text-[12.5px] text-muted mt-0.5">Triage Signal</div>
                  </div>
                  <div className="p-3 rounded-xl bg-sunk border border-line">
                    <div className="text-base font-bold text-info-ink">18 mins</div>
                    <div className="text-[12.5px] text-muted mt-0.5">Average ETA</div>
                  </div>
                  <div className="p-3 rounded-xl bg-sunk border border-line">
                    <div className="text-base font-bold text-red-ink">100%</div>
                    <div className="text-[12.5px] text-muted mt-0.5">RLS Protected</div>
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
                  <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                    <Droplets className="text-red-ink" size={18} />
                    <span>Compatible Emergency Alerts ({feedRequests.length})</span>
                  </h2>
                  <p className="text-[13.5px] text-muted mt-0.5">Live emergency requisitions matched against your {bloodGroup} blood group</p>
                </div>
                <button 
                  onClick={loadDashboardData} 
                  className="btn btn-secondary btn-sm flex items-center gap-1.5 text-[13.5px] py-1.5 px-3 rounded-lg"
                >
                  <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                  <span>Refresh</span>
                </button>
              </div>

              {feedRequests.length === 0 ? (
                <div className="card p-8 text-center text-muted">
                  <p className="text-[15px]">No emergency alerts in your immediate radius right now.</p>
                  <p className="text-[13.5px] text-faint mt-1">Thank you for standing ready as a verified donor.</p>
                </div>
              ) : (
                feedRequests.map((req) => (
                  <div 
                    key={req.id} 
                    className="card p-4 rounded-xl border border-line bg-sunk flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="badge badge-primary font-bold text-[12.5px]">{req.urgency_level || 'CRITICAL'}</span>
                        <span className="text-ink font-bold text-[15px]">{req.hospital_name || 'City Care Super Specialty Hospital'}</span>
                        <span className="text-[13.5px] text-muted">• {req.city || 'New Delhi'}</span>
                      </div>
                      <p className="text-[13.5px] text-ink">
                        Requires <strong className="text-ink">{req.units_required || 2} Units</strong> of <strong className="text-red-ink">{req.blood_group}</strong>
                      </p>
                      <p className="text-[12.5px] text-muted">{req.clinical_notes || 'Trauma surgery priority requisition.'}</p>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button 
                        onClick={() => handleRespond(req.id, 'accepted')} 
                        className="btn btn-primary text-[13.5px] py-2 px-3.5 rounded-lg flex-1 sm:flex-none font-bold "
                        style={{ background: 'var(--ok-fill)' }}
                      >
                        Accept & Dispatch →
                      </button>
                      <button 
                        onClick={() => handleRespond(req.id, 'declined')} 
                        className="btn btn-secondary text-[13.5px] py-2 px-3 rounded-lg"
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
            >
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-bold text-ink tracking-tight">My Emergency Responses</h2>
                  <p className="text-[13.5px] text-muted mt-0.5">Responses you have submitted for active emergency cases</p>
                </div>
                <span className="text-[13.5px] px-2.5 py-1 rounded-full bg-sunk text-muted font-mono">
                  {myResponses.length} Cases
                </span>
              </div>

              {myResponses.length === 0 ? (
                <div className="p-8 text-center text-muted border border-line rounded-xl bg-sunk">
                  <CheckCircle2 size={32} className="mx-auto mb-2 text-faint" />
                  <p className="text-[15px] font-semibold text-muted">No Responses Submitted Yet</p>
                  <p className="text-[13.5px] text-muted mt-1">When you accept emergency alerts, your dispatch status will appear here.</p>
                </div>
              ) : (
                <div className="divide-y divide-line">
                  {myResponses.map((res, i) => (
                    <div key={i} className="py-3.5 flex justify-between items-center text-[15px]">
                      <div>
                        <div className="font-bold text-ink flex items-center gap-2">
                          <span>Case #{res.request_id?.slice(0, 8) || 'Alert'}</span>
                          <span className="text-[13.5px] text-muted font-normal">({res.timestamp})</span>
                        </div>
                        <div className="text-[13.5px] text-muted mt-0.5">Estimated Arrival: <strong className="text-info-ink">{res.eta}</strong></div>
                      </div>
                      <span 
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.65rem',
                          borderRadius: '9999px',
                          
                          background: res.status === 'accepted' ? 'var(--ok-wash)' : 'var(--red-wash)',
                          color: res.status === 'accepted' ? 'var(--ok-ink)' : 'var(--red-ink)',
                          border: `1px solid ${res.status === 'accepted' ? 'var(--ok-wash)' : 'var(--red-wash)'}`,
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
            <div 
              style={{
                padding: '2rem',
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: '16px',
                boxShadow: 'none',
                
              }}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-ink tracking-tight">Verified Donation Record</h2>
                  <p className="text-[13.5px] text-muted mt-0.5">Officially logged donations verified by participating hospitals</p>
                </div>
                <span className="text-ok-ink font-bold text-[15px]">3 Logged</span>
              </div>

              <div className="divide-y divide-line">
                {[
                  {
                    id: 'don-1',
                    title: 'Whole Blood Donation (1 Unit, 450 ml)',
                    hospital: 'City Care Super Specialty Hospital, Verified by Dr. Arthur Vance',
                    date: '14 Oct 2026',
                  },
                  {
                    id: 'don-2',
                    title: 'Packed Red Blood Cells (1 Unit)',
                    hospital: 'KGMU Trauma Center, Emergency Dispatch Mesh',
                    date: '22 Jun 2026',
                  },
                  {
                    id: 'don-3',
                    title: 'Platelet Apheresis Single Donor',
                    hospital: 'Metropolitan Regional Blood Bank, Oncology Support',
                    date: '05 Jan 2026',
                  },
                ].map((rec) => (
                  <div key={rec.id} className="py-4 flex justify-between items-center gap-4">
                    <div>
                      <div className="text-[15px] font-bold text-ink">{rec.title}</div>
                      <div className="text-[13.5px] text-muted mt-0.5">{rec.hospital}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <span 
                        style={{
                          fontSize: '0.8rem',
                          padding: '0.2rem 0.65rem',
                          borderRadius: '9999px',
                          border: '1px solid transparent',
                          background: 'var(--ok-wash)',
                          color: 'var(--ok-ink)',
                          fontWeight: 700,
                          display: 'inline-block',
                        }}
                      >
                        VERIFIED
                      </span>
                      <div className="text-[13.5px] text-muted mt-1">{rec.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div 
              className="card"
            >
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-bold text-ink tracking-tight">Notification Center</h2>
                  <p className="text-[13.5px] text-muted mt-0.5">Emergency alerts and status updates</p>
                </div>
                {unreadNotifs > 0 && (
                  <button 
                    onClick={handleMarkAllNotifications} 
                    className="btn btn-secondary btn-sm text-[13.5px] py-1.5 px-3 rounded-lg"
                  >
                    Mark All Read
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted border border-line rounded-xl bg-sunk">
                  <Bell size={28} className="mx-auto mb-2 text-faint" />
                  <p className="text-[15px]">No new notifications on file.</p>
                </div>
              ) : (
                <div className="divide-y divide-line">
                  {notifications.map((n) => (
                    <div key={n.id} className={`py-3.5 flex justify-between items-center ${!n.is_read ? 'bg-red-wash px-3 rounded-xl' : ''}`}>
                      <div>
                        <div className="font-bold text-ink text-[15px] flex items-center gap-2">
                          {!n.is_read && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--red)' }}></span>}
                          <span>{n.title}</span>
                        </div>
                        <div className="text-[13.5px] text-muted mt-0.5">{n.message}</div>
                      </div>
                      {!n.is_read && (
                        <button 
                          onClick={() => handleMarkNotification(n.id)} 
                          className="text-[13.5px] text-info-ink hover:underline font-semibold ml-4 shrink-0"
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
            <div 
              style={{
                padding: '2rem',
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: '16px',
                boxShadow: 'none',
                
              }}
            >
              <div className="mb-6">
                <h2 className="text-lg font-bold text-ink tracking-tight">Donor Profile Information</h2>
                <p className="text-[13.5px] text-muted mt-0.5">Manage your contact information and verified blood group identity</p>
              </div>

              <div className="space-y-4 max-w-2xl">
                <div>
                  <label className="text-[13.5px] text-muted font-semibold block mb-1.5">Full Name</label>
                  <input 
                    type="text" 
                    className="form-control text-[15px] py-2.5 px-3 bg-sunk border-line text-ink rounded-lg  w-full" 
                    value={fullName} 
                    onChange={(e) => setFullName(e.target.value)} 
                    placeholder="Anita Desai (Demo Donor)"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <label className="text-[13.5px] text-muted font-semibold">Phone Number</label>
                    <span className="text-[12.5px] text-ok-ink font-medium">(Protected via Supabase RLS)</span>
                  </div>
                  <input 
                    type="text" 
                    className="form-control text-[15px] py-2.5 px-3 bg-sunk border-line text-ink rounded-lg  w-full" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div>
                  <label className="text-[13.5px] text-muted font-semibold block mb-1.5">City / Operating Zone</label>
                  <input 
                    type="text" 
                    className="form-control text-[15px] py-2.5 px-3 bg-sunk border-line text-ink rounded-lg  w-full" 
                    value={city} 
                    onChange={(e) => setCity(e.target.value)} 
                    placeholder="New Delhi"
                  />
                </div>

                <div>
                  <label className="text-[13.5px] text-muted font-semibold block mb-1.5">
                    Blood Group (Verified)
                  </label>
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-1 rounded bg-red-wash border border-red text-red-ink font-bold text-[13.5px]">
                      {bloodGroup}
                    </span>
                    <span className="text-[13.5px] text-muted">
                      Clinical laboratory verified. Contact admin to re-certify.
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    type="button"
                    onClick={() => {
                      setFeedback({ type: 'success', message: 'Donor profile information saved successfully.' });
                      setTimeout(() => setFeedback(null), 3000);
                    }} 
                    className="btn btn-primary py-2.5 px-6 rounded-xl font-bold  cursor-pointer text-[13.5px]"
                    style={{ background: 'var(--red)', boxShadow: 'none' }}
                  >
                    Save Profile Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: SETTINGS & GEOFENCE */}
          {activeTab === 'settings' && (
            <div 
              style={{
                padding: '2rem',
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: '16px',
                boxShadow: 'none',
                
              }}
            >
              <div className="mb-6">
                <h2 className="text-lg font-bold text-ink tracking-tight">Geofence & Alert Settings</h2>
                <p className="text-[13.5px] text-muted mt-0.5">Configure dispatch travel radius and notification preferences</p>
              </div>

              <div className="space-y-5 max-w-2xl">
                {/* Travel Radius Slider */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[13.5px] text-muted font-semibold flex items-center gap-1.5">
                      <MapPin size={14} className="text-red-ink" />
                      <span>Emergency Dispatch Travel Radius</span>
                    </label>
                    <span className="text-[13.5px] font-bold text-red-ink font-mono">
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
                    className="w-full accent-red cursor-pointer" 
                  />
                  <div className="flex justify-between text-[12.5px] text-faint mt-1">
                    <span>5 km (Local neighborhood)</span>
                    <span>25 km (Citywide)</span>
                    <span>50 km (Regional)</span>
                  </div>
                </div>

                {/* Alert Toggles */}
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center p-3 rounded-xl bg-sunk border border-line">
                    <div>
                      <div className="text-[13.5px] font-semibold text-ink">Emergency Push Alerts</div>
                      <div className="text-[12.5px] text-muted">Receive instant audio chime on critical local matches</div>
                    </div>
                    <SquishSwitch checked={pushAlerts} onChange={() => setPushAlerts(!pushAlerts)} trackColor="var(--line-strong)" trackOnColor="var(--ok)" thumbColor="#fff" thumbOnColor="#fff" ariaLabel="Push alerts" />
                  </div>

                  <div className="flex justify-between items-center p-3 rounded-xl bg-sunk border border-line">
                    <div>
                      <div className="text-[13.5px] font-semibold text-ink">SMS Triage Notification</div>
                      <div className="text-[12.5px] text-muted">Receive backup SMS dispatch route when app is backgrounded</div>
                    </div>
                    <SquishSwitch checked={smsAlerts} onChange={() => setSmsAlerts(!smsAlerts)} trackColor="var(--line-strong)" trackOnColor="var(--ok)" thumbColor="#fff" thumbOnColor="#fff" ariaLabel="SMS alerts" />
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    type="button"
                    onClick={() => {
                      setFeedback({ type: 'success', message: 'Geofence radius and dispatch preferences updated.' });
                      setTimeout(() => setFeedback(null), 3000);
                    }} 
                    className="btn btn-primary text-[13.5px] py-2.5 px-6 rounded-xl font-bold  cursor-pointer"
                    style={{ background: 'var(--red)', boxShadow: 'none' }}
                  >
                    Save Preferences
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};
