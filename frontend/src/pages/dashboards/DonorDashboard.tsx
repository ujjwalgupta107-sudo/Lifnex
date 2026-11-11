import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { 
  Activity, Bell, CheckCircle2, Clock, Droplets, MapPin, 
  ShieldCheck, User, Settings, Check, X, AlertTriangle, RefreshCw
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
  const [fullName, setFullName] = useState(user.full_name || 'Anita (Voluntary Donor)');
  const [phone, setPhone] = useState(user.phone_number || '+91 98765 43210');
  const [city, setCity] = useState('Metropolis');
  const [travelRadius, setTravelRadius] = useState(15);

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
        setFeedback({ type: 'success', message: `Status updated to ${nextStatus.toUpperCase()}` });
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
          message: status === 'accepted' ? 'Emergency response dispatched! Hospital and patient notified.' : 'Request declined.',
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

        // Remove or update from feed
        setFeedRequests(prev => prev.filter(r => r.id !== requestId));
      } else {
        setFeedback({ type: 'error', message: res.error?.message || 'Unable to record response.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Network error.' });
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

  return (
    <div className="container py-8 max-w-7xl">
      {/* Top Banner Message */}
      {feedback && (
        <div className={`mb-4 p-3 rounded-lg text-sm flex items-center justify-between ${
          feedback.type === 'success' ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-200' : 'bg-red-950/70 border border-red-500/40 text-red-200'
        }`}>
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white"><X size={16} /></button>
        </div>
      )}

      {/* Greeting & Header */}
      <div className="dashboard-greeting-row mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Welcome, {user.full_name || 'Anita'}</h1>
          <p className="text-sm text-slate-400">Voluntary Donor Emergency Hub • Blood Group: <span className="text-[#FF2E54] font-bold">{bloodGroup}</span></p>
        </div>

        {/* Functional Availability Toggle Switch */}
        <div className="flex items-center gap-3 bg-[#0F172A] border border-white/10 px-4 py-2 rounded-full">
          <span className="text-xs font-semibold text-slate-300">Available to Donate</span>
          <label className="toggle-switch-wrapper">
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

      {/* Navigation Pills */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-white/10 pb-4">
        {[
          { id: 'overview', label: 'Dashboard Overview', icon: Activity },
          { id: 'requests', label: `Nearby Alerts (${feedRequests.length})`, icon: Droplets },
          { id: 'responses', label: `My Responses (${myResponses.length})`, icon: CheckCircle2 },
          { id: 'history', label: 'Donation History', icon: Clock },
          { id: 'notifications', label: `Notifications (${unreadNotifs})`, icon: Bell },
          { id: 'profile', label: 'Donor Profile', icon: User },
          { id: 'settings', label: 'Settings', icon: Settings },
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

      {/* TAB CONTENT: Overview & Requests */}
      {(activeTab === 'overview' || activeTab === 'requests') && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Droplets className="text-[#FF2E54]" size={18} />
              Compatible Emergency Requests Near You
            </h2>
            <button onClick={loadDashboardData} className="btn btn-secondary btn-sm flex items-center gap-1.5 text-xs">
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              Refresh Feed
            </button>
          </div>

          {feedRequests.length === 0 ? (
            <div className="card p-8 text-center text-slate-400">
              <p className="text-sm">No critical requests matching your blood group in your area right now.</p>
              <p className="text-xs text-slate-500 mt-1">Thank you for standing ready as a verified donor.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {feedRequests.map((req) => (
                <div key={req.id} className="donor-urgent-card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 rounded-xl border border-white/10 bg-slate-900/80">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="badge badge-primary font-bold text-[11px]">{req.urgency_level || 'CRITICAL'}</span>
                      <span className="text-white font-bold text-sm">{req.hospital_name || 'KGMU Trauma Center'}</span>
                      <span className="text-xs text-slate-400">• {req.city || 'Metropolis'}</span>
                    </div>
                    <p className="text-xs text-slate-300">
                      Requires <strong className="text-white">{req.units_required || 2} Units</strong> of <strong className="text-[#FF2E54]">{req.blood_group}</strong>
                    </p>
                    <p className="text-[11px] text-slate-400">{req.clinical_notes || 'Immediate trauma surgery transfusion required.'}</p>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button 
                      onClick={() => handleRespond(req.id, 'accepted')} 
                      className="btn-teal-action flex-1 sm:flex-none text-xs py-2 px-3 rounded-lg"
                    >
                      I'm Available to Donate →
                    </button>
                    <button 
                      onClick={() => handleRespond(req.id, 'declined')} 
                      className="btn-decline-action text-xs py-2 px-3 rounded-lg"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: My Responses */}
      {activeTab === 'responses' && (
        <div className="card p-6">
          <h2 className="text-lg font-bold text-white mb-4">My Emergency Responses</h2>
          {myResponses.length === 0 ? (
            <p className="text-sm text-slate-400">You haven't responded to any active requests in this session yet.</p>
          ) : (
            <div className="divide-y divide-white/10">
              {myResponses.map((res, i) => (
                <div key={i} className="py-3 flex justify-between items-center text-sm">
                  <div>
                    <span className="font-semibold text-white">Case ID: {res.request_id}</span>
                    <span className="text-xs text-slate-400 ml-2">ETA: {res.eta}</span>
                  </div>
                  <span className={`badge ${res.status === 'accepted' ? 'badge-success' : 'badge-warning'}`}>
                    {res.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Donation History */}
      {activeTab === 'history' && (
        <div className="card p-6">
          <h2 className="text-lg font-bold text-white mb-4">Verified Donation Record</h2>
          <div className="divide-y divide-white/10 text-sm">
            <div className="py-3 flex justify-between items-center">
              <div>
                <div className="font-bold text-white">Whole Blood Donation (1 Unit)</div>
                <div className="text-xs text-slate-400">City Care Super Specialty Hospital • Verified by Dr. S. Nair</div>
              </div>
              <div className="text-right">
                <span className="badge badge-success">COMPLETED</span>
                <div className="text-xs text-slate-400 mt-0.5">14 Oct 2026</div>
              </div>
            </div>
            <div className="py-3 flex justify-between items-center">
              <div>
                <div className="font-bold text-white">Packed Red Blood Cells (1 Unit)</div>
                <div className="text-xs text-slate-400">KGMU Trauma Center • Emergency Dispatch</div>
              </div>
              <div className="text-right">
                <span className="badge badge-success">COMPLETED</span>
                <div className="text-xs text-slate-400 mt-0.5">22 Jun 2026</div>
              </div>
            </div>
            <div className="py-3 flex justify-between items-center">
              <div>
                <div className="font-bold text-white">Platelet Apheresis</div>
                <div className="text-xs text-slate-400">Metropolitan Blood Bank</div>
              </div>
              <div className="text-right">
                <span className="badge badge-success">COMPLETED</span>
                <div className="text-xs text-slate-400 mt-0.5">05 Jan 2026</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Notifications */}
      {activeTab === 'notifications' && (
        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-white">Notifications ({notifications.length})</h2>
            {unreadNotifs > 0 && (
              <button onClick={handleMarkAllNotifications} className="btn btn-secondary btn-sm text-xs">
                Mark All Read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="text-sm text-slate-400">No notifications on file.</p>
          ) : (
            <div className="divide-y divide-white/10">
              {notifications.map((n) => (
                <div key={n.id} className={`py-3 flex justify-between items-center ${!n.is_read ? 'bg-[#FF2E54]/5 px-3 rounded-lg' : ''}`}>
                  <div>
                    <div className="font-bold text-white text-sm">{n.title}</div>
                    <div className="text-xs text-slate-300">{n.message}</div>
                  </div>
                  {!n.is_read && (
                    <button 
                      onClick={() => handleMarkNotification(n.id)} 
                      className="text-xs text-[#38BDF8] hover:underline"
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

      {/* TAB CONTENT: Donor Profile & Settings */}
      {(activeTab === 'profile' || activeTab === 'settings') && (
        <div className="card p-6 max-w-xl">
          <h2 className="text-lg font-bold text-white mb-4">Donor Profile & Geofence Settings</h2>
          <div className="space-y-4 text-sm">
            <div>
              <label className="text-xs text-slate-400 font-semibold block mb-1">Full Name</label>
              <input 
                type="text" 
                className="form-control text-sm" 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)} 
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-semibold block mb-1">Phone Number (Protected via RLS)</label>
              <input 
                type="text" 
                className="form-control text-sm" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-semibold block mb-1">City / Operating Zone</label>
              <input 
                type="text" 
                className="form-control text-sm" 
                value={city} 
                onChange={(e) => setCity(e.target.value)} 
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-semibold block mb-1">
                Emergency Dispatch Travel Radius: <strong className="text-white">{travelRadius} km</strong>
              </label>
              <input 
                type="range" 
                min={5} 
                max={50} 
                value={travelRadius} 
                onChange={(e) => setTravelRadius(Number(e.target.value))} 
                className="w-full accent-[#FF2E54]" 
              />
            </div>
            <button 
              onClick={() => {
                setFeedback({ type: 'success', message: 'Profile & travel geofence preferences updated.' });
                setTimeout(() => setFeedback(null), 3000);
              }} 
              className="btn btn-primary text-xs py-2 px-4 rounded-lg mt-2"
            >
              Save Profile Preferences
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
