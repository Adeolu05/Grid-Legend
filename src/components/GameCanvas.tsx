/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
import { Racer, Track } from "../types";
import { audio } from "../utils/audio";

interface GameCanvasProps {
  playerRacer: Racer;
  rivalRacer: Racer;
  track: Track;
  isEndless: boolean;
  onRaceComplete: (marks: number, isVictory: boolean, timeSec: number) => void;
  onExit: () => void;
}

// Particle class for object pooling
class GridParticle {
  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
  color = "#fff";
  alpha = 1.0;
  decay = 0.02;
  size = 2;
  active = false;

  init(x: number, y: number, vx: number, vy: number, color: string, decay = 0.02, size = 3) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.alpha = 1.0;
    this.decay = decay;
    this.size = size;
    this.active = true;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= this.decay;
    if (this.alpha <= 0) {
      this.active = false;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    // Removed excess shadowBlur to keep particles clean and controlled
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Tire tracks / Drift trails structure
interface TireTrail {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  alpha: number;
  color: string;
}

// Enemy / civilian vehicles
interface TrafficVehicle {
  id: number;
  x: number;
  y: number; // progress on road
  speed: number;
  lane: number;
  color: string;
  width: number;
  height: number;
  type: "car" | "drone" | "truck";
}

// Score multiplier rings or energy cells
interface EnergyCell {
  x: number;
  y: number;
  active: boolean;
  pulse: number;
}

export default function GameCanvas({
  playerRacer,
  rivalRacer,
  track,
  isEndless,
  onRaceComplete,
  onExit,
}: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // States for live rendering
  const [marksLeft, setMarksLeft] = useState<number>(0);
  const [boostLevel, setBoostLevel] = useState<number>(30); // 0 to 100
  const [speedKmh, setSpeedKmh] = useState<number>(0);
  const [isBoosting, setIsBoosting] = useState<boolean>(false);
  const [lap, setLap] = useState<number>(1);
  const [raceTime, setRaceTime] = useState<number>(0);
  const [distanceTraveled, setDistanceTraveled] = useState<number>(0);

  // Keys & Interactive State
  const inputTargetXRef = useRef<number | null>(null);
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const isMouseDown = useRef<boolean>(false);

  // Core Game Loop References
  const animationFrameId = useRef<number | null>(null);
  const gameStateRef = useRef({
    playerX: 0, // Target horizontal lane coordinate (-150 to 150)
    playerTargetX: 0,
    rivalX: -50,
    rivalY: 400, // Distance progress ahead or behind
    trackProgress: 0, // Current total distance
    trackLength: isEndless ? 9999999 : 25000, 
    speed: 0,
    maxSpeed: isBoosting ? 260 : 160,
    acceleration: 0.15,
    deceleration: 0.05,
    boostActive: false,
    boostDuration: 0,
    isCrashed: false,
    crashTimer: 0,
    lastTime: 0,
    shakeDuration: 0,
    shakeIntensity: 0,
    driftScoreTimer: 0,
  });

  // Game assets / pools
  const particlePool = useRef<GridParticle[]>([]);
  const trails = useRef<TireTrail[]>([]);
  const traffic = useRef<TrafficVehicle[]>([]);
  const energyCells = useRef<EnergyCell[]>([]);
  const speedLines = useRef<{ x: number; y: number; length: number; speed: number }[]>([]);

  // Initialize Particle Pool once
  useEffect(() => {
    const pool: GridParticle[] = [];
    for (let i = 0; i < 150; i++) {
      pool.push(new GridParticle());
    }
    particlePool.current = pool;

    // Prep some initial background speedlines
    const lines = [];
    for (let i = 0; i < 25; i++) {
      lines.push({
        x: Math.random() * 400 - 200,
        y: Math.random() * 800,
        length: Math.random() * 80 + 40,
        speed: Math.random() * 15 + 15,
      });
    }
    speedLines.current = lines;

    // Start Audio
    audio.startEngine();

    return () => {
      audio.stopEngine();
    };
  }, []);

  const spawnSpark = (x: number, y: number, color: string, count = 3) => {
    let spawned = 0;
    const pool = particlePool.current;
    for (let i = 0; i < pool.length; i++) {
      if (!pool[i].active) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 2;
        pool[i].init(
          x,
          y,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed - 2, // Drift sparks fly up/back
          color,
          Math.random() * 0.03 + 0.02,
          Math.random() * 3 + 1.5
        );
        spawned++;
        if (spawned >= count) break;
      }
    }
  };

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = true;
      if (e.key === " " || e.key.toLowerCase() === "b") {
        triggerBoost();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [boostLevel]);

  // Resize Listener (Responsive Layout per guidelines)
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const updateSize = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };

    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    updateSize();

