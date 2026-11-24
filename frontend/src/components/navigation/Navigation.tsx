import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  Droplet,
  ShieldAlert,
  User,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  Activity,
} from 'lucide-react';

export const Navigation: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const stored = localStorage.getItem('lifnex_user');
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      } else {
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    }
  }, [location.pathname]);

  const handleSignOut = () => {
    localStorage.removeItem('lifnex_token');
    localStorage.removeItem('lifnex_user');
    setCurrentUser(null);
    navigate('/');
  };

  const getDashboardPath = () => {
    if (!currentUser) return '/login';
    const role = (currentUser.role || 'patient').toLowerCase();
    if (role === 'donor') return '/dashboard/donor';
    if (role === 'hospital') return '/dashboard/hospital';
    if (role === 'admin') return '/dashboard/admin';
    return '/dashboard/patient';
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'How It Works', path: '/how-it-works' },
    { name: 'Hospitals', path: '/hospitals' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <>
      {/* Top Demo Banner */}
      <div className="bg-[#0B101D] border-b border-white/5 py-2 px-4 text-[11px] sm:text-xs text-slate-400">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-[#FF747E] font-bold text-[10px] uppercase border border-red-500/30">
              Synthetic Demo Environment
            </span>
            <span>Lifnex is an academic demonstration project — all telemetry is simulated.</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="hidden md:inline font-mono text-[#38BDF8]">
              Emergency Desk: 1800-LIFNEX-EMG
            </span>
            <Link to="/" className="text-[#38BDF8] hover:underline">
              Terminal v5.0
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 z-50 bg-[#050811]/90 backdrop-blur-xl border-b border-white/10 transition-all">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF2E54] to-[#BE123C] flex items-center justify-center shadow-[0_0_15px_rgba(255,46,84,0.4)] group-hover:scale-105 transition-transform">
              <Droplet className="w-5 h-5 text-white fill-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-white flex items-center gap-1.5 leading-none">
                LIFNEX
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-[#FF747E] border border-red-500/30">
                  AI GRID
                </span>
              </span>
              <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase mt-1">
                Emergency Blood Network
              </span>
            </div>
          </Link>

          {/* Desktop Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-semibold transition-colors duration-200 relative py-1 ${
                  location.pathname === link.path
                    ? 'text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {link.name}
                {location.pathname === link.path && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF2E54] rounded-full shadow-[0_0_8px_#FF2E54]" />
                )}
              </Link>
            ))}
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <Link
                  to={getDashboardPath()}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#FF2E54] to-[#BE123C] hover:opacity-90 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(255,46,84,0.3)]"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>My Portal ({currentUser.role || 'User'})</span>
                </Link>
                <button
                  onClick={handleSignOut}
                  title="Sign Out"
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 border border-white/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 border border-white/10 transition-all"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#FF2E54] to-[#BE123C] hover:opacity-90 shadow-lg transition-all flex items-center gap-1.5"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Emergency Request</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 border border-white/10"
            aria-label="Toggle navigation menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {isOpen && (
          <div className="md:hidden border-b border-white/10 bg-[#070B16] px-4 py-6 space-y-4">
            <nav className="flex flex-col space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    location.pathname === link.path
                      ? 'bg-red-500/10 text-white font-bold border border-red-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
              {currentUser ? (
                <>
                  <Link
                    to={getDashboardPath()}
                    onClick={() => setIsOpen(false)}
                    className="w-full py-3 rounded-xl text-center text-sm font-bold text-white bg-gradient-to-r from-[#FF2E54] to-[#BE123C]"
                  >
                    Open Portal ({currentUser.role})
                  </Link>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      handleSignOut();
                    }}
                    className="w-full py-2.5 rounded-xl text-center text-xs font-semibold text-slate-400 hover:text-white border border-white/10"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="w-full py-3 rounded-xl text-center text-sm font-bold text-slate-300 border border-white/10"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsOpen(false)}
                    className="w-full py-3 rounded-xl text-center text-sm font-bold text-white bg-[#FF2E54]"
                  >
                    Emergency Blood Request
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
};
