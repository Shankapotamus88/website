// snakes.js
// Snake game with 3 AI snakes and 1 human snake, all spawning in random corners

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

  let humanSnake = [];
  let humanVel   = { x: 0, y: 0 };
  let humanStart = null;

  let aiSnakes = [];
  let foods    = [];
  let score    = 0;
  let gameStarted = false;
  const invincibleUntil = Date.now() + 5000;

  let touchStartX = 0, touchStartY = 0;

  function randomPos() {
    return {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount),
      spawnTime: Date.now()
    };
  }

  function startGame() {
    gameStarted = true;
    score       = 0;
    foods       = [randomPos()];

    // randomize spawn corners
    const corners = [
      { x: 0,             y: 0             },
      { x: tileCount - 1, y: 0             },
      { x: 0,             y: tileCount - 1 },
      { x: tileCount - 1, y: tileCount - 1 }
    ].sort(() => Math.random() - 0.5);

    // human snake in first corner
    humanStart = { ...corners[0] };
    humanSnake = [{ ...humanStart }];
    humanVel   = { x: 0, y: 0 };

    // AI snakes in remaining corners
    aiSnakes = [];
    for (let i = 0; i < 3; i++) {
      aiSnakes.push({
        startPos: { ...corners[i + 1] },
        segments: [{ ...corners[i + 1] }],
        vel:      { x: 0, y: 0 },
        color:    AI_COLORS[i]
      });
    }

    if (highScoreEl) highScoreEl.textContent = `High Score: ${highScore}`;
  }

  function updateHuman() {
    if (!gameStarted || (humanVel.x === 0 && humanVel.y === 0)) return;
    const head = { x: humanSnake[0].x + humanVel.x, y: humanSnake[0].y + humanVel.y };
    humanSnake.unshift(head);

    // collision wall/self/AI
    if (Date.now() >= invincibleUntil) {
      const hitWall = head.x < 0 || head.y < 0 || head.x >= tileCount || head.y >= tileCount;
      const hitSelf = humanSnake.slice(1).some(s => s.x === head.x && s.y === head.y);
      const hitAI   = aiSnakes.some(ai => ai.segments.some(s => s.x === head.x && s.y === head.y));
      if (hitWall || hitSelf || hitAI) {
        alert(`Game Over! Score: ${score}`);
        resetGame();
        return;
      }
    }

    // eating fresh only (rotten handled like death)
    const foodIndex = foods.findIndex(f => f.x === head.x && f.y === head.y);
    if (foodIndex !== -1) {
      const f = foods[foodIndex];
      const age = Date.now() - f.spawnTime;
      foods.splice(foodIndex, 1);
      foods.push(randomPos());
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
    // iterate backwards to allow removal
    for (let i = aiSnakes.length - 1; i >= 0; i--) {
      const ai = aiSnakes[i];
      const head = ai.segments[0];
      if (!head) continue;

      // move toward nearest food
      let target = foods[0], dist = Infinity;
      foods.forEach(f => {
        const d = Math.hypot(f.x - head.x, f.y - head.y);
        if (d < dist) { dist = d; target = f; }
      });
      const dx = target.x - head.x, dy = target.y - head.y;
      ai.vel = Math.abs(dx) > Math.abs(dy) ? { x: dx > 0 ? 1 : -1, y: 0 } : { x: 0, y: dy > 0 ? 1 : -1 };

      const newHead = { x: head.x + ai.vel.x, y: head.y + ai.vel.y };
      ai.segments.unshift(newHead);

      // collision with wall
      if (newHead.x < 0 || newHead.y < 0 || newHead.x >= tileCount || newHead.y >= tileCount) {
        aiSnakes.splice(i, 1);
        continue;
      }
      // collision self
      if (ai.segments.slice(1).some(s => s.x === newHead.x && s.y === newHead.y)) {
        aiSnakes.splice(i, 1);
        continue;
      }
      // collision other AI
      if (aiSnakes.some((other, idx) => idx !== i && other.segments.some(s => s.x === newHead.x && s.y === newHead.y))) {
        aiSnakes.splice(i, 1);
        continue;
      }
      // collision human
      if (humanSnake.some(s => s.x === newHead.x && s.y === newHead.y)) {
        aiSnakes.splice(i, 1);
        continue;
      }

      // eating
      const fi = foods.findIndex(f => f.x === newHead.x && f.y === newHead.y);
      if (fi !== -1) {
        const f = foods[fi]; foods.splice(fi, 1); foods.push(randomPos());
        const age = Date.now() - f.spawnTime;
        if (age > 5000) {
          // ate rotten -> die
          aiSnakes.splice(i, 1);
          continue;
        }
        // fresh -> grow (do not pop)
        continue;
      }

      // normal move: shrink
      ai.segments.pop();
    }
  }

  function draw() {
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw food
    foods.forEach(f => {
      const age = Date.now() - f.spawnTime;
      ctx.fillStyle = age > 5000 ? 'white' : 'red';
      ctx.fillRect(f.x * tileSize, f.y * tileSize, tileSize, tileSize);
    });

    // draw human
    ctx.fillStyle = HUMAN_COLOR;
    humanSnake.forEach(s => ctx.fillRect(s.x * tileSize, s.y * tileSize, tileSize, tileSize));

    // draw AIs
    aiSnakes.forEach(ai => {
      ctx.fillStyle = ai.color;
      ai.segments.forEach(s => ctx.fillRect(s.x * tileSize, s.y * tileSize, tileSize, tileSize));
    });

    // draw score
    ctx.fillStyle = '#fff'; ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, canvas.height - 10);
  }

  function resetGame() {
    musicStarted = false;
    gameStarted   = false;
    if (bgMusic) { bgMusic.pause(); bgMusic.currentTime = 0; }
    startGame();
  }

  // input
  document.addEventListener('keydown', e => {
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
      if (!musicStarted && bgMusic) { bgMusic.volume=0.5; bgMusic.play(); musicStarted=true; }
      if (!gameStarted) startGame();
      if (e.key==='ArrowUp'    && humanVel.y===0) humanVel={x:0,y:-1};
      if (e.key==='ArrowDown'  && humanVel.y===0) humanVel={x:0,y:1};
      if (e.key==='ArrowLeft'  && humanVel.x===0) humanVel={x:-1,y:0};
      if (e.key==='ArrowRight' && humanVel.x===0) humanVel={x:1,y:0};
    }
  });

  canvas.addEventListener('touchstart', e => {
    const t = e.touches[0]; touchStartX = t.clientX; touchStartY = t.clientY;
  }, { passive: true });
  canvas.addEventListener('touchend', e => {
    const t  = e.changedTouches[0];
    const dx = t.clientX - touchStartX, dy = t.clientY - touchStartY;
    if (Math.hypot(dx,dy)>=20) {
      if (Math.abs(dx)>Math.abs(dy) && humanVel.x===0) humanVel={x:dx>0?1:-1,y:0};
      else if (Math.abs(dy)>=Math.abs(dx) && humanVel.y===0) humanVel={x:0,y:dy>0?1:-1};
      if (!gameStarted) startGame();
    }
  }, { passive: true });

  // launch
  startGame();
  setInterval(() => { updateHuman(); updateAI(); draw(); }, 100);
}
