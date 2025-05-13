// script.js

// --- visitor counter (CountAPI) ---
fetch('https://api.countapi.xyz/hit/snake-game-example/visitor')
  .then(res => res.json())
  .then(data => {
    document.getElementById('visit-count').textContent =
      `Total visits: ${data.value}`;
  })
  .catch(err => console.error('Counter error:', err));

// --- rest of your Snake game code ---
const canvas = document.getElementById('game');
const ctx    = canvas.getContext('2d');

const tileSize  = 20;
const tileCount = canvas.width / tileSize;

let snake = [{ x: 10, y: 10 }];
let vel   = { x: 0, y: 0 };
let food  = randomPos();
let score = 0;

// 5-second invincibility
const invincibleUntil = Date.now() + 5000;

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowUp'    && vel.y === 0) vel = { x: 0, y: -1 };
  if (e.key === 'ArrowDown'  && vel.y === 0) vel = { x: 0, y:  1 };
  if (e.key === 'ArrowLeft'  && vel.x === 0) vel = { x: -1, y: 0 };
  if (e.key === 'ArrowRight' && vel.x === 0) vel = { x:  1, y: 0 };
});

function gameLoop() {
  update();
  draw();
}

function update() {
  if (vel.x === 0 && vel.y === 0) return; // don’t move until keypress

  const head = { x: snake[0].x + vel.x, y: snake[0].y + vel.y };
  snake.unshift(head);

  if (Date.now() >= invincibleUntil) {
    const hitWall = head.x < 0 || head.y < 0 || head.x >= tileCount || head.y >= tileCount;
    const hitSelf = snake.slice(1).some(seg => seg.x === head.x && seg.y === head.y);
    if (hitWall || hitSelf) {
      alert(`Game Over! Score: ${score}`);
      resetGame();
      return;
    }
  }

  if (head.x === food.x && head.y === food.y) {
    score++;
    food = randomPos();
  } else {
    snake.pop();
  }
}

function draw() {
  ctx.fillStyle = '#222';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'lime';
  snake.forEach(s => ctx.fillRect(s.x * tileSize, s.y * tileSize, tileSize, tileSize));

  ctx.fillStyle = 'red';
  ctx.fillRect(food.x * tileSize, food.y * tileSize, tileSize, tileSize);

  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.fillText(`Score: ${score}`, 10, canvas.height - 10);
}

function randomPos() {
  return {
    x: Math.floor(Math.random() * tileCount),
    y: Math.floor(Math.random() * tileCount)
  };
}

function resetGame() {
  snake = [{ x: 10, y: 10 }];
  vel   = { x: 0, y: 0 };
  food  = randomPos();
  score = 0;
}

setInterval(gameLoop, 100);
