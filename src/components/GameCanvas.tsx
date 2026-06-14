/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Racer, Track } from "../types";
import { audio } from "../utils/audio";
import { HELMETS } from "../data";

interface GameCanvasProps {
  playerRacer: Racer;
  rivalRacer: Racer;
  track: Track;
  isEndless: boolean;
  selectedHelmet?: string;
  onRaceComplete: (marks: number, isVictory: boolean, timeSec: number) => void;
  onExit: () => void;
}

// 3D Particle Structure
interface Spark3D {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  active: boolean;
}

// 3D Drift Trail Segment
interface TrailSegment3D {
  mesh: THREE.Mesh;
  zPos: number; // relative Z coordinate
  life: number;
  active: boolean;
}

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
  selectedHelmet = "standard",
  onRaceComplete,
  onExit,
}: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const traffic = useRef<TrafficVehicle[]>([]);
  const energyCells = useRef<EnergyCell[]>([]);

  // States for live rendering
  const [marksLeft, setMarksLeft] = useState<number>(0);
  const [boostLevel, setBoostLevel] = useState<number>(30); // 0 to 100
  const [speedKmh, setSpeedKmh] = useState<number>(0);
  const [isBoosting, setIsBoosting] = useState<boolean>(false);
  const [lap, setLap] = useState<number>(1);
  const [raceTime, setRaceTime] = useState<number>(0);

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
    maxSpeed: 160,
    acceleration: 0.15,
    deceleration: 0.05,
    boostActive: false,
    boostDuration: 0,
    isCrashed: false,
    crashTimer: 0,
    lastTime: 0,
    shakeDuration: 0,
    shakeIntensity: 0,
  });

  // Track settings mapping
  const barrierColorStr = track.environmentType === "rooftops" ? "#ff007f" : track.environmentType === "highway" ? "#00ffcc" : "#00D4FF";
  const barrierColor = new THREE.Color(barrierColorStr);

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

  const triggerBoost = () => {
    const state = gameStateRef.current;
    if (boostLevel >= 25 && !state.boostActive && !state.isCrashed) {
      state.boostActive = true;
      state.boostDuration = 2.0; // 2 seconds
      setBoostLevel((prev) => Math.max(0, prev - 25));
      setIsBoosting(true);
      audio.playBoost();
      triggerScreenShake(8, 12);
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
    const ratio = (relativeX / rect.width) * 2 - 1; // -1 to 1
    inputTargetXRef.current = ratio * 180;
  };

  // 3D Game Engine Loop & Asset Hookup
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // 1. SETUP THREE.JS SCENE & RENDERER
    const width = container.clientWidth;
    const height = container.clientHeight;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050508);
    scene.fog = new THREE.FogExp2(0x050508, 0.0035);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 6, 14);

    // 2. LIGHTING SETUP
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(0, 40, -100);
    scene.add(dirLight);

    // Additional neon city ambient light
    const pointLight = new THREE.PointLight(barrierColor, 1.5, 80);
    pointLight.position.set(0, 10, -30);
    scene.add(pointLight);

    // 3. INFINITE ROAD TILES
    // Width of road: 46 units. Length of tile: 200 units.
    const roadGroup = new THREE.Group();
    scene.add(roadGroup);

    const roadTiles: THREE.Group[] = [];
    const roadLength = 200;
    const numRoadTiles = 4;

    const createRoadTile = (zPos: number) => {
      const tile = new THREE.Group();
      tile.position.z = zPos;

      // Asphalt
      const asphaltGeom = new THREE.PlaneGeometry(46, roadLength);
      const asphaltMat = new THREE.MeshStandardMaterial({
        color: 0x0a0a10,
        roughness: 0.8,
        metalness: 0.1,
      });
      const asphalt = new THREE.Mesh(asphaltGeom, asphaltMat);
      asphalt.rotation.x = -Math.PI / 2;
      tile.add(asphalt);

      // Neon Left Barrier
      const barrierGeom = new THREE.BoxGeometry(0.5, 1.2, roadLength);
      const barrierMat = new THREE.MeshStandardMaterial({
        color: barrierColor,
        emissive: barrierColor,
        emissiveIntensity: 1.0,
      });
      const leftBarrier = new THREE.Mesh(barrierGeom, barrierMat);
      leftBarrier.position.set(-23, 0.6, 0);
      tile.add(leftBarrier);

      // Neon Right Barrier
      const rightBarrier = new THREE.Mesh(barrierGeom, barrierMat);
      rightBarrier.position.set(23, 0.6, 0);
      tile.add(rightBarrier);

      // Central dashed stripes
      const lineGeom = new THREE.PlaneGeometry(0.3, 8);
      const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.35, transparent: true });
      for (let zOffset = -roadLength / 2; zOffset < roadLength / 2; zOffset += 24) {
        const line = new THREE.Mesh(lineGeom, lineMat);
        line.rotation.x = -Math.PI / 2;
        line.position.set(0, 0.02, zOffset + 12);
        tile.add(line);
      }

      roadGroup.add(tile);
      roadTiles.push(tile);
    };

    for (let i = 0; i < numRoadTiles; i++) {
      createRoadTile(-i * roadLength);
    }

    // 4. PARALLAX CITY ENVIRONMENT BUILDINGS
    const buildingsGroup = new THREE.Group();
    scene.add(buildingsGroup);

    interface Building3D {
      mesh: THREE.Mesh;
      initialX: number;
    }
    const buildings: Building3D[] = [];
    const numBuildings = 20;

    for (let i = 0; i < numBuildings; i++) {
      const bHeight = 40 + Math.random() * 80;
      const bWidth = 10 + Math.random() * 20;
      const bDepth = 10 + Math.random() * 20;
      const bGeom = new THREE.BoxGeometry(bWidth, bHeight, bDepth);
      const bMat = new THREE.MeshStandardMaterial({
        color: 0x07070f,
        roughness: 0.9,
        metalness: 0.1,
      });
      const bMesh = new THREE.Mesh(bGeom, bMat);

      // Glowing edges wireframe outline for cyber style
      const edges = new THREE.EdgesGeometry(bGeom);
      const lineMat = new THREE.LineBasicMaterial({
        color: playerRacer.signatureColor,
        opacity: 0.15,
        transparent: true,
      });
      const wireframe = new THREE.LineSegments(edges, lineMat);
      bMesh.add(wireframe);

      // Placement
      const side = Math.random() > 0.5 ? 1 : -1;
      const xOffset = side * (35 + Math.random() * 60);
      const zOffset = -Math.random() * 650;
      bMesh.position.set(xOffset, bHeight / 2 - 2, zOffset);

      buildingsGroup.add(bMesh);
      buildings.push({ mesh: bMesh, initialX: xOffset });
    }

    // 5. SPEED LINES
    const speedLinesGroup = new THREE.Group();
    scene.add(speedLinesGroup);

    const speedLinesArr: THREE.Line[] = [];
    const numSpeedLines = 30;
    const speedLineGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 8),
    ]);
    const speedLineMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      opacity: 0.12,
      transparent: true,
    });

    for (let i = 0; i < numSpeedLines; i++) {
      const line = new THREE.Line(speedLineGeom, speedLineMat);
      line.position.set(
        (Math.random() - 0.5) * 80,
        Math.random() * 12 + 0.5,
        -Math.random() * 300
      );
      speedLinesGroup.add(line);
      speedLinesArr.push(line);
    }

    // 6. PLAYER SHIP MESH MODEL (sleek and stylized spaceship)
    const playerGroup = new THREE.Group();
    scene.add(playerGroup);

    const mainColor = new THREE.Color(playerRacer.signatureColor);
    const helmetColorStr = HELMETS.find((h) => h.id === selectedHelmet)?.glowColor || playerRacer.signatureColor;
    const helmetColor = new THREE.Color(helmetColorStr);

    // Fuselage
    const fuseGeom = new THREE.ConeGeometry(0.7, 3.2, 5);
    const shipMat = new THREE.MeshStandardMaterial({
      color: mainColor,
      roughness: 0.2,
      metalness: 0.8,
    });
    const fuselage = new THREE.Mesh(fuseGeom, shipMat);
    fuselage.rotation.x = -Math.PI / 2;
    playerGroup.add(fuselage);

    // Left Wing
    const leftWingGeom = new THREE.BoxGeometry(1.6, 0.08, 1.2);
    const leftWing = new THREE.Mesh(leftWingGeom, shipMat);
    leftWing.position.set(-1.0, -0.1, 0.4);
    leftWing.rotation.y = 0.2;
    leftWing.rotation.z = 0.1;
    playerGroup.add(leftWing);

    // Right Wing
    const rightWingGeom = new THREE.BoxGeometry(1.6, 0.08, 1.2);
    const rightWing = new THREE.Mesh(rightWingGeom, shipMat);
    rightWing.position.set(1.0, -0.1, 0.4);
    rightWing.rotation.y = -0.2;
    rightWing.rotation.z = -0.1;
    playerGroup.add(rightWing);

    // Cockpit Visor (reflecting the selected helmet color!)
    const visorGeom = new THREE.SphereGeometry(0.35, 12, 12);
    const visorMat = new THREE.MeshStandardMaterial({
      color: helmetColor,
      emissive: helmetColor,
      emissiveIntensity: 0.8,
      roughness: 0.05,
      metalness: 0.95,
    });
    const visor = new THREE.Mesh(visorGeom, visorMat);
    visor.scale.set(1, 0.6, 1.8);
    visor.position.set(0, 0.35, -0.4);
    playerGroup.add(visor);

    // Exhaust Cylinders
    const exhGeom = new THREE.CylinderGeometry(0.2, 0.2, 0.5, 6);
    const exhMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.7 });
    const exhL = new THREE.Mesh(exhGeom, exhMat);
    exhL.position.set(-0.35, -0.12, 1.4);
    exhL.rotation.x = -Math.PI / 2;
    playerGroup.add(exhL);

    const exhR = new THREE.Mesh(exhGeom, exhMat);
    exhR.position.set(0.35, -0.12, 1.4);
    exhR.rotation.x = -Math.PI / 2;
    playerGroup.add(exhR);

    // Glowing plume cones
    const plumeGeom = new THREE.ConeGeometry(0.18, 0.9, 5);
    const plumeMat = new THREE.MeshBasicMaterial({ color: helmetColor });
    const plumeL = new THREE.Mesh(plumeGeom, plumeMat);
    plumeL.position.set(-0.35, -0.12, 1.9);
    plumeL.rotation.x = Math.PI / 2;
    playerGroup.add(plumeL);

    const plumeR = new THREE.Mesh(plumeGeom, plumeMat);
    plumeR.position.set(0.35, -0.12, 1.9);
    plumeR.rotation.x = Math.PI / 2;
    playerGroup.add(plumeR);

    // Initial position
    playerGroup.position.set(0, 0.6, 0);

    // 7. RIVAL SHIP MESH MODEL (if not endless mode)
    let rivalGroup: THREE.Group | null = null;
    if (!isEndless) {
      rivalGroup = new THREE.Group();
      scene.add(rivalGroup);

      const rivalColor = new THREE.Color(rivalRacer.signatureColor);
      const rivalFuse = new THREE.Mesh(fuseGeom, new THREE.MeshStandardMaterial({
        color: rivalColor,
        roughness: 0.2,
        metalness: 0.8,
      }));
      rivalFuse.rotation.x = -Math.PI / 2;
      rivalGroup.add(rivalFuse);

      const rivalL = new THREE.Mesh(leftWingGeom, new THREE.MeshStandardMaterial({ color: rivalColor }));
      rivalL.position.set(-1.0, -0.1, 0.4);
      rivalL.rotation.y = 0.2;
      rivalL.rotation.z = 0.1;
      rivalGroup.add(rivalL);

      const rivalR = new THREE.Mesh(rightWingGeom, new THREE.MeshStandardMaterial({ color: rivalColor }));
      rivalR.position.set(1.0, -0.1, 0.4);
      rivalR.rotation.y = -0.2;
      rivalR.rotation.z = -0.1;
      rivalGroup.add(rivalR);

      // Rival Visor
      const rivalVisor = new THREE.Mesh(visorGeom, new THREE.MeshStandardMaterial({
        color: rivalColor,
        emissive: rivalColor,
        emissiveIntensity: 0.6,
        roughness: 0.1,
      }));
      rivalVisor.scale.set(1, 0.6, 1.8);
      rivalVisor.position.set(0, 0.35, -0.4);
      rivalGroup.add(rivalVisor);

      rivalGroup.position.set(0, 0.6, -100);
    }

    // 8. TRAFFIC MESHES MAP
    const trafficMeshes = new Map<number, THREE.Group>();

    const createTrafficMesh = (type: "car" | "drone" | "truck", colorHex: string) => {
      const group = new THREE.Group();
      const col = new THREE.Color(colorHex);

      if (type === "drone") {
        const geom = new THREE.OctahedronGeometry(1.0, 0);
        const mat = new THREE.MeshStandardMaterial({
          color: col,
          emissive: col,
          emissiveIntensity: 0.6,
          roughness: 0.3,
        });
        const mesh = new THREE.Mesh(geom, mat);
        group.add(mesh);

        const ringGeom = new THREE.TorusGeometry(1.1, 0.08, 8, 16);
        const ringMat = new THREE.MeshStandardMaterial({ color: 0x4b5563, roughness: 0.5 });
        const ring = new THREE.Mesh(ringGeom, ringMat);
        ring.rotation.x = Math.PI / 2;
        group.add(ring);
      } else {
        // Hovercraft car boxy shapes
        const geom = new THREE.BoxGeometry(1.8, 0.8, 3.4);
        const mat = new THREE.MeshStandardMaterial({
          color: col,
          roughness: 0.5,
          metalness: 0.4,
        });
        const body = new THREE.Mesh(geom, mat);
        group.add(body);

        // Windshield
        const glassGeom = new THREE.BoxGeometry(1.4, 0.35, 1.2);
        const glassMat = new THREE.MeshStandardMaterial({ color: 0x111116, roughness: 0.1 });
        const glass = new THREE.Mesh(glassGeom, glassMat);
        glass.position.set(0, 0.4, -0.2);
        group.add(glass);

        // Headlights
        const headG = new THREE.BoxGeometry(0.25, 0.12, 0.08);
        const headM = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const hl = new THREE.Mesh(headG, headM);
        hl.position.set(-0.65, -0.05, -1.7);
        group.add(hl);
        const hr = new THREE.Mesh(headG, headM);
        hr.position.set(0.65, -0.05, -1.7);
        group.add(hr);

        // Taillights
        const tailG = new THREE.BoxGeometry(0.25, 0.12, 0.08);
        const tailM = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const tl = new THREE.Mesh(tailG, tailM);
        tl.position.set(-0.65, -0.05, 1.7);
        group.add(tl);
        const tr = new THREE.Mesh(tailG, tailM);
        tr.position.set(0.65, -0.05, 1.7);
        group.add(tr);
      }

      scene.add(group);
      return group;
    };

    // 9. ENERGY CELL PICKUPS MAP
    const energyMeshes = new Map<number, THREE.Mesh>();
    const pickupGeom = new THREE.OctahedronGeometry(0.7, 0);
    const pickupMat = new THREE.MeshStandardMaterial({
      color: 0xe2f413,
      emissive: 0xe2f413,
      emissiveIntensity: 1.0,
      roughness: 0.1,
    });

    // 10. 3D SPARK PARTICLES POOL
    const maxSparks = 80;
    const sparksPool: Spark3D[] = [];
    const sparkGeom = new THREE.BoxGeometry(0.2, 0.2, 0.2);

    for (let i = 0; i < maxSparks; i++) {
      const sparkMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 1.0,
      });
      const mesh = new THREE.Mesh(sparkGeom, sparkMat);
      mesh.visible = false;
      scene.add(mesh);
      sparksPool.push({
        mesh,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 0,
        maxLife: 1.0,
        active: false,
      });
    }

    const triggerSparks3D = (x: number, y: number, z: number, colorStr: string, count = 2) => {
      let triggered = 0;
      const col = new THREE.Color(colorStr);
      for (let i = 0; i < maxSparks; i++) {
        if (!sparksPool[i].active) {
          const spark = sparksPool[i];
          spark.mesh.position.set(x, y, z);
          (spark.mesh.material as THREE.MeshBasicMaterial).color = col;
          spark.mesh.visible = true;
          spark.vx = (Math.random() - 0.5) * 12;
          spark.vy = Math.random() * 8 + 1;
          spark.vz = Math.random() * 15 + 10; // fly backwards
          spark.life = 0.6 + Math.random() * 0.4;
          spark.maxLife = spark.life;
          spark.active = true;

          triggered++;
          if (triggered >= count) break;
        }
      }
    };

    // 11. DRIFT TRAILS POOL
    const maxTrails = 150;
    const trailsPool: TrailSegment3D[] = [];
    const trailGeom = new THREE.PlaneGeometry(0.35, 2.5);

    for (let i = 0; i < maxTrails; i++) {
      const tMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(playerRacer.trailColor),
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
      });
      const tMesh = new THREE.Mesh(trailGeom, tMat);
      tMesh.rotation.x = -Math.PI / 2;
      tMesh.visible = false;
      scene.add(tMesh);

      trailsPool.push({
        mesh: tMesh,
        zPos: 0,
        life: 0,
        active: false,
      });
    }

    const spawnTrailSegment3D = (x: number, z: number) => {
      for (let i = 0; i < maxTrails; i++) {
        if (!trailsPool[i].active) {
          const trail = trailsPool[i];
          trail.mesh.position.set(x, 0.03, z);
          trail.mesh.visible = true;
          trail.life = 1.0;
          trail.active = true;
          break;
        }
      }
    };

    // 12. RUNNING TIMING VARIABLES
    let lastStamp = performance.now();
    let trafficIdCounter = 0;
    const playerWorldY = 600 * 0.75; // screen Y target logic coordinate

    // Spawn logical elements periodically
    const logicInterval = setInterval(() => {
      const state = gameStateRef.current;
      if (state.isCrashed) return;

      const trafficArr = traffic.current;
      if (trafficArr.length < 5) {
        const isDrone = Math.random() > 0.65;
        const sampleColors = ["#ef4444", "#3b82f6", "#10b981", "#a855f7", "#ec4899"];
        trafficArr.push({
          id: trafficIdCounter++,
          x: (Math.random() * 3 - 1) * 80,
          y: -100 - Math.random() * 300,
          speed: Math.random() * 3 + 2.5,
          lane: Math.floor(Math.random() * 3),
          color: sampleColors[Math.floor(Math.random() * sampleColors.length)],
          width: 32,
          height: 52,
          type: isDrone ? "drone" : "car",
        });
      }

      const cellArr = energyCells.current;
      if (cellArr.length < 3 && Math.random() > 0.45) {
        cellArr.push({
          x: (Math.random() * 3 - 1) * 75,
          y: -150 - Math.random() * 400,
          active: true,
          pulse: 0,
        });
      }
    }, 1100);

    // Audio Engine
    audio.startEngine();

    // 13. ANIMATION RENDERING LOOP
    const animationLoop = (timestamp: number) => {
      const dt = Math.min((timestamp - lastStamp) / 1000, 0.1);
      lastStamp = timestamp;

      const state = gameStateRef.current;

      // --- LOGIC CALCULATIONS ---
      // A. Input controls
      let moveDir = 0;
      if (keysPressed.current["ArrowLeft"] || keysPressed.current["a"] || keysPressed.current["A"]) {
        state.playerTargetX = Math.max(-150, state.playerTargetX - 12);
        moveDir = -1;
      }
      if (keysPressed.current["ArrowRight"] || keysPressed.current["d"] || keysPressed.current["D"]) {
        state.playerTargetX = Math.min(150, state.playerTargetX + 12);
        moveDir = 1;
      }

      if (inputTargetXRef.current !== null) {
        state.playerTargetX = Math.min(150, Math.max(-150, inputTargetXRef.current));
        const deltaX = state.playerTargetX - state.playerX;
        if (Math.abs(deltaX) > 5) {
          moveDir = Math.sign(deltaX);
        }
      }

      const prevX = state.playerX;
      state.playerX += (state.playerTargetX - state.playerX) * 0.16;
      const actualDx = state.playerX - prevX;
      const isDrifting = Math.abs(actualDx) > 2.5 && state.speed > 50;

      if (!state.isCrashed) {
        setRaceTime((prev) => prev + dt);
      }

      // B. Physical Speed calculations
      if (state.isCrashed) {
        state.speed = Math.max(0, state.speed - 320 * dt);
        state.crashTimer -= dt;
        if (state.crashTimer <= 0) {
          state.isCrashed = false;
        }
      } else {
        const targetMax = state.boostActive 
          ? (180 + playerRacer.stats.boost * 15) 
          : (110 + playerRacer.stats.speed * 12);

        if (state.boostActive) {
          state.speed += (targetMax - state.speed) * 0.28;
          state.boostDuration -= dt;
          if (state.boostDuration <= 0) {
            state.boostActive = false;
            setIsBoosting(false);
          }
        } else {
          state.speed += (targetMax - state.speed) * 0.08;
        }
      }

      setSpeedKmh(Math.round(state.speed));
      audio.setEngineSpeed(state.speed / 260, state.boostActive);

      const distanceDelta = (state.speed * dt * 2.2);
      state.trackProgress += distanceDelta;

      // Lap calculations
      const currentLapProgressRaw = state.trackProgress / (state.trackLength / track.laps);
      const computedLap = Math.min(track.laps, Math.floor(currentLapProgressRaw) + 1);
      setLap(computedLap);

      // Level victory check
      if (!isEndless && state.trackProgress >= state.trackLength && !state.isCrashed) {
        audio.stopEngine();
        audio.playVictory();
        onRaceComplete(marksLeft, true, timestamp / 1000);
        return;
      }

      // Rival AI
      if (!isEndless) {
        let rivalTargetSpeed = 120 + rivalRacer.stats.speed * 8;
        if (state.boostActive) {
          rivalTargetSpeed += 40;
        }
        // Rubberband logic
        const gap = state.rivalY - state.trackProgress;
        if (gap < -200) {
          rivalTargetSpeed += 65;
        } else if (gap > 420) {
          rivalTargetSpeed -= 48;
        }
        state.rivalY += rivalTargetSpeed * dt * 2.2;
        state.rivalX += Math.sin(timestamp / 450) * 1.5;
        state.rivalX = Math.max(-120, Math.min(120, state.rivalX));
      }

      // Score / Marks addition
      if (isDrifting && !state.isCrashed) {
        const marksEarned = Math.round(Math.abs(actualDx) * (state.boostActive ? 3.0 : 1.2));
        setMarksLeft((prev) => prev + marksEarned);
      }
      if (state.boostActive && !state.isCrashed && Math.random() > 0.2) {
        setMarksLeft((prev) => prev + 2);
      }

      // Traffic progression
      traffic.current.forEach((t) => {
        t.y += (state.speed * 0.25 + t.speed) * dt * 2.2;
      });
      // Clear out of screen
      traffic.current = traffic.current.filter((t) => t.y < 800 + 200 && t.y > -1200);

      // Energy cells
      energyCells.current.forEach((c) => {
        c.y += state.speed * dt * 2.2;
        c.pulse += dt * 4;
      });
      energyCells.current = energyCells.current.filter((c) => c.y < 800 + 200 && c.active);

      // Collisions check
      const playerWidth = 26;
      const playerHeight = 44;

      traffic.current.forEach((veh) => {
        const dx = Math.abs(state.playerX - veh.x);
        const dy = Math.abs(playerWorldY - veh.y);

        if (dx < (playerWidth + veh.width) / 2 && dy < (playerHeight + veh.height) / 2 && !state.isCrashed) {
          if (playerRacer.id === "kira" && state.boostActive) {
            veh.y = 999999;
            triggerSparks3D((veh.x / 150) * 22, 0.6, -((playerWorldY - veh.y) * 0.5), "#ff007f", 12);
            triggerScreenShake(8, 8);
            setMarksLeft((prev) => prev + 250);
          } else if (playerRacer.id === "mako" && state.boostActive) {
            veh.y = 999999;
            triggerSparks3D((veh.x / 150) * 22, 0.6, -((playerWorldY - veh.y) * 0.5), "#00ffcc", 8);
          } else {
            // Wreck
            state.isCrashed = true;
            state.crashTimer = 1.2;
            state.speed = 10;
            audio.playCrash();
            triggerScreenShake(20, 18);
            
            const px3D = (state.playerX / 150) * 22;
            const pz3D = 0;
            triggerSparks3D(px3D, 0.6, pz3D, "#ff3c00", 25);
            triggerSparks3D(px3D, 0.6, pz3D, "#ffffff", 10);

            if (isEndless) {
              onRaceComplete(marksLeft, false, timestamp / 1000);
            }
          }
        }
      });

      // Boundaries collision
      const roadLimitX = 145;
      if (Math.abs(state.playerX) > roadLimitX - 10 && !state.isCrashed) {
        state.playerX = Math.sign(state.playerX) * (roadLimitX - 10);
        const wallX3D = Math.sign(state.playerX) * 22;
        triggerSparks3D(wallX3D, 0.2, 0, "#ffffff", 2);
        state.speed = Math.max(20, state.speed - 150 * dt);
        setMarksLeft((prev) => Math.max(0, prev - 1));
      }

      // Energy cells pickup
      energyCells.current.forEach((cell) => {
        const dx = Math.abs(state.playerX - cell.x);
        const dy = Math.abs(playerWorldY - cell.y);
        const collectR = playerRacer.id === "mako" && state.boostActive ? 120 : 35;

        if (dx < collectR && dy < collectR && cell.active) {
          cell.active = false;
          audio.playClick();
          setBoostLevel((prev) => Math.min(100, prev + 20));
          setMarksLeft((prev) => prev + 150);

          const cellX3D = (cell.x / 150) * 22;
          const cellZ3D = -((playerWorldY - cell.y) * 0.5);
          triggerSparks3D(cellX3D, 0.6, cellZ3D, "#00ffcc", 10);
        }
      });

      // --- THREE.JS GRAPHICS UPDATE ---
      
      // A. Player Ship placement
      const playerX3D = (state.playerX / 150) * 22;
      playerGroup.position.x = playerX3D;
      
      // Hover wave bobbing
      if (state.isCrashed) {
        playerGroup.position.y = 0.8 + Math.sin(timestamp / 40) * 0.4;
        playerGroup.rotation.y += 8 * dt;
        playerGroup.rotation.x += 4 * dt;
        plumeL.scale.set(0.001, 0.001, 0.001);
        plumeR.scale.set(0.001, 0.001, 0.001);
      } else {
        playerGroup.position.y = 0.65 + Math.sin(timestamp / 180) * 0.12;
        playerGroup.rotation.y = 0;
        playerGroup.rotation.x = 0;
        playerGroup.rotation.z = -actualDx * 0.14; // tilt based on steering delta

        // Engine flame scale pulsing
        const plumeScale = 0.6 + (state.speed / 140) + (state.boostActive ? 1.0 : 0) + Math.sin(timestamp / 30) * 0.15;
        plumeL.scale.set(1, 1, Math.max(0.1, plumeScale));
        plumeR.scale.set(1, 1, Math.max(0.1, plumeScale));

        // Spawn drifting sparks and trails
        if (isDrifting) {
          const wheelOffsetZ = 1.0;
          spawnTrailSegment3D(playerX3D - 1.0, wheelOffsetZ);
          spawnTrailSegment3D(playerX3D + 1.0, wheelOffsetZ);
          
          if (Math.random() > 0.3) {
            triggerSparks3D(playerX3D - 1.0, 0.1, wheelOffsetZ, playerRacer.signatureColor, 2);
            triggerSparks3D(playerX3D + 1.0, 0.1, wheelOffsetZ, playerRacer.signatureColor, 2);
          }
        }
        if (state.boostActive && Math.random() > 0.4) {
          triggerSparks3D(playerX3D, 0.1, 1.2, "#fffae0", 1);
        }
      }

      // B. Road scrolling animation
      const scrollSpeed = state.speed * dt * 1.1; // scaling factor
      roadTiles.forEach((tile) => {
        tile.position.z += scrollSpeed;
        if (tile.position.z > roadLength) {
          // Wrap tile to front
          tile.position.z -= numRoadTiles * roadLength;
        }
      });

      // C. Buildings scrolling animation
      buildings.forEach((b) => {
        b.mesh.position.z += scrollSpeed;
        if (b.mesh.position.z > 80) {
          b.mesh.position.z = -550 - Math.random() * 150;
          const side = Math.random() > 0.5 ? 1 : -1;
          b.mesh.position.x = side * (35 + Math.random() * 60);
          b.initialX = b.mesh.position.x;
        }
        // Parallax horizontal drift relative to camera movement
        b.mesh.position.x = b.initialX - (playerGroup.position.x * 0.15);
      });

      // D. Speed lines movement
      speedLinesArr.forEach((line) => {
        line.position.z += (35 + state.speed * 0.35) * dt * 20;
        if (line.position.z > 20) {
          line.position.z = -300;
          line.position.x = (Math.random() - 0.5) * 80;
          line.position.y = Math.random() * 12 + 0.5;
        }
      });

      // E. Rival Ship placement
      if (rivalGroup) {
        const relRivalDist = state.rivalY - state.trackProgress;
        const rivalZ3D = -(relRivalDist * 0.5);
        rivalGroup.position.z = rivalZ3D;
        rivalGroup.position.x = (state.rivalX / 150) * 22;
        rivalGroup.rotation.y = Math.sin(timestamp / 500) * 0.05;

        // Pulse rival plumes
        const rivalPlumeScale = 0.8 + Math.sin(timestamp / 40) * 0.1;
        rivalGroup.children.forEach((c) => {
          if (c instanceof THREE.Mesh && c.geometry instanceof THREE.ConeGeometry && c.material instanceof THREE.MeshBasicMaterial) {
            c.scale.set(1, 1, rivalPlumeScale);
          }
        });

        // Hide if too far back
        rivalGroup.visible = (rivalZ3D > -350 && rivalZ3D < 60);
      }

      // F. Render Traffic cars
      const activeIds = new Set(traffic.current.map((t) => t.id));
      
      // Remove stale traffic
      trafficMeshes.forEach((mesh, id) => {
        if (!activeIds.has(id)) {
          scene.remove(mesh);
          // recursive geometry/material disposal
          mesh.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.geometry.dispose();
              if (Array.isArray(child.material)) {
                child.material.forEach((m) => m.dispose());
              } else {
                child.material.dispose();
              }
            }
          });
          trafficMeshes.delete(id);
        }
      });

      // Update / Create traffic
      traffic.current.forEach((veh) => {
        const tX3D = (veh.x / 150) * 22;
        const tZ3D = -((playerWorldY - veh.y) * 0.5);

        let mesh = trafficMeshes.get(veh.id);
        if (!mesh) {
          mesh = createTrafficMesh(veh.type, veh.color);
          trafficMeshes.set(veh.id, mesh);
        }

        mesh.position.set(tX3D, 0.6, tZ3D);
        
        // Bobbing floating cars
        mesh.position.y = 0.55 + Math.sin((timestamp + veh.id * 100) / 150) * 0.08;
        if (veh.type === "drone") {
          mesh.children[0].rotation.y += 2 * dt;
          mesh.children[1].rotation.z -= 1.5 * dt;
        }
      });

      // G. Render Energy Pickup cells
      const activeCellIds = new Set(energyCells.current.map((_, idx) => idx));
      
      energyMeshes.forEach((mesh, idx) => {
        if (!activeCellIds.has(idx) || !energyCells.current[idx].active) {
          scene.remove(mesh);
          mesh.geometry.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material.dispose();
          }
          energyMeshes.delete(idx);
        }
      });

      energyCells.current.forEach((cell, idx) => {
        if (!cell.active) return;
        const cX3D = (cell.x / 150) * 22;
        const cZ3D = -((playerWorldY - cell.y) * 0.5);

        let mesh = energyMeshes.get(idx);
        if (!mesh) {
          mesh = new THREE.Mesh(pickupGeom, pickupMat);
          scene.add(mesh);
          energyMeshes.set(idx, mesh);
        }

        mesh.position.set(cX3D, 0.8 + Math.sin(cell.pulse) * 0.15, cZ3D);
        mesh.rotation.y += 2.5 * dt;
        mesh.rotation.x += 1.0 * dt;
      });

      // H. Animate 3D spark particles
      sparksPool.forEach((spark) => {
        if (spark.active) {
          spark.mesh.position.x += spark.vx * dt;
          spark.mesh.position.y += spark.vy * dt;
          spark.mesh.position.z += (scrollSpeed / dt + spark.vz) * dt; // road speed + particle velocity

          spark.vy -= 16 * dt; // gravity
          spark.life -= dt;

          const lifeRatio = spark.life / spark.maxLife;
          spark.mesh.scale.set(lifeRatio, lifeRatio, lifeRatio);
          (spark.mesh.material as THREE.MeshBasicMaterial).opacity = lifeRatio;

          if (spark.life <= 0) {
            spark.active = false;
            spark.mesh.visible = false;
          }
        }
      });

      // I. Animate Drift Trails scrolling
      trailsPool.forEach((trail) => {
        if (trail.active) {
          trail.mesh.position.z += scrollSpeed;
          trail.life -= 1.8 * dt; // fade rate
          (trail.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, trail.life * 0.7);

          if (trail.life <= 0 || trail.mesh.position.z > 80) {
            trail.active = false;
            trail.mesh.visible = false;
          }
        }
      });

      // J. Chase Camera interpolation & shake
      camera.position.x = playerGroup.position.x * 0.65;
      camera.position.y = 5.2 + (state.boostActive ? 0.8 : 0);
      camera.position.z = 12.0 + (state.boostActive ? 2.5 : 0);

      // FOV transition for speed warp representation
      const targetFOV = state.boostActive ? 74 : 60;
      camera.fov += (targetFOV - camera.fov) * 0.08;

      // Dynamic screen shake addition
      if (state.shakeDuration > 0) {
        const curIntensity = state.shakeIntensity * 0.02;
        camera.position.x += (Math.random() - 0.5) * curIntensity;
        camera.position.y += (Math.random() - 0.5) * curIntensity;
        camera.position.z += (Math.random() - 0.5) * curIntensity;
        state.shakeDuration--;
      }
      camera.updateProjectionMatrix();

      // Look slightly in front of ship
      const lookAtTarget = new THREE.Vector3(playerGroup.position.x * 0.35, 1.0, -12);
      camera.lookAt(lookAtTarget);

      // K. Render Scene Frame
      renderer.render(scene, camera);

      animationFrameId.current = requestAnimationFrame(animationLoop);
    };

    animationFrameId.current = requestAnimationFrame(animationLoop);

    // L. Resize Observer
    const updateSize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);

    // M. CLEANUP ON UNMOUNT
    return () => {
      clearInterval(logicInterval);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      resizeObserver.disconnect();
      audio.stopEngine();

      // Dispose all active map meshes
      trafficMeshes.forEach((mesh) => {
        scene.remove(mesh);
        mesh.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach((m) => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
      });
      energyMeshes.forEach((mesh) => {
        scene.remove(mesh);
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else {
          mesh.material.dispose();
        }
      });

      // Dispose scene elements recursively
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((mat) => mat.dispose());
          } else {
            object.material.dispose();
          }
        }
      });

      renderer.dispose();
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
      className="relative w-full h-full aspect-auto flex flex-col justify-end overflow-hidden bg-brand-midnight"
      onTouchStart={(e) => handlePointerDown(e.touches[0].clientX)}
      onTouchMove={(e) => handlePointerMove(e.touches[0].clientX)}
      onTouchEnd={handlePointerUp}
      onMouseDown={(e) => handlePointerDown(e.clientX)}
      onMouseMove={(e) => handlePointerMove(e.clientX)}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
    >
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full touch-none" />

      {/* Futuristic HUD overlay panels layered on top of 3D Canvas */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center pointer-events-none">
        {/* Left Side: Racerz Points (augmented counter display) */}
        <div className="glass-panel px-4 py-2.5 rounded-2xl flex flex-col pointer-events-auto border-cyan-500/10">
          <span className="font-mono text-[9px] tracking-widest text-[#00D4FF] font-bold">RACERZ POINTS</span>
          <span className="font-orbitron font-extrabold text-2xl text-white tracking-wider glow-cyan-sm mt-0.5">
            {marksLeft.toLocaleString()}
          </span>
        </div>

        {/* Center Panel info details */}
        <div className="glass-panel px-4 py-2 rounded-xl flex items-center gap-4 pointer-events-auto border-white/5 font-orbitron">
          {!isEndless ? (
            <div className="flex flex-col items-center">
              <span className="text-[8px] text-gray-500 tracking-wider">SECTOR LAP</span>
              <span className="text-sm font-bold text-white">
                {lap} <span className="text-gray-500 text-[10px]">/ {track.laps}</span>
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-[8px] text-[#ff007f] tracking-widest font-bold">ENDLESS SPEEDWAY</span>
              <span className="text-[10px] font-bold text-emerald-400">SURVIVAL RUN</span>
            </div>
          )}
          <div className="h-6 w-[1px] bg-white/10" />
          <div className="flex flex-col items-center">
            <span className="text-[8px] text-gray-500 tracking-wider">RUN TIME</span>
            <span className="text-sm font-mono text-zinc-100">{raceTime.toFixed(1)}s</span>
          </div>
        </div>

        {/* Exit Button */}
        <button
          onClick={handleKeyboardExit}
          className="glass-panel px-4 py-2 rounded-xl text-[10px] font-orbitron font-bold text-zinc-400 hover:text-white pointer-events-auto transition-colors tracking-widest active:scale-95"
        >
          QUIT SECTOR
        </button>
      </div>

      {/* Massive bottom overlay panel */}
      <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end pointer-events-none select-none">
        {/* Speedometer panel */}
        <div className="glass-panel px-4 py-2.5 rounded-2xl flex flex-col pointer-events-auto font-orbitron w-36 border-white/5">
          <div className="flex justify-between items-baseline">
            <span className="text-[9px] text-[#00D4FF]">SPEED</span>
            <span className="text-[8px] text-zinc-500 font-mono">3D TELEM</span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`text-4xl font-black tracking-tighter transition-colors ${isBoosting ? "text-pink-500" : "text-white"}`}>
              {speedKmh}
            </span>
            <span className="text-[10px] text-zinc-400">KM/H</span>
          </div>
          {/* Speedometer linear meter */}
          <div className="w-full bg-white/5 h-[3px] rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-75 ${isBoosting ? "bg-cyan-400" : "bg-[#ff007f]"}`}
              style={{ width: `${Math.min(100, (speedKmh / 240) * 100)}%` }}
            />
          </div>
        </div>

        {/* Large Boost Button overlaying right quadrant */}
        <div className="flex flex-col items-center gap-2 pointer-events-auto">
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              triggerBoost();
            }}
            onClick={triggerBoost}
            className={`w-20 h-20 rounded-full flex flex-col justify-center items-center border transition-all pointer-events-auto ${
              boostLevel >= 25
                ? "bg-gradient-to-tr from-cyan-600/60 to-pink-600/60 border-cyan-400 active:scale-95 shadow-[0_0_20px_rgba(0,212,255,0.4)]"
                : "bg-white/5 border-white/10 opacity-40 cursor-not-allowed"
            }`}
          >
            <span className="font-orbitron text-[9px] font-black tracking-widest text-[#00D4FF]">BOOST</span>
            <span className="font-mono text-xs font-black text-white mt-1">
              {boostLevel >= 25 ? "READY" : `${Math.round(boostLevel)}%`}
            </span>
          </button>

          {/* Boost level sub-bar split indicators */}
          <div className="w-24 bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/5 flex">
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

      {/* Screen Controls Hint Overlay */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-center flex flex-col gap-1 items-center animate-fade-out font-orbitron">
        <span className="text-[10px] text-[#00D4FF] tracking-widest font-black">DRAG MOUSE / SWIPE TO STEER</span>
        <span className="text-[8px] text-gray-500 uppercase tracking-widest">Or Use Arrow Keys / AD</span>
      </div>
    </div>
  );
}
