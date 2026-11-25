import React, { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AlertCircle, ArrowRight, CheckCircle, Lock } from 'lucide-react';
import { AuthShell } from '../../components/site/AuthShell';
import { api } from '../../services/api';
import { useGo } from '../../lib/routes';

export const ResetPasswordPage: React.FC = () => {
  const location = useLocation();
  const navigate = useGo();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const recoveryToken = useMemo(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const queryParams = new URLSearchParams(location.search);
    return hashParams.get('access_token') || queryParams.get('access_token') || queryParams.get('token') || '';
  }, [location.search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!recoveryToken) {
      setError('Invalid or missing password recovery link. Please request a new reset email.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.resetPassword(recoveryToken, newPassword);
      if (res.success) {
        setSuccess(res.message || 'Password updated successfully. Redirecting to sign in...');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        setError(res.error?.message || 'Could not reset password. Your recovery link may have expired.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error while updating password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Set new password"
      sub="Choose a strong password for your Lifnex account."
      pitch="Security protects every handoff."
    >
      {error && (
        <div role="alert" className="note note-error panel-in mb-5">
          <AlertCircle size={18} />
          <p>{error}</p>
        </div>
      )}
      {success && (
        <div role="status" className="note note-ok panel-in mb-5">
          <CheckCircle size={18} />
          <p>{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-5">
        <label className="field">
          <span className="field-label">New password</span>
          <span className="field-box block">
            <Lock className="input-icon" size={18} />
            <input
              type="password"
              autoComplete="new-password"
              className="input has-icon"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              required
            />
          </span>
        </label>

        <label className="field">
          <span className="field-label">Confirm new password</span>
          <span className="field-box block">
            <Lock className="input-icon" size={18} />
            <input
              type="password"
              autoComplete="new-password"
              className="input has-icon"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={8}
              required
            />
          </span>
        </label>

        <button type="submit" className="btn btn-primary btn-lg" disabled={loading || Boolean(success)}>
          {loading ? (
            <>
              <span className="spinner" aria-hidden="true" />
              <span>Updating password</span>
            </>
          ) : (
            <>
              <span>Update password</span>
              <ArrowRight size={18} className="nudge" />
            </>
          )}
        </button>
      </form>

      <p className="mt-8">
        <Link to="/forgot-password" className="link">
          Request a new recovery link
        </Link>
      </p>
    </AuthShell>
  );
};

export default ResetPasswordPage;
