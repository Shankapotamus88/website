// Crush game code
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
  const playerY = canvas.height - playerHeight;
  const playerSpeed = 5;

  let playerX = canvas.width / 2 - playerWidth / 2;
  let leftPressed = false;
  let rightPressed = false;
  let score = 0;

  let blocks = [];
  let blockSpeed = 1;
  let gamePaused = false;

  document.addEventListener('keydown', e => {
    // start music on first player input
    if (!musicStarted && ['ArrowLeft', 'ArrowRight'].includes(e.key)) {
      if (bgMusic) {
        bgMusic.volume = 0.5;
        bgMusic.play().catch(err => console.warn('Music play failed:', err));
      }
      musicStarted = true;
    }
    if (e.key === 'ArrowLeft') {
      leftPressed = true;
      rightPressed = false;
    }
    if (e.key === 'ArrowRight') {
      rightPressed = true;
      leftPressed = false;
    }
  });

  document.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') leftPressed = false;
    if (e.key === 'ArrowRight') rightPressed = false;
  });

  function gameLoop() {
    if (!gamePaused) update();
    draw();
    requestAnimationFrame(gameLoop);
  }

  function update() {
    // Move player
    if (leftPressed) playerX -= playerSpeed;
    if (rightPressed) playerX += playerSpeed;
    playerX = Math.max(0, Math.min(canvas.width - playerWidth, playerX));

    // Spawn new block if none exist
    if (blocks.length === 0) {
      const maxWidth = canvas.width * 0.5;
      const blockWidth = 50 + Math.random() * (maxWidth - 50);
      const blockX = Math.random() * (canvas.width - blockWidth);
      blocks.push({ x: blockX, y: -300, w: blockWidth, h: 300 });
    }

    // Move blocks down
    for (let b of blocks) {
      b.y += blockSpeed;
    }

    // Remove blocks once fully off screen
    blocks = blocks.filter(b => b.y < canvas.height);

    // Collision detection
    for (let b of blocks) {
      if (
        playerX < b.x + b.w &&
        playerX + playerWidth > b.x &&
        playerY < b.y + b.h &&
        playerY + playerHeight > b.y
      ) {
        // Pause game and wait for player confirmation
        gamePaused = true;
        const restart = confirm(`Game Over! Score: ${score}\nPress OK to start next round.`);
        if (restart) {
          resetGame();
        }
        gamePaused = false;
        return;
      }
    }

    // Increase difficulty and score
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

    // Draw player
    ctx.fillStyle = 'lime';
    ctx.fillRect(playerX, playerY, playerWidth, playerHeight);

    // Draw blocks
    ctx.fillStyle = 'red';
    for (let b of blocks) {
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }

    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, canvas.height - 10);
  }

  function resetGame() {
    // Reset state
    playerX = canvas.width / 2 - playerWidth / 2;
    leftPressed = false;
    rightPressed = false;
    blocks = [];
    score = 0;
    blockSpeed = 1;
    // reset music
    musicStarted = false;
    if (bgMusic) {
      bgMusic.pause();
      bgMusic.currentTime = 0;
    }
    // update displayed high score in case changed during play
    if (highScoreEl) highScoreEl.textContent = `High Score: ${highScore}`;
  }

  gameLoop();
}
