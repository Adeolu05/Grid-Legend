/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { StoryRace, SaveData } from "../types";
import { STORY_RACES, TRACKS } from "../data";
import { audio } from "../utils/audio";
import { ArrowLeft, Lock, Play } from "lucide-react";

interface ChapterSelectProps {
  saveData: SaveData;
  onSelectRace: (race: StoryRace) => void;
  onBack: () => void;
}

export default function ChapterSelect({
  saveData,
  onSelectRace,
  onBack,
}: ChapterSelectProps) {
  const handleHover = () => {
    audio.playHover();
  };

  const handleRaceSelection = (race: StoryRace, isUnlocked: boolean) => {
    if (!isUnlocked) {
      audio.playHover();
      return;
    }
    audio.playClick();
    onSelectRace(race);
  };

  return (
    <div 
      className="w-full h-full text-zinc-100 flex flex-col justify-between p-6 sm:p-10 select-none bg-cover bg-center bg-no-repeat relative overflow-hidden custom-scrollbar overflow-y-auto"
      style={{ backgroundImage: 'url("/images/character_shop.jpg")' }}
    >
      {/* Dark showroom overlay */}
      <div className="absolute inset-0 bg-[#050508]/92 backdrop-blur-[5px] pointer-events-none" />

      {/* Header tool bar */}
      <div className="w-full max-w-5xl mx-auto flex justify-between items-center z-10">
        <button
          onClick={() => { audio.playClick(); onBack(); }}
          className="px-4 py-2 bg-white/[0.03] border border-white/5 rounded-xl text-xs font-sans text-zinc-400 hover:text-white transition-colors flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Lobby</span>
        </button>
        <span className="font-mono text-zinc-500 text-xs uppercase tracking-wider font-bold">SECTORS REGISTRY</span>
      </div>

      {/* Chapter Overview Text block */}
      <div className="w-full max-w-5xl mx-auto text-left mt-8 mb-8 z-10">
        <span className="font-mono text-[9px] text-[#ff007f] font-black tracking-widest uppercase border border-[#ff007f]/30 px-2.5 py-0.5 rounded bg-[#ff007f]/10 shadow-[0_0_12px_rgba(255,0,127,0.15)]">
          TOKYO OVERRUNS
        </span>
        <h2 className="font-orbitron font-black text-3xl text-white mt-3 leading-tight uppercase tracking-tight">
          CHAPTER 1: THE CITY WAS EMPTY
        </h2>
        <p className="text-xs text-zinc-400 font-sans font-light mt-1.5 max-w-md leading-relaxed">
          The curfew starts at ten. The roads are clear, but you aren't the only one who didn't go home. Choose an active sector below to log a trace.
        </p>
      </div>

      {/* Main List of Story races inside Campaign progress */}
      <div className="w-full max-w-5xl mx-auto flex flex-col gap-4 z-10 my-auto">
        {STORY_RACES.map((race, index) => {
          const isUnlocked = index <= saveData.storyProgress;
          const isCompleted = index < saveData.storyProgress;
          const track = TRACKS.find((t) => t.id === race.trackId) || TRACKS[0];

          return (
            <div
              key={race.id}
              onClick={() => handleRaceSelection(race, isUnlocked)}
              onMouseEnter={handleHover}
              className={`rounded-2xl p-5 sm:p-6 bg-white/[0.01] border transition-all duration-300 relative overflow-hidden flex flex-col md:flex-row justify-between items-stretch gap-6 ${
                isUnlocked 
                  ? "cursor-pointer hover:bg-white/[0.03] hover:border-white/10" 
                  : "opacity-40 cursor-not-allowed border-transparent"
              }`}
              style={{
                borderColor: isCompleted 
                  ? "rgba(16, 185, 129, 0.15)" 
                  : isUnlocked 
                    ? "rgba(255, 255, 255, 0.05)"
                    : "rgba(255, 255, 255, 0.02)"
              }}
            >
              {/* Completed green/active indicator */}
              <div 
                className="absolute top-0 bottom-0 left-0 w-1"
                style={{ 
                  backgroundColor: isCompleted 
                    ? "#10b981" 
                    : isUnlocked 
                      ? "#00D4FF" 
                      : "#27272a" 
                }}
              />

              {/* Central Details */}
              <div className="flex-1 text-left flex flex-col justify-between pl-3 space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[9px] text-zinc-500 font-bold uppercase tracking-widest">
                      {race.chapter}
                    </span>
                    {isCompleted && (
                      <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-800/20">
                        CLEARED
                      </span>
                    )}
                  </div>
                  <h3 className="font-sans font-semibold text-lg text-white">
                    {race.title}
                  </h3>
                  <p className="text-xs text-zinc-400 font-sans font-light leading-relaxed max-w-lg">
                    {track.name} · {track.description}
                  </p>
                </div>

                {/* Small specs line */}
                <div className="flex items-center gap-4 text-[10px] font-mono text-zinc-500">
                  <span className="flex items-center gap-1">
                    <span>Stars:</span>
                    <span className="text-zinc-300">{"★".repeat(track.difficulty)}</span>
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <span>Laps:</span>
                    <span className="text-zinc-300">{track.laps}</span>
                  </span>
                </div>
              </div>

              {/* Divider line vertical */}
              <div className="hidden md:block w-[1px] bg-white/5 my-1" />

              {/* Rival portal action side */}
              <div className="flex flex-col justify-center items-center md:items-end md:text-right min-w-[180px] gap-2.5">
                {isUnlocked ? (
                  <>
                    <div className="space-y-0.5 text-center md:text-right">
                      <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Rival</span>
                      <span className="font-sans font-medium text-white block">{race.rivalName}</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRaceSelection(race, true);
                      }}
                      className="px-5 py-2.5 bg-[#00D4FF] hover:bg-cyan-400 text-zinc-950 font-orbitron font-bold text-[10px] tracking-widest rounded-xl flex items-center justify-center gap-1.5 transition-transform hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(0,212,255,0.3)] cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Drive</span>
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-1">
                    <Lock className="w-4 h-4 text-zinc-600 animate-pulse" />
                    <span className="font-mono text-[9px] text-zinc-600 tracking-wider">LOCKED</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto text-center font-mono text-[9px] text-zinc-600 mt-8 pt-4 border-t border-white/5 z-10">
        <span>Sectors Registry DB-sync active</span>
      </footer>
    </div>
  );
}
