import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { ShieldCheck, Lock, Mail, ArrowRight, Activity, CheckCircle, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('patient@lifnex.org');
  const [password, setPassword] = useState('Patient@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.login(email, password);
      
      // Backend returns structure: { success: true, data: { user, session: { access_token } } }
      const token = res.data?.session?.access_token || res.token || res.access_token;
      const user = res.data?.user || res.user;

      if (token && user) {
        localStorage.setItem('lifnex_token', token);
        localStorage.setItem('lifnex_user', JSON.stringify(user));
        setSuccess('Authentication verified! Redirecting to secure portal...');

        const role = (user.role || 'patient').toLowerCase();
        setTimeout(() => {
          if (role === 'donor') navigate('/dashboard/donor');
          else if (role === 'hospital') navigate('/dashboard/hospital');
          else if (role === 'admin') navigate('/dashboard/admin');
          else navigate('/dashboard/patient');
        }, 600);
      } else {
        const errorMsg = res.error?.message || res.message || 'Invalid email or password.';
        setError(errorMsg);
      }
    } catch (err: any) {
      setError(err.message || 'Network error communicating with authentication service.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoRole = (role: string) => {
    setError('');
    setSuccess('');
    if (role === 'patient') {
      setEmail('patient@lifnex.org');
      setPassword('Patient@123');
    } else if (role === 'donor') {
      setEmail('donor@lifnex.org');
      setPassword('Donor@123');
    } else if (role === 'hospital') {
      setEmail('hospital@lifnex.org');
      setPassword('Hospital@123');
    } else if (role === 'admin') {
      setEmail('admin@lifnex.org');
      setPassword('Admin@123');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        
        {/* Left Informational Showcase Column */}
        <div className="md:col-span-5 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-[#FF2E54]/10 text-[#FDA4AF] border border-[#FF2E54]/30">
            <span className="w-2 h-2 rounded-full bg-[#FF2E54] animate-pulse"></span>
            Encrypted Gateway
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
            Secure Access to India's Emergency Blood Mesh.
          </h1>
          
          <p className="text-slate-400 text-sm leading-relaxed">
            Synchronizing accredited blood banks, trauma centers, and voluntary donors with sub-second response times.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <ShieldCheck className="text-[#38BDF8]" size={18} />
              <span>PostgreSQL Row Level Security (RLS) Enforced</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <Activity className="text-[#FF2E54]" size={18} />
              <span>Real-time Geospatial Match Dispatching</span>
            </div>
          </div>
        </div>

        {/* Right Authentication Card */}
        <div className="md:col-span-7">
          <div className="card p-8 sm:p-10 shadow-2xl relative overflow-hidden">
            <div className="mb-6">
              <h2 className="text-2xl font-black text-white">Sign In to Lifnex</h2>
              <p className="text-sm text-slate-400 mt-1">Select your credentials or use the one-click demo presets</p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-sm flex items-start gap-3">
                <AlertCircle className="text-[#FF2E54] shrink-0 mt-0.5" size={18} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-sm flex items-start gap-3">
                <CheckCircle className="text-emerald-400 shrink-0 mt-0.5" size={18} />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="form-group">
                <label className="form-label text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. patient@lifnex.org"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <div className="flex justify-between items-center mb-1">
                  <label className="form-label text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-xs text-[#FF2E54] hover:underline font-semibold">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full btn-lg font-bold shadow-lg"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Verifying Credentials...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Sign In to Portal <ArrowRight size={18} />
                  </span>
                )}
              </button>
            </form>

            {/* Quick-Click Demo Roles Section */}
            <div className="mt-8 pt-6 border-t border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Quick-Fill Demo Roles
                </span>
                <span className="text-[10px] text-slate-500 font-mono">STAGING READY</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm text-xs font-medium py-2"
                  onClick={() => setDemoRole('patient')}
                >
                  Demo Patient
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm text-xs font-medium py-2"
                  onClick={() => setDemoRole('donor')}
                >
                  Demo Donor
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm text-xs font-medium py-2"
                  onClick={() => setDemoRole('hospital')}
                >
                  Demo Hospital
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm text-xs font-medium py-2"
                  onClick={() => setDemoRole('admin')}
                >
                  Demo Admin
                </button>
              </div>
            </div>

            <div className="mt-6 text-center text-xs text-slate-400">
              Don't have an account yet?{' '}
              <Link to="/register" className="text-[#FF2E54] font-bold hover:underline">
                Register as Voluntary Donor
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
