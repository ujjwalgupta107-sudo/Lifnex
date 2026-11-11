import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShieldAlert } from 'lucide-react';

export const Navigation: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const links = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'How It Works', path: '/how-it-works' },
    { name: 'Hospitals', path: '/hospitals' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <>
      <div className="demo-banner">
        <div className="container flex justify-between items-center">
          <div className="flex items-center">
            <span className="demo-tag">Synthetic Demo Environment</span>
            <span>Lifnex is an academic demonstration project — all records are simulated.</span>
          </div>
          <Link to="/" style={{ color: 'var(--cyan-400)', fontSize: '0.8rem' }}>Terminal Home</Link>
        </div>
      </div>

      <header className="navbar">
        <div className="container navbar-inner">
          <Link to="/" className="nav-brand">
            <img src="/static/assets/branding/logo.svg" alt="Lifnex Neural Blood Grid" />
          </Link>

          <nav className={`nav-links ${isOpen ? 'open' : ''}`}>
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="nav-actions">
            <Link to="/login" className="btn btn-secondary btn-sm">Sign In</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Join Network</Link>
            <button className="mobile-nav-toggle" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle Navigation">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>
    </>
  );
};

