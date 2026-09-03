'use client';

import React, { useState } from 'react';
import { Code2, Play, CheckCircle2, AlertTriangle, Terminal } from 'lucide-react';

export const InteractivePolicyBuilder: React.FC = () => {
  const [thresholdVal, setThresholdVal] = useState(40);
  const [testDti, setTestDti] = useState(38);
  const [isCompiling, setIsCompiling] = useState(false);
  const [simulationResult, setSimulationResult] = useState<string | null>(null);

  const handleRunSimulation = () => {
    setIsCompiling(true);
    setSimulationResult(null);

    setTimeout(() => {
      setIsCompiling(false);
      if (testDti > thresholdVal) {
        setSimulationResult(`[SIMULATION: TRIGGERED REVIEW] Test DTI (${testDti}%) > Threshold (${thresholdVal}%). Route to senior underwriter desk.`);
      } else {
        setSimulationResult(`[SIMULATION: PASSED] Test DTI (${testDti}%) <= Threshold (${thresholdVal}%). Automated policy sanction approved.`);
      }
    }, 500);
  };

  return (
    <section
      id="section-policy-builder"
      className="relative py-28 sm:py-36 px-4 sm:px-8 lg:px-12 bg-[#F8FAFC] text-[#071A33] overflow-hidden border-b border-slate-200 select-none"
      style={{ contain: 'paint layout' }}
    >
      <div className="max-w-4xl mx-auto space-y-16 text-center">
        {/* Section Header */}
        <div className="space-y-4 max-w-2xl mx-auto text-left sm:text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 text-white text-xs font-mono font-bold uppercase tracking-widest">
            <Code2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>CONFIGURABLE RULE SYNTAX HARNESS</span>
          </div>

          <h2
            className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tighter uppercase leading-[1.02]"
            style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
          >
            WRITE POLICY <br />
            <span className="text-[#155EEF]">WITHOUT REPEATING CHECKS.</span>
          </h2>

          <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
            Construct and test expressive credit policy declarations in structured syntax before deploying to live channels.
          </p>
        </div>

        {/* ── THE INTERACTIVE POLICY BUILDER TERMINAL ── */}
        <div className="p-8 sm:p-12 bg-white border-2 border-slate-900 shadow-2xl space-y-8 text-left">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase">
              SYNTAX DECLARATION // RULE SPEC v2.4
            </span>
            <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 font-bold">
              COMPILER READY
            </span>
          </div>

          {/* Structured Syntax Code Block */}
          <div className="p-6 bg-[#071A33] text-white font-mono text-base sm:text-lg space-y-4 shadow-inner">
            <div className="text-slate-400 text-xs">
              // DECLARATIVE UNDERWRITING SPECIFICATION
            </div>

            <div className="flex items-center gap-3">
              <span className="text-cyan-400 font-bold">WHEN</span>
              <span className="text-white font-black">DTI_RATIO</span>
            </div>

            <div className="flex flex-wrap items-center gap-3 pl-6">
              <span className="text-slate-400">IS GREATER THAN</span>
              <div className="flex items-center gap-2">
                {[35, 40, 45, 50].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setThresholdVal(val)}
                    className={`px-3 py-1 text-sm font-bold transition-all cursor-pointer ${
                      thresholdVal === val
                        ? 'bg-cyan-400 text-slate-950 shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {val}%
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-amber-400 font-bold">THEN</span>
              <span className="text-white bg-amber-500/20 px-2 py-0.5 border border-amber-400/40 text-amber-300">
                ACTION: ROUTE_MANUAL_REVIEW
              </span>
            </div>
          </div>

          {/* Test Harness Execution Bar */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-slate-500">Applicant DTI to test:</span>
              <input
                type="number"
                min="20"
                max="60"
                value={testDti}
                onChange={(e) => setTestDti(parseInt(e.target.value, 10) || 0)}
                className="w-16 p-1.5 border border-slate-300 font-bold text-center"
              />
              <span>%</span>
            </div>

            <button
              type="button"
              onClick={handleRunSimulation}
              disabled={isCompiling}
              className="px-6 py-3 bg-[#155EEF] hover:bg-blue-700 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isCompiling ? 'COMPILING SPEC...' : 'RUN SIMULATION'}</span>
            </button>
          </div>

          {/* Real-time Compiler Output Feed */}
          {simulationResult && (
            <div className="p-4 bg-slate-100 border border-slate-300 text-xs font-mono text-slate-800 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#155EEF] shrink-0" />
              <span>{simulationResult}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
