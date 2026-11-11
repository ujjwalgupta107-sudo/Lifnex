import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Hero3DCanvas } from '../../components/3d/Hero3DCanvas';
import { Activity, ShieldCheck, Clock, HeartHandshake } from 'lucide-react';

export const HomePage: React.FC = () => {
  return (
    <div className="relative">
      {/* 3D Hero */}
      <section className="hero-wrapper relative min-h-[85vh] flex items-center">
        <Hero3DCanvas />
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="hero-content max-w-[680px]"
          >
            <div className="hero-badge inline-flex items-center gap-2">
              <span className="text-[#FF2E54]">●</span>
              <span>AI-POWERED NEURAL BLOOD COORDINATION</span>
            </div>
            <h1 className="hero-title text-4xl sm:text-6xl font-black text-white mt-4 mb-4 leading-tight">
              Connecting Lives<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF2E54] to-[#38BDF8]">
                When Every Second
              </span><br />
              Matters.
            </h1>
            <p className="hero-subtitle text-slate-300 text-lg mb-8">
              Lifnex coordinates real-time geospatial intelligence, verified voluntary blood donors, and trauma centers with sub-second precision.
            </p>
            <div className="hero-ctas flex gap-4 flex-wrap">
              <Link to="/register" className="btn btn-primary btn-lg">
                Request Blood Immediately &rarr;
              </Link>
              <Link to="/register?role=donor" className="btn btn-secondary btn-lg">
                Become a Verified Donor
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Real-time KPIs */}
      <section className="section section-darker">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon red"><Activity size={28} /></div>
              <div>
                <div className="stat-value">12,480+</div>
                <div className="stat-label">Verified Donors</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon cyan"><HeartHandshake size={28} /></div>
              <div>
                <div className="stat-value">3,210+</div>
                <div className="stat-label">Dispatched Responses</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon emerald"><ShieldCheck size={28} /></div>
              <div>
                <div className="stat-value">98%</div>
                <div className="stat-label">Fulfillment Rate</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon amber"><Clock size={28} /></div>
              <div>
                <div className="stat-value">6 min</div>
                <div className="stat-label">Average Response Time</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

