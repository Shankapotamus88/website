// Dodge game code
const canvas = document.getElementById('game');
if (canvas) {
  const ctx = canvas.getContext('2d');

  // Game setup
  const playerWidth = 40;
  const playerHeight = 20;
  const playerY = canvas.height - playerHeight - 10;
  const playerSpeed = 5;

  let playerX = canvas.width / 2 - playerWidth / 2;
  let leftPressed = false;
  let rightPressed = false;
  let score = 0;

  let blocks = [];
  let blockTimer = 0;
  let blockSpeed = 1;
  const blockGap = playerWidth * 2;

  document.addEventListener('keydown', e => {
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

    // Add new blocks
    blockTimer++;
    if (blockTimer > 60) {
      blockTimer = 0;
      const gapX = Math.floor(Math.random() * (canvas.width - blockGap));
      if (gapX > 0) {
        blocks.push({ x: 0, y: -20, w: gapX, h: randomHeight() });
      }
      if (gapX + blockGap < canvas.width) {
        blocks.push({ x: gapX + blockGap, y: -20, w: canvas.width - (gapX + blockGap), h: randomHeight() });
      }
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
        alert(`Game Over! Score: ${score}`);
        resetGame();
        return;
      }
    }

    // Increase difficulty
    score++;
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

  function randomHeight() {
    return 20 + Math.random() * 30;
  }

  function resetGame() {
    playerX = canvas.width / 2 - playerWidth / 2;
    blocks = [];
    score = 0;
    blockSpeed = 1;
  }

  gameLoop();
}
