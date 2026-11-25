import React, { useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate, type NavigateOptions } from 'react-router-dom';
import { tide } from './liquid';

const load: Record<string, () => Promise<any>> = {
  '/': () => import('../pages/public/HomePage'),
  '/about': () => import('../pages/public/AboutPage'),
  '/how-it-works': () => import('../pages/public/HowItWorksPage'),
  '/hospitals': () => import('../pages/public/HospitalsPage'),
  '/contact': () => import('../pages/public/ContactPage'),
  '/login': () => import('../pages/auth/LoginPage'),
  '/register': () => import('../pages/auth/RegisterPage'),
  '/verify-otp': () => import('../pages/auth/VerifyOtpPage'),
  '/forgot-password': () => import('../pages/auth/ForgotPasswordPage'),
  '/dashboard/patient': () => import('../pages/dashboards/PatientDashboard'),
  '/dashboard/donor': () => import('../pages/dashboards/DonorDashboard'),
  '/dashboard/hospital': () => import('../pages/dashboards/HospitalDashboard'),
  '/dashboard/admin': () => import('../pages/dashboards/AdminDashboard'),
};

const page = (path: string, name: string) => React.lazy(() => load[path]().then((m) => ({ default: m[name] })));

export const HomePage = page('/', 'HomePage');
export const AboutPage = page('/about', 'AboutPage');
export const HowItWorksPage = page('/how-it-works', 'HowItWorksPage');
export const HospitalsPage = page('/hospitals', 'HospitalsPage');
export const ContactPage = page('/contact', 'ContactPage');
export const LoginPage = page('/login', 'LoginPage');
export const RegisterPage = page('/register', 'RegisterPage');
export const VerifyOtpPage = page('/verify-otp', 'VerifyOtpPage');
export const ForgotPasswordPage = page('/forgot-password', 'ForgotPasswordPage');
export const PatientDashboard = page('/dashboard/patient', 'PatientDashboard');
export const DonorDashboard = page('/dashboard/donor', 'DonorDashboard');
export const HospitalDashboard = page('/dashboard/hospital', 'HospitalDashboard');
export const AdminDashboard = page('/dashboard/admin', 'AdminDashboard');

const preload = (to: string) => load[to.split(/[?#]/)[0]]?.().catch(() => undefined);

let lastClickX: number | undefined;

/** navigate() that rides the tide transition. Same signature as useNavigate for paths. */
export function useGo() {
  const navigate = useNavigate();
  return useCallback(
    async (to: string, opts?: NavigateOptions) => {
      await preload(to);
      await tide(() => {
        navigate(to, opts);
        window.scrollTo(0, 0);
      }, lastClickX);
    },
    [navigate],
  );
}

/** Intercepts in-app links so every <Link> gets the same page transition. */
export const RouteTransitions: React.FC = () => {
  const go = useGo();
  const { pathname, search } = useLocation();
  const here = useRef('');
  here.current = pathname + search;

  useEffect(() => {
    const anchorOf = (e: Event) =>
      ((e.target as HTMLElement | null)?.closest?.('a[href]') as HTMLAnchorElement | null) ?? null;

    const onClick = (e: MouseEvent) => {
      lastClickX = e.clientX || undefined;
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = anchorOf(e);
      if (!a || a.target || a.hasAttribute('download') || a.origin !== window.location.origin) return;
      if (a.hash || !load[a.pathname]) return;
      e.preventDefault();
      const path = a.pathname + a.search;
      if (path === here.current) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      go(path);
    };
    const onHover = (e: Event) => {
      const a = anchorOf(e);
      if (a && a.origin === window.location.origin) preload(a.pathname);
    };
    document.addEventListener('click', onClick, true);
    document.addEventListener('pointerover', onHover, { passive: true });
    return () => {
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('pointerover', onHover);
    };
  }, [go]);

  return null;
};
