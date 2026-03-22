import { useEffect, useRef, useState } from 'react';

const GRAVITY = 0.6;
const JUMP_FORCE = -12;
const GROUND_Y = 250;
const FROG_SIZE = 40;
const OBSTACLE_WIDTH = 20;
const MIN_OBSTACLE_GAP = 180;

interface Obstacle {
  x: number;
  height: number;
  id: number;
}

interface Fly {
  x: number;
  y: number;
  active: boolean;
}

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
}

export function ToadRunner({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(
    parseInt(localStorage.getItem('toad_highscore') || '0'),
  );

  const gameState = useRef({
    frogY: GROUND_Y - FROG_SIZE,
    velocity: 0,
    obstacles: [] as Obstacle[],
    stars: [] as Star[],
    flies: [] as Fly[],
    frame: 0,
    speed: 6,
    lastObstacleFrame: 0,
    powerUpCharges: 0,
    lastObstacleId: 0,
  });

  useEffect(() => {
    const stars: Star[] = [];
    for (let i = 0; i < 40; i++) {
      stars.push({
        x: Math.random() * 800,
        y: Math.random() * 180,
        size: Math.random() * 2 + 1,
        opacity: Math.random(),
        speed: 0.01 + Math.random() * 0.02,
      });
    }
    gameState.current.stars = stars;
  }, []);

  const resetGame = () => {
    const currentStars = gameState.current.stars;
    gameState.current = {
      frogY: GROUND_Y - FROG_SIZE,
      velocity: 0,
      obstacles: [],
      stars: currentStars,
      flies: [],
      frame: 0,
      speed: 6,
      lastObstacleFrame: 0,
      powerUpCharges: 0,
      lastObstacleId: 0,
    };
    setScore(0);
    setGameOver(false);
  };

  const jump = () => {
    if (
      gameState.current.frogY >=
      GROUND_Y - (gameState.current.powerUpCharges > 0 ? FROG_SIZE * 1.5 : FROG_SIZE)
    ) {
      gameState.current.velocity = JUMP_FORCE;
    }
    if (gameOver) resetGame();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        jump();
      }
      if (e.code === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const state = gameState.current;
      const isBig = state.powerUpCharges > 0;
      const currentFrogSize = isBig ? FROG_SIZE * 1.5 : FROG_SIZE;

      if (!gameOver) {
        state.frame++;

        // Physics
        state.velocity += GRAVITY;
        state.frogY += state.velocity;
        if (state.frogY > GROUND_Y - currentFrogSize) {
          state.frogY = GROUND_Y - currentFrogSize;
          state.velocity = 0;
        }

        // Speed up
        if (state.frame % 600 === 0) state.speed += 0.5;

        // Spawn Fly
        if (state.frame % 800 === 0 && Math.random() < 0.5) {
          state.flies.push({
            x: canvas.width,
            y: GROUND_Y - 30 - Math.random() * 100,
            active: true,
          });
        }

        // Fly logic
        state.flies.forEach((f) => {
          f.x -= state.speed;
          // Collision with frog
          if (
            f.active &&
            f.x < 50 + currentFrogSize &&
            f.x + 15 > 50 &&
            f.y < state.frogY + currentFrogSize &&
            f.y + 15 > state.frogY
          ) {
            f.active = false;
            state.powerUpCharges = 2; // 2 smashes
          }
        });
        state.flies = state.flies.filter((f) => f.x + 20 > 0 && f.active);

        // Obstacles spawning
        if (
          state.frame - state.lastObstacleFrame > MIN_OBSTACLE_GAP / (state.speed / 6) &&
          Math.random() < 0.03
        ) {
          state.obstacles.push({
            id: ++state.lastObstacleId,
            x: canvas.width,
            height: 35 + Math.random() * 50,
          });
          state.lastObstacleFrame = state.frame;
        }

        // Collision & Smash logic
        state.obstacles.forEach((obs) => {
          obs.x -= state.speed;

          if (
            obs.x < 50 + currentFrogSize - 8 &&
            obs.x + OBSTACLE_WIDTH > 50 + 8 &&
            state.frogY + currentFrogSize > GROUND_Y - obs.height
          ) {
            if (state.powerUpCharges > 0) {
              // SMASH!
              state.powerUpCharges--;
              obs.x = -100; // Destroy obstacle
            } else {
              setGameOver(true);
              if (score > highScore) {
                setHighScore(score);
                localStorage.setItem('toad_highscore', score.toString());
              }
            }
          }
        });

        state.obstacles = state.obstacles.filter((obs) => obs.x + OBSTACLE_WIDTH > 0);
        setScore(Math.floor(state.frame / 10));

        state.stars.forEach((s) => {
          s.opacity += s.speed;
          if (s.opacity > 1 || s.opacity < 0.2) s.speed = -s.speed;
        });
      }

      // Draw
      ctx.fillStyle = '#050f05';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Stars
      state.stars.forEach((s) => {
        ctx.fillStyle = `rgba(45, 255, 110, ${s.opacity})`;
        ctx.fillRect(s.x, s.y, s.size, s.size);
      });

      // Moon
      const mx = 700,
        my = 50;
      ctx.fillStyle = '#2dff6e';
      ctx.beginPath();
      ctx.arc(mx, my, 25, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#050f05';
      ctx.beginPath();
      ctx.arc(mx + 10, my - 5, 22, 0, Math.PI * 2);
      ctx.fill();

      // Ground
      ctx.strokeStyle = '#1a2e1a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y);
      ctx.lineTo(canvas.width, GROUND_Y);
      ctx.stroke();

      // Draw Fly
      state.flies.forEach((f) => {
        ctx.fillStyle = '#e8f5e8'; // White wings
        ctx.fillRect(f.x, f.y, 4, 4);
        ctx.fillRect(f.x + 8, f.y, 4, 4);
        ctx.fillStyle = '#000'; // Black body
        ctx.fillRect(f.x + 4, f.y + 2, 4, 4);
      });

      // Frog Drawing
      const drawFrog = (x: number, y: number, isJumping: boolean, charges: number) => {
        const baseSize = charges > 0 ? FROG_SIZE * 1.5 : FROG_SIZE;
        const s = baseSize / 10;

        ctx.save();
        if (charges > 0) {
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#2dff6e';
        }

        ctx.fillStyle = '#2dff6e';
        // Body
        ctx.fillRect(x + 1 * s, y + 3 * s, 8 * s, 6 * s);
        // Head
        ctx.fillRect(x + 1 * s, y + 1 * s, 3 * s, 3 * s);
        ctx.fillRect(x + 6 * s, y + 1 * s, 3 * s, 3 * s);
        // Pupils
        ctx.fillStyle = '#050f05';
        ctx.fillRect(x + 2 * s, y + 2 * s, 1 * s, 1 * s);
        ctx.fillRect(x + 7 * s, y + 2 * s, 1 * s, 1 * s);
        // Mouth
        ctx.fillRect(x + 3 * s, y + 6 * s, 4 * s, 1 * s);

        ctx.fillStyle = '#1acc50';
        if (isJumping) {
          ctx.fillRect(x + 0 * s, y + 7 * s, 2 * s, 4 * s);
          ctx.fillRect(x + 8 * s, y + 7 * s, 2 * s, 4 * s);
        } else {
          ctx.fillRect(x - 1 * s, y + 7 * s, 3 * s, 2 * s);
          ctx.fillRect(x + 8 * s, y + 7 * s, 3 * s, 2 * s);
        }
        ctx.restore();

        // Display charges if big
        if (charges > 0) {
          ctx.fillStyle = '#2dff6e';
          ctx.font = 'bold 10px "Space Mono"';
          ctx.textAlign = 'center';
          ctx.fillText(`BEAST_MODE: ${charges}`, x + baseSize / 2, y - 10);
        }
      };

      drawFrog(50, state.frogY, state.frogY < GROUND_Y - currentFrogSize, state.powerUpCharges);

      // Obstacles
      ctx.fillStyle = '#ff3b3b';
      state.obstacles.forEach((obs) => {
        ctx.fillRect(obs.x, GROUND_Y - obs.height, OBSTACLE_WIDTH, obs.height);
        ctx.beginPath();
        ctx.moveTo(obs.x + OBSTACLE_WIDTH / 2, GROUND_Y - obs.height - 10);
        ctx.lineTo(obs.x + OBSTACLE_WIDTH / 2, GROUND_Y);
        ctx.strokeStyle = '#ff3b3b';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      if (gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ff3b3b';
        ctx.font = 'bold 24px "Space Mono"';
        ctx.textAlign = 'center';
        ctx.fillText('ENGINE STRESS TEST FAILED', canvas.width / 2, canvas.height / 2 - 20);
        ctx.fillStyle = '#2dff6e';
        ctx.font = '14px "Space Mono"';
        ctx.fillText('PRESS SPACE TO REBOOT ENGINE', canvas.width / 2, canvas.height / 2 + 25);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameOver, highScore, score]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.92)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(8px)',
      }}
      onClick={jump}
    >
      <div
        style={{
          width: '840px',
          padding: '30px',
          border: '1px solid var(--border)',
          background: 'var(--bg)',
          position: 'relative',
          boxShadow: '0 0 50px rgba(45, 255, 110, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            color: 'var(--text-muted)',
            marginBottom: '15px',
            letterSpacing: '0.1em',
          }}
        >
          <span>TOAD-WIRE_STRESS_TEST.sys</span>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--red)',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              fontSize: '14px',
            }}
          >
            [TERMINATE_SESSION]
          </button>
        </div>

        <canvas
          ref={canvasRef}
          width={800}
          height={300}
          style={{
            width: '100%',
            height: '300px',
            border: '1px solid var(--border)',
            display: 'block',
            background: '#050f05',
          }}
        />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '20px',
            fontFamily: 'var(--font-mono)',
            fontSize: '16px',
            fontWeight: 'bold',
          }}
        >
          <span style={{ color: 'var(--green)' }}>SCORE: {score.toString().padStart(6, '0')}</span>
          <span style={{ color: 'var(--text-muted)' }}>
            HI_SCORE: {highScore.toString().padStart(6, '0')}
          </span>
        </div>

        <div
          style={{
            marginTop: '15px',
            fontSize: '11px',
            color: 'var(--text-muted)',
            textAlign: 'center',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.05em',
          }}
        >
          COMMANDS: [SPACE] JUMP / REBOOT · [ESC] EXIT_TEST · EAT FLIES FOR BEAST_MODE
        </div>
      </div>
    </div>
  );
}
