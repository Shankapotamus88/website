// script.js

// 1) Global visitor counter via Abacus
const visitEl = document.getElementById('visit-count');
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

// 2) High score (localStorage)
const highScoreEl = document.getElementById('high-score');
let highScore = parseInt(localStorage.getItem('snakeHighScore') || '0', 10);
highScoreEl.textContent = `High Score: ${highScore}`;

// 3) Snake game code
const canvas = document.getElementById('game');
const ctx    = canvas.getContext('2d');

const tileSize  = 20;
const tileCount = canvas.width / tileSize;

let snake = [{ x: 10, y: 10 }];
let vel   = { x: 0, y: 0 };
let food  = randomPos();
let score = 0;

// 5-second invincibility on load
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
  // Don't move until first keypress
  if (vel.x === 0 && vel.y === 0) return;

  const head = { x: snake[0].x + vel.x, y: snake[0].y + vel.y };
  snake.unshift(head);

  // Check collisions after invincibility expires
  if (Date.now() >= invincibleUntil) {
    const hitWall = head.x < 0 || head.y < 0 || head.x >= tileCount || head.y >= tileCount;
    const hitSelf = snake.slice(1).some(seg => seg.x === head.x && seg.y === head.y);
    if (hitWall || hitSelf) {
      // Update high score if beaten
      if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        highScoreEl.textContent = `High Score: ${highScore}`;
      }
      alert(`Game Over! Score: ${score}`);
      resetGame();
      return;
    }
  }

  // Eat food or move on
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
  snake.forEach(s => 
    ctx.fillRect(s.x * tileSize, s.y * tileSize, tileSize, tileSize)
  );

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
