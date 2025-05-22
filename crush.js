// Dodge game code: single block & 0.5s delay with player reset
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

  let block = null;
  let blockSpeed = 1;

  const spawnDelay = 500; // milliseconds
  let lastSpawnTime = Date.now() - spawnDelay;

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

    // Spawn single block after delay
    if (!block && Date.now() - lastSpawnTime >= spawnDelay) {
      const side = Math.random() < 0.5 ? 0 : 1;
      const w = canvas.width / 2;
      const h = 300;
      const x = side === 0 ? 0 : w;
      block = { x, y: -h, w, h };
      lastSpawnTime = Date.now();

      // Reset player to center for new block
      playerX = canvas.width / 2 - playerWidth / 2;
      leftPressed = false;
      rightPressed = false;
    }

    // Move block
    if (block) {
      block.y += blockSpeed;
      // Collision detection
      if (
        playerX < block.x + block.w &&
        playerX + playerWidth > block.x &&
        playerY < block.y + block.h &&
        playerY + playerHeight > block.y
      ) {
        endGame();
        return;
      }
      // Remove after off-screen
      if (block.y >= canvas.height) {
        block = null;
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
    // Draw block
    if (block) {
      ctx.fillStyle = 'red'; ctx.fillRect(block.x, block.y, block.w, block.h);
    }
    // Draw score
    ctx.fillStyle = '#fff'; ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, canvas.height - 10);
  }

  function endGame() {
    // stop music
    if (bgMusic) { bgMusic.pause(); bgMusic.currentTime = 0; }
    const restart = confirm(`Game Over! Score: ${score}\nPress OK to play again.`);
    if (restart) resetGame();
  }

  function resetGame() {
    playerX = canvas.width / 2 - playerWidth / 2;
    leftPressed = false;
    rightPressed = false;
    score = 0;
    blockSpeed = 1;
    block = null;
    lastSpawnTime = Date.now() - spawnDelay;
    musicStarted = false;
    if (highScoreEl) highScoreEl.textContent = `High Score: ${highScore}`;
  }

  gameLoop();
}
