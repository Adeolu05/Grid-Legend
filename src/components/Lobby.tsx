/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { SaveData } from "../types";
import { RACERS } from "../data";
import { audio } from "../utils/audio";
import { Sparkles, ArrowRight, UserCheck, RotateCcw } from "lucide-react";

interface LobbyProps {
  saveData: SaveData;
  onStartEndless: () => void;
  onStartStory: () => void;
  onEnterCharacterSelect: () => void;
  onResetData: () => void;
}

export default function Lobby({
  saveData,
  onStartEndless,
  onStartStory,
  onEnterCharacterSelect,
  onResetData,
}: LobbyProps) {
  // Find current active racer profile (match saved index or default)
  const activeRacerId = saveData.unlockedRacers[0] || "zenith";
  const activeRacer = RACERS.find((r) => r.id === activeRacerId) || RACERS[0];

  const handleHover = () => {
    audio.playHover();
  };

  const handleClick = (action: () => void) => {
    audio.playClick();
    action();
  };

  return (
    <div className="w-full h-full text-zinc-100 flex flex-col justify-between p-6 sm:p-10 select-none bg-[#050508] relative overflow-hidden">
      {/* Soft atmospheric radial glow - strictly only one color highlight */}
      <div 
        className="absolute -top-40 -left-40 w-96 h-96 rounded-full filter blur-[120px] opacity-15 pointer-events-none"
        style={{ backgroundColor: activeRacer.signatureColor }}
      />

      {/* Primary Header */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <span className="font-mono text-zinc-500 font-bold tracking-widest text-[11px] uppercase">
            Racerz / Grid
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="px-3 py-1 bg-white/[0.03] border border-white/5 rounded-lg flex items-center gap-2">
            <span className="text-zinc-500">Pilot Level</span>
            <span className="font-bold text-white font-mono">{saveData.level}</span>
          </div>
          {saveData.bestEndlessScore > 0 && (
            <div className="px-3 py-1 bg-white/[0.03] border border-white/5 rounded-lg flex items-center gap-1.5">
              <span className="text-zinc-500">Best Drift</span>
              <span className="text-zinc-300 font-bold">{saveData.bestEndlessScore}</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Spacious Workspace Grid */}
      <main className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center my-auto z-10">
        
        {/* Left Hand: Campaign & Gameplay portal */}
        <div className="md:col-span-6 flex flex-col items-start text-left space-y-6">
          <div className="space-y-3">
            <h1 className="font-sans font-medium text-4xl sm:text-5xl lg:text-6xl tracking-tight text-white leading-tight">
              The road is <br />
              <span className="text-zinc-400 font-light font-sans">empty tonight.</span>
            </h1>
            <p className="text-sm text-zinc-400 font-sans max-w-md font-light leading-relaxed">
              Drifting tire trails are the only evidence that you were here. Compete with rivals across sector bridges, or record endless runs on the freeway.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto pt-4">
            <button
              onClick={() => handleClick(onStartStory)}
              onMouseEnter={handleHover}
              className="px-8 py-3.5 bg-white text-zinc-950 font-sans font-medium text-sm rounded-xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
            >
              <span>Chapters</span>
              <ArrowRight className="w-4 h-4 text-zinc-950" />
            </button>
            <button
              onClick={() => handleClick(onStartEndless)}
              onMouseEnter={handleHover}
              className="px-6 py-3.5 bg-white/[0.04] border border-white/10 hover:border-white/20 text-white font-sans text-sm rounded-xl transition-all"
            >
              Drift Trial
            </button>
          </div>
        </div>

        {/* Right Hand: Garage & Pilot Card (The direct portal to selection) */}
        <div className="md:col-span-6 flex justify-end">
          <div 
            onClick={() => handleClick(onEnterCharacterSelect)}
            onMouseEnter={handleHover}
            className="w-full max-w-sm bg-[#0a0a0f] border border-white/5 hover:border-white/15 rounded-2xl p-6 shadow-2xl transition-all duration-300 cursor-pointer group hover:-translate-y-1"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="space-y-0.5">
                <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider">Active Racer</span>
                <h3 className="font-sans font-semibold text-lg text-white group-hover:text-zinc-200 transition-colors">
                  {activeRacer.name}
                </h3>
              </div>
              <div 
                className="w-2.5 h-2.5 rounded-full shadow-lg"
                style={{ backgroundColor: activeRacer.signatureColor }}
              />
            </div>

            <div className="aspect-video w-full rounded-xl bg-black/40 flex items-center justify-center border border-white/5 relative overflow-hidden mb-6">
              {/* Clean abstract tire / line motif representing the driver's vehicle */}
              <div className="absolute inset-0 bg-[radial-gradient(#1f1f2e_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
              <div 
                className="w-16 h-16 rounded-full border flex items-center justify-center transition-transform duration-700 group-hover:scale-105"
                style={{ borderColor: `${activeRacer.signatureColor}40` }}
              >
                <div 
                  className="w-10 h-10 rounded-full"
                  style={{ backgroundColor: `${activeRacer.signatureColor}15` }}
                />
              </div>
            </div>

            <p className="text-xs text-zinc-400 font-sans font-light leading-relaxed mt-2 text-left line-clamp-2">
              {activeRacer.description}
            </p>

            <div className="h-[1px] bg-white/5 my-4" />

            <div className="flex items-center justify-between text-xs font-mono text-zinc-500">
              <span className="flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5" style={{ color: activeRacer.signatureColor }} />
                <span>Garage & Pilot Locker</span>
              </span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>
        </div>

      </main>

      {/* Bottom Footer: Minimal and elegant */}
      <footer className="w-full max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-zinc-600 border-t border-white/5 pt-6 z-10 gap-3">
        <span>The city remembers.</span>
        <button 
          onClick={() => handleClick(onResetData)}
          className="flex items-center gap-1 text-zinc-500 hover:text-zinc-200 transition-colors"
        >
          <RotateCcw className="w-3" />
          <span>Reset progression data</span>
        </button>
      </footer>
    </div>
  );
}
