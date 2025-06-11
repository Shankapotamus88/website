const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
document.body.appendChild(canvas);
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const worldWidth = canvas.width * 1.5;
const worldHeight = canvas.height * 1.5;

let keys = {};
let projectiles = [];
let enemies = [];
let stars = [];
let spawnDelay = 5000;
let spawnTimer = 0;
let spawnCount = 1;
let lastSpawn = Date.now();
let gameOver = false;

const player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  size: 20,
  speed: 5,
  color: "green",
};

for (let i = 0; i < 200; i++) {
  stars.push({
    x: Math.random() * worldWidth,
    y: Math.random() * worldHeight,
  });
}

function drawPlayer() {
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x - player.size / 2, player.y - player.size / 2, player.size, player.size);
}

function movePlayer() {
  if (keys["w"]) player.y -= player.speed;
  if (keys["s"]) player.y += player.speed;
  if (keys["a"]) player.x -= player.speed;
  if (keys["d"]) player.x += player.speed;
  player.x = Math.max(0, Math.min(worldWidth, player.x));
  player.y = Math.max(0, Math.min(worldHeight, player.y));
}

function drawStars() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "white";
  for (let s of stars) {
    const dx = s.x - player.x + canvas.width / 2;
    const dy = s.y - player.y + canvas.height / 2;
    if (dx >= 0 && dx < canvas.width && dy >= 0 && dy < canvas.height) {
      ctx.fillRect(dx, dy, 1, 1);
    }
  }
}

function shoot(dirX, dirY) {
  const mag = Math.hypot(dirX, dirY);
  projectiles.push({
    x: player.x,
    y: player.y,
    dx: (dirX / mag) * 10,
    dy: (dirY / mag) * 10,
  });
}

function drawProjectiles() {
  ctx.fillStyle = "white";
  for (let p of projectiles) {
    ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
  }
}

function updateProjectiles() {
  for (let p of projectiles) {
    p.x += p.dx;
    p.y += p.dy;
  }
  projectiles = projectiles.filter(p => p.x >= 0 && p.x <= worldWidth && p.y >= 0 && p.y <= worldHeight);
}

function spawnEnemies() {
  if (Date.now() - lastSpawn > spawnDelay) {
    for (let i = 0; i < spawnCount; i++) {
      const type = ["red", "yellow", "purple"][Math.floor(Math.random() * 3)];
      enemies.push({
        x: Math.random() * worldWidth,
        y: Math.random() * worldHeight,
        dx: Math.random() < 0.5 ? 2 : -2,
        dy: Math.random() < 0.5 ? 2 : -2,
        type,
        size: 20,
      });
    }
    spawnCount++;
    spawnDelay = Math.max(500, spawnDelay - 500);
    lastSpawn = Date.now();
  }
}

function drawEnemies() {
  for (let e of enemies) {
    ctx.fillStyle = e.type;
    const dx = e.x - player.x + canvas.width / 2;
    const dy = e.y - player.y + canvas.height / 2;
    if (e.type === "red") {
      ctx.beginPath();
      ctx.moveTo(dx, dy - 10);
      ctx.lineTo(dx - 10, dy + 10);
      ctx.lineTo(dx + 10, dy + 10);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillRect(dx - 10, dy - 10, 20, 20);
    }
  }
}

function updateEnemies() {
  for (let e of enemies) {
    if (e.type === "red") {
      e.x += e.dx;
      e.y += e.dy;
      if (e.x < 0 || e.x > worldWidth) e.dx *= -1;
      if (e.y < 0 || e.y > worldHeight) e.dy *= -1;
    } else {
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const dist = Math.hypot(dx, dy);
      if (e.type === "yellow" || e.type === "purple") {
        e.x += (dx / dist) * 2;
        e.y += (dy / dist) * 2;
      }
      if (e.type === "purple") {
        for (let p of projectiles) {
          const pdx = p.x - e.x;
          const pdy = p.y - e.y;
          const pdist = Math.hypot(pdx, pdy);
          if (pdist < 100) {
            e.x -= (pdx / pdist) * 2;
            e.y -= (pdy / pdist) * 2;
          }
        }
      }
    }
  }
  // Repel enemies
  for (let i = 0; i < enemies.length; i++) {
    for (let j = i + 1; j < enemies.length; j++) {
      let dx = enemies[i].x - enemies[j].x;
      let dy = enemies[i].y - enemies[j].y;
      let dist = Math.hypot(dx, dy);
      if (dist < 20 && dist > 0) {
        dx /= dist;
        dy /= dist;
        enemies[i].x += dx;
        enemies[i].y += dy;
        enemies[j].x -= dx;
        enemies[j].y -= dy;
      }
    }
  }
}

function checkCollisions() {
  for (let e of enemies) {
    if (Math.hypot(player.x - e.x, player.y - e.y) < 20) {
      gameOver = true;
    }
  }
  enemies = enemies.filter(e => {
    for (let p of projectiles) {
      if (Math.hypot(p.x - e.x, p.y - e.y) < 15) return false;
    }
    return true;
  });
}

function gameLoop() {
  if (gameOver) {
    ctx.fillStyle = "red";
    ctx.font = "48px sans-serif";
    ctx.fillText("Game Over", canvas.width / 2 - 100, canvas.height / 2);
    return;
  }
  drawStars();
  movePlayer();
  drawPlayer();
  drawProjectiles();
  updateProjectiles();
  spawnEnemies();
  drawEnemies();
  updateEnemies();
  checkCollisions();
  requestAnimationFrame(gameLoop);
}

document.addEventListener("keydown", e => {
  keys[e.key] = true;
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
    let dx = 0, dy = 0;
    if (e.key === "ArrowUp") dy = -1;
    if (e.key === "ArrowDown") dy = 1;
    if (e.key === "ArrowLeft") dx = -1;
    if (e.key === "ArrowRight") dx = 1;
    shoot(dx, dy);
  }
});

document.addEventListener("keyup", e => {
  keys[e.key] = false;
});

canvas.addEventListener("click", e => {
  const rect = canvas.getBoundingClientRect();
  const dx = e.clientX - rect.left - canvas.width / 2;
  const dy = e.clientY - rect.top - canvas.height / 2;
  shoot(dx, dy);
});

gameLoop();
