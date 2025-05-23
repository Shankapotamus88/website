// snakes.js
// Snake game with 3 AI snakes and 1 human snake, all spawning in random corners

const canvas = document.getElementById('game');
if (!canvas) {
  console.error('Canvas element not found');
} else {
  const ctx       = canvas.getContext('2d');
  const tileSize  = 20;
  const tileCount = canvas.width / tileSize;

  const bgMusic      = document.getElementById('bg-music');
  let musicStarted   = false;

  const highScoreEl = document.getElementById('high-score');
  let highScore      = parseInt(localStorage.getItem('snake-highscore') || '0', 10);
  if (highScoreEl) highScoreEl.textContent = `High Score: ${highScore}`;

  const HUMAN_COLOR = 'lime';
  const AI_COLORS   = ['cyan', 'magenta', 'orange'];

  let humanSnake = [];
  let humanVel   = { x: 0, y: 0 };
  let humanStart = null;

  let aiSnakes   = [];
  let foods      = [];
  let score      = 0;
  const invincibleUntil = Date.now() + 5000;
  let gameStarted       = false;

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

    // randomize corners
    const corners = [
      { x: 0,              y: 0              },
      { x: tileCount - 1,  y: 0              },
      { x: 0,              y: tileCount - 1  },
      { x: tileCount - 1,  y: tileCount - 1  }
    ].sort(() => Math.random() - 0.5);

    // human snake at first corner
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

    // update high score display
    if (highScoreEl) highScoreEl.textContent = `High Score: ${highScore}`;
  }

  function updateHuman() {
    if (!gameStarted || (humanVel.x === 0 && humanVel.y === 0)) return;
    if (!humanSnake.length) return;

    const head = { x: humanSnake[0].x + humanVel.x, y: humanSnake[0].y + humanVel.y };
    humanSnake.unshift(head);

    // wall & self collision
    if (Date.now() >= invincibleUntil) {
      const hitWall = head.x < 0 || head.y < 0 || head.x >= tileCount || head.y >= tileCount;
      const hitSelf = humanSnake.slice(1).some(seg => seg.x === head.x && seg.y === head.y);
      const hitAI   = aiSnakes.some(s => s.segments.some(seg => seg.x === head.x && seg.y === head.y));
      if (hitWall || hitSelf || hitAI) {
        alert(`Game Over! Score: ${score}`);
        resetGame();
        return;
      }
    }

    const ateFresh = handleEating(humanSnake, true);
    if (!ateFresh) humanSnake.pop();
  }

  function updateAI() {
    if (!gameStarted) return;
    aiSnakes.forEach(snakeObj => {
      const head = snakeObj.segments[0];
      if (!head) return;

      // simple AI: move toward nearest food
      let target = foods[0];
      let minDist = Infinity;
      foods.forEach(f => {
        const d = Math.hypot(f.x - head.x, f.y - head.y);
        if (d < minDist) { minDist = d; target = f; }
      });
      const dx = target.x - head.x, dy = target.y - head.y;
      snakeObj.vel = Math.abs(dx) > Math.abs(dy)
        ? { x: dx > 0 ? 1 : -1, y: 0 }
        : { x: 0, y: dy > 0 ? 1 : -1 };

      // move
      const newHead = { x: head.x + snakeObj.vel.x, y: head.y + snakeObj.vel.y };
      snakeObj.segments.unshift(newHead);

      // collision detection
      const collidedSelf = snakeObj.segments.slice(1).some(seg => seg.x === newHead.x && seg.y === newHead.y);
      const collidedHuman = humanSnake.some(seg => seg.x === newHead.x && seg.y === newHead.y);
      const collidedOtherAI = aiSnakes.some(other =>
        other !== snakeObj && other.segments.some(seg => seg.x === newHead.x && seg.y === newHead.y)
      );
      if (collidedSelf || collidedHuman || collidedOtherAI) {
        // respawn this AI
        snakeObj.segments = [{ ...snakeObj.startPos }];
        snakeObj.vel = { x: 0, y: 0 };
        return;
      }

      // eating
      const ateFresh = handleEating(snakeObj.segments, false);
      if (!ateFresh) snakeObj.segments.pop();
    });
  }

  function handleEating(snakeArr, isHuman) {
    const head = snakeArr[0];
    for (let i = 0; i < foods.length; i++) {
      const f = foods[i];
      if (head.x === f.x && head.y === f.y) {
        const age = Date.now() - f.spawnTime;
        const rotten = age > 5000;
        if (rotten && isHuman) {
          alert(`Oh no—you ate rotten food! Game Over. Score: ${score}`);
          resetGame();
        }
        if (!rotten && isHuman) {
          score++;
          if (score > highScore) {
            highScore = score;
            localStorage.setItem('snake-highscore', highScore);
          }
        }
        foods.splice(i, 1);
        foods.push(randomPos());
        return true;
      }
    }
    return false;
  }

  function draw() {
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw food
    foods.forEach(f => {
      const age = gameStarted ? Date.now() - f.spawnTime : 0;
      ctx.fillStyle = age > 5000 ? 'white' : 'red';
      ctx.fillRect(f.x * tileSize, f.y * tileSize, tileSize, tileSize);
    });

    // draw human snake
    ctx.fillStyle = HUMAN_COLOR;
    humanSnake.forEach(seg =>
      ctx.fillRect(seg.x * tileSize, seg.y * tileSize, tileSize, tileSize)
    );

    // draw AI snakes
    aiSnakes.forEach(snakeObj => {
      ctx.fillStyle = snakeObj.color;
      snakeObj.segments.forEach(seg =>
        ctx.fillRect(seg.x * tileSize, seg.y * tileSize, tileSize, tileSize)
      );
    });

    // draw score
    ctx.fillStyle = '#fff';
    ctx.font      = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, canvas.height - 10);
  }

  function resetGame() {
    musicStarted = false;
    gameStarted   = false;
    if (bgMusic) {
      bgMusic.pause();
      bgMusic.currentTime = 0;
    }
    startGame();
  }

  // input handlers
  document.addEventListener('keydown', e => {
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
      if (!musicStarted && bgMusic) { bgMusic.volume = 0.5; bgMusic.play(); musicStarted = true; }
      if (!gameStarted) startGame();
      if (e.key === 'ArrowUp'    && humanVel.y === 0) humanVel = { x:0, y:-1 };
      if (e.key === 'ArrowDown'  && humanVel.y === 0) humanVel = { x:0, y: 1 };
      if (e.key === 'ArrowLeft'  && humanVel.x === 0) humanVel = { x:-1,y:0 };
      if (e.key === 'ArrowRight' && humanVel.x === 0) humanVel = { x: 1,y:0 };
    }
  });

  canvas.addEventListener('touchstart', e => {
    const t = e.touches[0];
    touchStartX = t.clientX; touchStartY = t.clientY;
  }, { passive: true });

  canvas.addEventListener('touchend', e => {
    const t  = e.changedTouches[0];
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;
    if (Math.hypot(dx,dy) >= 20) {
      if (Math.abs(dx) > Math.abs(dy) && humanVel.x===0) humanVel = { x: dx>0?1:-1, y:0 };
      else if (Math.abs(dy) >= Math.abs(dx) && humanVel.y===0) humanVel = { x:0, y: dy>0?1:-1 };
      if (!gameStarted) startGame();
    }
  }, { passive: true });

  // start everything
  startGame();
  setInterval(() => {
    updateHuman();
    updateAI();
    draw();
  }, 100);
}
