/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Racer, Track, StoryRace, Helmet } from "./types";

export const RACERS: Racer[] = [
  {
    id: "zenith",
    name: "Zenith",
    alias: "VROOM",
    description: "An underground paint runner who views Neo-Tokyo's overpasses as empty canvases waiting for a high-speed spray nozzle.",
    vehicleName: "Apex S-X",
    vehicleDesc: "Ultra-low chassis with carbon fins.",
    signatureColor: "#00D4FF", // Neon Cyan
    trailColor: "#00D4FF",
    abilityName: "Paint trail",
    abilityDesc: "Leaves a dense neon wake that doubles your drift marks.",
    stats: {
      speed: 7,
      handling: 8,
      boost: 6,
      grip: 7
    },
    avatarSeed: 12
  },
  {
    id: "kira",
    name: "Kira",
    alias: "VOLT",
    description: "Spent her youth hacking municipal substations just to light up abandoned transit lines. Racing is just her canvas of choice.",
    vehicleName: "Phantom Hybrid",
    vehicleDesc: "Solid state power with raw magnetic thrusters.",
    signatureColor: "#ff007f", // Cyber Pink
    trailColor: "#ff007f",
    abilityName: "Bolt bypass",
    abilityDesc: "Speed burst that clears oncoming commuter traffic.",
    stats: {
      speed: 9,
      handling: 5,
      boost: 9,
      grip: 4
    },
    avatarSeed: 45
  },
  {
    id: "mako",
    name: "Mako",
    alias: "TATSU",
    description: "A rogue drafting technician who found that structural algorithms hold up better when measured in cornering g-forces.",
    vehicleName: "Tatsu Widebody",
    vehicleDesc: "Brutalist frame with heavy downforce tunnels.",
    signatureColor: "#00ffcc", // Neon Mint
    trailColor: "#00ffcc",
    abilityName: "Vacuum grid",
    abilityDesc: "Draws nearby score marks and fits impact armor.",
    stats: {
      speed: 6,
      handling: 9,
      boost: 5,
      grip: 9
    },
    avatarSeed: 88
  },
  {
    id: "phoenix",
    name: "Rex",
    alias: "REX",
    description: "A retired desert freight runner with a heavy knee and a total disregard for toll barriers. He only exits the dunes when he is bored.",
    vehicleName: "Dune Reaver V8",
    vehicleDesc: "Stellar custom muscle block with raw exhaust channels.",
    signatureColor: "#e2f413", // Sulphur Yellow
    trailColor: "#e2f413",
    abilityName: "Dust blast",
    abilityDesc: "Obstructs opponents and triggers massive forward pull.",
    stats: {
      speed: 8,
      handling: 6,
      boost: 8,
      grip: 6
    },
    avatarSeed: 99
  }
];

export const TRACKS: Track[] = [
  {
    id: "downtown",
    name: "Downtown Canyons",
    description: "Sharp asphalt angles. Dark steel shadows.",
    difficulty: 1,
    laps: 2,
    environmentType: "downtown",
    bgGradient: "linear-gradient(to bottom, #050512, #0d061f)",
    obstacleFrequency: 0.3,
    unlockedAtXp: 0
  },
  {
    id: "highway",
    name: "High Pass Expressway",
    description: "High altitude overpass above the cloud belt.",
    difficulty: 3,
    laps: 2,
    environmentType: "highway",
    bgGradient: "linear-gradient(to bottom, #03030d, #010a1a)",
    obstacleFrequency: 0.45,
    unlockedAtXp: 1000
  },
  {
    id: "rooftops",
    name: "Skyline Grid",
    description: "Leap across empty skyscraper spans. Watch your tires.",
    difficulty: 5,
    laps: 3,
    environmentType: "rooftops",
    bgGradient: "linear-gradient(to bottom, #020205, #140114)",
    obstacleFrequency: 0.6,
    unlockedAtXp: 2500
  }
];

export const STORY_RACES: StoryRace[] = [
  {
    id: "story_1",
    title: "The city was empty.",
    chapter: "Sector 1",
    trackId: "downtown",
    rivalName: "Drone unit",
    rivalRacerId: "phoenix",
    introDialogue: [
      {
        speaker: "THE COURIER",
        text: "You're late.",
        side: "left"
      },
      {
        speaker: "YOU",
        text: "Had to finish the mural.",
        side: "right"
      },
      {
        speaker: "THE COURIER",
        text: "Then let's see if the tires grip as well as the paint.",
        side: "left",
        isRival: true
      }
    ],
    victoryDialogue: [
      {
        speaker: "THE COURIER",
        text: "Not bad. You left a trace.",
        side: "left",
        isRival: true
      },
      {
        speaker: "YOU",
        text: "Just the first coat.",
        side: "right"
      }
    ],
    targetRank: 3,
    xpAward: 500
  },
  {
    id: "story_2",
    title: "Curfew calls.",
    chapter: "Sector 2",
    trackId: "highway",
    rivalName: "Kira",
    rivalRacerId: "kira",
    introDialogue: [
      {
        speaker: "KIRA",
        text: "Your lines are neat, but you take too many precautions.",
        side: "left",
        isRival: true
      },
      {
        speaker: "YOU",
        text: "My lines are clean.",
        side: "right"
      },
      {
        speaker: "KIRA",
        text: "We'll see. The overpass is open.",
        side: "left",
        isRival: true
      }
    ],
    victoryDialogue: [
      {
        speaker: "KIRA",
        text: "Fast. The city is starting to remember you.",
        side: "left",
        isRival: true
      },
      {
        speaker: "YOU",
        text: "Next sector?",
        side: "right"
      }
    ],
    targetRank: 2,
    xpAward: 1000
  },
  {
    id: "story_3",
    title: "One more lap.",
    chapter: "Sector 3",
    trackId: "rooftops",
    rivalName: "Rex",
    rivalRacerId: "phoenix",
    introDialogue: [
      {
        speaker: "REX",
        text: "You didn't exit the dunes just to paint on concrete hulls.",
        side: "left",
        isRival: true
      },
      {
        speaker: "YOU",
        text: "The heights have a better view.",
        side: "right"
      },
      {
        speaker: "REX",
        text: "One slip, and you're skyline history. Run it back.",
        side: "left",
        isRival: true
      }
    ],
    victoryDialogue: [
      {
        speaker: "REX",
        text: "Beautiful. That drift across the empty span... genuine art.",
        side: "left",
        isRival: true
      },
      {
        speaker: "YOU",
        text: "We of the heights know the air.",
        side: "right"
      }
    ],
    targetRank: 1,
    xpAward: 1500
  }
];

export const HELMETS: Helmet[] = [
  {
    id: "standard",
    name: "Classic Carbon Dome",
    description: "Standard issue lightweight carbon fiber weave with high visibility visor.",
    glowColor: "#71717a", // zinc-500
    unlockedAtLevel: 1,
  },
  {
    id: "neon",
    name: "Neon Visor V1",
    description: "Equipped with custom heads-up grid layout and a neon cyan visor.",
    glowColor: "#00D4FF", // Neon Cyan
    unlockedAtLevel: 2,
  },
  {
    id: "volt",
    name: "Volt Charger",
    description: "Cyber pink visor that syncs with magnetic engines for optimal frequency monitoring.",
    glowColor: "#ff007f", // Cyber Pink
    unlockedAtLevel: 3,
  },
  {
    id: "apex",
    name: "Apex Legend",
    description: "Gold visor used by top-tier desert and street legends. Complete telemetry HUD.",
    glowColor: "#e2f413", // Sulphur Yellow
    unlockedAtLevel: 4,
  },
];

