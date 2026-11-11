import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] p-6">
      <div className="card w-full max-w-[420px] p-8 text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Reset Password</h1>
        <p className="text-sm text-slate-400 mb-6">Enter your registered email to receive access instructions.</p>

        {submitted ? (
          <div className="badge badge-success p-4 mb-4 block">
            Reset email dispatched. Please check your inbox.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group mb-4 text-left">
              <label className="form-label text-sm text-slate-300">Registered Email</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="doctor@hospital.org"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-full btn-lg mb-4">
              Send Instructions →
            </button>
          </form>
        )}

        <Link to="/login" className="text-xs text-[#FF2E54] hover:underline">
          &larr; Back to Login
        </Link>
      </div>
    </div>
  );
};

