import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Navigation } from './components/navigation/Navigation';
import { Footer } from './components/navigation/Footer';
import { Mark } from './components/ui/Brand';
import { ThemeProvider, useTheme } from './lib/theme';
import { IntroOverlay } from './components/site/IntroOverlay';
import ClickSpark from './components/reactbits/ClickSpark';
import { useReduced } from './lib/hooks';
import {
  AboutPage,
  AdminDashboard,
  ContactPage,
  DonorDashboard,
  ForgotPasswordPage,
  HomePage,
  HospitalDashboard,
  HospitalsPage,
  HowItWorksPage,
  LoginPage,
  PatientDashboard,
  RegisterPage,
  RouteTransitions,
  VerifyOtpPage,
} from './lib/routes';

const TITLES: Record<string, string> = {
  '/': 'Lifnex: Connecting Lives When Every Second Matters',
  '/about': 'About Lifnex',
  '/how-it-works': 'How Lifnex works',
  '/hospitals': 'Lifnex hospital network',
  '/contact': 'Contact Lifnex',
  '/login': 'Sign in to Lifnex',
  '/register': 'Join Lifnex',
  '/verify-otp': 'Verify your email, Lifnex',
  '/forgot-password': 'Reset your Lifnex password',
  '/dashboard/patient': 'Patient portal, Lifnex',
  '/dashboard/donor': 'Donor portal, Lifnex',
  '/dashboard/hospital': 'Hospital portal, Lifnex',
  '/dashboard/admin': 'Admin portal, Lifnex',
};

// The old static pages had these addresses. Keep every bookmark working.
const ALIASES: [string, string][] = [
  ['/index.html', '/'],
  ['/about.html', '/about'],
  ['/how-it-works.html', '/how-it-works'],
  ['/hospitals.html', '/hospitals'],
  ['/contact.html', '/contact'],
  ['/login.html', '/login'],
  ['/register.html', '/register'],
  ['/forgot-password.html', '/forgot-password'],
  ['/verify-otp.html', '/verify-otp'],
  ...['patient', 'donor', 'hospital', 'admin'].flatMap((r): [string, string][] => [
    [`/${r}-dashboard`, `/dashboard/${r}`],
    [`/${r}-dashboard.html`, `/dashboard/${r}`],
    [`/dashboard/${r}.html`, `/dashboard/${r}`],
  ]),
];

const Alias: React.FC<{ to: string }> = ({ to }) => {
  const { search } = useLocation();
  return <Navigate to={to + search} replace />;
};

const RequireVerifiedAuth: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const token = localStorage.getItem('lifnex_token');
  let user: any = null;
  try {
    user = JSON.parse(localStorage.getItem('lifnex_user') || 'null');
  } catch {
    user = null;
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.is_active === false) {
    if (user.email) {
      sessionStorage.setItem('lifnex_pending_email', user.email);
    }
    return <Navigate to="/verify-otp" replace />;
  }

  const userRole = String(user.role || 'patient').toLowerCase();
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    const fallbackPath = ['patient', 'donor', 'hospital', 'admin'].includes(userRole)
      ? `/dashboard/${userRole}`
      : '/login';
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

const Loading: React.FC = () => (
  <div className="grid min-h-[80vh] place-items-center" role="status" aria-label="Loading">
    <Mark size={64} className="beat" />
  </div>
);

const NotFound: React.FC = () => (
  <section className="wrap grid min-h-[70vh] place-content-center gap-6 py-24 text-center">
    <h1 className="display text-[clamp(2.6rem,8vw,6rem)]">No pulse on this page</h1>
    <p className="lede mx-auto">The address may have changed. Everything else is still running.</p>
    <a href="/" className="btn btn-primary btn-lg mx-auto">
      <span>Back to home</span>
    </a>
  </section>
);

const Shell: React.FC = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const reduced = useReduced();

  useEffect(() => {
    document.title = TITLES[pathname] ?? 'Lifnex';
  }, [pathname]);

  useEffect(() => {
    const onExpired = () => {
      if (pathname.startsWith('/dashboard')) {
        navigate('/login', { replace: true });
      }
    };
    window.addEventListener('lifnex:session-expired', onExpired);
    return () => window.removeEventListener('lifnex:session-expired', onExpired);
  }, [pathname, navigate]);

  return (
    <ClickSpark
      sparkColor={theme === 'night' ? ['#ff5a63', '#ffb9b4', '#f4b544'] : ['#d3122e', '#7a0c1e', '#e8a11c']}
      sparkCount={9}
      sparkSize={11}
      sparkRadius={26}
      duration={520}
      disabled={reduced}
    >
      <a
        href="#main"
        className="fixed left-4 top-2 z-[100] -translate-y-20 rounded-xl bg-ink px-4 py-2 text-ground focus:translate-y-0"
      >
        Skip to content
      </a>
      <div className="flex min-h-screen flex-col">
        <Navigation />
        <main id="main" className="flex-1" tabIndex={-1} style={{ outline: 'none' }}>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              <Route path="/hospitals" element={<HospitalsPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/verify-otp" element={<VerifyOtpPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/dashboard/patient" element={<RequireVerifiedAuth allowedRoles={['patient', 'admin']}><PatientDashboard /></RequireVerifiedAuth>} />
              <Route path="/dashboard/donor" element={<RequireVerifiedAuth allowedRoles={['donor', 'admin']}><DonorDashboard /></RequireVerifiedAuth>} />
              <Route path="/dashboard/hospital" element={<RequireVerifiedAuth allowedRoles={['hospital', 'admin']}><HospitalDashboard /></RequireVerifiedAuth>} />
              <Route path="/dashboard/admin" element={<RequireVerifiedAuth allowedRoles={['admin']}><AdminDashboard /></RequireVerifiedAuth>} />
              {ALIASES.map(([from, to]) => (
                <Route key={from} path={from} element={<Alias to={to} />} />
              ))}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>
        {!pathname.startsWith('/dashboard') && <Footer />}
      </div>
      <RouteTransitions />
    </ClickSpark>
  );
};

export const App: React.FC = () => (
  <ThemeProvider>
    <IntroOverlay />
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  </ThemeProvider>
);

export default App;
