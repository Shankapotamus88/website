// Dodge game code with 2D movement & multiple blocks
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

  let playerX = canvas.width / 2 - playerWidth / 2;
  let playerY = canvas.height / 2 - playerHeight / 2;
  let leftPressed = false;
  let rightPressed = false;
  let upPressed = false;
  let downPressed = false;
  let score = 0;

  let blocks = [];
  let blockSpeed = 1;
  let spawnTimer = 0;
  const spawnInterval = 60; // frames between spawns

  const minGap = playerWidth * 3; // minimum gap between blocks

  document.addEventListener('keydown', e => {
    if (!musicStarted && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) {
      if (bgMusic) {
        bgMusic.volume = 0.5;
        bgMusic.play().catch(err => console.warn('Music play failed:', err));
      }
      musicStarted = true;
    }
    if (e.key === 'ArrowLeft') leftPressed = true;
    if (e.key === 'ArrowRight') rightPressed = true;
    if (e.key === 'ArrowUp') upPressed = true;
    if (e.key === 'ArrowDown') downPressed = true;
  });

  document.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') leftPressed = false;
    if (e.key === 'ArrowRight') rightPressed = false;
    if (e.key === 'ArrowUp') upPressed = false;
    if (e.key === 'ArrowDown') downPressed = false;
  });

  function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
  }

  function update() {
    // Move player in 2D
    if (leftPressed) playerX -= playerSpeed;
    if (rightPressed) playerX += playerSpeed;
    if (upPressed) playerY -= playerSpeed;
    if (downPressed) playerY += playerSpeed;
    // Boundaries
    playerX = Math.max(0, Math.min(canvas.width - playerWidth, playerX));
    playerY = Math.max(0, Math.min(canvas.height - playerHeight, playerY));

    // Spawn multiple blocks over time
    spawnTimer++;
    if (spawnTimer >= spawnInterval) {
      spawnTimer = 0;
      const toSpawn = 1 + Math.floor(Math.random() * 2); // 1-2 blocks
      const newBlocks = [];
      for (let i = 0; i < toSpawn; i++) {
        const minSizeX = playerWidth * 2;
        const maxSizeX = playerWidth * 5;
        const minSizeY = playerHeight * 2;
        const maxSizeY = playerHeight * 5;
        const w = minSizeX + Math.random() * (maxSizeX - minSizeX);
        const h = minSizeY + Math.random() * (maxSizeY - minSizeY);
        let x, attempts = 0;
        const maxAttempts = 10;
        do {
          x = Math.random() * (canvas.width - w);
          attempts++;
        } while (
          attempts < maxAttempts &&
          newBlocks.concat(blocks).some(b => !(x + w + minGap <= b.x || b.x + b.w + minGap <= x))
        );
        newBlocks.push({ x, y: -h, w, h });
      }
      blocks.push(...newBlocks);
    }

    // Move blocks
    for (let b of blocks) {
      b.y += blockSpeed;
    }

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
        // Game over
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
    // Player
    ctx.fillStyle = 'lime'; ctx.fillRect(playerX, playerY, playerWidth, playerHeight);
    // Blocks
    ctx.fillStyle = 'red';
    blocks.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));
    // Score
    ctx.fillStyle = '#fff'; ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, canvas.height - 10);
  }

  function resetGame() {
    playerX = canvas.width / 2 - playerWidth / 2;
    playerY = canvas.height / 2 - playerHeight / 2;
    leftPressed = false;
    rightPressed = false;
    upPressed = false;
    downPressed = false;
    blocks = [];
    score = 0;
    blockSpeed = 1;
    spawnTimer = 0;
    musicStarted = false;
  }

  gameLoop();
}
