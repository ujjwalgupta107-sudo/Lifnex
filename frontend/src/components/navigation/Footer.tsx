import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col">
            <img src="/static/assets/branding/logo.svg" alt="Lifnex Logo" style={{ height: '38px', marginBottom: '1.25rem' }} />
            <p style={{ color: 'var(--slate-400)', lineHeight: '1.6', maxWidth: '320px' }}>
              Connecting verified blood donors with patients and hospitals across India when every second matters.
            </p>
          </div>
          <div className="footer-col">
            <h4>Platform</h4>
            <ul className="footer-links">
              <li><Link to="/how-it-works">How It Works</Link></li>
              <li><Link to="/hospitals">Hospitals & Blood Banks</Link></li>
              <li><Link to="/register">Request Blood</Link></li>
              <li><Link to="/register?role=donor">Become a Donor</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <ul className="footer-links">
              <li><Link to="/about">About Lifnex</Link></li>
              <li><Link to="/contact">Emergency Contact</Link></li>
              <li><a href="#privacy">Privacy & RLS Security</a></li>
              <li><a href="#terms">Terms of Service</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Emergency Dispatch</h4>
            <p style={{ color: '#FF2E54', fontWeight: 700, fontSize: '1.2rem', marginBottom: '0.5rem' }}>1800-LIFNEX-EMG</p>
            <p style={{ color: 'var(--slate-400)', fontSize: '0.85rem' }}>24/7 Monitored Dispatch Hotline</p>
          </div>
        </div>
        <div className="footer-bottom">
          <div>&copy; 2026 Lifnex Healthcare Network. All rights reserved.</div>
          <div>Engineered with React 18, Three.js WebGL & Supabase RLS</div>
        </div>
      </div>
    </footer>
  );
};

