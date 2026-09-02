'use client';

import React, { useState } from 'react';
import { GsapProvider } from '@/components/motion/GsapProvider';
import { MotionNavbar } from '@/components/motion/MotionNavbar';
import { Hero3DVisual } from '@/components/Hero3DVisual';
import { StoryRoadmapArc } from '@/components/motion/StoryRoadmapArc';
import { CinematicStatsStrip } from '@/components/fintech/CinematicStatsStrip';
import { MotionGoalSelector, GoalType } from '@/components/motion/MotionGoalSelector';
import { MotionLoanController } from '@/components/motion/MotionLoanController';
import { MotionJourneyRoadmap } from '@/components/motion/MotionJourneyRoadmap';
import { LayeredSecurityVault } from '@/components/fintech/LayeredSecurityVault';
import { StoryDestinationsFeed } from '@/components/fintech/StoryDestinationsFeed';
import { FintechLaunchpad } from '@/components/fintech/FintechLaunchpad';
import { FintechFooter } from '@/components/fintech/FintechFooter';
import { SectionTransition } from '@/components/motion/SectionTransition';

export default function HomePage() {
  const [selectedGoal, setSelectedGoal] = useState<GoalType>('business');

  return (
    <GsapProvider>
      <div className="min-h-screen bg-[#FFFFFF] text-[#071A33] selection:bg-[#155EEF] selection:text-white relative overflow-x-hidden font-sans">
        {/* Adaptive Scroll-Interpolated Floating Navigation */}
        <MotionNavbar />

        {/* Main Narrative Journey */}
        <main className="relative z-10 flex flex-col">
          {/* Chapter 01: Hero with 3D Financial Core Canvas */}
          <Hero3DVisual />

          {/* Visual continuity: Hero → Story Roadmap */}
          <SectionTransition from="#FFFFFF" to="#FFFFFF" variant="line" />

          {/* Chapter 02: Narrative Arc & Real Moment Stories (5-Stage Story Roadmap with Sketches) */}
          <StoryRoadmapArc />

          {/* Visual continuity: Story → Stats */}
          <SectionTransition from="#FFFFFF" to="#FFFFFF" variant="line" />

          {/* Viewport Animated Numbers Strip */}
          <CinematicStatsStrip />

          {/* Visual continuity: Stats → Goal Selector */}
          <SectionTransition from="#FFFFFF" to="#FFFFFF" variant="line" />

          {/* Chapter 03: What Are You Moving Forward With? (4-Way Category Matrix) */}
          <MotionGoalSelector
            selectedGoal={selectedGoal}
            onSelectGoal={setSelectedGoal}
          />

          {/* Chapter 04: Tactile Interactive Loan Controller with Spring Scaling & 0% Split */}
          <MotionLoanController
            selectedGoal={selectedGoal}
          />

          {/* Visual continuity: Light → Dark transition */}
          <SectionTransition from="#FFFFFF" to="#071A33" variant="gradient" />

          {/* Chapter 05: The Continuous 5-Stage Journey Track */}
          <MotionJourneyRoadmap />

          {/* Visual continuity: Dark → Light transition */}
          <SectionTransition from="#071A33" to="#FFFFFF" variant="gradient" />

          {/* Chapter 06: Zero-Trust Layered Security Architecture */}
          <LayeredSecurityVault />

          {/* Chapter 07: India in Motion Stories & Live Disbursement Feed */}
          <StoryDestinationsFeed />

          {/* Visual continuity: Light → Dark transition */}
          <SectionTransition from="rgba(234,244,255,0.5)" to="#071A33" variant="gradient" />

          {/* Chapter 08: Final Launchpad with 60-Second Pre-Approved Check */}
          <FintechLaunchpad
            selectedGoal={selectedGoal}
          />
        </main>

        {/* Midnight Navy Regulatory Footer */}
        <FintechFooter />
      </div>
    </GsapProvider>
  );
}
