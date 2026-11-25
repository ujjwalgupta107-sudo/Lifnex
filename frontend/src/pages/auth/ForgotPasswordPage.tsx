import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight, CheckCircle, Mail } from 'lucide-react';
import { AuthShell } from '../../components/site/AuthShell';
import { api } from '../../services/api';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.forgotPassword(email.trim());
      if (res.success) {
        setStatusMessage(res.message || 'If an account matches that email, recovery instructions have been requested.');
        setSubmitted(true);
      } else {
        setError(res.error?.message || 'Could not process password reset request.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error while requesting password reset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      sub="Enter your registered email to receive access instructions."
      pitch="Back to the network in a minute."
    >
      {error && (
        <div role="alert" className="note note-error panel-in mb-5">
          <AlertCircle size={18} />
          <p>{error}</p>
        </div>
      )}
      {submitted ? (
        <div role="status" className="note note-ok panel-in">
          <CheckCircle size={18} />
          <p>{statusMessage}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid gap-5">
          <label className="field">
            <span className="field-label">Registered email</span>
            <span className="field-box block">
              <Mail className="input-icon" size={18} />
              <input
                type="email"
                autoComplete="email"
                className="input has-icon"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="doctor@hospital.org"
                required
              />
            </span>
          </label>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner" aria-hidden="true" />
                <span>Sending instructions</span>
              </>
            ) : (
              <>
                <span>Send instructions</span>
                <ArrowRight size={18} className="nudge" />
              </>
            )}
          </button>
        </form>
      )}
      <p className="mt-8">
        <Link to="/login" className="link">
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
};

export default ForgotPasswordPage;
