// Dodge game code: teleport half-way horizontal movement
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

  // Player setup
  const playerWidth = 20;
  const playerHeight = 20;
  const playerY = canvas.height - playerHeight;
  let playerX = canvas.width / 2 - playerWidth / 2;

  // Game variables
  let score = 0;
  let block = null;
  let blockSpeed = 1;
  const spawnDelay = 500; // ms between blocks
  let lastSpawnTime = Date.now() - spawnDelay;

  document.addEventListener('keydown', e => {
    if (['ArrowLeft', 'ArrowRight'].includes(e.key)) {
      // start music on first move
      if (!musicStarted && bgMusic) {
        bgMusic.volume = 0.5;
        bgMusic.play().catch(() => {});
        musicStarted = true;
      }
      const centerX = canvas.width / 2 - playerWidth / 2;
      if (e.key === 'ArrowLeft') {
        // move halfway from center to left
        playerX = centerX / 2;
      } else {
        // move halfway from center to right
        const rightX = canvas.width - playerWidth;
        playerX = centerX + (rightX - centerX) / 2;
      }
    }
  });

  function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
  }

  function update() {
    // spawn block if none and delay passed
    if (!block && Date.now() - lastSpawnTime >= spawnDelay) {
      const side = Math.random() < 0.5 ? 0 : 1;
      const w = canvas.width / 2;
      const h = 300;
      const x = side === 0 ? 0 : w;
      block = { x, y: -h, w, h };
      lastSpawnTime = Date.now();

      // reset player to center
      playerX = canvas.width / 2 - playerWidth / 2;
      musicStarted = false;
    }

    // move block
    if (block) {
      block.y += blockSpeed;
      // collision
      if (
        playerX < block.x + block.w &&
        playerX + playerWidth > block.x &&
        playerY < block.y + block.h &&
        playerY + playerHeight > block.y
      ) {
        endGame();
        return;
      }
      // off-screen
      if (block.y >= canvas.height) block = null;
    }

    // update score & difficulty
    score++;
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('crush-highscore', highScore);
      if (highScoreEl) highScoreEl.textContent = `High Score: ${highScore}`;
    }
    if (score % 300 === 0) blockSpeed += 0.5;
  }

  function draw() {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw player
    ctx.fillStyle = 'lime';
    ctx.fillRect(playerX, playerY, playerWidth, playerHeight);

    // draw block
    if (block) {
      ctx.fillStyle = 'red';
      ctx.fillRect(block.x, block.y, block.w, block.h);
    }

    // draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
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
    score = 0;
    blockSpeed = 1;
    block = null;
    lastSpawnTime = Date.now() - spawnDelay;
    if (highScoreEl) highScoreEl.textContent = `High Score: ${highScore}`;
  }

  gameLoop();
}
