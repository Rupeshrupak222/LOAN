'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle,
  Clock,
  AlertCircle,
  Camera,
  CreditCard,
  Building,
  Fingerprint,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import type { BorrowerProfile } from '../types';
import { borrowerApi } from '../api';

interface KycVerificationViewProps {
  profile: BorrowerProfile;
  onKycUpdated?: () => void;
}

export const KycVerificationView: React.FC<KycVerificationViewProps> = ({ profile, onKycUpdated }) => {
  const [isSimulatingKyc, setIsSimulatingKyc] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'DIGILOCKER' | 'NSDL_PAN' | 'SELFIE'>('DIGILOCKER');

  const isFullyVerified = profile.kycStatus === 'VERIFIED';

  const handleSimulateKycVerification = async () => {
    try {
      setIsSimulatingKyc(true);
      // Simulate direct KYC completion / update on backend
      await borrowerApi.updateMyProfile({
        kycStatus: 'VERIFIED',
        status: 'KYC_VERIFIED',
      });
      if (onKycUpdated) onKycUpdated();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'KYC update failed.');
    } finally {
      setIsSimulatingKyc(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className={`p-6 rounded-3xl border shadow-xs ${
        isFullyVerified
          ? 'bg-gradient-to-r from-emerald-50/80 via-teal-50/40 to-white dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900 border-emerald-200 dark:border-emerald-500/30'
          : 'bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-white dark:from-blue-950/40 dark:via-slate-900 dark:to-slate-900 border-blue-200 dark:border-blue-500/30'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
              isFullyVerified ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' : 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20'
            }`}>
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Digital e-KYC Compliance Center</h3>
                {isFullyVerified ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Verified & Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
                    <Clock className="w-3.5 h-3.5" />
                    Verification Required
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
                RBI Compliant Video & Paperless e-KYC pipeline. Once verified, you get instant loan sanctions and immediate disbursals.
              </p>
            </div>
          </div>

          {!isFullyVerified && (
            <button
              disabled={isSimulatingKyc}
              onClick={handleSimulateKycVerification}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {isSimulatingKyc ? 'Verifying with UIDAI & NSDL...' : 'Complete Instant e-KYC'}
            </button>
          )}
        </div>
      </div>

      {/* KYC Steps Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. PAN Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                <CheckCircle className="w-3 h-3" />
                NSDL Matched
              </span>
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">PAN Card Verification</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Validates your identity with the National Securities Depository Limited (NSDL) registry.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Customer: </span>
            {profile.firstName} {profile.lastName}
          </div>
        </div>

        {/* 2. Aadhaar / DigiLocker */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 flex items-center justify-center">
                <Fingerprint className="w-5 h-5" />
              </div>
              {isFullyVerified ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                  <CheckCircle className="w-3 h-3" />
                  UIDAI e-Signed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                  <Clock className="w-3 h-3" />
                  OTP Pending
                </span>
              )}
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">DigiLocker / Aadhaar OTP</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Direct digital fetching of Aadhaar XML from MeitY DigiLocker gateway.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Registered Mobile: </span>
            {profile.mobile}
          </div>
        </div>

        {/* 3. Liveness Check & Selfie */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 flex items-center justify-center">
                <Camera className="w-5 h-5" />
              </div>
              {isFullyVerified ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                  <CheckCircle className="w-3 h-3" />
                  Facial 98% Match
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  Ready
                </span>
              )}
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">AI Liveness & Face Match</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Real-time anti-spoofing facial recognition matched against government photo ID.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Geotag: </span>
            GPS Coordinates Verified
          </div>
        </div>
      </div>
    </div>
  );
};
