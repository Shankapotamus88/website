// script.js

// 1) Global visitor counter via Abacus
const visitEl = document.getElementById('visit-count');
if (visitEl) {
  fetch('https://abacus.jasoncameron.dev/hit/shankapotamus88/visitor')
    .then(r => {
      if (!r.ok) throw new Error(r.statusText);
      return r.json();
    })
    .then(data => {
      visitEl.textContent = `Total visits: ${data.value}`;
    })
    .catch(err => {
      console.error('Abacus error:', err);
      visitEl.textContent = 'Visits unavailable';
    });
}

// 2) Snake game code
const canvas = document.getElementById('game');
if (canvas) {
  // —— music setup —— 
  const bgMusic      = document.getElementById('bg-music');
  let musicStarted   = false;

  // —— high score setup ——  
  const highScoreEl = document.getElementById('high-score');
  let highScore = parseInt(localStorage.getItem('snake-highscore') || '0', 10);
  if (highScoreEl) {
    highScoreEl.textContent = `High Score: ${highScore}`;
  }

  // —— canvas & game setup ——  
  const ctx       = canvas.getContext('2d');
  const tileSize  = 20;
  const tileCount = canvas.width / tileSize;

  let snake = [{ x: 10, y: 10 }];
  let vel   = { x: 0, y: 0 };
  let foods = [randomPos()];
  let score = 0;

  const invincibleUntil = Date.now() + 5000;

  // —— touch support ——  
  let touchStartX = 0, touchStartY = 0;
  canvas.addEventListener('touchstart', e => {
    const t = e.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
  }, { passive: true });

  canvas.addEventListener('touchend', e => {
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;

    // ignore tiny taps
    if (Math.hypot(dx, dy) < 20) return;

    // determine swipe direction
    if (Math.abs(dx) > Math.abs(dy)) {
      // horizontal swipe
      if (dx > 0 && vel.x === 0)       vel = { x:  1, y:  0 }; // right
      else if (dx < 0 && vel.x === 0)  vel = { x: -1, y:  0 }; // left
    } else {
      // vertical swipe
      if (dy > 0 && vel.y === 0)       vel = { x:  0, y:  1 }; // down
      else if (dy < 0 && vel.y === 0)  vel = { x:  0, y: -1 }; // up
    }
  }, { passive: true });

  document.addEventListener('keydown', e => {
    // ** start music on first move **
    if (!musicStarted && ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
      if (bgMusic) {
        bgMusic.volume = 0.5;
        bgMusic.play();
      }
      musicStarted = true;
    }

    // ** snake controls **
    if (e.key === 'ArrowUp'    && vel.y === 0) vel = { x: 0,  y: -1 };
    if (e.key === 'ArrowDown'  && vel.y === 0) vel = { x: 0,  y:  1 };
    if (e.key === 'ArrowLeft'  && vel.x === 0) vel = { x: -1, y:  0 };
    if (e.key === 'ArrowRight' && vel.x === 0) vel = { x:  1, y:  0 };
  });

  function gameLoop() {
    update();
    draw();
  }

  function update() {
    if (vel.x === 0 && vel.y === 0) return;  // wait for first move

    // advance head
    const head = { x: snake[0].x + vel.x, y: snake[0].y + vel.y };
    snake.unshift(head);

    // collision (after invincibility)
    if (Date.now() >= invincibleUntil) {
      const hitWall = head.x < 0 || head.y < 0
                   || head.x >= tileCount || head.y >= tileCount;
      const hitSelf = snake.slice(1)
                            .some(seg => seg.x === head.x && seg.y === head.y);
      if (hitWall || hitSelf) {
        alert(`Game Over! Score: ${score}`);
        resetGame();
        return;
      }
    }

    // spawn fresh food when any item rots
    foods.forEach(f => {
      if (!f.spawnedNew && (Date.now() - f.spawnTime) > 5000) {
        foods.push(randomPos());
        f.spawnedNew = true;
      }
    });

    let ateFresh = false;

    // eating logic
    for (let i = 0; i < foods.length; i++) {
      const f = foods[i];
      if (head.x === f.x && head.y === f.y) {
        const age = Date.now() - f.spawnTime;
        if (age > 5000) {
          alert(`Oh no—you ate rotten food! Game Over. Score: ${score}`);
          resetGame();
          return;
        } else {
          // fresh → grow & respawn
          score++;
          if (score > highScore) {
            highScore = score;
            localStorage.setItem('snake-highscore', highScore);
            if (highScoreEl) highScoreEl.textContent = `High Score: ${highScore}`;
          }
          foods.splice(i, 1);
          foods.push(randomPos());
          ateFresh = true;
        }
        break;
      }
    }

    // only shrink tail if we didn't eat fresh
    if (!ateFresh) snake.pop();
  }

  function draw() {
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw snake
    ctx.fillStyle = 'lime';
    snake.forEach(s =>
      ctx.fillRect(s.x * tileSize, s.y * tileSize, tileSize, tileSize)
    );

    // draw foods
    foods.forEach(f => {
      const age = Date.now() - f.spawnTime;
      ctx.fillStyle = age > 5000 ? 'white' : 'red';
      ctx.fillRect(f.x * tileSize, f.y * tileSize, tileSize, tileSize);
    });

    // draw score
    ctx.fillStyle = '#fff';
    ctx.font      = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, canvas.height - 10);
  }

  function randomPos() {
    return {
      x:          Math.floor(Math.random() * tileCount),
      y:          Math.floor(Math.random() * tileCount),
      spawnTime:  Date.now(),
      spawnedNew: false
    };
  }

  function resetGame() {
    snake        = [{ x: 10, y: 10 }];
    vel          = { x: 0, y: 0 };
    foods        = [randomPos()];
    score        = 0;
    musicStarted = false;
    if (bgMusic) {
      bgMusic.pause();
      bgMusic.currentTime = 0;
    }
    // high score persists
  }

  setInterval(gameLoop, 100);
}
