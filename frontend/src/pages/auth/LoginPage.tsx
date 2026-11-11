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
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
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
    <div className="min-h-[82vh] flex items-center justify-center py-6 px-4">
      {/* Compact 440px Centered Card */}
      <div className="card w-full max-w-[460px] p-6 sm:p-8 relative border border-white/10 shadow-2xl bg-[#0B1120]/90 backdrop-blur-xl">
        
        {/* Subtle 3D Droplet Header */}
        <div className="text-center mb-5">
          <Mini3DDroplet />
          <h1 className="text-2xl font-black text-white tracking-tight mt-1">Sign In to Lifnex</h1>
          <p className="text-xs text-slate-400 mt-1">Emergency Neural Blood Mesh Terminal</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/50 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="text-[#FF2E54] shrink-0" size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle className="text-emerald-400 shrink-0" size={16} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="form-group mb-0">
            <label className="form-label text-xs font-semibold text-slate-300">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                className="form-control text-sm py-2 px-3 pl-9 bg-slate-950/70 border-white/10 text-white rounded-lg focus:border-[#FF2E54]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@lifnex.org"
                required
              />
              <Mail className="absolute left-3 top-2.5 text-slate-500" size={15} />
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
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control text-sm py-2 px-3 pl-9 pr-9 bg-slate-950/70 border-white/10 text-white rounded-lg focus:border-[#FF2E54]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <Lock className="absolute left-3 top-2.5 text-slate-500" size={15} />
              <button
                type="button"
                className="absolute right-3 top-2.5 text-slate-500 hover:text-white"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full py-2.5 text-sm font-bold shadow-md mt-2 flex items-center justify-center gap-2"
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
        <div className="mt-5 pt-4 border-t border-white/10 text-center">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            One-Click Demo Roles
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            <button
              type="button"
              className="btn btn-secondary text-[11px] py-1 px-1.5 font-medium"
              onClick={() => setDemoRole('patient')}
            >
              Patient
            </button>
            <button
              type="button"
              className="btn btn-secondary text-[11px] py-1 px-1.5 font-medium"
              onClick={() => setDemoRole('donor')}
            >
              Donor
            </button>
            <button
              type="button"
              className="btn btn-secondary text-[11px] py-1 px-1.5 font-medium"
              onClick={() => setDemoRole('hospital')}
            >
              Hospital
            </button>
            <button
              type="button"
              className="btn btn-secondary text-[11px] py-1 px-1.5 font-medium"
              onClick={() => setDemoRole('admin')}
            >
              Admin
            </button>
          </div>
        </div>

        <div className="mt-4 text-center text-xs text-slate-400">
          Need an account?{' '}
          <Link to="/register" className="text-[#FF2E54] font-semibold hover:underline">
            Register as Voluntary Donor
          </Link>
        </div>
      </div>
    </div>
  );
};
