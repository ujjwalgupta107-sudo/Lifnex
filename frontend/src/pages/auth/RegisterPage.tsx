import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Mini3DDroplet } from '../../components/3d/Mini3DDroplet';
import { User, Mail, Lock, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [role, setRole] = useState<'patient' | 'donor'>('patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.register({
        email,
        password,
        full_name: fullName,
        role,
        blood_group: bloodGroup,
      });

      const token = res.data?.session?.access_token || res.token || res.access_token;
      const user = res.data?.user || res.user;

      if (token && user) {
        localStorage.setItem('lifnex_token', token);
        localStorage.setItem('lifnex_user', JSON.stringify(user));
        navigate(role === 'donor' ? '/dashboard/donor' : '/dashboard/patient');
      } else {
        setError(res.error?.message || res.message || 'Registration failed');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
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
      {/* Compact 430px Centered Registration Card */}
      <div 
        className="auth-card-compact"
        style={{
          maxWidth: '430px',
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
        <div className="text-center mb-3.5">
          <Mini3DDroplet />
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">Create Account</h1>
          <p className="text-xs text-slate-400 mt-0.5">Join the Lifnex Emergency Blood Mesh</p>
        </div>

        {error && (
          <div className="mb-3 p-2.5 rounded-lg bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="text-[#FF2E54] shrink-0" size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* Role Toggle Selector */}
        <div className="grid grid-cols-2 gap-1.5 mb-3.5 p-1 bg-slate-950/60 rounded-xl border border-white/10">
          <button
            type="button"
            className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
              role === 'patient'
                ? 'bg-[#FF2E54] text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
            onClick={() => setRole('patient')}
          >
            I Need Blood (Patient)
          </button>
          <button
            type="button"
            className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
              role === 'donor'
                ? 'bg-[#FF2E54] text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
            onClick={() => setRole('donor')}
          >
            I Can Donate (Donor)
          </button>
        </div>

        <form onSubmit={handleRegister} className="space-y-3">
          <div className="form-group mb-0">
            <label className="form-label text-xs font-semibold text-slate-300">Full Name</label>
            <div className="relative">
              <input
                type="text"
                className="form-control text-xs sm:text-sm py-2 px-3 pl-9 bg-slate-950/70 border-white/10 text-white rounded-lg focus:border-[#FF2E54]"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                required
              />
              <User className="absolute left-3 top-2.5 text-slate-500" size={14} />
            </div>
          </div>

          <div className="form-group mb-0">
            <label className="form-label text-xs font-semibold text-slate-300">Email Address</label>
            <div className="relative">
              <input
                type="email"
                className="form-control text-xs sm:text-sm py-2 px-3 pl-9 bg-slate-950/70 border-white/10 text-white rounded-lg focus:border-[#FF2E54]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rahul@example.com"
                required
              />
              <Mail className="absolute left-3 top-2.5 text-slate-500" size={14} />
            </div>
          </div>

          <div className="form-group mb-0">
            <label className="form-label text-xs font-semibold text-slate-300">Password</label>
            <div className="relative">
              <input
                type="password"
                className="form-control text-xs sm:text-sm py-2 px-3 pl-9 bg-slate-950/70 border-white/10 text-white rounded-lg focus:border-[#FF2E54]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <Lock className="absolute left-3 top-2.5 text-slate-500" size={14} />
            </div>
          </div>

          <div className="form-group mb-0">
            <label className="form-label text-xs font-semibold text-slate-300">Blood Group</label>
            <select
              className="form-control text-xs sm:text-sm py-2 px-3 bg-slate-950/70 border-white/10 text-white rounded-lg focus:border-[#FF2E54]"
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
            >
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full py-2.5 text-xs sm:text-sm font-bold shadow-md mt-3 flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>

          <div className="text-center text-xs text-slate-400 pt-2">
            Already have an account?{' '}
            <Link to="/login" className="text-[#FF2E54] font-semibold hover:underline">
              Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
