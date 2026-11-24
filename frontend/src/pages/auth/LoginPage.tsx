import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Mini3DDroplet } from '../../components/3d/Mini3DDroplet';
import { Lock, Mail, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('patient@lifnex.org');
  const [password, setPassword] = useState('Patient@123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isUnverified, setIsUnverified] = useState(false);
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setIsUnverified(false);
    setSuccess('');

    try {
      const res = await api.login(email, password);
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
        }, 500);
      } else {
        const errCode = res.error?.code;
        const errorMsg = res.error?.message || res.message || 'Invalid email or password.';
        if (errCode === 'EMAIL_NOT_VERIFIED') {
          setIsUnverified(true);
          sessionStorage.setItem('lifnex_pending_email', email);
        }
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
    <div 
      className="auth-page-wrapper"
      style={{
        minHeight: '82vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem 1rem',
        width: '100%',
      }}
    >
      {/* Compact 420px Centered Card */}
      <div 
        className="auth-card-compact"
        style={{
          maxWidth: '420px',
          width: '100%',
          margin: '0 auto',
          background: 'rgba(11, 17, 32, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          padding: '1.75rem',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 25px rgba(255, 46, 84, 0.15)',
          backdropFilter: 'blur(20px)',
          position: 'relative',
        }}
      >
        
        {/* Subtle 3D Droplet Header */}
        <div className="text-center mb-4">
          <Mini3DDroplet />
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">Sign In to Lifnex</h1>
          <p className="text-xs text-slate-400 mt-0.5">Emergency Neural Blood Mesh Terminal</p>
        </div>

        {error && (
          <div className="mb-3 p-2.5 rounded-lg bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <AlertCircle className="text-[#FF2E54] shrink-0" size={15} />
              <span>{error}</span>
            </div>
            {isUnverified && (
              <button
                type="button"
                onClick={() => {
                  sessionStorage.setItem('lifnex_pending_email', email);
                  navigate('/verify-otp', { state: { email } });
                }}
                className="text-left text-[#38BDF8] hover:underline font-semibold flex items-center gap-1 mt-0.5"
              >
                <span>Enter 6-digit verification code</span>
                <ArrowRight size={12} />
              </button>
            )}
          </div>
        )}

        {success && (
          <div className="mb-3 p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle className="text-emerald-400 shrink-0" size={15} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-3.5">
          <div className="form-group mb-0">
            <label className="form-label text-xs font-semibold text-slate-300">
              Email Address
            </label>
            <div className="relative flex items-center">
              <input
                type="email"
                className="form-control text-xs sm:text-sm py-2.5 bg-slate-950/70 border-white/10 text-white rounded-lg focus:border-[#FF2E54]"
                style={{ paddingLeft: '2.75rem', paddingRight: '0.85rem' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@lifnex.org"
                required
              />
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
            </div>
          </div>

          <div className="form-group mb-0">
            <div className="flex justify-between items-center mb-1">
              <label className="form-label text-xs font-semibold text-slate-300">
                Password
              </label>
              <Link to="/forgot-password" className="text-xs text-[#FF2E54] hover:underline">
                Forgot?
              </Link>
            </div>
            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control text-xs sm:text-sm py-2.5 bg-slate-950/70 border-white/10 text-white rounded-lg focus:border-[#FF2E54]"
                style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
              <button
                type="button"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full py-2.5 text-xs sm:text-sm font-bold shadow-md mt-2 flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <span>Sign In to Terminal</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        {/* Compact Preset Roles */}
        <div className="mt-4 pt-3.5 border-t border-white/10 text-center">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            One-Click Demo Roles
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            <button
              type="button"
              className="btn btn-secondary text-[11px] py-1 px-1 font-medium"
              onClick={() => setDemoRole('patient')}
            >
              Patient
            </button>
            <button
              type="button"
              className="btn btn-secondary text-[11px] py-1 px-1 font-medium"
              onClick={() => setDemoRole('donor')}
            >
              Donor
            </button>
            <button
              type="button"
              className="btn btn-secondary text-[11px] py-1 px-1 font-medium"
              onClick={() => setDemoRole('hospital')}
            >
              Hospital
            </button>
            <button
              type="button"
              className="btn btn-secondary text-[11px] py-1 px-1 font-medium"
              onClick={() => setDemoRole('admin')}
            >
              Admin
            </button>
          </div>
        </div>

        <div className="mt-3.5 text-center text-xs text-slate-400">
          Need an account?{' '}
          <Link to="/register" className="text-[#FF2E54] font-semibold hover:underline">
            Register as Voluntary Donor
          </Link>
        </div>
      </div>
    </div>
  );
};
