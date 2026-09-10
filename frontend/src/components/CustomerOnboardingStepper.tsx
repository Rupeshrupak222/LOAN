'use client';

import React from 'react';
import { Check, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StepItem {
  id: number;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

interface StepperProps {
  currentStep: number;
  completedSteps: number[];
  steps: StepItem[];
  onStepClick: (stepId: number) => void;
}

export function CustomerOnboardingStepper({
  currentStep,
  completedSteps,
  steps,
  onStepClick,
}: StepperProps) {
  const totalSteps = steps.length;
  const completedCount = completedSteps.length;
  const progressPercent = Math.round((completedCount / totalSteps) * 100);

  // Line fill percentage between center of first step (0%) and center of last step (100%)
  const lineProgressPercent = totalSteps > 1
    ? Math.min(100, Math.max(0, ((Math.max(currentStep - 1, completedCount - 1)) / (totalSteps - 1)) * 100))
    : 0;

  return (
    <div className="w-full space-y-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#1E2445] p-5 sm:p-6 shadow-sm">
      {/* Connected Line Stepper Header (Matching Reference Design) */}
      <div className="relative w-full px-5 sm:px-14">
        {/* Progress Connecting Line Container (Bounded between center of Step 1 and Step N) */}
        <div className="absolute top-5 sm:top-6 left-10 sm:left-20 right-10 sm:right-20 h-1 pointer-events-none z-0">
          {/* Progress Background Connecting Line */}
          <div className="w-full h-full bg-slate-200 dark:bg-slate-800 rounded-full" />
          
          {/* Active Progress Completed Line */}
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500 ease-out rounded-full"
            style={{
              width: `${lineProgressPercent}%`,
            }}
          />
        </div>

        {/* Step Nodes Row */}
        <div className="relative z-1 flex items-center justify-between">
          {steps.map((s) => {
            const Icon = s.icon;
            const isActive = currentStep === s.id;
            const isDone = completedSteps.includes(s.id) && !isActive;
            const isClickable = completedSteps.includes(s.id) || isDone || s.id <= Math.max(...completedSteps, 0) + 1 || s.id === 1;

            return (
              <div key={s.id} className="flex flex-col items-center group">
                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => isClickable && onStepClick(s.id)}
                  className={cn(
                    'relative flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full font-bold text-xs sm:text-sm transition-all duration-300 cursor-pointer shadow-sm',
                    isDone
                      ? 'bg-emerald-500 text-white shadow-emerald-500/20 ring-4 ring-emerald-100 dark:ring-emerald-950/80 hover:bg-emerald-600'
                      : isActive
                      ? 'bg-emerald-500 text-white ring-4 ring-emerald-200 dark:ring-emerald-900/80 scale-110 shadow-md animate-pulse-subtle'
                      : isClickable
                      ? 'bg-white dark:bg-[#1E2445] text-slate-600 dark:text-slate-300 border-2 border-slate-300 dark:border-slate-700 hover:border-emerald-500'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-2 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                  )}
                >
                  {isDone ? (
                    <Check className="h-5 w-5 stroke-[3]" />
                  ) : isActive ? (
                    <Icon className="h-5 w-5" />
                  ) : (
                    <span>{s.id}</span>
                  )}
                </button>

                {/* Node Title Below */}
                <div className="mt-2.5 text-center max-w-[110px] sm:max-w-[150px]">
                  <span
                    className={cn(
                      'block text-xs font-bold transition-colors leading-tight tracking-tight line-clamp-2',
                      isActive
                        ? 'text-emerald-700 dark:text-emerald-400 font-extrabold scale-105'
                        : isDone
                        ? 'text-slate-800 dark:text-slate-200 font-semibold'
                        : 'text-slate-400 dark:text-slate-500'
                    )}
                  >
                    {s.label}
                  </span>
                  {isDone ? (
                    <span className="inline-block text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-full">
                      Done ✓
                    </span>
                  ) : isActive ? (
                    <span className="inline-block text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-full">
                      In Progress
                    </span>
                  ) : (
                    <span className="inline-block text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1">
                      Pending
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex flex-wrap items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
            {currentStep}
          </span>
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            Step {currentStep} of {totalSteps}: <span className="text-slate-500 dark:text-slate-400">{steps.find((s) => s.id === currentStep)?.description}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Completion Progress:</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200/50 dark:border-emerald-800/40">
            {completedCount} of {totalSteps} Steps ({progressPercent}%)
          </span>
        </div>
      </div>
    </div>
  );
}
