/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { ScreenState, SaveData, StoryRace, Racer } from "./types";
import { RACERS, TRACKS, STORY_RACES } from "./data";
import { audio } from "./utils/audio";
import Lobby from "./components/Lobby";
import CharacterSelect from "./components/CharacterSelect";
import ChapterSelect from "./components/ChapterSelect";
import DialogueOverlay from "./components/DialogueOverlay";
import GameCanvas from "./components/GameCanvas";
import ResultOverlay from "./components/ResultOverlay";
import { Sparkles, Zap, Trophy, Play } from "lucide-react";

const LOCAL_STORAGE_KEY = "racerz_progression_save_v1";

const DEFAULT_SAVE_DATA: SaveData = {
  xp: 0,
  level: 1,
  unlockedRacers: ["zenith"], // "zenith" is unlocked by default; others unlock at Pilot Level 3
  unlockedTracks: ["downtown"], // Highway triggers at Level 2, rooftops at Level 3
  storyProgress: 0, // index of next story race
  bestEndlessScore: 0,
};

export default function App() {
  const [screen, setScreen] = useState<ScreenState>("SPLASH");
  const [saveData, setSaveData] = useState<SaveData>(DEFAULT_SAVE_DATA);
  const [activeRacerId, setActiveRacerId] = useState<string>("zenith");

  // Gameplay Context state
  const [isGameplayEndless, setIsGameplayEndless] = useState<boolean>(false);
  const [activeStoryRace, setActiveStoryRace] = useState<StoryRace | null>(null);
  const [isShowingDialogue, setIsShowingDialogue] = useState<boolean>(false);
  const [dialogueStage, setDialogueStage] = useState<"INTRO" | "VICTORY" | "NONE">("NONE");

  // Post Race Summary Stats
  const [postRaceStats, setPostRaceStats] = useState<{
    isVictory: boolean;
    marksLeft: number;
    timeSec: number;
    oldXp: number;
    oldLevel: number;
    gainedXp: number;
  } | null>(null);

  // 1. Persistence Load Loop
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SaveData;
        
        // Auto-unlock mechanics based on level just in case
        const lvl = parsed.level || 1;
        let racers = [...parsed.unlockedRacers];
        let tracks = [...parsed.unlockedTracks];

        if (lvl >= 2 && !tracks.includes("highway")) {
          tracks.push("highway");
        }
        if (lvl >= 3) {
          if (!tracks.includes("rooftops")) tracks.push("rooftops");
          ["kira", "mako", "phoenix"].forEach((id) => {
            if (!racers.includes(id)) racers.push(id);
          });
        }

        setSaveData({
          ...parsed,
          unlockedRacers: Array.from(new Set(racers)),
          unlockedTracks: Array.from(new Set(tracks)),
        });
      }
    } catch (e) {
      console.warn("Failed to load local state progression:", e);
    }
  }, []);

  // 2. Local Save Helper
  const handleSaveDataUpdate = (update: Partial<SaveData>) => {
    setSaveData((prev) => {
      const merged = { ...prev, ...update };
      
      // Auto-unlock validation
      if (merged.level >= 2 && !merged.unlockedTracks.includes("highway")) {
        merged.unlockedTracks.push("highway");
      }
      if (merged.level >= 3) {
        if (!merged.unlockedTracks.includes("rooftops")) merged.unlockedTracks.push("rooftops");
        ["kira", "mako", "phoenix"].forEach((id) => {
          if (!merged.unlockedRacers.includes(id)) merged.unlockedRacers.push(id);
        });
      }

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
      return merged;
    });
  };

  const handleResetSaveData = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setSaveData(DEFAULT_SAVE_DATA);
    setActiveRacerId("zenith");
    setScreen("MAIN_MENU");
    audio.playClick();
  };

  // 3. Audio Unlock Gesture and Splash Proceeding
  const handleProceedFromSplash = () => {
    // Unlocks browser audio context safely (required by Chrome, Safari guidelines)
    audio.resume();
    audio.playSelect();
    setScreen("MAIN_MENU");
  };

  // 4. State routing controllers
  const handleSelectPilot = (id: string) => {
    setActiveRacerId(id);
  };

  const getActiveRacer = (): Racer => {
    return RACERS.find((r) => r.id === activeRacerId) || RACERS[0];
  };

  // Launch Endless Mode Run
  const handleLaunchEndless = () => {
    setIsGameplayEndless(true);
    setActiveStoryRace(null);
    setIsShowingDialogue(false);
    setScreen("GAMEPLAY");
  };

  // Launch Story Node Channel
  const handleLaunchStoryRace = (storyRace: StoryRace) => {
    setIsGameplayEndless(false);
    setActiveStoryRace(storyRace);
    
    // Check if introductory dialogue exists
    if (storyRace.introDialogue && storyRace.introDialogue.length > 0) {
      setDialogueStage("INTRO");
      setIsShowingDialogue(true);
    } else {
      setIsShowingDialogue(false);
      setScreen("GAMEPLAY");
    }
    setScreen("STORY_DIALOG");
  };

  // Finished Narrative Dialogue overlay
  const handleDialogueComplete = () => {
    if (dialogueStage === "INTRO") {
      setIsShowingDialogue(false);
      setScreen("GAMEPLAY");
    } else if (dialogueStage === "VICTORY") {
      setIsShowingDialogue(false);
      setScreen("VICTORY");
    }
  };

  // Intercept Canvas Complete loop signals
  const handleRaceComplete = (marksEarned: number, isVictory: boolean, timeSec: number) => {
    const oldXp = saveData.xp;
    const oldLevel = saveData.level;
    let xpAwarded = Math.round(marksEarned * 0.15); // passive conversion ratio

    if (!isGameplayEndless && activeStoryRace) {
      // In story mode, if user won, award major bonus XP and advance progression index
      const isSuccess = isVictory; 
      if (isSuccess) {
        xpAwarded += activeStoryRace.xpAward;
        const currentProgressIndex = STORY_RACES.findIndex((r) => r.id === activeStoryRace.id);
        
        // If they defeated the highest achieved level, increment unlocked progress indices
        if (currentProgressIndex === saveData.storyProgress) {
          handleSaveDataUpdate({
            storyProgress: Math.min(3, saveData.storyProgress + 1),
          });
        }

        // Set up victory screen summary or dial up dialogue first
        const totalNewXp = oldXp + xpAwarded;
        const computedNewLevel = Math.floor(totalNewXp / 1000) + 1;

        setPostRaceStats({
          isVictory: true,
          marksLeft: marksEarned,
          timeSec: timeSec,
          oldXp: oldXp,
          oldLevel: oldLevel,
          gainedXp: xpAwarded,
        });

        // Trigger Progression save updates
        handleSaveDataUpdate({
          xp: totalNewXp,
          level: computedNewLevel,
        });

        if (activeStoryRace.victoryDialogue && activeStoryRace.victoryDialogue.length > 0) {
          setDialogueStage("VICTORY");
          setScreen("STORY_DIALOG");
        } else {
          setScreen("VICTORY");
        }

      } else {
        // Failed story mode race
        setPostRaceStats({
          isVictory: false,
          marksLeft: marksEarned,
          timeSec: timeSec,
          oldXp: oldXp,
          oldLevel: oldLevel,
          gainedXp: xpAwarded,
        });

        // Still award minor XP for drifting effort!
        const totalNewXp = oldXp + xpAwarded;
        const computedNewLevel = Math.floor(totalNewXp / 1000) + 1;

        handleSaveDataUpdate({
          xp: totalNewXp,
          level: computedNewLevel,
        });

        setScreen("DEFEAT");
        audio.playDefeat();
      }

    } else {
      // Endless Survival run
      const isNewHighScore = marksEarned > saveData.bestEndlessScore;
      const totalNewXp = oldXp + xpAwarded;
      const computedNewLevel = Math.floor(totalNewXp / 1000) + 1;

      setPostRaceStats({
        isVictory: isVictory, // True if they survived long enough or completed a threshold
        marksLeft: marksEarned,
        timeSec: timeSec,
        oldXp: oldXp,
        oldLevel: oldLevel,
        gainedXp: xpAwarded,
      });

      handleSaveDataUpdate({
        xp: totalNewXp,
        level: computedNewLevel,
        bestEndlessScore: isNewHighScore ? marksEarned : saveData.bestEndlessScore,
      });

      setScreen("VICTORY");
      audio.playVictory();
    }
  };

  const handlePostRaceExitToLobby = () => {
    setPostRaceStats(null);
    setScreen("MAIN_MENU");
    audio.playClick();
  };

  // Active racer profile
  const playerRacerProfile = getActiveRacer();
  
  // Choose opponent profile (Rival in story, or randomized drone driver in endless)
  const getRivalProfile = (): Racer => {
    if (!isGameplayEndless && activeStoryRace) {
      return RACERS.find((r) => r.id === activeStoryRace.rivalRacerId) || RACERS[3];
    }
    return RACERS[3]; // Phoenix Rex as endless shadow rival
  };

  const opponentRacerProfile = getRivalProfile();

  // Active track environmental profile
  const getActiveTrack = () => {
    if (!isGameplayEndless && activeStoryRace) {
      return TRACKS.find((t) => t.id === activeStoryRace.trackId) || TRACKS[0];
    }
    // Endless uses downtown by default
    return TRACKS[0];
  };

  const activeTrack = getActiveTrack();

  return (
    <div id="application-container" className="relative w-full h-full bg-brand-midnight select-none overflow-hidden font-sans">
      
      {/* 1. SPLASH / PRELOADER VIEW */}
      {screen === "SPLASH" && (
        <div 
          onClick={handleProceedFromSplash}
          className="absolute inset-0 z-50 flex flex-col justify-center items-center bg-[#050508] text-zinc-100 overflow-hidden cursor-pointer"
        >
          {/* Subtle atmosphere background */}
          <div className="absolute inset-0 bg-[#00D4FF]/[0.01] pointer-events-none" />

          {/* Clean, spacious typography layout and prompt */}
          <div className="flex flex-col items-center max-w-sm text-center relative z-10 space-y-6">
            <div className="space-y-1">
              <span className="font-mono text-[9px] tracking-widest text-zinc-500 font-bold uppercase">
                Racerz / Grid
              </span>
              <h1 className="font-sans font-semibold text-3xl tracking-tight text-white leading-none">
                Grid Legends
              </h1>
            </div>

            <p className="text-xs text-zinc-400 font-sans font-light leading-relaxed max-w-[280px]">
              The galactic race has already begun. Tap the console to join.
            </p>

            <button
              onClick={handleProceedFromSplash}
              className="px-8 py-3 bg-white text-zinc-950 font-sans font-medium text-xs rounded-xl transition-all hover:bg-zinc-200"
            >
              Enter Game
            </button>
          </div>
        </div>
      )}

      {/* 2. LOBBY VIEW */}
      {screen === "MAIN_MENU" && (
        <Lobby
          saveData={saveData}
          onStartEndless={handleLaunchEndless}
          onStartStory={() => { setScreen("CHAPTER_SELECT"); audio.playClick(); }}
          onEnterCharacterSelect={() => { setScreen("CHARACTER_SELECT"); audio.playClick(); }}
          onResetData={handleResetSaveData}
        />
      )}

      {/* 3. CHARACTER SELECT LOCKER VIEW */}
      {screen === "CHARACTER_SELECT" && (
        <CharacterSelect
          saveData={saveData}
          activeRacerId={activeRacerId}
          onSelect={handleSelectPilot}
          onBack={() => setScreen("MAIN_MENU")}
        />
      )}

      {/* 4. CHAPTER STORY SELECT VIEW */}
      {screen === "CHAPTER_SELECT" && (
        <ChapterSelect
          saveData={saveData}
          onSelectRace={handleLaunchStoryRace}
          onBack={() => setScreen("MAIN_MENU")}
        />
      )}

      {/* 5. STORY MODE VISUAL NOVEL DIALOG CORES WRAPPER */}
      {screen === "STORY_DIALOG" && isShowingDialogue && activeStoryRace && (
        <DialogueOverlay
          dialogue={dialogueStage === "INTRO" ? activeStoryRace.introDialogue : activeStoryRace.victoryDialogue}
          playerRacer={playerRacerProfile}
          onComplete={handleDialogueComplete}
        />
      )}

      {/* 6. GAMEPLAY ACTIVE TARGET PLAYGROUND STAGE */}
      {screen === "GAMEPLAY" && (
        <GameCanvas
          playerRacer={playerRacerProfile}
          rivalRacer={opponentRacerProfile}
          track={activeTrack}
          isEndless={isGameplayEndless}
          onRaceComplete={handleRaceComplete}
          onExit={() => { 
            setScreen("MAIN_MENU"); 
            audio.stopEngine(); 
          }}
        />
      )}

      {/* 7. POST RACE RESULT OVERLAYS (Victory / Defeat transitions) */}
      {(screen === "VICTORY" || screen === "DEFEAT") && postRaceStats && (
        <ResultOverlay
          isVictory={postRaceStats.isVictory}
          marksLeft={postRaceStats.marksLeft}
          timeSec={postRaceStats.timeSec}
          playerRacer={playerRacerProfile}
          gainedXp={postRaceStats.gainedXp}
          oldXp={postRaceStats.oldXp}
          oldLevel={postRaceStats.oldLevel}
          onContinue={handlePostRaceExitToLobby}
          onRetry={() => {
            setPostRaceStats(null);
            if (isGameplayEndless) {
              handleLaunchEndless();
            } else if (activeStoryRace) {
              handleLaunchStoryRace(activeStoryRace);
            }
          }}
        />
      )}

    </div>
  );
}
