// Dodge game code
const canvas = document.getElementById('game');
if (canvas) {
  const ctx = canvas.getContext('2d');

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
  let blockTimer = 0;
  let blockSpeed = 1;

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

    // Add new block if none are on screen
    if (blocks.length === 0) {
      const maxWidth = canvas.width * 0.5;
      const blockWidth = 50 + Math.random() * (maxWidth - 50);
      const blockX = Math.random() * (canvas.width - blockWidth);
      blocks.push({ x: blockX, y: -300, w: blockWidth, h: 300 });
    }

    // Move block
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

  function resetGame() {
    playerX = canvas.width / 2 - playerWidth / 2;
    blocks = [];
    score = 0;
    blockSpeed = 1;
  }

  gameLoop();
}
