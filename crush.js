// Dodge game code: single purple block, player reset, arrow/a/l, pointer/touch controls
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

  function startMusic() {
    if (!musicStarted && bgMusic) {
      bgMusic.volume = 0.5;
      bgMusic.play().catch(() => {});
      musicStarted = true;
    }
  }

  function movePlayer(direction) {
    const centerX = canvas.width / 2 - playerWidth / 2;
    if (direction === 'left') {
      playerX = centerX / 2;
    } else {
      const rightX = canvas.width - playerWidth;
      playerX = centerX + (rightX - centerX) / 2;
    }
  }

  // Keyboard controls (A/L or Arrow)
  document.addEventListener('keydown', e => {
    const key = e.key.toLowerCase();
    if (['arrowleft', 'arrowright', 'a', 'l'].includes(key)) {
      startMusic();
      movePlayer((key === 'arrowleft' || key === 'a') ? 'left' : 'right');
    }
  });

  // Pointer controls (mouse or touch)
  canvas.addEventListener('pointerdown', e => {
    e.preventDefault();
    startMusic();
    const x = e.offsetX;
    movePlayer(x < canvas.width / 2 ? 'left' : 'right');
  });

  // Touch fallback
  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    startMusic();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    movePlayer(x < canvas.width / 2 ? 'left' : 'right');
  }, { passive: false });

  function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
  }

  function update() {
    if (!block && Date.now() - lastSpawnTime >= spawnDelay) {
      const side = Math.random() < 0.5 ? 0 : 1;
      const w = canvas.width / 2;
      const h = 300;
      const x = side === 0 ? 0 : w;
      block = { x, y: -h, w, h, color: 'purple' };
      lastSpawnTime = Date.now();
      // reset player
      playerX = canvas.width / 2 - playerWidth / 2;
      musicStarted = false;
    }
    if (block) {
      block.y += blockSpeed;
      if (
        playerX < block.x + block.w &&
        playerX + playerWidth > block.x &&
        playerY < block.y + block.h &&
        playerY + playerHeight > block.y
      ) {
        endGame(); return;
      }
      if (block.y >= canvas.height) block = null;
    }
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
    ctx.fillStyle = 'lime'; ctx.fillRect(playerX, playerY, playerWidth, playerHeight);
    if (block) { ctx.fillStyle = block.color; ctx.fillRect(block.x, block.y, block.w, block.h); }
    ctx.fillStyle = '#fff'; ctx.font = '16px sans-serif'; ctx.fillText(`Score: ${score}`, 10, canvas.height - 10);
  }

  function endGame() {
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
