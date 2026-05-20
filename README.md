# 🥏 QueenShot — Multiplayer Carrom Board Web App

A premium, real-time multiplayer Carrom Board web game built with a **React + TypeScript (Vite)** frontend client and a **Node.js + Express + Socket.io** backend server.

---

## 📁 Project Architecture & Structure

The repository is divided into two primary directories to separate the client and server concerns:

```
QueenShot/
├── client/                 # React + TypeScript Web App (Frontend)
│   ├── src/
│   │   ├── assets/         # Images, fonts, and styling assets
│   │   ├── App.tsx         # Main layout, router, and screens
│   │   ├── main.tsx        # React mounting entry point
│   │   └── index.css       # Premium Vanilla CSS styles (Glassmorphism & animations)
│   ├── index.html          # Web entry point
│   ├── package.json        # React + TypeScript + Vite dependencies
│   └── vite.config.ts      # Vite bundler configurations
│
└── server/                 # Node.js + Socket.io Backend (Real-Time Service)
    ├── src/
    │   ├── index.js        # Server bootstrapping (Express & Http Server)
    │   └── socket.js       # Real-time game logic, matchmaking queue, and rooms
    ├── .env                # Port and environment configurations (ignored)
    ├── .gitignore          # Ignores Node modules and environmental secrets
    └── package.json        # Node.js dependencies
```

---

## ⚡ Quick Start Guide

### 1. Backend Server (`/server`)

The server manages matchmaking lobbies and synchronizes striker releases, puck movements, and player scores in real-time.

#### Install Dependencies
Open your terminal and navigate to the server folder, then run:
```bash
cd server
npm install
```

#### Run Server in Development Mode
Starts the server with hot-reloading using `nodemon`:
```bash
npm run dev
```
By default, the server will start on **port `4000`** (configurable in `server/.env`). You can check if the server is up by visiting `http://localhost:4000/health` in your browser.

---

### 2. Vite React Web Client (`/client`)

The React web client handles 2D canvas rendering for the carrom board, dragging gestures for aiming, and real-time multiplayer connections.

#### Install Dependencies
Navigate to the client directory:
```bash
cd client
npm install
```

#### Start React Web Server
Start the Vite development web server:
```bash
npm run dev
```

This will spin up a hot-reloading development server (usually at `http://localhost:5173`). Open that URL in your browser to play!

---

## 🎮 Game Engine Details (Planned)

### 🎨 Visual Aesthetics & Layout
- **Glassmorphic & Radiant Dark UI**: Stunning dark modes, neon gradients, and premium shadow typography.
- **High-Fidelity Board Rendering**: Elegant wooden border details, standard circular patterns, center circle, and beautiful pocket meshes rendered dynamically via HTML5 Canvas.

### 📐 Physics & Gestures (Client-Side)
- **Striker Sliding**: Drag-and-slide controls to reposition the striker along the baseline.
- **Aiming & Pull-back**: Elegant visual arrows showing power and trajectory on drag-back.
- **2D Friction & Collision Physics**: Accurate circles-to-circles collisions (striker-to-pucks and pucks-to-pucks) with wall bounces and realistic friction decay inside an HTML5 Canvas game loop.

### 🔄 Multi-player Synchronization (Socket.io)
- **Instant Matchmaking**: Joins a 1v1 queue to immediately pair up active players.
- **Physics Sync**: Rather than streaming endless coordinate positions (which leads to lag), client broadcasts the **strike velocity and striker coordinates**. Both clients execute the physics loop locally, resulting in lag-free, seamless movement!
- **State Reconciliation**: Subtle corrections are done using `syncBoardState` after pucks settle to ensure perfect sync.

---

## 🛠️ Technology Stack Summarized

| Part | Tech | Purpose |
| :--- | :--- | :--- |
| **Web App (Frontend)** | React (TypeScript + Vite) | Fast, responsive Single Page Application with full type safety |
| **Icons** | Lucide React | High-quality vector SVG icons |
| **Real-time Comms** | Socket.io Client | Bidirectional event sync with low latency |
| **Physics** | HTML5 Canvas / Game Loop | High performance 60FPS board physics in React |
| **Backend API / Server** | Node.js + Express | Game state orchestration & REST API |
| **Real-time Server** | Socket.io Server | Room hosting and player coordination |
