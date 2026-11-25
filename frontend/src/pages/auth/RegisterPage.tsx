import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import RubberSegment from '../../components/reactbits/RubberSegment';
import JellyRadio from '../../components/reactbits/JellyRadio';
import { AuthShell } from '../../components/site/AuthShell';
import { Expand } from '../../components/ui/Reveal';
import { useGo } from '../../lib/routes';
import { AlertCircle, ArrowRight, Building2, Lock, Mail, User } from 'lucide-react';

type Role = 'patient' | 'donor' | 'hospital';
const PITCH: Record<Role, string> = {
  patient: 'Ask once. Every compatible donor nearby hears it.',
  donor: 'The next call could be for your blood group.',
  hospital: 'Your ward, linked to every donor in range.',
};

export const RegisterPage: React.FC = () => {
  const [params] = useSearchParams();
  const asked = params.get('role') as Role | null;
  const [role, setRole] = useState<Role>(asked && asked in PITCH ? asked : 'patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useGo();

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
        blood_group: role === 'donor' ? bloodGroup : undefined,
        hospital_name: role === 'hospital' ? fullName : undefined,
      });

      // When OTP verification is required (standard real flow)
      if (res.otp_required || res.success) {
        sessionStorage.setItem('lifnex_pending_email', email);
        sessionStorage.setItem('lifnex_pending_role', role);
        sessionStorage.setItem('lifnex_pending_name', fullName);
        if (role === 'donor') {
          sessionStorage.setItem('lifnex_pending_blood_group', bloodGroup);
        }
        
        navigate('/verify-otp', {
          state: {
            email,
            role,
            fullName,
            bloodGroup: role === 'donor' ? bloodGroup : undefined,
          }
        });
        return;
      }

      const token = res.data?.session?.access_token || res.token || res.access_token;
      const user = res.data?.user || res.user;

      if (token && user) {
        localStorage.setItem('lifnex_token', token);
        localStorage.setItem('lifnex_user', JSON.stringify(user));
        if (role === 'donor') navigate('/dashboard/donor');
        else if (role === 'hospital') navigate('/dashboard/hospital');
        else navigate('/dashboard/patient');
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
    <AuthShell
      title="Create your account"
      sub={
        <>
          Already registered?{' '}
          <Link to="/login" className="link">
            Sign in
          </Link>
        </>
      }
      pitch={PITCH[role]}
    >
      {error && (
        <div role="alert" className="note note-error panel-in mb-5">
          <AlertCircle size={18} />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleRegister} className="grid gap-5">
        <div>
          <span className="field-label">I am registering as</span>
          <RubberSegment
            items={[
              { value: 'patient', label: 'Patient' },
              { value: 'donor', label: 'Donor' },
              { value: 'hospital', label: 'Hospital' },
            ]}
            value={role}
            onChange={(v) => setRole(v as Role)}
            size="lg"
            radius={16}
            inset={5}
            equalSlots
            trackColor="var(--sunk)"
            thumbColor="var(--red)"
            textColor="var(--ink)"
            activeTextColor="var(--on-red)"
            className="seg-full"
            aria-label="Account type"
          />
        </div>

        <label className="field">
          <span className="field-label">{role === 'hospital' ? 'Hospital name' : 'Full name'}</span>
          <span className="field-box block">
            {role === 'hospital' ? <Building2 className="input-icon" size={18} /> : <User className="input-icon" size={18} />}
            <input
              type="text"
              autoComplete={role === 'hospital' ? 'organization' : 'name'}
              className="input has-icon"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={role === 'hospital' ? 'City Care Hospital' : 'Rahul Sharma'}
              required
            />
          </span>
        </label>

        <label className="field">
          <span className="field-label">Email address</span>
          <span className="field-box block">
            <Mail className="input-icon" size={18} />
            <input
              type="email"
              autoComplete="email"
              className="input has-icon"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="rahul@example.com"
              required
            />
          </span>
        </label>

        <label className="field">
          <span className="field-label">Password</span>
          <span className="field-box block">
            <Lock className="input-icon" size={18} />
            <input
              type="password"
              autoComplete="new-password"
              className="input has-icon"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </span>
        </label>

        <Expand open={role === 'donor'}>
          <span className="field-label">Blood group</span>
          <div className="-mx-4">
            <JellyRadio
              items={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => ({ value: bg, label: bg.replace('-', '\u2212') }))}
              value={bloodGroup}
              onChange={(v) => setBloodGroup(v)}
              size="md"
              gap={7}
              radius={13}
              chipColor="var(--sunk)"
              textColor="var(--ink)"
              activeColor="var(--red)"
              activeTextColor="var(--on-red)"
              ariaLabel="Blood group"
            />
          </div>
        </Expand>

        <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner" aria-hidden="true" />
              <span>Sending code</span>
            </>
          ) : (
            <>
              <span>Send verification code</span>
              <ArrowRight size={18} className="nudge" />
            </>
          )}
        </button>
      </form>
    </AuthShell>
  );
};

export default RegisterPage;
