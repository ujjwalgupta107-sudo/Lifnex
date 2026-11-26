import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import RubberSegment from '../../components/reactbits/RubberSegment';
import { AuthShell } from '../../components/site/AuthShell';
import { useGo } from '../../lib/routes';
import { Lock, Mail, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<string>('patient');
  const [demoCreds, setDemoCreds] = useState<Record<string, { email: string; password: string }>>({});
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isUnverified, setIsUnverified] = useState(false);
  const [success, setSuccess] = useState('');
  const navigate = useGo();

  useEffect(() => {
    let isMounted = true;
    api.getDemoCredentials().then((res) => {
      if (!isMounted) return;
      if (res.success && res.data) {
        setDemoCreds(res.data);
        const pCred = res.data['patient'];
        if (pCred) {
          setEmail(pCred.email);
          setPassword(pCred.password);
        }
      }
    }).catch(() => {
      // Fallback if network issue occurs
    });
    return () => { isMounted = false; };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setIsUnverified(false);
    setSuccess('');

    try {
      const res = await api.login(email, password);
      const token = res.data?.session?.access_token || res.token || res.access_token;
      const refreshToken = res.data?.session?.refresh_token;
      const user = res.data?.user || res.user;

      if (res.success && token && user) {
        localStorage.setItem('lifnex_token', token);
        if (refreshToken) {
          localStorage.setItem('lifnex_refresh_token', refreshToken);
        }
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

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
    setError('');
    setIsUnverified(false);
    setSuccess('');

    const cred = demoCreds[role];
    if (cred) {
      setEmail(cred.email);
      setPassword(cred.password);
    } else {
      setEmail(`${role}@lifnex.org`);
      // If demoCreds haven't loaded yet, fetch them
      api.getDemoCredentials().then((res) => {
        if (res.success && res.data) {
          setDemoCreds(res.data);
          if (res.data[role]) {
            setEmail(res.data[role].email);
            setPassword(res.data[role].password);
          }
        }
      });
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      sub={
        <>
          New here?{' '}
          <Link to="/register" className="link">
            Create an account
          </Link>
        </>
      }
      pitch="Someone nearby needs what you have."
    >
      {error && (
        <div role="alert" className="note note-error panel-in mb-5">
          <AlertCircle size={18} />
          <div>
            <p>{error}</p>
            {isUnverified && (
              <button
                type="button"
                onClick={() => {
                  sessionStorage.setItem('lifnex_pending_email', email);
                  navigate('/verify-otp', { state: { email } });
                }}
                className="link mt-2"
              >
                Enter 6-digit verification code
              </button>
            )}
          </div>
        </div>
      )}

      {success && (
        <div role="status" className="note note-ok panel-in mb-5">
          <CheckCircle size={18} />
          <p>{success}</p>
        </div>
      )}

      <form onSubmit={handleLogin} className="grid gap-5">
        <label className="field">
          <span className="field-label">Email address</span>
          <span className="field-box block">
            <Mail className="input-icon" size={18} />
            <input
              id="loginEmail"
              type="email"
              autoComplete="email"
              className="input has-icon"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@lifnex.org"
              required
            />
          </span>
        </label>

        <div className="field">
          <div className="flex items-baseline justify-between">
            <label htmlFor="loginPassword" className="field-label">
              Password
            </label>
            <Link to="/forgot-password" className="text-sm font-semibold text-red-ink hover:underline">
              Forgot password?
            </Link>
          </div>
          <span className="field-box block">
            <Lock className="input-icon" size={18} />
            <input
              id="loginPassword"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className="input has-icon !pr-14"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="absolute right-1.5 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-xl text-faint transition-colors hover:text-ink"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </span>
        </div>

        <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner" aria-hidden="true" />
              <span>Signing in</span>
            </>
          ) : (
            <>
              <span>Sign in</span>
              <ArrowRight size={18} className="nudge" />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 border-t border-line pt-6">
        <p className="mb-3 text-sm text-muted">Try a demo account</p>
        <RubberSegment
          items={[
            { value: 'patient', label: 'Patient' },
            { value: 'donor', label: 'Donor' },
            { value: 'hospital', label: 'Hospital' },
            { value: 'admin', label: 'Admin' },
          ]}
          value={selectedRole}
          onChange={(v) => handleRoleSelect(v)}
          size="lg"
          radius={15}
          inset={4}
          equalSlots
          trackColor="var(--sunk)"
          thumbColor="var(--raised)"
          textColor="var(--ink)"
          activeTextColor="var(--red-ink)"
          className="seg-full"
          aria-label="Demo account"
        />
      </div>
    </AuthShell>
  );
};

export default LoginPage;
