// space.js — Geometry Wars–style Space Game
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const bgMusic = document.getElementById('bg-music');
let musicStarted = false;

// High Score setup
const highScoreEl = document.getElementById('high-score');
let highScore = parseInt(localStorage.getItem('space-highscore') || '0', 10);
highScoreEl.textContent = `High Score: ${highScore}`;

// World dimensions (50% larger than viewport)
const worldWidth = canvas.width * 1.5;
const worldHeight = canvas.height * 1.5;

// Game state
const keys = {};
let projectiles = [];
let enemies = [];
let stars = [];
let score = 0;
let gameOver = false;

// Spawn timing
let spawnDelay = 5000;
let lastSpawn = Date.now();
let spawnCount = 1;

// Player setup
const player = {
  x: worldWidth / 2,
  y: worldHeight / 2,
  size: 20,
  speed: 5,
  color: 'green'
};

// Create starfield
for (let i = 0; i < 200; i++) {
  stars.push({ x: Math.random() * worldWidth, y: Math.random() * worldHeight });
}

function drawStars() {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'white';
  stars.forEach(s => {
    const dx = s.x - player.x + canvas.width / 2;
    const dy = s.y - player.y + canvas.height / 2;
    if (dx >= 0 && dx < canvas.width && dy >= 0 && dy < canvas.height) {
      ctx.fillRect(dx, dy, 1, 1);
    }
  });
}

function drawPlayer() {
  const px = canvas.width / 2 - player.size / 2;
  const py = canvas.height / 2 - player.size / 2;
  ctx.fillStyle = player.color;
  ctx.fillRect(px, py, player.size, player.size);
}

function movePlayer() {
  if (keys['w'] || keys['W']) player.y -= player.speed;
  if (keys['s'] || keys['S']) player.y += player.speed;
  if (keys['a'] || keys['A']) player.x -= player.speed;
  if (keys['d'] || keys['D']) player.x += player.speed;
  player.x = Math.max(0, Math.min(worldWidth, player.x));
  player.y = Math.max(0, Math.min(worldHeight, player.y));
}

function shoot(dirX, dirY) {
  const mag = Math.hypot(dirX, dirY) || 1;
  projectiles.push({ x: player.x, y: player.y, dx: (dirX / mag) * 10, dy: (dirY / mag) * 10 });
}

function drawProjectiles() {
  ctx.fillStyle = 'white';
  projectiles.forEach(p => {
    const dx = p.x - player.x + canvas.width / 2;
    const dy = p.y - player.y + canvas.height / 2;
    ctx.fillRect(dx - 2, dy - 2, 4, 4);
  });
}

function updateProjectiles() {
  projectiles.forEach(p => { p.x += p.dx; p.y += p.dy; });
  projectiles = projectiles.filter(p => p.x >= 0 && p.x <= worldWidth && p.y >= 0 && p.y <= worldHeight);
}

function spawnEnemies() {
  if (Date.now() - lastSpawn > spawnDelay) {
    for (let i = 0; i < spawnCount; i++) {
      const types = ['red', 'yellow', 'purple'];
      const type = types[Math.floor(Math.random() * types.length)];
      enemies.push({
        x: Math.random() * worldWidth,
        y: Math.random() * worldHeight,
        dx: (Math.random() < 0.5 ? 2 : -2),
        dy: (Math.random() < 0.5 ? 2 : -2),
        type,
        size: 20
      });
    }
    spawnCount++;
    spawnDelay = Math.max(500, spawnDelay - 500);
    lastSpawn = Date.now();
  }
}

function drawEnemies() {
  enemies.forEach(e => {
    const dx = e.x - player.x + canvas.width / 2;
    const dy = e.y - player.y + canvas.height / 2;
    ctx.fillStyle = e.type;
    if (e.type === 'red') {
      ctx.beginPath();
      ctx.moveTo(dx, dy - e.size / 2);
      ctx.lineTo(dx - e.size / 2, dy + e.size / 2);
      ctx.lineTo(dx + e.size / 2, dy + e.size / 2);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillRect(dx - e.size / 2, dy - e.size / 2, e.size, e.size);
    }
  });
}

function updateEnemies() {
  enemies.forEach(e => {
    if (e.type === 'red') {
      e.x += e.dx; e.y += e.dy;
      if (e.x < 0 || e.x > worldWidth) e.dx *= -1;
      if (e.y < 0 || e.y > worldHeight) e.dy *= -1;
    } else {
      const dx1 = player.x - e.x, dy1 = player.y - e.y;
      const dist1 = Math.hypot(dx1, dy1) || 1;
      e.x += (dx1 / dist1) * 2; e.y += (dy1 / dist1) * 2;
      if (e.type === 'purple') {
        projectiles.forEach(p => {
          const dx2 = p.x - e.x, dy2 = p.y - e.y;
          const dist2 = Math.hypot(dx2, dy2) || 1;
          if (dist2 < 100) { e.x -= (dx2 / dist2) * 2; e.y -= (dy2 / dist2) * 2; }
        });
      }
    }
  });
  // Repel overlap
  for (let i = 0; i < enemies.length; i++) {
    for (let j = i + 1; j < enemies.length; j++) {
      let dx3 = enemies[i].x - enemies[j].x;
      let dy3 = enemies[i].y - enemies[j].y;
      let d3 = Math.hypot(dx3, dy3) || 1;
      if (d3 < enemies[i].size) {
        enemies[i].x += (dx3 / d3);
        enemies[i].y += (dy3 / d3);
        enemies[j].x -= (dx3 / d3);
        enemies[j].y -= (dy3 / d3);
      }
    }
  }
}

function checkCollisions() {
  // Player collision
  if (enemies.some(e => Math.hypot(player.x - e.x, player.y - e.y) < player.size)) {
    gameOver = true;
  }
  // Projectile collisions
  enemies = enemies.filter(e => {
    const hit = projectiles.some(p => Math.hypot(p.x - e.x, p.y - e.y) < e.size);
    if (hit) { score++; updateScore(); return false; }
    return true;
  });
}

function updateScore() {
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('space-highscore', highScore);
    highScoreEl.textContent = `High Score: ${highScore}`;
  }
}

function explodePlayer() {
  ctx.fillStyle = 'red';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function gameLoop() {
  if (!musicStarted) { bgMusic.play(); musicStarted = true; }
  if (gameOver) {
    explodePlayer();
    bgMusic.pause();
    ctx.fillStyle = 'white';
    ctx.font = '48px sans-serif';
    ctx.fillText('Game Over', canvas.width / 2 - 120, canvas.height / 2);
    return;
  }
  drawStars();
  movePlayer();
  drawPlayer();
  updateProjectiles();
  drawProjectiles();
  spawnEnemies();
  updateEnemies();
  drawEnemies();
  checkCollisions();
  requestAnimationFrame(gameLoop);
}

// Input handlers
document.addEventListener('keydown', e => {
  keys[e.key] = true;
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
    let dx=0, dy=0;
    if(e.key==='ArrowUp') dy=-1;
    if(e.key==='ArrowDown') dy=1;
    if(e.key==='ArrowLeft') dx=-1;
    if(e.key==='ArrowRight') dx=1;
    shoot(dx, dy);
  }
});
document.addEventListener('keyup', e => { keys[e.key] = false; });
canvas.addEventListener('click', e => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left - canvas.width / 2;
  const my = e.clientY - rect.top - canvas.height / 2;
  shoot(mx, my);
});

gameLoop();
