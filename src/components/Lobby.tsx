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
  activeRacerId: string;
  onStartEndless: () => void;
  onStartStory: () => void;
  onEnterCharacterSelect: () => void;
  onResetData: () => void;
}

export default function Lobby({
  saveData,
  activeRacerId,
  onStartEndless,
  onStartStory,
  onEnterCharacterSelect,
  onResetData,
}: LobbyProps) {
  // Find current active racer profile
  const activeRacer = RACERS.find((r) => r.id === activeRacerId) || RACERS[0];

  const handleHover = () => {
    audio.playHover();
  };

  const handleClick = (action: () => void) => {
    audio.playClick();
    action();
  };

  return (
    <div 
      className="w-full h-full text-zinc-100 flex flex-col justify-between p-6 sm:p-10 select-none bg-cover bg-center bg-no-repeat relative overflow-hidden"
      style={{ backgroundImage: 'url("/images/character_shop.jpg")' }}
    >
      {/* Dark showroom overlay */}
      <div className="absolute inset-0 bg-[#050508]/85 backdrop-blur-[3px] pointer-events-none" />
      
      {/* Soft atmospheric radial glow - strictly only one color highlight */}
      <div 
        className="absolute -top-40 -left-40 w-96 h-96 rounded-full filter blur-[120px] opacity-20 pointer-events-none"
        style={{ backgroundColor: activeRacer.signatureColor }}
      />

      {/* Primary Header */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between z-10">
        <div className="flex flex-col items-start">
          <span className="font-orbitron text-white font-black tracking-widest text-[14px] uppercase">
            RACERZ 3D
          </span>
          <span className="font-mono text-zinc-500 font-bold tracking-wider text-[8px] uppercase">
            An Unofficial Racerz Fan Experience
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="px-3.5 py-1.5 bg-[#00D4FF]/10 border border-[#00D4FF]/20 rounded-xl flex items-center gap-2 shadow-[0_0_15px_rgba(0,212,255,0.05)]">
            <span className="text-zinc-400 text-[10px]">Racerz Points</span>
            <span className="font-extrabold text-[#00D4FF] font-orbitron">{saveData.xp.toLocaleString()}</span>
          </div>
          <div className="px-3 py-1.5 bg-white/[0.03] border border-white/5 rounded-xl flex items-center gap-2">
            <span className="text-zinc-500">Pilot Level</span>
            <span className="font-bold text-white font-mono">{saveData.level}</span>
          </div>
          {saveData.bestEndlessScore > 0 && (
            <div className="px-3 py-1.5 bg-white/[0.03] border border-white/5 rounded-xl flex items-center gap-1.5">
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
            <h1 className="font-orbitron font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight text-white leading-none uppercase">
              THE ROAD IS <br />
              <span className="text-zinc-400 font-light font-orbitron">EMPTY TONIGHT.</span>
            </h1>
            <p className="text-sm text-zinc-400 font-sans max-w-md font-light leading-relaxed">
              Drifting tire trails are the only evidence that you were here. Compete with rivals across sector bridges, or record endless runs on the freeway.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto pt-4">
            <button
              onClick={() => handleClick(onStartStory)}
              onMouseEnter={handleHover}
              className="px-8 py-3.5 bg-[#00D4FF] hover:bg-cyan-400 text-zinc-950 font-orbitron font-bold text-xs tracking-widest rounded-xl hover:scale-102 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,212,255,0.4)] active:scale-98 cursor-pointer"
            >
              <span>Chapters</span>
              <ArrowRight className="w-4 h-4 text-zinc-950" />
            </button>
            <button
              onClick={() => handleClick(onStartEndless)}
              onMouseEnter={handleHover}
              className="px-8 py-3.5 bg-white/[0.03] border border-[#ff007f]/40 hover:border-[#ff007f] text-white font-orbitron font-bold text-xs tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 active:scale-98 hover:shadow-[0_0_15px_rgba(255,0,127,0.25)] hover:bg-white/[0.06] cursor-pointer"
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
            className="w-full max-w-sm bg-[#0a0a0f]/90 border border-white/10 hover:border-[#00D4FF]/40 rounded-2xl p-6 shadow-2xl transition-all duration-300 cursor-pointer group hover:-translate-y-1 backdrop-blur-md"
            style={{ 
              boxShadow: `0 20px 45px rgba(0,0,0,0.6), inset 0 0 20px ${activeRacer.signatureColor}10` 
            }}
          >
            <div className="flex justify-between items-start mb-6">
              <div className="space-y-0.5">
                <span className="font-mono text-[9px] text-[#00D4FF] uppercase tracking-wider font-bold">PILOT GARAGE</span>
                <h3 className="font-orbitron font-bold text-lg text-white group-hover:text-[#00D4FF] transition-colors uppercase">
                  {activeRacer.name}
                </h3>
              </div>
              <div 
                className="w-3 h-3 rounded-full"
                style={{ 
                  backgroundColor: activeRacer.signatureColor,
                  boxShadow: `0 0 12px ${activeRacer.signatureColor}`
                }}
              />
            </div>

            <div className="aspect-video w-full rounded-xl bg-black/55 flex items-center justify-center border border-white/5 relative overflow-hidden mb-6">
              {activeRacer.id === "zenith" ? (
                <img 
                  src="/images/splash_cockpit.png" 
                  alt={activeRacer.name} 
                  className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />
              ) : activeRacer.id === "kira" ? (
                <img 
                  src="/images/character_girl.png" 
                  alt={activeRacer.name} 
                  className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                />
              ) : activeRacer.id === "mako" ? (
                <img 
                  src="/images/character_mako.png" 
                  alt={activeRacer.name} 
                  className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />
              ) : activeRacer.id === "phoenix" ? (
                <img 
                  src="/images/character_shop.jpg" 
                  alt={activeRacer.name} 
                  className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <>
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
                </>
              )}
            </div>

            <div className="text-left space-y-1">
              <span className="font-mono text-[8px] text-zinc-500 uppercase tracking-widest block font-bold">VEHICLE DATA</span>
              <p className="text-xs text-zinc-300 font-sans font-light leading-relaxed line-clamp-2">
                {activeRacer.vehicleName} · {activeRacer.description}
              </p>
            </div>

            <div className="h-[1px] bg-white/5 my-4" />

            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
              <span className="flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5" style={{ color: activeRacer.signatureColor }} />
                <span className="group-hover:text-white transition-colors uppercase font-bold">Locker & Helmet Select</span>
              </span>
              <span className="group-hover:translate-x-1.5 transition-transform text-[#00D4FF]">→</span>
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
