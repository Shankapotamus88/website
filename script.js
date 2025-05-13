// script.js
const canvas = document.getElementById('game');
const ctx    = canvas.getContext('2d');

const tileSize  = 20;
const tileCount = canvas.width / tileSize;

let snake = [{ x: 10, y: 10 }];
let vel   = { x: 0, y: 0 };
let food  = randomPos();
let score = 0;

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
  const head = { x: snake[0].x + vel.x, y: snake[0].y + vel.y };

  // Check collisions
  if (
    head.x < 0 || head.y < 0 ||
    head.x >= tileCount || head.y >= tileCount ||
    snake.some(s => s.x === head.x && s.y === head.y)
  ) {
    alert(`Game Over! Score: ${score}`);
    snake = [{ x: 10, y: 10 }];
    vel   = { x: 0, y: 0 };
    food  = randomPos();
    score = 0;
    return;
  }

  snake.unshift(head);

  // Eat food
  if (head.x === food.x && head.y === food.y) {
    score++;
    food = randomPos();
  } else {
    snake.pop();
  }
}

function draw() {
  // clear
  ctx.fillStyle = '#222';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // snake
  ctx.fillStyle = 'lime';
  for (let s of snake) {
    ctx.fillRect(s.x * tileSize, s.y * tileSize, tileSize, tileSize);
  }

  // food
  ctx.fillStyle = 'red';
  ctx.fillRect(food.x * tileSize, food.y * tileSize, tileSize, tileSize);

  // score
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

// start
setInterval(gameLoop, 100);
