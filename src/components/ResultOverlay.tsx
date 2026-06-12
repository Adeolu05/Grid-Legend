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
            <span className="font-mono text-[9px] text-zinc-500 uppercase">Drift marks earned</span>
            <span className="font-mono text-3xl font-bold text-zinc-100 block">{marksLeft.toLocaleString()}</span>
          </div>

          <div className="h-[1px] bg-white/5 w-full" />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-mono text-[8.5px] text-zinc-500 uppercase block">Time</span>
              <span className="font-sans font-medium text-sm text-zinc-300 block">{timeSec.toFixed(1)}s</span>
            </div>
            <div className="text-right">
              <span className="font-mono text-[8.5px] text-zinc-500 uppercase block">Experience</span>
              <span className="font-sans font-medium text-sm text-zinc-300 block">+{gainedXp}</span>
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
        </div>

        {/* Minimal Navigation Buttons */}
        <div className="flex flex-col gap-3.5 pt-4">
          <button
            onClick={() => { audio.playClick(); onContinue(); }}
            className="w-full py-3.5 bg-white text-zinc-950 rounded-xl font-sans font-medium text-sm transition-all hover:bg-zinc-200 flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4 text-zinc-950" />
            <span>Continue</span>
          </button>

          <button
            onClick={() => { audio.playSelect(); onRetry(); }}
            className="w-full py-3 bg-white/[0.03] hover:bg-white/[0.06] text-white border border-white/5 rounded-xl font-sans text-xs transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Run again</span>
          </button>
        </div>

      </div>
    </div>
  );
}
