import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';

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
      const data = await api.register({
        email,
        password,
        full_name: fullName,
        role,
        blood_group: bloodGroup,
      });

      if (data.token) {
        localStorage.setItem('lifnex_token', data.token);
        localStorage.setItem('lifnex_user', JSON.stringify(data.user));
        navigate(role === 'donor' ? '/dashboard/donor' : '/dashboard/patient');
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[85vh] p-6">
      <div className="card w-full max-w-[480px] p-8">
        <h1 className="text-2xl font-bold text-white mb-1">Create Account</h1>
        <p className="text-sm text-slate-400 mb-6">Join the Lifnex Emergency Blood Mesh</p>

        {error && <div className="badge badge-primary w-full p-2 mb-4 text-center">{error}</div>}

        <div className="flex gap-2 mb-6">
          <button
            type="button"
            className={`btn btn-block ${role === 'patient' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setRole('patient')}
          >
            I Need Blood (Patient)
          </button>
          <button
            type="button"
            className={`btn btn-block ${role === 'donor' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setRole('donor')}
          >
            I Can Donate (Donor)
          </button>
        </div>

        <form onSubmit={handleRegister}>
          <div className="form-group mb-4">
            <label className="form-label text-sm text-slate-300">Full Name</label>
            <input
              type="text"
              className="form-control"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              required
            />
          </div>

          <div className="form-group mb-4">
            <label className="form-label text-sm text-slate-300">Email Address</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="rahul@example.com"
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
              placeholder="••••••••"
              required
            />
          </div>

          <div className="form-group mb-6">
            <label className="form-label text-sm text-slate-300">Blood Group</label>
            <select
              className="form-control"
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
            >
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn btn-primary w-full btn-lg mb-4" disabled={loading}>
            {loading ? 'Creating Account...' : 'Complete Registration →'}
          </button>

          <div className="text-center text-xs text-slate-400">
            Already have an account? <Link to="/login" className="text-[#FF2E54] font-bold">Sign In</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

