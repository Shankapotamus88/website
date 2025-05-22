// Dodge game code: horizontal movement & half-screen blocks
const canvas = document.getElementById('game');
if (canvas) {
  const ctx = canvas.getContext('2d');

  // —— background music setup ——
  const bgMusic = document.getElementById('bg-music');
  let musicStarted = false;

  // —— high score setup ——
  const highScoreEl = document.getElementById('high-score');
  let highScore = parseInt(localStorage.getItem('crush-highscore') || '0', 10);
  if (highScoreEl) highScoreEl.textContent = `High Score: ${highScore}`;

  // Game setup
  const playerWidth = 20;
  const playerHeight = 20;
  const playerSpeed = 5;
  const playerY = canvas.height - playerHeight;

  let playerX = canvas.width / 2 - playerWidth / 2;
  let leftPressed = false;
  let rightPressed = false;
  let score = 0;

  let blocks = [];
  let blockSpeed = 1;
  let spawnTimer = 0;
  const spawnInterval = 60; // frames between spawns

  document.addEventListener('keydown', e => {
    // start music on first horizontal input
    if (!musicStarted && ['ArrowLeft','ArrowRight'].includes(e.key)) {
      if (bgMusic) {
        bgMusic.volume = 0.5;
        bgMusic.play().catch(err => console.warn('Music play failed:', err));
      }
      musicStarted = true;
    }
    if (e.key === 'ArrowLeft') leftPressed = true;
    if (e.key === 'ArrowRight') rightPressed = true;
  });

  document.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') leftPressed = false;
    if (e.key === 'ArrowRight') rightPressed = false;
  });

  function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
  }

  function update() {
    // Move player
    if (leftPressed) playerX -= playerSpeed;
    if (rightPressed) playerX += playerSpeed;
    playerX = Math.max(0, Math.min(canvas.width - playerWidth, playerX));

    // Spawn new block
    spawnTimer++;
    if (spawnTimer >= spawnInterval) {
      spawnTimer = 0;
      // half-screen block, left or right
      const side = Math.random() < 0.5 ? 0 : 1;
      const w = canvas.width / 2;
      const h = 300;
      const x = side === 0 ? 0 : w;
      blocks.push({ x, y: -h, w, h });
    }

    // Move blocks
    for (let b of blocks) b.y += blockSpeed;

    // Remove off-screen blocks
    blocks = blocks.filter(b => b.y < canvas.height);

    // Collision detection
    for (let b of blocks) {
      if (
        playerX < b.x + b.w &&
        playerX + playerWidth > b.x &&
        playerY < b.y + b.h &&
        playerY + playerHeight > b.y
      ) {
        // stop music
        if (bgMusic) { bgMusic.pause(); bgMusic.currentTime = 0; }
        const restart = confirm(`Game Over! Score: ${score}\nPress OK to play again.`);
        if (restart) resetGame();
        return;
      }
    }

    // Score & difficulty
    score++;
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('crush-highscore', highScore);
      if (highScoreEl) highScoreEl.textContent = `High Score: ${highScore}`;
    }
    if (score % 300 === 0) blockSpeed += 0.5;
  }

  function draw() {
    ctx.fillStyle = '#111'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw player
    ctx.fillStyle = 'lime'; ctx.fillRect(playerX, playerY, playerWidth, playerHeight);
    // Draw blocks
    ctx.fillStyle = 'red';
    blocks.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));
    // Draw score
    ctx.fillStyle = '#fff'; ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, canvas.height - 10);
  }

  function resetGame() {
    playerX = canvas.width / 2 - playerWidth / 2;
    leftPressed = false;
    rightPressed = false;
    blocks = [];
    score = 0;
    blockSpeed = 1;
    spawnTimer = 0;
    musicStarted = false;
    if (bgMusic) { bgMusic.pause(); bgMusic.currentTime = 0; }
    if (highScoreEl) highScoreEl.textContent = `High Score: ${highScore}`;
  }

  gameLoop();
}
