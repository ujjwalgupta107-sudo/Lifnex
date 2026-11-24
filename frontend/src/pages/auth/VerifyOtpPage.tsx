import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Mini3DDroplet } from '../../components/3d/Mini3DDroplet';
import { 
  ShieldCheck, AlertCircle, CheckCircle, ArrowRight, 
  RotateCw, ArrowLeft, Mail, Lock
} from 'lucide-react';

export const VerifyOtpPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve email and role passed from registration or session storage
  const stateEmail = (location.state as any)?.email || sessionStorage.getItem('lifnex_pending_email') || '';
  const stateRole = (location.state as any)?.role || sessionStorage.getItem('lifnex_pending_role') || 'patient';
  
  const [email, setEmail] = useState<string>(stateEmail);
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [countdown, setCountdown] = useState<number>(60);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 60-Second Resend Countdown Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      setCanResend(false);
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // Focus first input box on mount
  useEffect(() => {
    if (!email) {
      // If user navigated directly without email, redirect to register
      navigate('/register');
      return;
    }
    sessionStorage.setItem('lifnex_pending_email', email);
    sessionStorage.setItem('lifnex_pending_role', stateRole);
    inputRefs.current[0]?.focus();
  }, [email, navigate, stateRole]);

  // Handle individual digit input
  const handleChange = (index: number, value: string) => {
    // Only accept numeric characters
    const cleanVal = value.replace(/[^0-9]/g, '');
    if (!cleanVal && value !== '') return;

    const newOtp = [...otp];
    // Take the last entered character if multiple typed
    const digit = cleanVal.slice(-1);
    newOtp[index] = digit;
    setOtp(newOtp);
    setError('');

    // Automatically advance to the next box
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify if all 6 digits are entered
    const completeCode = newOtp.join('');
    if (completeCode.length === 6 && !newOtp.includes('')) {
      triggerVerification(completeCode);
    }
  };

  // Backspace navigation
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // Move to previous box and clear it
        inputRefs.current[index - 1]?.focus();
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
      } else {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Paste support for all six digits
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    const numericData = pastedData.replace(/[^0-9]/g, '').slice(0, 6);

    if (numericData.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < 6; i++) {
        newOtp[i] = numericData[i] || '';
      }
      setOtp(newOtp);
      setError('');

      // Focus the next empty box or the last box
      const targetIndex = Math.min(numericData.length, 5);
      inputRefs.current[targetIndex]?.focus();

      if (numericData.length === 6) {
        triggerVerification(numericData);
      }
    }
  };

  // Server-Side Verification Trigger
  const triggerVerification = async (codeToVerify: string) => {
    if (codeToVerify.length !== 6) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.verifyOtp(email, codeToVerify);

      if (res.success && res.data) {
        setSuccessMsg('Email verified successfully! Activating your account...');
        
        const token = res.data.session?.access_token || res.data.token;
        const user = res.data.user;

        if (token && user) {
          localStorage.setItem('lifnex_token', token);
          localStorage.setItem('lifnex_user', JSON.stringify(user));
          sessionStorage.removeItem('lifnex_pending_email');
          sessionStorage.removeItem('lifnex_pending_role');

          setTimeout(() => {
            const role = user.role || stateRole;
            if (role === 'donor') navigate('/dashboard/donor');
            else if (role === 'hospital') navigate('/dashboard/hospital');
            else navigate('/dashboard/patient');
          }, 1200);
        } else {
          // If session not returned directly, send to login
          setTimeout(() => navigate('/login'), 1500);
        }
      } else {
        const errorMsg = res.error?.message || res.message || 'Verification failed. Please check your code.';
        setError(errorMsg);
        // Clear OTP inputs on failure for convenience
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err: any) {
      setError(err.message || 'Connection error during verification. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerVerification(otp.join(''));
  };

  // Resend OTP Action
  const handleResend = async () => {
    if (!canResend || resending) return;

    setResending(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await api.resendOtp(email);
      if (res.success) {
        setSuccessMsg('A fresh 6-digit verification code has been dispatched to your email.');
        setCountdown(60);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        setTimeout(() => setSuccessMsg(''), 5000);
      } else {
        setError(res.error?.message || 'Could not resend code. Please wait and try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error while requesting a new code.');
    } finally {
      setResending(false);
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
      {/* Compact 430px Centered Verification Card */}
      <div 
        className="auth-card-compact verify-otp-card"
        style={{
          maxWidth: '430px',
          width: '100%',
          margin: '0 auto',
          background: 'rgba(11, 17, 32, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '18px',
          padding: '2rem 1.75rem',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 25px rgba(255, 46, 84, 0.15)',
          backdropFilter: 'blur(20px)',
          position: 'relative',
        }}
      >
        {/* Subtle Top Crimson Accent Line */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, #FF2E54 0%, #E11D48 50%, #38BDF8 100%)',
            borderTopLeftRadius: '18px',
            borderTopRightRadius: '18px',
          }}
        />

        {/* Brand Header */}
        <div className="text-center mb-4">
          <Mini3DDroplet />
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">Verify Your Email</h1>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            We sent a 6-digit verification code to<br />
            <strong className="text-white font-semibold">{email}</strong>
          </p>
        </div>

        {/* Feedback Banners */}
        {error && (
          <div role="alert" data-testid="otp-error-banner" className="mb-4 p-3 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs flex items-center gap-2.5 animate-fadeIn">
            <AlertCircle className="text-[#FF2E54] shrink-0" size={16} />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {successMsg && (
          <div role="status" data-testid="otp-success-banner" className="mb-4 p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2.5 animate-fadeIn">
            <CheckCircle className="text-emerald-400 shrink-0" size={16} />
            <span className="leading-snug">{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleVerifySubmit} className="space-y-4">
          {/* Six Separate OTP Input Boxes */}
          <div className="flex justify-between items-center gap-2 sm:gap-2.5 my-2">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                data-index={idx}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={idx === 0 ? handlePaste : undefined}
                className="w-12 h-14 sm:w-13 sm:h-15 text-center text-xl sm:text-2xl font-extrabold text-white bg-slate-950/80 border border-white/15 rounded-xl focus:border-[#FF2E54] focus:ring-2 focus:ring-[#FF2E54]/30 focus:outline-none transition-all shadow-inner font-mono"
                style={{
                  boxShadow: digit ? '0 0 12px rgba(255, 46, 84, 0.25)' : 'none',
                  borderColor: digit ? '#FF2E54' : 'rgba(255, 255, 255, 0.15)',
                }}
                disabled={loading}
                autoComplete="one-time-code"
              />
            ))}
          </div>

          <p className="text-[11px] text-slate-500 text-center">
            Verification code expires in 10 minutes
          </p>

          {/* Verify Email Button */}
          <button
            type="submit"
            className="btn btn-primary w-full py-2.5 text-xs sm:text-sm font-bold shadow-md mt-2 flex items-center justify-center gap-2"
            disabled={loading || otp.join('').length !== 6}
            style={{
              opacity: otp.join('').length === 6 ? 1 : 0.75,
              cursor: otp.join('').length === 6 ? 'pointer' : 'not-allowed',
            }}
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Verifying Code...</span>
              </>
            ) : (
              <>
                <span>Verify Email</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>

          {/* Resend and Email Change Controls */}
          <div className="pt-2 text-center space-y-2">
            <div>
              {canResend ? (
                <button
                  type="button"
                  data-testid="otp-resend-button"
                  onClick={handleResend}
                  disabled={resending}
                  className="text-xs text-[#FF2E54] hover:text-[#ff4d6d] font-bold flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer"
                >
                  <RotateCw size={13} className={resending ? 'animate-spin' : ''} />
                  <span>Resend Verification Code</span>
                </button>
              ) : (
                <span data-testid="otp-resend-countdown" className="text-xs text-slate-400 flex items-center justify-center gap-1.5 font-medium">
                  <RotateCw size={13} className="text-slate-500" />
                  <span>Resend Code in <strong className="text-slate-200 font-bold">{countdown}s</strong></span>
                </span>
              )}
            </div>

            {/* Change Email Option */}
            <div>
              <Link
                to="/register"
                className="text-xs text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1 mt-1"
              >
                <ArrowLeft size={12} />
                <span>Wrong email? Change Email</span>
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
