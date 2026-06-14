<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Racerz 3D: Grid Legends
> **An Unofficial Racerz Fan Experience**

A retro-futuristic, high-speed 3D WebGL racing game built on React and Three.js. Drift through neon-lit cyber highways, collect energy cells, avoid commuter hovercrafts, and log your trace on the skyline grids.

---

## 🌟 Core Features

- **Custom 3D WebGL Engine**: Developed from scratch with Three.js, featuring a smooth chase camera, speed lines, 3D particle systems for drifting sparks/wrecks, and dynamically scrolling neon city skyscrapers.
- **Pilot Garage & Locker**: Choose between 4 unique pilots, each featuring their own custom anime illustrations:
  - **Zenith** (Apex S-X)
  - **Kira Volt** (Phantom Hybrid)
  - **Mako** (Tatsu Widebody)
  - **Rex** (Dune Reaver V8)
- **Helmet Customization Locker**: Upgrade and equip unlocked custom helmets (**Classic Carbon**, **Neon Visor V1**, **Volt Charger**, **Apex Legend**). Visor colors, glows, and decals update dynamically in both 2D garage portraits and the 3D player spacecraft's cockpit.
- **Visual Novel Campaign Storyline**: Engage in sector-based dialogue matchups with rival pilots before and after campaign runs.
- **Racerz Points Progression**: Earn points for successful high-speed runs and drifts to unlock new sectors, custom vehicles, and collectible helmets.
- **Cohesive Glassmorphic Design**: Futuristic dashboard HUD overlays and blur layouts utilizing harmonious HSL palettes.

---

## 🎮 Controls

### Keyboard Inputs
- **Steer Left**: `A` / `ArrowLeft`
- **Steer Right**: `D` / `ArrowRight`
- **Trigger Boost**: `Spacebar` / `B`

### Touch & Mouse Drag
- **Steer**: Click/Tap and drag left or right across the screen canvas.
- **Trigger Boost**: Press the glowing **BOOST** button at the bottom-right corner.

---

## 🛠️ Run Locally

### Prerequisites
- Node.js (v18+)

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```
2. Set your configuration environment key:
   Set the `GEMINI_API_KEY` in `.env.local` to your Gemini API key.
3. Run the development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` to play!
