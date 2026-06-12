/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { DialogueNode, Racer } from "../types";
import { audio } from "../utils/audio";
import { ChevronRight, FastForward } from "lucide-react";

interface DialogueOverlayProps {
  dialogue: DialogueNode[];
  playerRacer: Racer;
  onComplete: () => void;
}

export default function DialogueOverlay({
  dialogue,
  playerRacer,
  onComplete,
}: DialogueOverlayProps) {
  const [index, setIndex] = useState<number>(0);

  const currentNode = dialogue[index];

  const handleNext = () => {
    audio.playClick();
    if (index < dialogue.length - 1) {
      setIndex((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    audio.playSelect();
    onComplete();
  };

  if (!currentNode) return null;

  const isCurrentPlayer = currentNode.speaker === "YOU";
  const speakerLabel = isCurrentPlayer ? playerRacer.name : currentNode.speaker;
  const speakerColor = isCurrentPlayer ? playerRacer.signatureColor : "#ff007f"; // cyber pink for rivals

  return (
    <div className="absolute inset-0 z-50 bg-[#050508]/95 backdrop-blur-md flex flex-col justify-between p-6 sm:p-10 select-none">
      
      {/* Skip Button */}
      <div className="w-full max-w-4xl mx-auto flex justify-end z-10 pt-4">
        <button
          onClick={handleSkip}
          className="flex items-center gap-1 px-3 py-1.5 bg-white/[0.02] border border-white/5 rounded-xl text-[10px] font-mono text-zinc-500 hover:text-white transition-all"
        >
          <FastForward className="w-3 h-3" />
          <span>Skip Dialogue</span>
        </button>
      </div>

      {/* Narrative Dialogue Body (Center focus) */}
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center my-auto z-10 space-y-8 animate-fade-in">
        
        {/* Simple geometric outline portrait */}
        <div className="w-16 h-16 rounded-full border border-zinc-800 flex items-center justify-center relative bg-black/40">
          <div 
            className="w-1.5 h-1.5 rounded-full absolute top-1 right-1"
            style={{ backgroundColor: speakerColor }}
          />
          <svg viewBox="0 0 100 100" className="w-8 h-8 opacity-40">
            <ellipse cx="50" cy="50" rx="35" ry="35" fill="none" stroke="#fff" strokeWidth="1.5" />
            <path d="M 30,70 Q 50,55 70,70" fill="none" stroke="#fff" strokeWidth="1.5" />
          </svg>
        </div>

        {/* Text Container */}
        <div 
          onClick={handleNext}
          className="w-full text-center space-y-4 cursor-pointer group"
        >
          <span 
            className="font-mono text-[10px] font-bold tracking-widest uppercase block"
            style={{ color: speakerColor }}
          >
            {speakerLabel}
          </span>
          <p className="text-lg sm:text-xl text-zinc-100 font-sans font-light leading-relaxed max-w-xl mx-auto">
            "{currentNode.text}"
          </p>
        </div>

      </div>

      {/* Progress navigation bar */}
      <div className="w-full max-w-xl mx-auto flex flex-col items-center gap-6 pb-6 z-10">
        
        {/* Step dots */}
        <div className="flex gap-2.5">
          {dialogue.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1 rounded-full transition-all duration-300 ${idx === index ? "w-6" : "w-1.5 bg-zinc-800"}`}
              style={{ 
                backgroundColor: idx === index ? speakerColor : "" 
              }}
            />
          ))}
        </div>

        {/* Continue Button Hint */}
        <button 
          onClick={handleNext}
          className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 hover:text-white transition-colors"
        >
          <span>Click screen to continue</span>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
        </button>

      </div>
    </div>
  );
}
