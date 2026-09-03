'use client';

import React from 'react';

export const OperationalMetricsRibbon: React.FC = () => {
  const METRICS = [
    { stat: '800+', label: 'Fintech Subsystem Ingestions', sub: 'LOS, LMS, Payments, & Policy' },
    { stat: '200+', label: 'Regulated Banks & NBFCs', sub: 'Active institutional deployment' },
    { stat: '50M+', label: 'Sealed Audit Records', sub: 'Append-only regulatory blocks' },
    { stat: '0.002s', label: 'Disk Commit Latency', sub: 'High-throughput synchronous SLA' },
    { stat: '0', label: 'Tamper Collisions', sub: 'Zero historical bit-level drift' },
    { stat: '8 Years', label: 'Compliance Retention', sub: 'RBI WORM storage enforcement' },
  ];

  return (
    <section
      id="operational-metrics-ribbon"
      className="py-12 sm:py-16 px-4 sm:px-8 lg:px-12 bg-[#071A33] text-white border-b border-slate-800"
      style={{ contain: 'paint layout' }}
    >
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 sm:gap-8 text-center sm:text-left">
          {METRICS.map((m, idx) => (
            <div
              key={m.label}
              className={`space-y-1.5 ${
                idx !== METRICS.length - 1 ? 'lg:border-r lg:border-slate-800/80 lg:pr-6' : ''
              }`}
            >
              <div
                className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                {m.stat}
              </div>
              <div className="text-xs sm:text-sm font-semibold text-cyan-300">
                {m.label}
              </div>
              <div className="text-[11px] text-slate-400 font-sans leading-tight">
                {m.sub}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