    return () => {
      observer.disconnect();
    };
  }, []);

  const triggerBoost = () => {
    if (boostLevel >= 25 && !gameStateRef.current.boostActive && !gameStateRef.current.isCrashed) {
      gameStateRef.current.boostActive = true;
      gameStateRef.current.boostDuration = 2.0; // 2 seconds
      setBoostLevel((prev) => Math.max(0, prev - 25));
      setIsBoosting(true);
      audio.playBoost();
      triggerScreenShake(12, 10);
    }
  };

  const triggerScreenShake = (intensity: number, duration: number) => {
    gameStateRef.current.shakeIntensity = intensity;
    gameStateRef.current.shakeDuration = duration;
  };

  // Touch and Mouse Controls
  const handlePointerDown = (clientX: number) => {
    isMouseDown.current = true;
    updateTargetFromClient(clientX);
  };

  const handlePointerMove = (clientX: number) => {
    if (isMouseDown.current) {
      updateTargetFromClient(clientX);
    }
  };

  const handlePointerUp = () => {
    isMouseDown.current = false;
    inputTargetXRef.current = null;
  };

  const updateTargetFromClient = (clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    // Map center of screen as 0, extremes as -150 to +150
    const ratio = (relativeX / rect.width) * 2 - 1; // -1 to 1
    inputTargetXRef.current = ratio * 180; // Allow slight drift offsets
  };

  // Core Game Loop
  useEffect(() => {
    let lastStamp = performance.now();
    let trafficIdCounter = 0;
    
    // Spawn simple traffic periodically
    const trafficInterval = setInterval(() => {
      if (gameStateRef.current.isCrashed) return;
      
      const speedFactor = gameStateRef.current.speed / 100;
      if (traffic.current.length < 5) {
        const isDrone = Math.random() > 0.6;
        const sampleColors = ["#ef4444", "#3b82f6", "#10b981", "#a855f7", "#ec4899"];
        traffic.current.push({
          id: trafficIdCounter++,
          x: (Math.random() * 3 - 1) * 80, // Pick lane
          y: -100 - Math.random() * 300, // Distance ahead
          speed: Math.random() * 4 + 2,
          lane: Math.floor(Math.random() * 3),
          color: sampleColors[Math.floor(Math.random() * sampleColors.length)],
          width: 32,
          height: 52,
          type: isDrone ? "drone" : "car",
        });
      }

      // Spawn energy pickups
      if (energyCells.current.length < 3 && Math.random() > 0.4) {
        energyCells.current.push({
          x: (Math.random() * 3 - 1) * 75,
          y: -150 - Math.random() * 400,
          active: true,
          pulse: 0,
        });
      }
    }, 1200);

    const animationLoop = (timestamp: number) => {
      const dt = (timestamp - lastStamp) / 1000;
      lastStamp = timestamp;

      const canvas = canvasRef.current;
      if (!canvas) {
        animationFrameId.current = requestAnimationFrame(animationLoop);
        return;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        animationFrameId.current = requestAnimationFrame(animationLoop);
        return;
      }

      const state = gameStateRef.current;

      // 1. INPUT PROCESSING
      let moveDir = 0;
      if (keysPressed.current["ArrowLeft"] || keysPressed.current["a"] || keysPressed.current["A"]) {
        state.playerTargetX = Math.max(-150, state.playerTargetX - 12);
        moveDir = -1;
      }
      if (keysPressed.current["ArrowRight"] || keysPressed.current["d"] || keysPressed.current["D"]) {
        state.playerTargetX = Math.min(150, state.playerTargetX + 12);
        moveDir = 1;
      }

      // Touch Override
      if (inputTargetXRef.current !== null) {
        state.playerTargetX = Math.min(150, Math.max(-150, inputTargetXRef.current));
        const deltaX = state.playerTargetX - state.playerX;
        if (Math.abs(deltaX) > 5) {
          moveDir = Math.sign(deltaX);
        }
      }

      // Smooth horizontal position interpolation
      const lerpSpeed = 0.15;
      const prevX = state.playerX;
      state.playerX += (state.playerTargetX - state.playerX) * lerpSpeed;

      // Drift detection
      const actualDx = state.playerX - prevX;
      const isDrifting = Math.abs(actualDx) > 2.5 && state.speed > 50;

      // 2. TIMERS & TIMINGS
      if (!state.isCrashed) {
        setRaceTime((prev) => prev + dt);
      }

      // 3. PHYSICAL LAWS (SPEED ENGINE)
      if (state.isCrashed) {
        state.speed = Math.max(0, state.speed - 300 * dt);
        state.crashTimer -= dt;
        if (state.crashTimer <= 0) {
          state.isCrashed = false;
        }
      } else {
        // Compute speed ceilings
        const targetMax = state.boostActive 
          ? (180 + playerRacer.stats.boost * 15) 
          : (110 + playerRacer.stats.speed * 12);

        if (state.boostActive) {
          state.speed += (targetMax - state.speed) * 0.25;
          state.boostDuration -= dt;
          if (state.boostDuration <= 0) {
            state.boostActive = false;
            setIsBoosting(false);
          }
        } else {
          // Regular flow acceleration
          state.speed += (targetMax - state.speed) * 0.08;
        }
      }

      setSpeedKmh(Math.round(state.speed));
      audio.setEngineSpeed(state.speed / 260, state.boostActive);

      // 4. LANDSCAPE SCROLLING PROGRESS
      const distanceDelta = (state.speed * dt * 2.2); // Scaling factor
      state.trackProgress += distanceDelta;
      setDistanceTraveled(Math.round(state.trackProgress));

      // Check Lap / Win Criteria
      const totalTrackLaps = track.laps;
      const currentLapProgressRaw = state.trackProgress / (state.trackLength / totalTrackLaps);
      const computedLap = Math.min(totalTrackLaps, Math.floor(currentLapProgressRaw) + 1);
      setLap(computedLap);

      if (!isEndless && state.trackProgress >= state.trackLength && !state.isCrashed) {
        // Victory!
        audio.stopEngine();
        audio.playVictory();
        onRaceComplete(marksLeft, true, timestamp / 1000);
        return;
      }

      // 5. RIVAL BEHAVIOR AI
      if (!isEndless) {
        // Rival speed adapts based on player progression to maintain high drama (Rubber-banding)
        let rivalTargetSpeed = 120 + rivalRacer.stats.speed * 8;
        if (state.boostActive) {
          rivalTargetSpeed += 40;
        }
        // Rubberband scaling: if too far behind, boost rival. If too far ahead, drag.
        const gap = state.rivalY - state.trackProgress;
        if (gap < -200) {
          rivalTargetSpeed += 60; // catch up drone
        } else if (gap > 400) {
          rivalTargetSpeed -= 45; // wait for player
        }

        state.rivalY += rivalTargetSpeed * dt * 2.2;
        // Rival weaves slightly
        state.rivalX += Math.sin(timestamp / 500) * 1.5;
        // Clamp rival on road boundary
        state.rivalX = Math.max(-120, Math.min(120, state.rivalX));
      }

      // 6. TIRE DRIFT MARKS GENERATION
      // Spawn tyre trails continuously under player backwheels when steering
      if (isDrifting && !state.isCrashed) {
        const offsetLeftX = state.playerX - 12;
        const offsetRightX = state.playerX + 12;
        const wheelY = canvas.height * 0.78; // back of car height

        trails.current.push({
          x1: offsetLeftX,
          y1: wheelY,
          x2: offsetLeftX - actualDx * 1.5,
          y2: wheelY - 14,
          alpha: 1.0,
          color: playerRacer.trailColor,
        });

        trails.current.push({
          x1: offsetRightX,
          y1: wheelY,
          x2: offsetRightX - actualDx * 1.5,
          y2: wheelY - 14,
          alpha: 1.0,
          color: playerRacer.trailColor,
        });

        // Earn Marks Left during drifts!
        const marksEarned = Math.round(Math.abs(actualDx) * (state.boostActive ? 3.0 : 1.2));
        setMarksLeft((prev) => prev + marksEarned);

        // Spawn beautiful drifting glow sparks!
        spawnSpark(offsetLeftX, wheelY, playerRacer.signatureColor, 2);
        spawnSpark(offsetRightX, wheelY, playerRacer.signatureColor, 2);
      }

      // Boost particles
      if (state.boostActive && !state.isCrashed && Math.random() > 0.2) {
        spawnSpark(state.playerX, canvas.height * 0.78, "#fffae0", 3);
        setMarksLeft((prev) => prev + 2); // Boost passive markers
      }

      // 7. PARTICLES AND DEBRIS UPDATES
      const particles = particlePool.current;
      particles.forEach((p) => {
        if (p.active) p.update();
      });

      // Update Drift trails (fade over time represent fading tire marks)
      trails.current.forEach((t) => {
        t.alpha -= 0.015; // fade rate
      });
      trails.current = trails.current.filter((t) => t.alpha > 0);

      // Traffic calculations
      traffic.current.forEach((t) => {
        // Traffic moves slower relative to screen
        t.y += (state.speed * 0.25 + t.speed) * dt * 2.2;
      });

      // Clear traffic that went past the screen limit
      traffic.current = traffic.current.filter((t) => t.y < canvas.height + 200 && t.y > -1200);

      // Energy cells update
      energyCells.current.forEach((cell) => {
        cell.y += state.speed * dt * 2.2;
        cell.pulse += dt * 4;
      });
      energyCells.current = energyCells.current.filter((c) => c.y < canvas.height + 200 && c.active);

      // Speed lines update
      speedLines.current.forEach((line) => {
        line.y += (line.speed + state.speed * 0.15);
        if (line.y > canvas.height + 100) {
          line.y = -100;
          line.x = Math.random() * (canvas.width - 100) + 50 - canvas.width / 2;
        }
      });

      // 8. COLLISION CONTROLLERS
      // Compute bounding shapes
      const playerWidth = 26;
      const playerHeight = 44;
      const playerWorldY = canvas.height * 0.75;

      // Checks overlap with traffic obstacles
      traffic.current.forEach((veh) => {
        const vehicleScreenY = veh.y; // traffic works on screen coordinates
        const dx = Math.abs(state.playerX - veh.x);
        const dy = Math.abs(playerWorldY - vehicleScreenY);

        if (dx < (playerWidth + veh.width) / 2 && dy < (playerHeight + veh.height) / 2 && !state.isCrashed) {
          // Double impact armor or blast skills bypass collisions
          if (playerRacer.id === "kira" && state.boostActive) {
            // KIRAS unique ability vaporizes cars
            veh.y = 999999; // destroy
            spawnSpark(veh.x, vehicleScreenY, "#ff007f", 12);
            triggerScreenShake(8, 6);
            setMarksLeft((prev) => prev + 250); // Massive destruction bonus
          } else if (playerRacer.id === "mako" && state.boostActive) {
            // MAKO armor shrugs off impact
            veh.y = 999999; // destroy
            spawnSpark(veh.x, vehicleScreenY, "#00ffcc", 8);
          } else {
            // Normal Crash
            state.isCrashed = true;
            state.crashTimer = 1.2; // locked
            state.speed = 10; // reduce speed violently
            audio.playCrash();
            triggerScreenShake(24, 15);
            // Spawn intensive orange/red sparks for total wreckage representation!
            for (let s = 0; s < 25; s++) {
              spawnSpark(state.playerX, playerWorldY, "#ff3c00", 25);
            }
            if (isEndless) {
              // Endless mode ends upon a high-speed collision!
              onRaceComplete(marksLeft, false, timestamp / 1000);
            }
          }
        }
      });

      // Check collision with outer boundaries (Walls)
      const roadLimitX = 145;
      if (Math.abs(state.playerX) > roadLimitX - 10 && !state.isCrashed) {
        state.playerX = Math.sign(state.playerX) * (roadLimitX - 10);
        spawnSpark(state.playerX, playerWorldY, "#ffffff", 2);
        // Reduce speed slightly
        state.speed = Math.max(20, state.speed - 150 * dt);
        setMarksLeft((prev) => Math.max(0, prev - 1)); // penalty for bad drift
      }

      // Check pick-up collision for energy cells
      energyCells.current.forEach((cell) => {
        const dx = Math.abs(state.playerX - cell.x);
        const dy = Math.abs(playerWorldY - cell.y);
        
        // MAKO signature ability auto-magnetizes energy cells from further away
        const collectionRadius = playerRacer.id === "mako" && state.boostActive ? 120 : 35;

        if (dx < collectionRadius && dy < collectionRadius && cell.active) {
          cell.active = false;
          // Collect audio, boost charge & reward
          audio.playClick();
          setBoostLevel((prev) => Math.min(100, prev + 20));
          setMarksLeft((prev) => prev + 150);
          
          // Generate visual aura explosion
          for (let p = 0; p < 8; p++) {
            spawnSpark(cell.x, cell.y, "#00ffcc", 8);
          }
        }
      });

      // 9. RENDERING PRESETS
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Parallax / Space Background according to environment
      ctx.save();
      
      // Dynamic camera offsets / Screen shake implementation
      let shakeX = 0;
      let shakeY = 0;
      if (state.shakeDuration > 0) {
        shakeX = (Math.random() - 0.5) * state.shakeIntensity;
        shakeY = (Math.random() - 0.5) * state.shakeIntensity;
        state.shakeDuration--;
      }
      ctx.translate(shakeX, shakeY);

      // Environment Renderers (Downtown / Highway / Rooftop Space backgrounds)
      const cx = canvas.width / 2;
      
      // Cyber sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      if (track.environmentType === "downtown") {
        skyGrad.addColorStop(0, "#010105");
        skyGrad.addColorStop(1, "#0a051d");
      } else if (track.environmentType === "highway") {
        skyGrad.addColorStop(0, "#00000a");
        skyGrad.addColorStop(1, "#030e22");
      } else {
        skyGrad.addColorStop(0, "#0c010c");
        skyGrad.addColorStop(1, "#010103");
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Background Grids / Parallax Pillars
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(0, 212, 255, 0.05)";
      const gridYOffset = (state.trackProgress * 0.15) % 40;
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y + gridYOffset);
        ctx.lineTo(canvas.width, y + gridYOffset);
        ctx.stroke();
      }

      // Draw background space lines representing warp/hyper speed
      speedLines.current.forEach((line) => {
        ctx.strokeStyle = state.boostActive ? "rgba(255,0,127,0.12)" : "rgba(0, 212, 255, 0.08)";
        ctx.lineWidth = state.boostActive ? 2 : 1;
        ctx.beginPath();
        const worldX = cx + line.x;
        ctx.moveTo(worldX, line.y);
        ctx.lineTo(worldX, line.y + line.length);
        ctx.stroke();
      });

      // 10. DRAW ROADWAYS & BORDERS
      // Perspective drawing: central clean tube
      const roadWidth = 280;
      
      // Road Surface
      ctx.fillStyle = "#0c0d16";
      ctx.fillRect(cx - roadWidth / 2, 0, roadWidth, canvas.height);

      // Road grid pattern (moving)
      const dividerOffset = (state.trackProgress * 3.5) % 80;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 2;
      for (let y = -80; y < canvas.height + 80; y += 80) {
        ctx.beginPath();
        ctx.moveTo(cx - roadWidth / 2, y + dividerOffset);
        ctx.lineTo(cx + roadWidth / 2, y + dividerOffset);
        ctx.stroke();
      }

      // Outer Neon Barriers (Glows!)
      const barrierColor = track.environmentType === "rooftops" ? "#ff007f" : "#00ffcc";
      ctx.strokeStyle = barrierColor;
      ctx.lineWidth = 4;
      ctx.shadowBlur = 12;
      ctx.shadowColor = barrierColor;

      // Draw Left Border Wall
      ctx.beginPath();
      ctx.moveTo(cx - roadWidth / 2, 0);
      ctx.lineTo(cx - roadWidth / 2, canvas.height);
      ctx.stroke();

      // Draw Right Border Wall
      ctx.beginPath();
      ctx.moveTo(cx + roadWidth / 2, 0);
      ctx.lineTo(cx + roadWidth / 2, canvas.height);
      ctx.stroke();
      ctx.shadowBlur = 0; // reset

      // Draw Center white dashed lines
      ctx.strokeStyle = "rgba(255, 212, 255, 0.45)";
      ctx.lineWidth = 4;
      ctx.setLineDash([25, 35]);
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash

      // 11. DRAW DRIFT TRAILS ON ROAD
      trails.current.forEach((trail) => {
        ctx.save();
        ctx.globalAlpha = trail.alpha;
        ctx.lineWidth = 5;
        ctx.strokeStyle = trail.color;
        ctx.lineCap = "round";
        ctx.shadowBlur = 15;
        ctx.shadowColor = trail.color;
        ctx.beginPath();
        ctx.moveTo(cx + trail.x1, trail.y1);
        ctx.lineTo(cx + trail.x2, trail.y2);
        ctx.stroke();
        ctx.restore();
      });

      // 12. DRAW ENERGY PICKUP CELLS
      energyCells.current.forEach((cell) => {
        if (!cell.active) return;
        ctx.save();
        const sinSize = 10 + Math.sin(cell.pulse) * 3;
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#e2f413";
        ctx.fillStyle = "#e2f413";
        const cellScreenX = cx + cell.x;
        
        ctx.beginPath();
        // Star diamond shape
        ctx.moveTo(cellScreenX, cell.y - sinSize);
        ctx.lineTo(cellScreenX + sinSize, cell.y);
        ctx.lineTo(cellScreenX, cell.y + sinSize);
        ctx.lineTo(cellScreenX - sinSize, cell.y);
        ctx.closePath();
        ctx.fill();

        // Inner glowing core
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(cellScreenX, cell.y, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });

      // 13. DRAW RIVAL / COMPETITOR RACER (If within range)
      if (!isEndless) {
        const rivalScreenY = playerWorldY + (state.trackProgress - state.rivalY);
        // Only render if physically visible on the active viewscreen
        if (rivalScreenY > -100 && rivalScreenY < canvas.height + 100) {
          ctx.save();
          ctx.translate(cx + state.rivalX, rivalScreenY);
          
          // Draw simple sci-fi rival car body
          ctx.fillStyle = rivalRacer.signatureColor;
          // Removed glow for competitor vehicle to respect visual restraint
          
          // Outer shell
          ctx.beginPath();
          ctx.moveTo(-14, -20);
          ctx.lineTo(14, -20);
          ctx.lineTo(19, 15);
          ctx.lineTo(13, 24);
          ctx.lineTo(-13, 24);
          ctx.lineTo(-19, 15);
          ctx.closePath();
          ctx.fill();

          // Glass canopy overlay
          ctx.fillStyle = "#0c0c16";
          ctx.fillRect(-8, -10, 16, 12);
          ctx.fillStyle = "#ff5599";
          ctx.fillRect(-6, -8, 12, 4);

          // Rival Hover Thrusters (Yellow pulsing)
          ctx.fillStyle = "#e2f413";
          ctx.fillRect(-17, 18, 5, 8);
          ctx.fillRect(12, 18, 5, 8);

          // Name Tag Banner label
          ctx.restore();
          ctx.save();
          ctx.font = "bold 9px var(--font-orbitron)";
          ctx.fillStyle = "#ffffff";
          ctx.textAlign = "center";
          ctx.fillStyle = rivalRacer.signatureColor;
          ctx.fillText(`RIVAL: ${rivalRacer.alias}`, cx + state.rivalX, rivalScreenY - 32);
          ctx.restore();
        }
      }

      // 14. DRAW OBSTACLES / TRAFFIC
      traffic.current.forEach((veh) => {
        ctx.save();
        ctx.translate(cx + veh.x, veh.y);

        // Styling the vehicle bodies
        ctx.fillStyle = veh.color;
        // Removed glow shadow for obstacles to create crisp contrast

        ctx.beginPath();
        if (veh.type === "drone") {
          // Sharp hex geometry
          ctx.moveTo(0, -18);
          ctx.lineTo(15, -6);
          ctx.lineTo(15, 12);
          ctx.lineTo(-15, 12);
          ctx.lineTo(-15, -6);
          ctx.closePath();
          ctx.fill();

          // Pulsating sensor light
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(0, -4, 4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Standard civilian car/truck rectangular rounded shell
          ctx.roundRect(-15, -24, 30, 48, 4);
          ctx.fill();

          // Black windows
          ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
          ctx.roundRect(-11, -12, 22, 15, 2);
          ctx.fill();

          // Red taillights
          ctx.fillStyle = "#ff0000";
          ctx.fillRect(-12, 20, 5, 3);
          ctx.fillRect(7, 20, 5, 3);
        }

        ctx.restore();
      });

      // 15. DRAW ACTIVE DRIVER (PLAYER)
      if (!state.isCrashed) {
        ctx.save();
        ctx.translate(cx + state.playerX, playerWorldY);

        // Steering dynamic rotation tilt
        const targetRotation = Math.min(0.20, Math.max(-0.20, actualDx * 0.05));
        ctx.rotate(targetRotation);

        // Thruster sparks glow under engine
        const thrusterColor = state.boostActive ? "#ffaa00" : playerRacer.signatureColor;
        ctx.fillStyle = thrusterColor;
        // Only glow when actually boosting or overcharged!
        ctx.shadowBlur = state.boostActive ? 15 : 0;
        ctx.shadowColor = thrusterColor;

        // Draw Player Ship shell
        ctx.beginPath();
        // Sleek sharp forward nose
        ctx.moveTo(0, -25);
        // Front right wing
        ctx.lineTo(16, -10);
        // Back right stabilizer
        ctx.lineTo(17, 20);
        ctx.lineTo(12, 25);
        // Custom exhaust gap
        ctx.lineTo(5, 22);
        ctx.lineTo(-5, 22);
        ctx.lineTo(-12, 25);
        // Back left stabilizer
        ctx.lineTo(-17, 20);
        // Front left wing
        ctx.lineTo(-16, -10);
        ctx.closePath();
        ctx.fill();

        // Canopy Glass glassmorphism style
        ctx.fillStyle = "#020205";
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.lineTo(8, -2);
        ctx.lineTo(6, 12);
        ctx.lineTo(-6, 12);
        ctx.lineTo(-8, -2);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = playerRacer.signatureColor;
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();

        // Thruster fire plumes
        const plumeHeight = 10 + (state.speed / 10) + (state.boostActive ? 15 : 0);
        ctx.strokeStyle = thrusterColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-6, 22);
        ctx.lineTo(-6, 22 + plumeHeight);
        ctx.moveTo(6, 22);
        ctx.lineTo(6, 22 + plumeHeight);
        ctx.stroke();

        ctx.restore();
      } else {
        // Crash state indicators: spin details
        ctx.save();
        ctx.translate(cx + state.playerX, playerWorldY);
        ctx.rotate(timestamp / 60);
        ctx.fillStyle = "#ef4444";
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#ff0000";
        // Wreckage silhouette
        ctx.fillRect(-15, -15, 30, 30);
        ctx.restore();

        // Floating crash tag
        ctx.save();
        ctx.font = "bold 13px var(--font-orbitron)";
        ctx.fillStyle = "#ef4444";
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#ef4444";
        ctx.textAlign = "center";
        ctx.fillText("CRASH LOGGED!", cx + state.playerX, playerWorldY - 45);
        ctx.restore();
      }

      // 16. DRAW PARTICLES
      particles.forEach((p) => {
        if (p.active) p.draw(ctx);
      });

      // 17. HUD DISPLAY OVERLAY (Drawn directly on canvas margins for high game look)
      // Subtle top banner details
      ctx.fillStyle = "rgba(5, 5, 12, 0.4)";
      ctx.fillRect(0, 0, canvas.width, 42);

      // Chapter Progression Line (Minimap representation)
      if (!isEndless) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
        ctx.fillRect(15, 34, canvas.width - 30, 4);

        // Player point tracker
        const playerPct = Math.min(1.0, state.trackProgress / state.trackLength);
        ctx.fillStyle = playerRacer.signatureColor;
        ctx.fillRect(15, 34, (canvas.width - 30) * playerPct, 4);

        // Rival point tracker
        const rivalPct = Math.min(1.0, state.rivalY / state.trackLength);
        ctx.fillStyle = "#e2f413";
        ctx.beginPath();
        ctx.arc(15 + (canvas.width - 30) * rivalPct, 36, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore(); // finish rendering frame
      
      animationFrameId.current = requestAnimationFrame(animationLoop);
    };

    animationFrameId.current = requestAnimationFrame(animationLoop);

    return () => {
      clearInterval(trafficInterval);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [marksLeft, boostLevel, isEndless]);

  // Clean-up loop upon exit request
  const handleKeyboardExit = () => {
    audio.stopEngine();
    onExit();
  };

  return (
    <div
      ref={containerRef}
      id="game-canvas-container"
      className="relative w-full h-full aspect-auto flex flex-col justify-end overflow-hidden"
      onTouchStart={(e) => handlePointerDown(e.touches[0].clientX)}
      onTouchMove={(e) => handlePointerMove(e.touches[0].clientX)}
      onTouchEnd={handlePointerUp}
      onMouseDown={(e) => handlePointerDown(e.clientX)}
      onMouseMove={(e) => handlePointerMove(e.clientX)}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
    >
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full touch-none" />

      {/* 2026 Sleek HUD Overlays -- Clean Glassmorphism Panels layered on top of canvas */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center pointer-events-none">
        {/* Left Side: Score of Marks Left (Core Mechanic) */}
        <div className="glass-panel px-4 py-2 rounded-xl flex flex-col pointer-events-auto border-cyan-500/10">
          <span className="font-mono text-[9px] tracking-widest text-[#00D4FF]">MARKS LEFT</span>
          <span className="font-orbitron font-extrabold text-2xl text-white tracking-wider glow-cyan-sm">
            {marksLeft.toLocaleString()}
          </span>
        </div>

        {/* Info panel in center showing lap or distance */}
        <div className="glass-panel px-4 py-1.5 rounded-xl flex items-center gap-4 pointer-events-auto border-white/5 font-orbitron">
          {!isEndless ? (
            <div className="flex flex-col items-center">
              <span className="text-[8px] text-gray-500 tracking-wider">LAP</span>
              <span className="text-sm font-bold text-white">
                {lap} <span className="text-gray-500 text-[10px]">/ {track.laps}</span>
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-[8px] text-zinc-500 tracking-wider">ENDLESS RUN</span>
              <span className="text-xs font-bold text-emerald-400">Survival</span>
            </div>
          )}
          <div className="h-6 w-[1px] bg-white/10" />
          <div className="flex flex-col items-center">
            <span className="text-[8px] text-gray-500 tracking-wider">TIME</span>
            <span className="text-sm font-mono text-zinc-100">{raceTime.toFixed(1)}s</span>
          </div>
        </div>

        {/* Exit Button */}
        <button
          onClick={handleKeyboardExit}
          className="glass-panel px-3 py-2 rounded-xl text-xs font-orbitron text-zinc-400 hover:text-white pointer-events-auto transition-colors"
        >
          QUIT
        </button>
      </div>

      {/* Massive bottom overlay panel */}
      <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end pointer-events-none select-none">
        {/* Speedometer panel */}
        <div className="glass-panel px-4 py-2.5 rounded-2xl flex flex-col pointer-events-auto font-orbitron w-36 border-white/5">
          <div className="flex justify-between items-baseline">
            <span className="text-[9px] text-[#00D4FF]">SPEED</span>
            <span className="text-[8px] text-zinc-500 font-mono">2026 TYPE</span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`text-4xl font-black tracking-tighter ${isBoosting ? "text-pink-500" : "text-white"}`}>
              {speedKmh}
            </span>
            <span className="text-[10px] text-zinc-400">KM/H</span>
          </div>
          {/* Subtle Speedometer linear graph */}
          <div className="w-full bg-white/5 h-[3px] rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-75 ${isBoosting ? "bg-cyan-400" : "bg-[#ff007f]"}`}
              style={{ width: `${Math.min(100, (speedKmh / 240) * 100)}%` }}
            />
          </div>
        </div>

        {/* Large Boost Button overlaying right quadrant */}
        <div className="flex flex-col items-center gap-2 pointer-events-auto">
          {/* Circular Boost button */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              triggerBoost();
            }}
            onClick={triggerBoost}
            className={`w-20 h-20 rounded-full flex flex-col justify-center items-center border transition-all pointer-events-auto ${
              boostLevel >= 25
                ? "bg-gradient-to-tr from-cyan-600/60 to-pink-600/60 border-cyan-400 animate-pulse active:scale-95 shadow-[0_0_20px_rgba(0,212,255,0.4)]"
                : "bg-white/5 border-white/10 opacity-40 cursor-not-allowed"
            }`}
          >
            <span className="font-orbitron text-[9px] font-black tracking-widest text-[#00D4FF]">BOOST</span>
            <span className="font-mono text-xs font-black text-white mt-1">
              {boostLevel >= 25 ? "READY" : `${Math.round(boostLevel)}%`}
            </span>
          </button>

          {/* Boost level sub-bar */}
          <div className="w-24 bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/5 flex">
            {/* Split bars of 25% for visual rhythm */}
            {[0, 1, 2, 3].map((idx) => {
              const chargeLevel = Math.max(0, Math.min(25, boostLevel - idx * 25));
              const pct = (chargeLevel / 25) * 100;
              return (
                <div key={idx} className="flex-1 border-r border-[#050508]:last:border-0 h-full bg-white/5">
                  <div
                    className="h-full bg-gradient-to-r from-[#00D4FF] to-fuchsia-500 transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Screen Controls Hint Overlay for first 3 seconds */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-center flex flex-col gap-1 items-center animate-fade-out font-orbitron">
        <span className="text-[10px] text-[#00D4FF] tracking-widest">TOUCH DRAG LEFT & RIGHT</span>
        <span className="text-[8px] text-gray-500 uppercase tracking-widest">Or Use Keyboard Arrow Keys</span>
      </div>
    </div>
  );
}
