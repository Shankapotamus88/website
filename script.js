// Snake game code
const canvas = document.getElementById('game');
if (canvas) {
  // —— music setup —— 
  const bgMusic      = document.getElementById('bg-music');
  let musicStarted   = false;

  // —— canvas & game setup ——
  const ctx       = canvas.getContext('2d');
  const tileSize  = 20;
  const tileCount = canvas.width / tileSize;

  let snake = [{ x: 10, y: 10 }];
  let vel   = { x: 0, y: 0 };
  let foods = [randomPos()];
  let score = 0;

  const invincibleUntil = Date.now() + 5000;

  document.addEventListener('keydown', e => {
    // ** start music on first move **
    if (!musicStarted && ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
      if (bgMusic) {
        bgMusic.volume = 0.5;  // adjust volume 0.0–1.0
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
    if (vel.x === 0 && vel.y === 0) return;

    const head = { x: snake[0].x + vel.x, y: snake[0].y + vel.y };
    snake.unshift(head);

    // collisions after invincible window
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

    // spawn a new red piece when any food item rots
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
          // rotten → game over
          alert(`Oh no—you ate rotten food! Game Over. Score: ${score}`);
          resetGame();
          return;
        } else {
          // fresh → grow & respawn that piece
          score++;
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
    // background
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // snake
    ctx.fillStyle = 'lime';
    snake.forEach(s =>
      ctx.fillRect(s.x * tileSize, s.y * tileSize, tileSize, tileSize)
    );

    // foods
    foods.forEach(f => {
      const age = Date.now() - f.spawnTime;
      ctx.fillStyle = age > 5000 ? 'white' : 'red';
      ctx.fillRect(f.x * tileSize, f.y * tileSize, tileSize, tileSize);
    });

    // score
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
    snake         = [{ x: 10, y: 10 }];
    vel           = { x: 0, y: 0 };
    foods         = [randomPos()];
    score         = 0;
    musicStarted  = false;
    // reset music
    if (bgMusic) {
      bgMusic.pause();
      bgMusic.currentTime = 0;
    }
  }

  setInterval(gameLoop, 100);
}
