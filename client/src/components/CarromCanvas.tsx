import React, { useEffect, useRef, useState } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { audio } from '../services/audio';

// Constants for Carrom Physics
const BOARD_SIZE = 600;
const BORDER_MARGIN = 35;
const POCKET_RADIUS = 28;
const PUCK_RADIUS = 15;
const STRIKER_RADIUS = 22;
const FRICTION = 0.986; // Friction dampening per frame
const MIN_SPEED = 0.08;

// Pockets center positions
const POCKETS = [
  { x: BORDER_MARGIN, y: BORDER_MARGIN },
  { x: BOARD_SIZE - BORDER_MARGIN, y: BORDER_MARGIN },
  { x: BORDER_MARGIN, y: BOARD_SIZE - BORDER_MARGIN },
  { x: BOARD_SIZE - BORDER_MARGIN, y: BOARD_SIZE - BORDER_MARGIN },
];

interface Puck {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  mass: number;
  color: 'white' | 'black' | 'queen';
  active: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
}

export const CarromCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const {
    socket,
    roomId,
    players,
    currentTurn,
    strike,
    aimStriker,
    pocketPuck,
    endTurn,
    gameResetTrigger
  } = useSocket();

  const [myRole, setMyRole] = useState<'player1' | 'player2' | 'spectator'>('spectator');
  const [aimX, setAimX] = useState(300); // Striker X along baseline
  const [isAiming, setIsAiming] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null);
  const [oppAimX, setOppAimX] = useState<number | null>(null);

  // Core physics references
  const pucksRef = useRef<Puck[]>([]);
  const strikerRef = useRef<Puck | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const isSimulatingRef = useRef(false);
  const turnChangePendingRef = useRef(false);
  const turnPocketedPuckRef = useRef(false);

  // Set local player role
  useEffect(() => {
    if (!players || !socket) return;
    if (players.player1.id === socket.id) {
      setMyRole('player1');
    } else if (players.player2.id === socket.id) {
      setMyRole('player2');
    } else {
      setMyRole('spectator');
    }
  }, [players, socket]);

  // Determine baseline Y for local shooting
  const getBaselineY = (role: 'player1' | 'player2' | 'spectator') => {
    if (role === 'player2') return 115; // Top baseline for P2
    return 485; // Bottom baseline for P1
  };

  const baselineY = getBaselineY(myRole);
  const isMyTurn = socket && currentTurn === socket.id;

  // Initialize Board Setup
  const resetBoardState = () => {
    const list: Puck[] = [];
    let idCounter = 1;

    // Arrange pucks in hexagonal concentric packing around center (300, 300)
    // Center: Red Queen (id: 0)
    list.push({
      id: 0,
      x: 300,
      y: 300,
      vx: 0,
      vy: 0,
      radius: PUCK_RADIUS,
      mass: 1.0,
      color: 'queen',
      active: true,
    });

    // Inner Ring: 6 pucks at radius 30px (2 * r), alternating White and Black
    const innerRadius = PUCK_RADIUS * 2;
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3; // 60 degrees
      const color = i % 2 === 0 ? 'white' : 'black';
      list.push({
        id: idCounter++,
        x: 300 + innerRadius * Math.cos(angle),
        y: 300 + innerRadius * Math.sin(angle),
        vx: 0,
        vy: 0,
        radius: PUCK_RADIUS,
        mass: 1.0,
        color,
        active: true,
      });
    }

    // Outer Ring: 12 pucks at radius 60px (4 * r), alternating White and Black
    const outerRadius = PUCK_RADIUS * 4;
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI) / 6; // 30 degrees
      // Arrange colors so they form a beautiful checkerboard flower pattern
      let color: 'white' | 'black' = 'black';
      if (i % 2 === 0) {
        color = 'white';
      }
      list.push({
        id: idCounter++,
        x: 300 + outerRadius * Math.cos(angle),
        y: 300 + outerRadius * Math.sin(angle),
        vx: 0,
        vy: 0,
        radius: PUCK_RADIUS,
        mass: 1.0,
        color,
        active: true,
      });
    }

    pucksRef.current = list;
    particlesRef.current = [];

    // Striker initialization
    strikerRef.current = {
      id: 99,
      x: 300,
      y: baselineY,
      vx: 0,
      vy: 0,
      radius: STRIKER_RADIUS,
      mass: 3.0, // Striker is heavier
      color: 'white', // Color not evaluated for scoring
      active: true,
    };

    setAimX(300);
    isSimulatingRef.current = false;
    turnChangePendingRef.current = false;
    turnPocketedPuckRef.current = false;
  };

  // Reset when room initializes or gameReset socket fires
  useEffect(() => {
    resetBoardState();
  }, [roomId, myRole, gameResetTrigger]);

  // Setup Socket listeners for aiming and striking sync
  useEffect(() => {
    if (!socket) return;

    socket.on('opponentAim', (data: { x: number; y: number }) => {
      setOppAimX(data.x);
    });

    socket.on(
      'opponentStrike',
      (data: { velocityX: number; velocityY: number; startX: number; startY: number }) => {
        if (!strikerRef.current) return;
        
        // Launch striker locally with absolute synced coordinates
        strikerRef.current.x = data.startX;
        strikerRef.current.y = myRole === 'player1' ? 115 : 485; // Mirror launch baseline
        strikerRef.current.vx = data.velocityX;
        strikerRef.current.vy = data.velocityY;
        strikerRef.current.active = true;

        isSimulatingRef.current = true;
        setOppAimX(null);
        turnPocketedPuckRef.current = false;
      }
    );

    socket.on('boardStateSynced', (data: { pucks: any[] }) => {
      // Periodic check to fix synchronization drift
      data.pucks.forEach(p => {
        const local = pucksRef.current.find(lp => lp.id === p.id);
        if (local) {
          local.x = p.x;
          local.y = p.y;
          local.vx = p.vx;
          local.vy = p.vy;
          local.active = p.active;
        }
      });
    });

    return () => {
      socket.off('opponentAim');
      socket.off('opponentStrike');
      socket.off('boardStateSynced');
    };
  }, [socket, myRole]);

  // Trigger floating pocket spark particles
  const spawnPocketSparks = (x: number, y: number, color: string) => {
    const list = particlesRef.current;
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3.5;
      list.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 3 + Math.random() * 4,
        alpha: 1.0,
        decay: 0.02 + Math.random() * 0.03,
      });
    }
  };

  // Main Canvas Render and Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const updatePhysics = () => {
      if (!isSimulatingRef.current) return;

      const pucks = pucksRef.current;
      const striker = strikerRef.current;
      const allBodies = striker ? [...pucks, striker] : pucks;

      // 1. Apply velocities and friction
      allBodies.forEach(b => {
        if (!b.active) return;
        b.x += b.vx;
        b.y += b.vy;

        // Friction dampening
        b.vx *= FRICTION;
        b.vy *= FRICTION;

        // Freeze if extremely slow
        if (Math.sqrt(b.vx * b.vx + b.vy * b.vy) < MIN_SPEED) {
          b.vx = 0;
          b.vy = 0;
        }
      });

      // 2. Wall Collisions
      allBodies.forEach(b => {
        if (!b.active) return;

        const leftBound = BORDER_MARGIN + b.radius;
        const rightBound = BOARD_SIZE - BORDER_MARGIN - b.radius;
        const topBound = BORDER_MARGIN + b.radius;
        const bottomBound = BOARD_SIZE - BORDER_MARGIN - b.radius;

        let hit = false;
        let speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);

        if (b.x < leftBound) {
          b.x = leftBound;
          b.vx = -b.vx * 0.85; // Slight bounce bounce decay
          hit = true;
        } else if (b.x > rightBound) {
          b.x = rightBound;
          b.vx = -b.vx * 0.85;
          hit = true;
        }

        if (b.y < topBound) {
          b.y = topBound;
          b.vy = -b.vy * 0.85;
          hit = true;
        } else if (b.y > bottomBound) {
          b.y = bottomBound;
          b.vy = -b.vy * 0.85;
          hit = true;
        }

        if (hit && speed > 0.5) {
          audio.playThud(speed / 10);
        }
      });

      // 3. Puck to Puck Collisions (Circle vs Circle)
      for (let i = 0; i < allBodies.length; i++) {
        const b1 = allBodies[i];
        if (!b1.active) continue;

        for (let j = i + 1; j < allBodies.length; j++) {
          const b2 = allBodies[j];
          if (!b2.active) continue;

          const dx = b2.x - b1.x;
          const dy = b2.y - b1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = b1.radius + b2.radius;

          if (dist < minDist) {
            // Overlap resolution (push apart so they don't stick)
            const overlap = minDist - dist;
            const nx = dx / dist;
            const ny = dy / dist;

            b1.x -= nx * overlap * 0.5;
            b1.y -= ny * overlap * 0.5;
            b2.x += nx * overlap * 0.5;
            b2.y += ny * overlap * 0.5;

            // Elastic Collisions math (conserving momentum)
            const kx = b1.vx - b2.vx;
            const ky = b1.vy - b2.vy;
            const p = 2 * (nx * kx + ny * ky) / (b1.mass + b2.mass);

            b1.vx -= p * b2.mass * nx;
            b1.vy -= p * b2.mass * ny;
            b2.vx += p * b1.mass * nx;
            b2.vy += p * b1.mass * ny;

            const impactForce = Math.sqrt((b1.vx - b2.vx) ** 2 + (b1.vy - b2.vy) ** 2);
            if (impactForce > 0.2) {
              audio.playClick(impactForce / 8);
            }
          }
        }
      }

      // 4. Pocket Detections
      allBodies.forEach(b => {
        if (!b.active) return;

        POCKETS.forEach(p => {
          const dx = b.x - p.x;
          const dy = b.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < POCKET_RADIUS) {
            // Pocketed!
            b.active = false;
            b.vx = 0;
            b.vy = 0;

            const sparkColor = b.color === 'queen' ? '#ff007f' : b.color === 'white' ? '#22d3ee' : '#a78bfa';
            spawnPocketSparks(p.x, p.y, sparkColor);

            if (b.id === 99) {
              // Striker pocketed (Foul!)
              audio.playThud(0.8);
              setTimeout(() => {
                // Respawn striker on baseline
                if (strikerRef.current) {
                  strikerRef.current.x = 300;
                  strikerRef.current.y = baselineY;
                  strikerRef.current.vx = 0;
                  strikerRef.current.vy = 0;
                  strikerRef.current.active = true;
                }
              }, 600);
            } else {
              // Pocketed a valid scoring puck!
              // Standard rule: only the player who shot notifies the server to prevent duplicates
              if (isMyTurn) {
                pocketPuck(b.id, b.color);
                
                // Track if we scored our own color puck
                const myColor = players?.[myRole === 'player1' ? 'player1' : 'player2']?.color;
                if (b.color === myColor || b.color === 'queen') {
                  turnPocketedPuckRef.current = true;
                }
              }
            }
          }
        });
      });

      // 5. Check if all bodies have stopped moving to terminate physics phase
      const isMoving = allBodies.some(b => b.active && (b.vx !== 0 || b.vy !== 0));
      if (!isMoving) {
        isSimulatingRef.current = false;
        
        // Turn transition handling
        if (isMyTurn) {
          // Send anti-drift sync coordinates to opponent
          if (socket && roomId) {
            const syncData = pucksRef.current.map(p => ({
              id: p.id,
              x: p.x,
              y: p.y,
              vx: 0,
              vy: 0,
              active: p.active,
            }));
            socket.emit('syncBoardState', { roomId, pucks: syncData });
          }

          // Decide next turn
          setTimeout(() => {
            if (turnPocketedPuckRef.current) {
              // Pocketed own puck - keep turn!
              console.log('Own puck pocketed. Keep turn.');
              // Reset striker position for next shot
              if (strikerRef.current) {
                strikerRef.current.x = aimX;
                strikerRef.current.y = baselineY;
              }
            } else {
              // Failed to score - switch turn!
              const nextId = myRole === 'player1' ? players?.player2.id : players?.player1.id;
              if (nextId) {
                endTurn(nextId);
              }
            }
          }, 800);
        }
      }
    };

    // Render loop
    const render = () => {
      updatePhysics();

      // Clear Canvas
      ctx.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);

      // Save Context for 180 Rotation
      ctx.save();
      const isRotated = myRole === 'player2';
      if (isRotated) {
        ctx.translate(BOARD_SIZE / 2, BOARD_SIZE / 2);
        ctx.rotate(Math.PI);
        ctx.translate(-BOARD_SIZE / 2, -BOARD_SIZE / 2);
      }

      // Draw Wooden Board Bezel
      ctx.fillStyle = '#1e1b18'; // Dark wood
      ctx.fillRect(0, 0, BOARD_SIZE, BOARD_SIZE);

      // Inner Felt Board
      ctx.fillStyle = '#12131a'; // Deep cosmic felt
      ctx.fillRect(BORDER_MARGIN, BORDER_MARGIN, BOARD_SIZE - BORDER_MARGIN * 2, BOARD_SIZE - BORDER_MARGIN * 2);

      // Board Frame Border Shadow/Bevel Line
      ctx.strokeStyle = '#2d2b28';
      ctx.lineWidth = 4;
      ctx.strokeRect(BORDER_MARGIN, BORDER_MARGIN, BOARD_SIZE - BORDER_MARGIN * 2, BOARD_SIZE - BORDER_MARGIN * 2);

      // Draw 4 Corner Pockets
      POCKETS.forEach(p => {
        // Brass pocket rim shadow
        ctx.beginPath();
        ctx.arc(p.x, p.y, POCKET_RADIUS + 3, 0, Math.PI * 2);
        ctx.fillStyle = '#b5a642'; // Brass
        ctx.fill();

        // Dark hole
        ctx.beginPath();
        ctx.arc(p.x, p.y, POCKET_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = '#06070a';
        ctx.fill();

        ctx.strokeStyle = 'rgba(0,0,0,0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Draw Central Circles & Queen Ring
      ctx.beginPath();
      ctx.arc(300, 300, 70, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(170, 59, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(300, 300, 20, 0, Math.PI * 2);
      ctx.strokeStyle = '#ff007f';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Draw Baselines & Circles
      const baselines = [
        { y: 115, xStart: 150, xEnd: 450, color: 'rgba(0, 240, 255, 0.2)' }, // Top
        { y: 485, xStart: 150, xEnd: 450, color: 'rgba(170, 59, 255, 0.2)' }, // Bottom
      ];

      baselines.forEach(line => {
        ctx.beginPath();
        ctx.moveTo(line.xStart, line.y);
        ctx.lineTo(line.xEnd, line.y);
        ctx.strokeStyle = line.color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Round circle endpoints for baseline striker limits
        [line.xStart, line.xEnd].forEach(cx => {
          ctx.beginPath();
          ctx.arc(cx, line.y, 10, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,255,0.05)';
          ctx.strokeStyle = line.color;
          ctx.stroke();
          ctx.fill();
        });
      });

      // Draw active player striker baseline highlight
      if (myRole !== 'spectator') {
        const activeBaselineY = baselineY;
        ctx.beginPath();
        ctx.moveTo(150, activeBaselineY);
        ctx.lineTo(450, activeBaselineY);
        ctx.strokeStyle = isMyTurn ? 'rgba(0, 240, 255, 0.7)' : 'rgba(255,255,255,0.05)';
        ctx.lineWidth = isMyTurn ? 4 : 2;
        ctx.shadowBlur = isMyTurn ? 10 : 0;
        ctx.shadowColor = 'var(--secondary)';
        ctx.stroke();
        ctx.shadowBlur = 0; // Reset shadow
      }

      // Draw Pucks
      pucksRef.current.forEach(p => {
        if (!p.active) return;

        // Shadow
        ctx.beginPath();
        ctx.arc(p.x + 2, p.y + 2, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fill();

        // Solid Body
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        if (p.color === 'queen') {
          // Beautiful Red Queen with gradient
          const grad = ctx.createRadialGradient(p.x - 4, p.y - 4, 2, p.x, p.y, p.radius);
          grad.addColorStop(0, '#ff4fa1');
          grad.addColorStop(1, '#9b0047');
          ctx.fillStyle = grad;
        } else if (p.color === 'white') {
          // White Pucks (Cyan theme highlights)
          const grad = ctx.createRadialGradient(p.x - 4, p.y - 4, 2, p.x, p.y, p.radius);
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(1, '#cfd8dc');
          ctx.fillStyle = grad;
        } else {
          // Black Pucks
          const grad = ctx.createRadialGradient(p.x - 4, p.y - 4, 2, p.x, p.y, p.radius);
          grad.addColorStop(0, '#424242');
          grad.addColorStop(1, '#1a1a1a');
          ctx.fillStyle = grad;
        }
        ctx.fill();

        // Ridge lines
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius - 4, 0, Math.PI * 2);
        ctx.strokeStyle = p.color === 'queen' ? 'rgba(255,255,255,0.4)' : p.color === 'white' ? 'rgba(0, 240, 255, 0.3)' : 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Draw Striker
      const striker = strikerRef.current;
      if (striker && striker.active) {
        // Shadow
        ctx.beginPath();
        ctx.arc(striker.x + 3, striker.y + 3, striker.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fill();

        // Glowing Core
        ctx.beginPath();
        ctx.arc(striker.x, striker.y, striker.radius, 0, Math.PI * 2);
        
        const grad = ctx.createRadialGradient(striker.x - 5, striker.y - 5, 3, striker.x, striker.y, striker.radius);
        grad.addColorStop(0, '#00ffff');
        grad.addColorStop(0.4, '#aa3bff');
        grad.addColorStop(1, '#4a0e78');
        ctx.fillStyle = grad;
        ctx.fill();

        // Inner glowing ring
        ctx.beginPath();
        ctx.arc(striker.x, striker.y, striker.radius - 6, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(striker.x, striker.y, striker.radius - 12, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fill();
      }

      // Draw Opponent Aiming Indicator
      if (oppAimX !== null && !isMyTurn && !isSimulatingRef.current) {
        const oppBaselineY = myRole === 'player1' ? 115 : 485;
        ctx.beginPath();
        ctx.arc(oppAimX, oppBaselineY, STRIKER_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(170, 59, 255, 0.15)';
        ctx.strokeStyle = 'rgba(170, 59, 255, 0.5)';
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]); // Reset
      }

      // Draw Aiming Guide Vector (Pull back drag interface)
      if (isAiming && dragStart && dragCurrent && striker) {
        const dx = dragStart.x - dragCurrent.x;
        const dy = dragStart.y - dragCurrent.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Limit maximum shot power
        const maxPower = 180;
        const powerRatio = Math.min(distance / maxPower, 1.0);

        if (distance > 10) {
          const angle = Math.atan2(dy, dx);
          
          // Draw backward force pulling guide
          ctx.beginPath();
          ctx.moveTo(striker.x, striker.y);
          ctx.lineTo(striker.x - Math.cos(angle) * (powerRatio * 70), striker.y - Math.sin(angle) * (powerRatio * 70));
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 3;
          ctx.stroke();

          // Draw forward aiming direction projection line
          ctx.beginPath();
          ctx.moveTo(striker.x, striker.y);
          ctx.lineTo(striker.x + Math.cos(angle) * (powerRatio * 200), striker.y + Math.sin(angle) * (powerRatio * 200));
          ctx.strokeStyle = 'rgba(34, 211, 238, 0.7)';
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 6]);
          ctx.stroke();
          ctx.setLineDash([]); // Reset
          
          // Draw target cursor circle
          ctx.beginPath();
          ctx.arc(striker.x + Math.cos(angle) * (powerRatio * 200), striker.y + Math.sin(angle) * (powerRatio * 200), 8, 0, Math.PI * 2);
          ctx.fillStyle = '#22d3ee';
          ctx.fill();
        }
      }

      // Draw pocket sparks particles
      particlesRef.current.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        p.size *= 0.98;

        if (p.alpha <= 0) {
          particlesRef.current.splice(idx, 1);
          return;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      ctx.restore(); // Restore Rotation

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [myRole, baselineY, isMyTurn, isAiming, dragStart, dragCurrent, oppAimX]);

  // Transform raw mouse clicks to absolute grid coordinates (accounting for 180 deg P2 rotation)
  const getCanvasMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Coordinates inside canvas
    const x = ((e.clientX - rect.left) / rect.width) * BOARD_SIZE;
    const y = ((e.clientY - rect.top) / rect.height) * BOARD_SIZE;

    // Rotate 180 if playing as player2
    if (myRole === 'player2') {
      return { x: BOARD_SIZE - x, y: BOARD_SIZE - y };
    }
    return { x, y };
  };

  // Striker drag position along baseline
  const handleAimSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isMyTurn || isSimulatingRef.current) return;
    const val = parseInt(e.target.value);
    setAimX(val);
    
    if (strikerRef.current) {
      strikerRef.current.x = val;
      strikerRef.current.y = baselineY;
    }
    
    aimStriker(val, baselineY);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isMyTurn || isSimulatingRef.current || !strikerRef.current) return;
    const pos = getCanvasMousePos(e);

    // Verify click is directly on striker to initialize drag-to-aim
    const dx = pos.x - strikerRef.current.x;
    const dy = pos.y - strikerRef.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < STRIKER_RADIUS + 15) {
      setIsAiming(true);
      setDragStart({ x: strikerRef.current.x, y: strikerRef.current.y });
      setDragCurrent({ x: strikerRef.current.x, y: strikerRef.current.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isAiming || !dragStart) return;
    const pos = getCanvasMousePos(e);
    setDragCurrent(pos);
  };

  const handleMouseUp = () => {
    if (!isAiming || !dragStart || !dragCurrent || !strikerRef.current) return;
    
    const dx = dragStart.x - dragCurrent.x;
    const dy = dragStart.y - dragCurrent.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    setIsAiming(false);
    setDragStart(null);
    setDragCurrent(null);

    // Minimum drag threshold to trigger shot
    if (distance > 15) {
      const maxPower = 180;
      const powerRatio = Math.min(distance / maxPower, 1.0);
      const speed = powerRatio * 18; // Speed threshold limit

      const angle = Math.atan2(dy, dx);
      
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      // Apply locally
      strikerRef.current.vx = vx;
      strikerRef.current.vy = vy;
      isSimulatingRef.current = true;

      // Sync shot to Server
      strike(vx, vy, strikerRef.current.x, strikerRef.current.y);
      turnPocketedPuckRef.current = false;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
      
      {/* 2D Canvas Play area */}
      <div style={{
        position: 'relative',
        borderRadius: '24px',
        padding: '8px',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
        border: '1px solid var(--border)',
        boxShadow: isMyTurn ? '0 0 30px var(--secondary-glow)' : 'var(--shadow)',
        transition: 'all 0.3s'
      }}>
        <canvas
          ref={canvasRef}
          width={BOARD_SIZE}
          height={BOARD_SIZE}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            display: 'block',
            borderRadius: '16px',
            cursor: isMyTurn && !isSimulatingRef.current ? 'crosshair' : 'not-allowed',
            maxWidth: '100%',
            height: 'auto'
          }}
        />

        {/* Turn Indicator Floating overlay */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: isMyTurn ? 'rgba(0, 240, 255, 0.9)' : 'rgba(22, 24, 38, 0.85)',
          color: isMyTurn ? '#0a0b10' : 'var(--text-secondary)',
          padding: '6px 16px',
          borderRadius: '20px',
          fontSize: '13px',
          fontWeight: '700',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)',
          pointerEvents: 'none',
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
          letterSpacing: '0.5px'
        }}>
          {isSimulatingRef.current ? 'SIMULATING COLLISION...' : isMyTurn ? 'YOUR SHOT' : "OPPONENT'S SHOT"}
        </div>
      </div>

      {/* Striker Slider Controls */}
      {myRole !== 'spectator' && (
        <div className="glass-panel" style={{
          width: '100%',
          maxWidth: '600px',
          padding: '16px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
            <span>STRIKER POSITIONING</span>
            <span>{isMyTurn && !isSimulatingRef.current ? 'Drag Slider to Place' : 'Locked'}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <input
              type="range"
              min="165"
              max="435"
              value={aimX}
              onChange={handleAimSlider}
              disabled={!isMyTurn || isSimulatingRef.current}
              style={{
                flexGrow: 1,
                accentColor: 'var(--secondary)',
                height: '6px',
                borderRadius: '3px',
                cursor: isMyTurn && !isSimulatingRef.current ? 'pointer' : 'not-allowed',
                background: 'rgba(255,255,255,0.1)',
                outline: 'none'
              }}
            />
          </div>
          {isMyTurn && !isSimulatingRef.current && (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '4px' }}>
              Position striker along baseline, then <b>click & drag back</b> directly on the striker to fire!
            </div>
          )}
        </div>
      )}

    </div>
  );
};
