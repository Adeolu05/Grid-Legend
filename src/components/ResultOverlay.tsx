/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { Racer } from "../types";
import { audio } from "../utils/audio";
import { Trophy, ShieldAlert, Sparkles, Home, RotateCcw } from "lucide-react";

interface ResultOverlayProps {
  isVictory: boolean;
  marksLeft: number;
  timeSec: number;
  playerRacer: Racer;
  gainedXp: number;
  oldXp: number;
  oldLevel: number;
  onContinue: () => void;
  onRetry: () => void;
}

export default function ResultOverlay({
  isVictory,
  marksLeft,
  timeSec,
  playerRacer,
  gainedXp,
  oldXp,
  oldLevel,
  onContinue,
  onRetry,
}: ResultOverlayProps) {
  const [levelUpOccurred, setLevelUpOccurred] = useState<boolean>(false);
  const [currentLevel, setCurrentLevel] = useState<number>(oldLevel);
  const [progressWidth, setProgressWidth] = useState<number>(0);

  useEffect(() => {
    const oldLevelProgress = (oldXp % 1000) / 10;
    setProgressWidth(oldLevelProgress);

    const timer = setTimeout(() => {
      const totalNewXp = oldXp + gainedXp;
      const expectedNewLevel = Math.floor(totalNewXp / 1000) + 1;
      const newLevelProgress = (totalNewXp % 1000) / 10;

      if (expectedNewLevel > oldLevel) {
        setLevelUpOccurred(true);
        setCurrentLevel(expectedNewLevel);
        audio.playVictory();
        setProgressWidth(100);
        setTimeout(() => {
          setProgressWidth(newLevelProgress);
        }, 600);
      } else {
        setProgressWidth(newLevelProgress);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [oldXp, gainedXp, oldLevel]);

  return (
    <div className="absolute inset-0 z-50 bg-[#050508]/95 backdrop-blur-md flex flex-col justify-center items-center p-6 text-zinc-100 select-none">
      
      {/* Background highlight */}
      <div 
        className="absolute w-80 h-80 rounded-full filter blur-[100px] opacity-10 pointer-events-none"
        style={{ backgroundColor: isVictory ? playerRacer.signatureColor : "#ef4444" }}
      />

      <div className="w-full max-w-sm text-center relative z-10 space-y-8">
        
        {/* Header Title Block */}
        <div className="space-y-2">
          {isVictory ? (
            <div className="flex flex-col items-center gap-3">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center border"
                style={{ 
                  borderColor: `${playerRacer.signatureColor}30`,
                  backgroundColor: `${playerRacer.signatureColor}10`
                }}
              >
                <Trophy className="w-5 h-5 animate-pulse" style={{ color: playerRacer.signatureColor }} />
              </div>
              <span className="font-mono text-[9px] text-zinc-500 font-bold tracking-widest uppercase">
                Mark recorded.
              </span>
              <h2 className="font-sans font-medium text-3xl text-white leading-none">
                You left a trace.
              </h2>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-red-500/20 bg-red-950/10">
                <ShieldAlert className="w-5 h-5 text-red-500" />
              </div>
              <span className="font-mono text-[9px] text-[#ff007f] font-bold tracking-widest uppercase animate-pulse">
                Run failed.
              </span>
              <h2 className="font-sans font-medium text-3xl text-white leading-none">
                Wrecked.
              </h2>
            </div>
          )}
        </div>

        {/* Core Stats Sheet */}
        <div className="bg-[#0a0a0f] border border-white/5 rounded-2xl p-6 text-left space-y-4 shadow-xl">
          <div className="space-y-0.5">
            <span className="font-mono text-[9px] text-[#00D4FF] uppercase tracking-wider block">Racerz Points Earned</span>
            <span className="font-mono text-3xl font-bold text-zinc-100 block">{marksLeft.toLocaleString()}</span>
          </div>

          <div className="h-[1px] bg-white/5 w-full" />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-mono text-[8.5px] text-zinc-500 uppercase block">Time</span>
              <span className="font-sans font-medium text-sm text-zinc-300 block">{timeSec.toFixed(1)}s</span>
            </div>
            <div className="text-right">
              <span className="font-mono text-[8.5px] text-zinc-500 uppercase block">Level XP</span>
              <span className="font-sans font-medium text-sm text-[#00D4FF] block">+{gainedXp}</span>
            </div>
          </div>
        </div>

        {/* Level Syncing & Unlocks Bar */}
        <div className="text-left space-y-1.5">
          <div className="flex justify-between items-baseline font-mono text-[9px] text-zinc-500">
            <span>Pilot Level License</span>
            <span className="text-zinc-300 font-bold font-mono">LEVEL {currentLevel}</span>
          </div>

          <div className="w-full bg-white/5 h-[3px] rounded-full overflow-hidden border-none">
            <div 
              className="h-full bg-white transition-all duration-750" 
              style={{ width: `${progressWidth}%` }}
            />
          </div>

          {levelUpOccurred && (
            <div className="pt-2 bg-[#0a0a0f] text-center rounded-lg py-2 border border-emerald-500/10 text-[10px] font-mono text-emerald-400 flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Pilot class upgraded!</span>
            </div>
          )}

          {levelUpOccurred && currentLevel >= 2 && currentLevel <= 4 && (
            <div className="p-4 bg-[#0a0a0f] rounded-2xl border border-[#00D4FF]/20 text-left space-y-3 mt-4 shadow-[0_15px_30px_rgba(0,0,0,0.5)] animate-fade-in">
              <span className="font-mono text-[8.5px] text-[#00D4FF] font-black tracking-widest uppercase block text-center">
                🎁 REWARDS UNLOCKED 🎁
              </span>
              <div className="space-y-2 text-[11px] font-sans">
                <div className="flex justify-between items-center bg-white/[0.02] px-3 py-2 rounded-xl border border-white/5">
                  <span className="text-zinc-500">New Car</span>
                  <span className="font-bold text-white">
                    {currentLevel === 2 ? "Phantom Hybrid" : currentLevel === 3 ? "Tatsu Widebody" : "Dune Reaver V8"}
                  </span>
                </div>
                <div className="flex justify-between items-center bg-white/[0.02] px-3 py-2 rounded-xl border border-white/5">
                  <span className="text-zinc-500">New Helmet</span>
                  <span className="font-bold text-white">
                    {currentLevel === 2 ? "Neon Visor V1" : currentLevel === 3 ? "Volt Charger" : "Apex Legend"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Minimal Navigation Buttons */}
        <div className="flex flex-col gap-3.5 pt-4">
          <button
            onClick={() => { audio.playClick(); onContinue(); }}
            className="w-full py-3.5 bg-[#00D4FF] hover:bg-cyan-400 text-zinc-950 rounded-xl font-orbitron font-bold text-xs tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(0,212,255,0.35)] active:scale-98"
          >
            <Home className="w-4 h-4 text-zinc-950" />
            <span>Continue</span>
          </button>

          <button
            onClick={() => { audio.playSelect(); onRetry(); }}
            className="w-full py-3 bg-white/[0.02] hover:bg-white/[0.05] text-white border border-[#ff007f]/40 hover:border-[#ff007f] rounded-xl font-orbitron font-bold text-[10px] tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 hover:shadow-[0_0_15px_rgba(255,0,127,0.25)]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Run again</span>
          </button>
        </div>

      </div>
    </div>
  );
}
