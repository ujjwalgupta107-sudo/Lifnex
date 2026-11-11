import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Lock, Mail } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('patient@lifnex.org');
  const [password, setPassword] = useState('Patient@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await api.login(email, password);
      if (data.token) {
        localStorage.setItem('lifnex_token', data.token);
        localStorage.setItem('lifnex_user', JSON.stringify(data.user));

        const role = data.user?.role || 'patient';
        if (role === 'donor') navigate('/dashboard/donor');
        else if (role === 'hospital') navigate('/dashboard/hospital');
        else if (role === 'admin') navigate('/dashboard/admin');
        else navigate('/dashboard/patient');
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  const setDemoRole = (role: string) => {
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
    <div className="auth-split-wrapper min-h-screen grid grid-cols-1 md:grid-cols-2">
      <div className="auth-banner-side p-12 flex flex-col justify-between hidden md:flex">
        <Link to="/">
          <img src="/static/assets/branding/logo.svg" alt="Lifnex Official Logo" style={{ height: '44px' }} />
        </Link>
        <div>
          <div className="badge badge-primary mb-4">SECURE HEALTHCARE GATEWAY</div>
          <h2 className="text-4xl font-extrabold text-white mb-4">
            Instant Access to India's Emergency Blood Mesh.
          </h2>
          <p className="text-slate-400 text-base leading-relaxed">
            Synchronizing verified voluntary blood donors, trauma centers, and blood banks via sub-second geospatial routing.
          </p>
        </div>
        <div className="flex gap-6 text-slate-400 text-xs">
          <span>🔒 256-Bit Encrypted</span>
          <span>🛡️ Row Level Security</span>
          <span>⚡ Sub-Second AI Triage</span>
        </div>
      </div>

      <div className="auth-form-side flex items-center justify-center p-8 bg-[#080D1A]">
        <div className="card w-full max-w-[440px] p-8">
          <h1 className="text-2xl font-bold text-white mb-1">Welcome Back</h1>
          <p className="text-sm text-slate-400 mb-6">Sign into your Lifnex terminal</p>

          {error && <div className="badge badge-primary w-full p-2 mb-4 text-center">{error}</div>}

          <form onSubmit={handleLogin}>
            <div className="form-group mb-4">
              <label className="form-label text-sm text-slate-300">Email Address</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group mb-4">
              <label className="form-label text-sm text-slate-300">Password</label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary w-full btn-lg mb-4" disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In to Portal →'}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800">
            <div className="text-xs text-slate-400 uppercase tracking-wider text-center mb-2">One-Click Demo Roles</div>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setDemoRole('patient')}>Demo Patient</button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setDemoRole('donor')}>Demo Donor</button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setDemoRole('hospital')}>Demo Hospital</button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setDemoRole('admin')}>Demo Admin</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

