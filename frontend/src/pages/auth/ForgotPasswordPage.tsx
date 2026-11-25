import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Mail } from 'lucide-react';
import { AuthShell } from '../../components/site/AuthShell';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <AuthShell
      title="Reset your password"
      sub="Enter your registered email to receive access instructions."
      pitch="Back to the network in a minute."
    >
      {submitted ? (
        <div role="status" className="note note-ok panel-in">
          <CheckCircle size={18} />
          <p>Reset email dispatched. Please check your inbox.</p>
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
          <button type="submit" className="btn btn-primary btn-lg">
            <span>Send instructions</span>
            <ArrowRight size={18} className="nudge" />
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
