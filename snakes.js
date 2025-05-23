// Snake game with 3 AI snakes seeking food
const canvas = document.getElementById('game');
if (canvas) {
  // —— music setup ——
  const bgMusic      = document.getElementById('bg-music');
  let musicStarted   = false;

  // —— high score setup ——
  const highScoreEl = document.getElementById('high-score');
  let highScore = parseInt(localStorage.getItem('snake-highscore') || '0', 10);
  if (highScoreEl) highScoreEl.textContent = `High Score: ${highScore}`;

  // —— canvas & game setup ——
  const ctx       = canvas.getContext('2d');
  const tileSize  = 20;
  const tileCount = canvas.width / tileSize;

  // —— player snake ——
  let humanSnake = [{ x: Math.floor(tileCount/2), y: Math.floor(tileCount/2) }];
  let humanVel   = { x: 0, y: 0 };
  let score      = 0;

  // —— AI snakes ——
  const aiSnakes = [
    { segments: [{ x: 0, y: 0 }],                   vel: { x: 1,  y: 0 }, color: 'cyan'    },
    { segments: [{ x: tileCount-1, y: 0 }],          vel: { x: -1, y: 0 }, color: 'magenta' },
    { segments: [{ x: 0, y: tileCount-1 }],          vel: { x: 0,  y: -1}, color: 'orange'  }
  ];

  // —— food setup ——
  let foods = [ randomPos() ];
  let gameStarted = false;
  const invincibleUntil = Date.now() + 5000;

  // —— touch support ——
  let touchStartX = 0, touchStartY = 0;
  canvas.addEventListener('touchstart', e => {
    const t = e.touches[0]; touchStartX = t.clientX; touchStartY = t.clientY;
  }, { passive: true });
  canvas.addEventListener('touchend', e => {
    const t = e.changedTouches[0]; const dx = t.clientX - touchStartX, dy = t.clientY - touchStartY;
    if (Math.hypot(dx, dy) < 20) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0 && humanVel.x === 0) humanVel = { x: 1, y: 0 };
      else if (dx < 0 && humanVel.x === 0) humanVel = { x: -1, y: 0 };
    } else {
      if (dy > 0 && humanVel.y === 0) humanVel = { x: 0, y: 1 };
      else if (dy < 0 && humanVel.y === 0) humanVel = { x: 0, y: -1 };
    }
    if (!gameStarted) startGame();
  }, { passive: true });

  document.addEventListener('keydown', e => {
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
      if (!musicStarted && bgMusic) { bgMusic.volume = 0.5; bgMusic.play(); musicStarted = true; }
      if (!gameStarted) startGame();
    }
    if (e.key === 'ArrowUp'    && humanVel.y === 0) humanVel = { x: 0, y: -1 };
    if (e.key === 'ArrowDown'  && humanVel.y === 0) humanVel = { x: 0, y:  1 };
    if (e.key === 'ArrowLeft'  && humanVel.x === 0) humanVel = { x: -1, y: 0 };
    if (e.key === 'ArrowRight' && humanVel.x === 0) humanVel = { x:  1, y: 0 };
  });

  function startGame() {
    gameStarted = true;
    foods = [randomPos()];
    aiSnakes.forEach(s => s.segments = [ {...s.segments[0]} ]);
  }

  function updateHuman() {
    if (humanVel.x === 0 && humanVel.y === 0) return;
    const head = { x: humanSnake[0].x + humanVel.x, y: humanSnake[0].y + humanVel.y };
    humanSnake.unshift(head);
    if (Date.now() >= invincibleUntil) {
      const hitWall = head.x < 0 || head.y < 0 || head.x >= tileCount || head.y >= tileCount;
      const hitSelf = humanSnake.slice(1).some(seg => seg.x === head.x && seg.y === head.y);
      if (hitWall || hitSelf) { alert(`Game Over! Score: ${score}`); resetGame(); return; }
    }
    let ateFresh = false;
    for (let i = 0; i < foods.length; i++) {
      const f = foods[i];
      if (head.x === f.x && head.y === f.y) {
        const age = Date.now() - f.spawnTime;
        if (age > 5000) { alert(`Oh no—you ate rotten food! Game Over. Score: ${score}`); resetGame(); return; }
        score++; humanSnake.pop(); foods[i] = randomPos(); ateFresh = true; break;
      }
    }
    if (!ateFresh) humanSnake.pop();
  }

  function updateAI() {
    aiSnakes.forEach(snakeObj => {
      const head = snakeObj.segments[0];
      let target = foods[0], minDist = Infinity;
      foods.forEach(f => { const d = Math.hypot(f.x - head.x, f.y - head.y); if (d < minDist) { minDist = d; target = f; }});
      const dx = target.x - head.x, dy = target.y - head.y;
      snakeObj.vel = Math.abs(dx) > Math.abs(dy) ? { x: dx>0?1:-1, y:0 } : { x:0, y: dy>0?1:-1 };
      const newHead = { x: head.x + snakeObj.vel.x, y: head.y + snakeObj.vel.y };
      snakeObj.segments.unshift(newHead);
      const ateFresh = foods.some((f,i) => {
        if (newHead.x === f.x && newHead.y === f.y && Date.now() - f.spawnTime <= 5000) { foods[i] = randomPos(); return true; }
        return false;
      });
      if (!ateFresh) snakeObj.segments.pop();
    });
  }

  function draw() {
    ctx.fillStyle = '#222'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (const f of foods) { ctx.fillStyle = (Date.now() - f.spawnTime > 5000) ? 'white' : 'red'; ctx.fillRect(f.x*tileSize, f.y*tileSize, tileSize, tileSize); }
    ctx.fillStyle = 'lime'; humanSnake.forEach(s => ctx.fillRect(s.x*tileSize, s.y*tileSize, tileSize, tileSize));
    ['cyan','magenta','orange'].forEach((c,i) => { ctx.fillStyle = c; aiSnakes[i].segments.forEach(s => ctx.fillRect(s.x*tileSize,s.y*tileSize,tileSize,tileSize)); });
    ctx.fillStyle = '#fff'; ctx.font = '16px sans-serif'; ctx.fillText(`Score: ${score}`, 10, canvas.height - 10);
  }

  function resetGame() { humanSnake = [{ x: Math.floor(tileCount/2), y: Math.floor(tileCount/2) }]; aiSnakes.forEach((s,i) => s.segments = [{ x: i===0?0:tileCount-1, y: i===1?0:tileCount-1 }]); score = 0; gameStarted=false; }

  setInterval(() => { updateHuman(); updateAI(); draw(); }, 100);
}
