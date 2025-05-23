// Snakes.js
// Attach this script to your existing snakes.html after the canvas element

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const tileSize = 20;
const tileCount = canvas.width / tileSize;
let snakes = [];
let food = { x: 0, y: 0 };
let gameInterval;

function init() {
  const choice = prompt('Select 1 for single player or 2 for two players:');
  const playerCount = parseInt(choice, 10) === 2 ? 2 : 1;
  const startPositions = [
    { x: 2, y: 2 },
    { x: tileCount - 3, y: tileCount - 3 }
  ];

  // Player snakes
  for (let i = 0; i < playerCount; i++) {
    snakes.push({
      segments: [{ ...startPositions[i] }],
      dx: 1,
      dy: 0,
      color: i === 0 ? 'green' : 'purple',
      isPlayer: true,
      alive: true,
      controls: i === 0
        ? { 37: [-1, 0], 38: [0, -1], 39: [1, 0], 40: [0, 1] }
        : { 65: [-1, 0], 87: [0, -1], 68: [1, 0], 83: [0, 1] }
    });
  }

  // AI snakes
  const aiCount = playerCount === 1 ? 3 : 2;
  const aiStarts = [
    { x: tileCount - 3, y: 2 },
    { x: 2, y: tileCount - 3 },
    { x: tileCount - 3, y: tileCount - 3 }
  ];
  for (let i = 0; i < aiCount; i++) {
    snakes.push({
      segments: [{ ...aiStarts[i] }],
      dx: 0,
      dy: 1,
      color: 'blue',
      isPlayer: false,
      alive: true
    });
  }

  spawnFood();
  document.addEventListener('keydown', handleKey);
  gameInterval = setInterval(gameLoop, 100);
}

function spawnFood() {
  food.x = Math.floor(Math.random() * tileCount);
  food.y = Math.floor(Math.random() * tileCount);
}

function handleKey(e) {
  snakes.forEach(s => {
    if (!s.alive || !s.isPlayer) return;
    const move = s.controls[e.keyCode];
    if (move) {
      const [nx, ny] = move;
      // Prevent reversing direction
      if (nx !== -s.dx || ny !== -s.dy) {
        s.dx = nx;
        s.dy = ny;
      }
    }
  });
}

function aiMove(s) {
  const head = s.segments[0];
  const dx = food.x - head.x;
  const dy = food.y - head.y;
  if (Math.abs(dx) > Math.abs(dy)) {
    s.dx = dx > 0 ? 1 : -1;
    s.dy = 0;
  } else {
    s.dy = dy > 0 ? 1 : -1;
    s.dx = 0;
  }
}

function killSnake(s) {
  s.alive = false;
}

function gameOver() {
  clearInterval(gameInterval);
  // Customize your own game-over display here:
  alert('Game Over');
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Move snakes and handle growth
  snakes.forEach(s => {
    if (!s.alive) return;
    if (!s.isPlayer) aiMove(s);
    const head = s.segments[0];
    const newHead = { x: head.x + s.dx, y: head.y + s.dy };
    s.segments.unshift(newHead);

    // Eat food?
    if (newHead.x === food.x && newHead.y === food.y) {
      spawnFood();
    } else {
      s.segments.pop();
    }
  });

  // Collision detection
  snakes.forEach(s => {
    if (!s.alive) return;
    const head = s.segments[0];
    // Wall collision
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
      killSnake(s);
      return;
    }
    // Self collision
    for (let i = 1; i < s.segments.length; i++) {
      if (head.x === s.segments[i].x && head.y === s.segments[i].y) {
        killSnake(s);
        return;
      }
    }
    // Other snakes
    snakes.forEach(o => {
      if (!o.alive || o === s) return;
      o.segments.forEach(seg => {
        if (head.x === seg.x && head.y === seg.y) killSnake(s);
      });
    });
  });

  // Draw food
  ctx.fillStyle = 'red';
  ctx.fillRect(food.x * tileSize, food.y * tileSize, tileSize, tileSize);

  // Draw snakes
  snakes.forEach(s => {
    if (!s.alive) return;
    ctx.fillStyle = s.color;
    s.segments.forEach(seg => {
      ctx.fillRect(seg.x * tileSize, seg.y * tileSize, tileSize, tileSize);
    });
  });

  // End game when no players remain
  const alivePlayers = snakes.filter(s => s.isPlayer && s.alive).length;
  if (alivePlayers === 0) gameOver();
}

// Start game once canvas and script are loaded
window.addEventListener('load', init);
