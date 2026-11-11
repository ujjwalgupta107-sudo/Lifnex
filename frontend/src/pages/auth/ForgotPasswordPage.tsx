import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div 
      className="auth-page-wrapper"
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem 1rem',
        width: '100%',
      }}
    >
      <div 
        className="auth-card-compact text-center"
        style={{
          maxWidth: '420px',
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
        <h1 className="text-xl sm:text-2xl font-black text-white mb-1.5 tracking-tight">Reset Password</h1>
        <p className="text-xs text-slate-400 mb-5">Enter your registered email to receive access instructions.</p>

        {submitted ? (
          <div className="badge badge-success p-3 mb-4 block text-xs">
            Reset email dispatched. Please check your inbox.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="form-group mb-0 text-left">
              <label className="form-label text-xs font-semibold text-slate-300">Registered Email</label>
              <div className="relative flex items-center">
                <input
                  type="email"
                  className="form-control text-xs sm:text-sm py-2.5 bg-slate-950/70 border-white/10 text-white rounded-lg focus:border-[#FF2E54]"
                  style={{ paddingLeft: '2.75rem', paddingRight: '0.85rem' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="doctor@hospital.org"
                  required
                />
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary w-full py-2.5 text-xs sm:text-sm font-bold shadow-md mt-2">
              Send Instructions →
            </button>
          </form>
        )}

        <div className="mt-4 pt-3 border-t border-white/10">
          <Link to="/login" className="text-xs text-[#FF2E54] hover:underline font-semibold">
            &larr; Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

