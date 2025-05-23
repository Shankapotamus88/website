// snakes.js
// Snake game with 3 AI snakes and 1 human snake, initialized at load, game starts on first keypress

const canvas = document.getElementById('game');
if (!canvas) {
  console.error('Canvas element not found');
} else {
  const ctx       = canvas.getContext('2d');
  const tileSize  = 20;
  const tileCount = canvas.width / tileSize;

  const bgMusic    = document.getElementById('bg-music');
  let musicStarted = false;

  const highScoreEl = document.getElementById('high-score');
  let highScore      = parseInt(localStorage.getItem('snake-highscore') || '0', 10);
  if (highScoreEl) highScoreEl.textContent = `High Score: ${highScore}`;

  const HUMAN_COLOR = 'lime';
  const AI_COLORS   = ['cyan', 'magenta', 'orange'];

  let humanSnake  = [];
  let humanVel    = { x: 0, y: 0 };
  let aiSnakes    = [];
  let foods       = [];
  let score       = 0;
  let gameStarted = false;
  let invincibleUntil = 0;
  let touchStartX = 0, touchStartY = 0;

  function randomPos() {
    return {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount),
      spawnTime: Date.now(),
      spawnedNew: false
    };
  }

  function isCellSafe(x, y) {
    if (x < 0 || y < 0 || x >= tileCount || y >= tileCount) return false;
    if (humanSnake.some(seg => seg.x === x && seg.y === y)) return false;
    for (const ai of aiSnakes) {
      if (ai.segments.some(seg => seg.x === x && seg.y === y)) return false;
    }
    for (const f of foods) {
      if (f.x === x && f.y === y && Date.now() - f.spawnTime > 5000) return false;
    }
    return true;
  }

  function initPositions() {
    const corners = [
      { x: 0, y: 0 },
      { x: tileCount - 1, y: 0 },
      { x: 0, y: tileCount - 1 },
      { x: tileCount - 1, y: tileCount - 1 }
    ].sort(() => Math.random() - 0.5);

    humanSnake = [{ ...corners[0] }];
    humanVel   = { x: 0, y: 0 };

    aiSnakes = corners.slice(1).map((c, i) => ({
      segments: [{ ...c }],
      vel: { x: 0, y: 0 },
      color: AI_COLORS[i]
    }));
  }

  function startGame() {
    gameStarted = true;
    score = 0;
    invincibleUntil = Date.now() + 5000;
    foods = [randomPos()];
    if (highScoreEl) highScoreEl.textContent = `High Score: ${highScore}`;
  }

  function spawnFreshFood() {
    foods.forEach(f => {
      if (!f.spawnedNew && Date.now() - f.spawnTime > 5000) {
        foods.push(randomPos());
        f.spawnedNew = true;
      }
    });
  }

  function updateHuman() {
    if (!gameStarted || (humanVel.x === 0 && humanVel.y === 0)) return;
    const head = { x: humanSnake[0].x + humanVel.x, y: humanSnake[0].y + humanVel.y };
    humanSnake.unshift(head);

    if (Date.now() >= invincibleUntil && !isCellSafe(head.x, head.y)) {
      alert(`Game Over! Score: ${score}`);
      resetGame();
      return;
    }

    spawnFreshFood();

    const idx = foods.findIndex(f => f.x === head.x && f.y === head.y);
    if (idx !== -1) {
      const f = foods[idx];
      foods.splice(idx, 1);
      foods.push(randomPos());
      const age = Date.now() - f.spawnTime;
      if (age > 5000) {
        alert(`Oh no—you ate rotten food! Game Over. Score: ${score}`);
        resetGame();
        return;
      } else {
        score++;
        if (score > highScore) {
          highScore = score;
          localStorage.setItem('snake-highscore', highScore);
          if (highScoreEl) highScoreEl.textContent = `High Score: ${highScore}`;
        }
      }
    } else {
      humanSnake.pop();
    }
  }

  function updateAI() {
    if (!gameStarted) return;
    for (let i = aiSnakes.length - 1; i >= 0; i--) {
      const ai = aiSnakes[i];
      const head = ai.segments[0];
      if (!head) continue;

      spawnFreshFood();

      let target = null;
      let minD = Infinity;
      foods.forEach(f => {
        const age = Date.now() - f.spawnTime;
        if (age <= 5000) {
          const d = Math.hypot(f.x - head.x, f.y - head.y);
          if (d < minD) {
            minD = d;
            target = f;
          }
        }
      });
      if (!target) target = foods[0];

      const moves = [
        { x: head.x + 1, y: head.y },
        { x: head.x - 1, y: head.y },
        { x: head.x, y: head.y + 1 },
        { x: head.x, y: head.y - 1 }
      ];
      moves.sort((a, b) =>
        Math.hypot(a.x - target.x, a.y - target.y) - Math.hypot(b.x - target.x, b.y - target.y)
      );

      let moved = false;
      for (const m of moves) {
        if (isCellSafe(m.x, m.y)) {
          ai.vel = { x: m.x - head.x, y: m.y - head.y };
          ai.segments.unshift(m);
          moved = true;
          break;
        }
      }
      if (!moved) {
        aiSnakes.splice(i, 1);
        continue;
      }

      const newHead = ai.segments[0];
      const fi = foods.findIndex(f => f.x === newHead.x && f.y === newHead.y);
      if (fi !== -1) {
        const f = foods[fi];
        foods.splice(fi, 1);
        foods.push(randomPos());
        const age = Date.now() - f.spawnTime;
        if (age > 5000) {
          aiSnakes.splice(i, 1);
          continue;
        }
        continue;
      }
      ai.segments.pop();
    }
  }

  function draw() {
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    foods.forEach(f => {
      const age = Date.now() - f.spawnTime;
      ctx.fillStyle = age > 5000 ? 'white' : 'red';
      ctx.fillRect(f.x * tileSize, f.y * tileSize, tileSize, tileSize);
    });

    ctx.fillStyle = HUMAN_COLOR;
    humanSnake.forEach(seg =>
      ctx.fillRect(seg.x * tileSize, seg.y * tileSize, tileSize, tileSize)
    );

    aiSnakes.forEach(ai => {
      ctx.fillStyle = ai.color;
      ai.segments.forEach(seg =>
        ctx.fillRect(seg.x * tileSize, seg.y * tileSize, tileSize, tileSize)
      );
    });

    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, canvas.height - 10);
  }

  function resetGame() {
    musicStarted = false;
    gameStarted = false;
    if (bgMusic) {
      bgMusic.pause();
      bgMusic.currentTime = 0;
    }
    initPositions();
  }

  document.addEventListener('keydown', e => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      if (!musicStarted && bgMusic) {
        bgMusic.volume = 0.5;
        bgMusic.play();
        musicStarted = true;
      }
      if (!gameStarted) startGame();
      else {
        if (e.key === 'ArrowUp' && humanVel.y === 0) humanVel = { x: 0, y: -1 };
        if (e.key === 'ArrowDown' && humanVel.y === 0) humanVel = { x: 0, y: 1 };
        if (e.key === 'ArrowLeft' && humanVel.x === 0) humanVel = { x: -1, y: 0 };
        if (e.key === 'ArrowRight' && humanVel.x === 0) humanVel = { x: 1, y: 0 };
      }
    }
  });

  canvas.addEventListener('touchstart', e => {
    const t = e.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
  }, { passive: true });

  canvas.addEventListener('touchend', e => {
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;
    if (Math.hypot(dx, dy) >= 20) {
      if (!gameStarted) startGame();
      else if (Math.abs(dx) > Math.abs(dy) && humanVel.x === 0) {
        humanVel = { x: dx > 0 ? 1 : -1, y: 0 };
      } else if (Math.abs(dy) >= Math.abs(dx) && humanVel.y === 0) {
        humanVel = { x: 0, y: dy > 0 ? 1 : -1 };
      }
    }
  }, { passive: true });

  // Initial load: place snakes and draw
  initPositions();
  draw();

  // Main game loop
  setInterval(() => {
    updateHuman();
    updateAI();
    draw();
  }, 100);
}
