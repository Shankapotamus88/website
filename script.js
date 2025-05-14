// Snake game code
const canvas = document.getElementById('game');
if (canvas) {
  const ctx       = canvas.getContext('2d');
  const tileSize  = 20;
  const tileCount = canvas.width / tileSize;

  let snake = [{ x: 10, y: 10 }];
  let vel   = { x: 0, y: 0 };
  let food  = randomPos();
  let score = 0;

  // 5-second invincibility on load
  const invincibleUntil = Date.now() + 5000;

  document.addEventListener('keydown', e => {
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
    // don’t move until first keypress
    if (vel.x === 0 && vel.y === 0) return;

    const head = { x: snake[0].x + vel.x, y: snake[0].y + vel.y };
    snake.unshift(head);

    // check collisions after invincibility expires
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

    // handle eating
    if (head.x === food.x && head.y === food.y) {
      const age = Date.now() - food.spawnTime;
      if (age > 5000) {
        // rotten food eaten → game over
        alert(`Oh no—you ate rotten food! Game Over. Score: ${score}`);
        resetGame();
        return;
      } else {
        // good food
        score++;
        food = randomPos();
      }
    } else {
      // just move on
      snake.pop();
    }
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

    // food (red if fresh, white if rotten)
    const age = Date.now() - food.spawnTime;
    ctx.fillStyle = age > 5000 ? 'white' : 'red';
    ctx.fillRect(food.x * tileSize, food.y * tileSize, tileSize, tileSize);

    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, canvas.height - 10);
  }

  function randomPos() {
    return {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount),
      spawnTime: Date.now()
    };
  }

  function resetGame() {
    snake = [{ x: 10, y: 10 }];
    vel   = { x: 0, y: 0 };
    food  = randomPos();
    score = 0;
  }

  setInterval(gameLoop, 100);
}
