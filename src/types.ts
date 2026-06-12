/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface RacerStats {
  speed: number;     // 1-10
  handling: number;  // 1-10
  boost: number;     // 1-10
  grip: number;      // 1-10
}

export interface Racer {
  id: string;
  name: string;
  alias: string;
  description: string;
  vehicleName: string;
  vehicleDesc: string;
  signatureColor: string; // Tailwind readable or Hex code
  trailColor: string;     // Color code for drift trails
  abilityName: string;
  abilityDesc: string;
  stats: RacerStats;
  avatarSeed: number;     // Used to render beautiful proceduring graphic representations
}

export interface Track {
  id: string;
  name: string;
  description: string;
  difficulty: number; // 1-5 stars
  laps: number;
  environmentType: "downtown" | "highway" | "rooftops";
  bgGradient: string; // CSS background style or theme color
  obstacleFrequency: number; // 0-1
  unlockedAtXp: number;
}

export interface SaveData {
  xp: number;
  level: number;
  unlockedRacers: string[]; // Racer IDs
  unlockedTracks: string[]; // Track IDs
  storyProgress: number;    // Last accomplished story race index (0, 1, 2)
  bestEndlessScore: number; // High score of Marks Left
}

export type ScreenState = 
  | "SPLASH"
  | "MAIN_MENU"
  | "CHARACTER_SELECT"
  | "CHAPTER_SELECT"
  | "STORY_DIALOG"
  | "GAMEPLAY"
  | "VICTORY"
  | "DEFEAT";

export interface DialogueNode {
  speaker: string;
  text: string;
  side: "left" | "right";
  isRival?: boolean;
}

export interface StoryRace {
  id: string;
  title: string;
  chapter: string;
  trackId: string;
  rivalName: string;
  rivalRacerId: string;
  introDialogue: DialogueNode[];
  victoryDialogue: DialogueNode[];
  targetRank: number; // 1 means must win, 2 means top 2...
  xpAward: number;
}
