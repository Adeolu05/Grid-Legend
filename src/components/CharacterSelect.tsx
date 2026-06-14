/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Racer, SaveData } from "../types";
import { RACERS, HELMETS } from "../data";
import { audio } from "../utils/audio";
import { ArrowLeft, Check, Lock, Zap, Shield } from "lucide-react";

interface CharacterSelectProps {
  saveData: SaveData;
  activeRacerId: string;
  onSelect: (racerId: string) => void;
  onSelectHelmet: (helmetId: string) => void;
  onBack: () => void;
}

export default function CharacterSelect({
  saveData,
  activeRacerId,
  onSelect,
  onSelectHelmet,
  onBack,
}: CharacterSelectProps) {
  const [selectedId, setSelectedId] = useState<string>(activeRacerId);
  const [activeTab, setActiveTab] = useState<"pilot" | "helmet">("pilot");

  const currentHelmetId = saveData.selectedHelmet || "standard";
  const activeHelmet = HELMETS.find((h) => h.id === currentHelmetId) || HELMETS[0];
  const helmetGlow = activeHelmet.glowColor;

  const handleHover = () => {
    audio.playHover();
  };

  const handleSelectRacer = (racer: Racer) => {
    const isUnlocked = saveData.unlockedRacers.includes(racer.id);
    if (!isUnlocked) {
      audio.playHover();
      return;
    }
    audio.playSelect();
    setSelectedId(racer.id);
    onSelect(racer.id);
  };

  const activeRacer = RACERS.find((r) => r.id === selectedId) || RACERS[0];

  // Helper to render simple, procedural vector portraits
  const renderRacerPortrait = (racer: Racer) => {
    const color = racer.signatureColor;
    return (
      <svg viewBox="0 0 100 120" className="w-full h-full stroke-none transition-transform duration-500 group-hover:scale-102">
        <defs>
          <radialGradient id={`glow-${racer.id}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100" height="120" fill={`url(#glow-${racer.id})`} />
        
        {/* Simple geometric visor and helmet representation */}
        <g transform="translate(50, 55)">
          {/* Main helmet dome */}
          <path d="M -18,-15 C -18,-35 18,-35 18,-15 C 18,5 14,14 0,16 C -14,14 -18,5 -18,-15 Z" fill="#0c0c12" stroke={color} strokeWidth="1.5" />
          
          {/* Visor shield - color matches selected helmet glow */}
          <path d="M -13,-10 C -11,-18 11,-18 13,-10 C 14,-2 9,2 0,2 C -9,2 -14,-2 -13,-10 Z" fill="#050508" stroke={helmetGlow} strokeWidth="1.2" opacity="0.95" />
          
          {/* Neon reflection */}
          <path d="M -8,-11 L 3,-11" stroke={helmetGlow} strokeWidth="1" opacity="0.8" strokeLinecap="round" />
          
          {/* Decals and special detailing for high tier helmets */}
          {currentHelmetId === "volt" && (
            <path d="M -9,-4 L -5,-4 M 5,-4 L 9,-4" stroke="#ff007f" strokeWidth="1" />
          )}
          {currentHelmetId === "neon" && (
            <circle cx="0" cy="-4" r="1.5" fill="#00D4FF" />
          )}
          {currentHelmetId === "apex" && (
            <path d="M -4,-14 L 4,-14" stroke="#e2f413" strokeWidth="1.5" />
          )}
        </g>
        <path d="M 5,5 L 95,5 L 95,115 L 5,115 Z" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      </svg>
    );
  };

  return (
    <div 
      className="w-full h-full text-zinc-100 flex flex-col justify-between p-6 sm:p-10 select-none bg-cover bg-center bg-no-repeat relative overflow-hidden custom-scrollbar overflow-y-auto"
      style={{ backgroundImage: 'url("/images/character_shop.jpg")' }}
    >
      {/* Dark showroom overlay */}
      <div className="absolute inset-0 bg-[#050508]/90 backdrop-blur-[5px] pointer-events-none" />

      {/* Dynamic top-right highlight */}
      <div 
        className="absolute -top-32 -right-32 w-80 h-80 rounded-full filter blur-[100px] opacity-20 pointer-events-none"
        style={{ backgroundColor: activeRacer.signatureColor }}
      />

      {/* Header toolbar */}
      <div className="w-full max-w-6xl mx-auto flex items-center justify-between mb-8 z-10">
        <button
          onClick={() => { audio.playClick(); onBack(); }}
          className="px-4 py-2 bg-white/[0.03] border border-white/5 rounded-xl text-xs font-sans text-zinc-400 hover:text-white transition-colors flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Lobby</span>
        </button>
        <span className="font-mono text-zinc-500 text-xs uppercase tracking-wider font-bold">PILOT LOCKER</span>
      </div>

      {/* Primary Workspace Panel */}
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch my-auto z-10">
        
        {/* Left Hand: Interactive Grid of Drivers */}
        <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {RACERS.map((racer) => {
            const isSelected = selectedId === racer.id;
            const isUnlocked = saveData.unlockedRacers.includes(racer.id);

            return (
              <div
                key={racer.id}
                onClick={() => handleSelectRacer(racer)}
                onMouseEnter={handleHover}
                className={`group rounded-2xl p-4 flex flex-col bg-white/[0.02] border transition-all duration-300 relative overflow-hidden h-[210px] cursor-pointer ${
                  isSelected 
                    ? "border-opacity-100 bg-white/[0.04]" 
                    : "border-white/5 hover:border-white/10 hover:bg-white/[0.03]"
                }`}
                style={{
                  borderColor: isSelected ? racer.signatureColor : "rgba(255,255,255,0.05)"
                }}
              >
                {/* Minimal Character Portrait */}
                <div className="w-full h-[120px] rounded-xl bg-black/40 overflow-hidden relative border border-white/5">
                  {racer.id === "zenith" ? (
                    <img 
                      src="/images/splash_cockpit.png" 
                      alt={racer.name} 
                      className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105" 
                    />
                  ) : racer.id === "kira" ? (
                    <img 
                      src="/images/character_girl.png" 
                      alt={racer.name} 
                      className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105" 
                    />
                  ) : racer.id === "mako" ? (
                    <img 
                      src="/images/character_mako.png" 
                      alt={racer.name} 
                      className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105" 
                    />
                  ) : racer.id === "phoenix" ? (
                    <img 
                      src="/images/character_shop.jpg" 
                      alt={racer.name} 
                      className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105" 
                    />
                  ) : (
                    renderRacerPortrait(racer)
                  )}
                  
                  {/* Status Overlay */}
                  {!isUnlocked ? (
                    <div className="absolute inset-0 bg-[#050508]/90 flex flex-col justify-center items-center gap-1">
                      <Lock className="w-4 h-4 text-zinc-500" />
                      <span className="font-mono text-[9px] tracking-widest text-[#ff007f] font-bold">LOCKED</span>
                    </div>
                  ) : isSelected ? (
                    <div 
                      className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center shadow-lg"
                      style={{ backgroundColor: racer.signatureColor }}
                    >
                      <Check className="w-3 h-3 text-[#050508] stroke-[3px]" />
                    </div>
                  ) : null}
                </div>

                <div className="mt-3 text-left">
                  <div className="flex items-baseline justify-between">
                    <span className="font-sans font-medium text-white text-sm">{racer.name}</span>
                    <span className="font-mono text-[9px] text-zinc-500 uppercase">{racer.alias}</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1 font-light font-sans">
                    {racer.vehicleName} · {racer.vehicleDesc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Hand: Elegant Active Selection Panel details */}
        <div className="md:col-span-5 flex">
          <div 
            className="w-full bg-[#0a0a0f] border border-white/5 rounded-2xl p-6 flex flex-col justify-between text-left relative overflow-hidden"
            style={{ 
              boxShadow: `0 20px 45px rgba(0,0,0,0.4), inset 0 0 25px ${activeRacer.signatureColor}08`
            }}
          >
            <div className="space-y-6">
              <div className="space-y-1">
                <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest block">Active Profile</span>
                <h3 className="font-sans font-semibold text-xl text-white">{activeRacer.name}</h3>
                <span 
                  className="font-mono text-[9px] px-2 py-0.5 rounded border border-white/5 bg-white/5 inline-block"
                  style={{ color: activeRacer.signatureColor }}
                >
                  {activeRacer.alias}
                </span>
              </div>

              {/* Tab Navigation */}
              <div className="flex border-b border-white/5 gap-4 mt-2">
                <button 
                  onClick={() => { audio.playClick(); setActiveTab("pilot"); }}
                  className={`pb-2 text-xs font-mono font-bold tracking-wider transition-colors ${activeTab === "pilot" ? "text-white border-b-2" : "text-zinc-500 hover:text-zinc-300"}`}
                  style={{ borderBottomColor: activeTab === "pilot" ? activeRacer.signatureColor : "transparent" }}
                >
                  PILOT STATS
                </button>
                <button 
                  onClick={() => { audio.playClick(); setActiveTab("helmet"); }}
                  className={`pb-2 text-xs font-mono font-bold tracking-wider transition-colors ${activeTab === "helmet" ? "text-white border-b-2" : "text-zinc-500 hover:text-zinc-300"}`}
                  style={{ borderBottomColor: activeTab === "helmet" ? activeRacer.signatureColor : "transparent" }}
                >
                  HELMET LOCKER
                </button>
              </div>

              {activeTab === "pilot" ? (
                <div className="space-y-6 animate-fade-in">
                  {/* Bio description */}
                  <div className="space-y-1.5">
                    <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-wider block">Background</span>
                    <p className="text-xs text-zinc-300 font-sans font-light leading-relaxed">
                      {activeRacer.description}
                    </p>
                  </div>

                  {/* Ability Information */}
                  <div className="p-4 rounded-xl bg-black/40 border border-white/5 flex gap-3.5 items-start">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center border shrink-0 mt-0.5"
                      style={{ 
                        borderColor: `${activeRacer.signatureColor}30`,
                        backgroundColor: `${activeRacer.signatureColor}10`
                      }}
                    >
                      <Zap className="w-5 h-5" style={{ color: activeRacer.signatureColor }} />
                    </div>
                    <div className="space-y-0.5">
                      <span className="font-mono text-[8px] text-zinc-500 uppercase tracking-widest block font-bold">Signature Skill</span>
                      <h4 className="font-sans font-medium text-xs text-white">{activeRacer.abilityName}</h4>
                      <p className="text-[11px] text-zinc-400 font-light font-sans leading-relaxed">
                        {activeRacer.abilityDesc}
                      </p>
                    </div>
                  </div>

                  {/* Performance sliders */}
                  <div className="space-y-2.5">
                    <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-wider block">Performance Matrix</span>
                    
                    {Object.entries(activeRacer.stats).map(([stat, val]) => (
                      <div key={stat} className="flex flex-col">
                        <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400 uppercase">
                          <span>{stat}</span>
                          <span className="text-zinc-200">{val} / 10</span>
                        </div>
                        <div className="w-full bg-white/5 h-[3px] rounded-full overflow-hidden mt-1 inline-block">
                          <div 
                            className="h-full transition-all duration-500" 
                            style={{ 
                              width: `${val * 10}%`,
                              backgroundColor: activeRacer.signatureColor 
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-wider block">Unlocked Customizations</span>
                  <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                    {HELMETS.map((helmet) => {
                      const isUnlocked = saveData.unlockedHelmets?.includes(helmet.id) || (helmet.unlockedAtLevel === 1);
                      const isActive = currentHelmetId === helmet.id;

                      return (
                        <div
                          key={helmet.id}
                          onClick={() => {
                            if (!isUnlocked) return;
                            audio.playSelect();
                            onSelectHelmet(helmet.id);
                          }}
                          className={`p-3 rounded-xl border flex gap-3.5 items-center relative overflow-hidden transition-all ${
                            isUnlocked 
                              ? "cursor-pointer hover:bg-white/[0.03]" 
                              : "opacity-40 cursor-not-allowed"
                          } ${
                            isActive 
                              ? "bg-white/[0.04] border-white/20 animate-pulse" 
                              : "border-white/5"
                          }`}
                          style={{
                            borderColor: isActive ? helmet.glowColor : ""
                          }}
                        >
                          {/* Helmet glow dot */}
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center border shrink-0"
                            style={{ 
                              borderColor: isUnlocked ? `${helmet.glowColor}40` : "rgba(255,255,255,0.05)",
                              backgroundColor: isUnlocked ? `${helmet.glowColor}10` : "rgba(255,255,255,0.02)"
                            }}
                          >
                            <Shield className="w-4 h-4" style={{ color: isUnlocked ? helmet.glowColor : "#52525b" }} />
                          </div>

                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex justify-between items-baseline">
                              <h4 className="font-sans font-medium text-xs text-white truncate">{helmet.name}</h4>
                              {!isUnlocked && (
                                <span className="font-mono text-[8px] text-[#ff007f] font-bold">LVL {helmet.unlockedAtLevel}</span>
                              )}
                            </div>
                            <p className="text-[10px] text-zinc-400 font-sans font-light leading-snug mt-0.5">
                              {helmet.description}
                            </p>
                          </div>

                          {isActive && (
                            <div 
                              className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                              style={{ backgroundColor: helmet.glowColor }}
                            >
                              <Check className="w-2.5 h-2.5 text-[#050508] stroke-[3px]" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

             <div className="pt-6">
               <button
                 onClick={() => { audio.playSelect(); onBack(); }}
                 className="w-full py-3.5 rounded-xl font-orbitron font-bold text-xs tracking-widest text-zinc-950 transition-all hover:opacity-95 active:scale-98 cursor-pointer"
                 style={{ 
                   backgroundColor: activeRacer.signatureColor,
                   boxShadow: `0 0 20px ${activeRacer.signatureColor}35`
                 }}
               >
                 Confirm Pilot
               </button>
             </div>
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto text-center font-mono text-[9px] text-zinc-600 mt-6 pt-4 border-t border-white/5 z-10">
        <span>Drivers Registry DB-sync active</span>
      </footer>
    </div>
  );
}
