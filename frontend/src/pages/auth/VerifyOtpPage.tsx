import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../../services/api';
import Counter from '../../components/reactbits/Counter';
import { AuthShell } from '../../components/site/AuthShell';
import { useGo } from '../../lib/routes';
import { AlertCircle, ArrowRight, CheckCircle, RotateCw } from 'lucide-react';

export const VerifyOtpPage: React.FC = () => {
  const navigate = useGo();
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
  const [countdown, setCountdown] = useState<number>(() => {
    const sentAtRaw = sessionStorage.getItem('lifnex_otp_sent_at');
    if (!sentAtRaw) return 0;
    const elapsedSec = Math.floor((Date.now() - Number(sentAtRaw)) / 1000);
    return elapsedSec >= 0 && elapsedSec < 60 ? 60 - elapsedSec : 0;
  });
  const [canResend, setCanResend] = useState<boolean>(() => {
    const sentAtRaw = sessionStorage.getItem('lifnex_otp_sent_at');
    if (!sentAtRaw) return true;
    const elapsedSec = Math.floor((Date.now() - Number(sentAtRaw)) / 1000);
    return !(elapsedSec >= 0 && elapsedSec < 60);
  });

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 60-Second Resend Countdown Timer
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
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
          sessionStorage.removeItem('lifnex_otp_sent_at');

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
        const cooldown = Number(res.data?.cooldown_seconds) || 60;
        sessionStorage.setItem('lifnex_otp_sent_at', String(Date.now()));
        setSuccessMsg('A fresh verification code has been requested for your email.');
        setCountdown(cooldown);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        setTimeout(() => setSuccessMsg(''), 5000);
      } else {
        if (res.error?.code === 'RATE_LIMITED' && res.error?.retry_after) {
          const retryAfter = Math.max(1, Number(res.error.retry_after));
          setCountdown(retryAfter);
          setCanResend(false);
          sessionStorage.setItem('lifnex_otp_sent_at', String(Date.now() - (60 - Math.min(60, retryAfter)) * 1000));
        }
        setError(res.error?.message || 'Could not resend code. Please wait and try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error while requesting a new code.');
    } finally {
      setResending(false);
    }
  };

  const complete = otp.join('').length === 6;

  return (
    <AuthShell
      title="Verify your email"
      sub={
        <>
          We sent a 6-digit code to <strong className="break-all text-ink">{email}</strong>
        </>
      }
      pitch="One last check. Safety runs both ways."
    >
      {error && (
        <div role="alert" data-testid="otp-error-banner" className="note note-error panel-in mb-5">
          <AlertCircle size={18} />
          <p>{error}</p>
        </div>
      )}
      {successMsg && (
        <div role="status" data-testid="otp-success-banner" className="note note-ok panel-in mb-5">
          <CheckCircle size={18} />
          <p>{successMsg}</p>
        </div>
      )}

      <form onSubmit={handleVerifySubmit} className="grid grid-cols-1 gap-6">
        <div className={`flex min-w-0 justify-between gap-1.5 sm:gap-3 ${error ? 'otp-shake' : ''}`}>
          {otp.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => {
                inputRefs.current[idx] = el;
              }}
              data-index={idx}
              data-filled={Boolean(digit)}
              aria-label={`Digit ${idx + 1} of 6`}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              onPaste={idx === 0 ? handlePaste : undefined}
              className="otp-cell"
              disabled={loading}
              autoComplete="one-time-code"
            />
          ))}
        </div>
        <p className="text-sm text-muted">The code expires in 10 minutes.</p>

        <button type="submit" className="btn btn-primary btn-lg" disabled={loading || !complete}>
          {loading ? (
            <>
              <span className="spinner" aria-hidden="true" />
              <span>Verifying</span>
            </>
          ) : (
            <>
              <span>Verify email</span>
              <ArrowRight size={18} className="nudge" />
            </>
          )}
        </button>

        <div className="flex flex-wrap items-center justify-between gap-4">
          {canResend ? (
            <button
              type="button"
              data-testid="otp-resend-button"
              onClick={handleResend}
              disabled={resending}
              className="inline-flex items-center gap-2 font-semibold text-red-ink"
            >
              <RotateCw size={16} className={resending ? 'animate-spin' : ''} />
              <span>Resend code</span>
            </button>
          ) : (
            <span data-testid="otp-resend-countdown" className="inline-flex items-center gap-1.5 text-muted">
              Resend in <Counter value={countdown} fontSize={17} fontWeight={650} textColor="var(--ink)" suffix="s" fade={0} padding={2} />
            </span>
          )}
          <Link to="/register" className="link">
            Change email
          </Link>
        </div>
      </form>
    </AuthShell>
  );
};

export default VerifyOtpPage;
