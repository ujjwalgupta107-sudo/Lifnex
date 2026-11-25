import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutDashboard, LogOut, Menu, X } from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Mark, Wordmark } from '../ui/Brand';
import { useGo } from '../../lib/routes';

const NAV_LINKS = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
  { name: 'How it works', path: '/how-it-works' },
  { name: 'Hospitals', path: '/hospitals' },
  { name: 'Contact', path: '/contact' },
];

export const Navigation: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [tucked, setTucked] = useState(false);
  const location = useLocation();
  const go = useGo();

  useEffect(() => {
    try {
      const stored = localStorage.getItem('lifnex_user');
      setCurrentUser(stored ? JSON.parse(stored) : null);
    } catch {
      setCurrentUser(null);
    }
    setIsOpen(false);
    setTucked(false);
  }, [location.pathname]);

  // tuck away on scroll down, return on scroll up
  useEffect(() => {
    let last = window.scrollY;
    const on = () => {
      const y = window.scrollY;
      if (Math.abs(y - last) < 6) return;
      setTucked(y > last && y > 420);
      last = y;
    };
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setIsOpen(false);
    window.addEventListener('keydown', esc);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', esc);
    };
  }, [isOpen]);

  const handleSignOut = () => {
    const token = localStorage.getItem('lifnex_token') || undefined;
    if (token) {
      fetch('/api/v1/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      }).catch(() => undefined);
    }
    localStorage.removeItem('lifnex_token');
    localStorage.removeItem('lifnex_refresh_token');
    localStorage.removeItem('lifnex_user');
    setCurrentUser(null);
    go('/');
  };

  const getDashboardPath = () => {
    if (!currentUser) return '/login';
    const role = (currentUser.role || 'patient').toLowerCase();
    if (role === 'donor') return '/dashboard/donor';
    if (role === 'hospital') return '/dashboard/hospital';
    if (role === 'admin') return '/dashboard/admin';
    return '/dashboard/patient';
  };

  const lit = hovered ?? location.pathname;

  return (
    <>
      <div className="bg-venous text-on-venous text-[13px] leading-snug">
        <div className="wrap flex items-center justify-between gap-4 py-2">
          <p>
            <strong className="font-semibold">Demo environment.</strong>{' '}
            <span className="opacity-80">
              Lifnex is an academic demonstration project, all telemetry is simulated.
            </span>
          </p>
          <span className="hidden md:inline shrink-0 opacity-90">Emergency desk 1800-LIFNEX-EMG</span>
        </div>
      </div>

      <header
        className="site-nav sticky top-0 z-50 px-3 pt-3 transition-transform duration-500 [transition-timing-function:var(--ease-out)]"
        style={{ transform: tucked && !isOpen ? 'translateY(-120%)' : 'none' }}
      >
        <div
          className="mx-auto flex h-[64px] max-w-[1296px] items-center justify-between gap-4 rounded-[20px] border border-line pl-3 pr-3 sm:pl-4"
          style={{
            background: 'var(--nav-glass)',
            backdropFilter: 'blur(18px) saturate(1.6)',
            WebkitBackdropFilter: 'blur(18px) saturate(1.6)',
            boxShadow: 'var(--shadow-lift)',
          }}
        >
          <Link to="/" className="group flex items-center gap-2.5 rounded-xl" aria-label="Lifnex home">
            <Mark size={38} className="transition-transform duration-500 [transition-timing-function:var(--ease-out)] group-hover:rotate-90" />
            <Wordmark className="text-[25px]" />
          </Link>

          <nav aria-label="Main" className="hidden lg:flex items-center" onMouseLeave={() => setHovered(null)}>
            {NAV_LINKS.map((link) => {
              const active = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  aria-current={active ? 'page' : undefined}
                  onMouseEnter={() => setHovered(link.path)}
                  onFocus={() => setHovered(link.path)}
                  onBlur={() => setHovered(null)}
                  className={`relative rounded-full px-4 py-2 text-[15px] font-medium transition-colors duration-200 ${
                    active ? 'text-red-ink' : 'text-muted hover:text-ink'
                  }`}
                >
                  {lit === link.path && (
                    <motion.span
                      layoutId="nav-cell"
                      className="absolute inset-0 -z-10 rounded-full bg-red-wash"
                      transition={{ type: 'spring', duration: 0.5, bounce: 0.22 }}
                    />
                  )}
                  {link.name}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="hidden md:flex items-center gap-2">
              {currentUser ? (
                <>
                  <Link to={getDashboardPath()} className="btn btn-primary btn-sm">
                    <LayoutDashboard size={16} />
                    <span>My portal</span>
                  </Link>
                  <button onClick={handleSignOut} className="btn btn-ghost btn-sm !px-3" aria-label="Sign out" title="Sign out">
                    <LogOut size={16} />
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn btn-ghost btn-sm">
                    <span>Sign in</span>
                  </Link>
                  <Link to="/register" className="btn btn-primary btn-sm">
                    <span>Request blood</span>
                  </Link>
                </>
              )}
            </div>
            <button
              onClick={() => setIsOpen((v) => !v)}
              className="grid h-11 w-11 place-items-center rounded-xl border border-line-strong transition-transform duration-150 active:scale-95 lg:hidden"
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isOpen}
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="venous-panel fixed inset-0 z-40 flex flex-col justify-between overflow-y-auto px-6 pb-8 pt-36 lg:hidden"
            initial={{ clipPath: 'ellipse(0% 0% at 92% 8%)' }}
            animate={{ clipPath: 'ellipse(170% 150% at 92% 8%)' }}
            exit={{ clipPath: 'ellipse(0% 0% at 92% 8%)' }}
            transition={{ duration: 0.55, ease: [0.77, 0, 0.175, 1] }}
          >
            <nav aria-label="Mobile" className="flex flex-col">
              {NAV_LINKS.map((link, i) => (
                <motion.div
                  key={link.path}
                  initial={{ opacity: 0, transform: 'translateY(26px)' }}
                  animate={{ opacity: 1, transform: 'translateY(0px)' }}
                  transition={{ delay: 0.16 + i * 0.05, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                >
                  <Link
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    aria-current={location.pathname === link.path ? 'page' : undefined}
                    className="display block py-2.5 text-[clamp(2.1rem,10vw,3rem)] aria-[current=page]:text-plasma"
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}
            </nav>
            <div className="mt-10 grid gap-3">
              {currentUser ? (
                <>
                  <Link to={getDashboardPath()} onClick={() => setIsOpen(false)} className="btn btn-inverse btn-lg">
                    <span>Open my portal</span>
                  </Link>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      handleSignOut();
                    }}
                    className="btn btn-outline-inverse btn-lg"
                  >
                    <span>Sign out</span>
                  </button>
                </>
              ) : (
                <>
                  <Link to="/register" onClick={() => setIsOpen(false)} className="btn btn-inverse btn-lg">
                    <span>Request blood</span>
                  </Link>
                  <Link to="/login" onClick={() => setIsOpen(false)} className="btn btn-outline-inverse btn-lg">
                    <span>Sign in</span>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
