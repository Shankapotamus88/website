// space.js — Geometry Wars–style Space Game with explosion effect on hit
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const bgMusic = document.getElementById('bg-music');
let musicStarted = false;

// High Score setup
const highScoreEl = document.getElementById('high-score');
let highScore = parseInt(localStorage.getItem('space-highscore') || '0', 10);
highScoreEl.textContent = `High Score: ${highScore}`;

// World (50% larger than viewport)
const worldWidth = canvas.width * 1.5;
const worldHeight = canvas.height * 1.5;

// Game state
const keys = {};
let projectiles = [];
let enemies = [];
let stars = [];
let score = 0;
let gameOver = false;

// Spawn timing: start at 0.5s, keep flat; increase count every 5s
let spawnDelay = 500;
let lastSpawn = Date.now();
let spawnCount = 1;
let lastCountIncrease = Date.now();

// Player
const player = { x: worldWidth/2, y: worldHeight/2, size:20, speed:5, color:'green' };

// Starfieldor(let i=0;i<200;i++) stars.push({ x:Math.random()*worldWidth, y:Math.random()*worldHeight });

function clamp(v,min,max){ return Math.max(min,Math.min(max,v)); }
function getOffset(){
  return {
    x: clamp(player.x - canvas.width/2, 0, worldWidth - canvas.width),
    y: clamp(player.y - canvas.height/2,0,worldHeight - canvas.height)
  };
}

function drawStars(offset){
  ctx.fillStyle='black'; ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='white';
  stars.forEach(s=>{
    const sx=s.x-offset.x, sy=s.y-offset.y;
    if(sx>=0&&sx<canvas.width&&sy>=0&&sy<canvas.height) ctx.fillRect(sx,sy,1,1);
  });
}
function drawPlayer(offset){
  const px=player.x-offset.x-player.size/2;
  const py=player.y-offset.y-player.size/2;
  ctx.fillStyle=player.color;
  ctx.fillRect(px,py,player.size,player.size);
}
function movePlayer(){
  if(keys['w']||keys['W']) player.y-=player.speed;
  if(keys['s']||keys['S']) player.y+=player.speed;
  if(keys['a']||keys['A']) player.x-=player.speed;
  if(keys['d']||keys['D']) player.x+=player.speed;
  player.x=clamp(player.x,0,worldWidth);
  player.y=clamp(player.y,0,worldHeight);
}
function shoot(dx,dy){
  const m=Math.hypot(dx,dy)||1;
  projectiles.push({ x:player.x, y:player.y, dx:(dx/m)*10, dy:(dy/m)*10 });
}
function drawProjectiles(offset){
  ctx.fillStyle='white';
  projectiles.forEach(p=>{
    const sx=p.x-offset.x, sy=p.y-offset.y;
    ctx.fillRect(sx-2,sy-2,4,4);
  });
}
function updateProjectiles(){
  projectiles.forEach(p=>{ p.x+=p.dx; p.y+=p.dy; });
  projectiles=projectiles.filter(p=>p.x>=0&&p.x<=worldWidth&&p.y>=0&&p.y<=worldHeight);
}

function spawnEnemies(){
  const now=Date.now();
  if(now-lastSpawn>spawnDelay){
    for(let i=0;i<spawnCount;i++){
      const types=['red','yellow','purple'];
      const type=types[Math.floor(Math.random()*types.length)];
      enemies.push({ x:Math.random()*worldWidth, y:Math.random()*worldHeight,
        dx:(Math.random()<0.5?2:-2), dy:(Math.random()<0.5?2:-2), type, size:20 });
    }
    lastSpawn=now;
  }
  if(now-lastCountIncrease>5000){ spawnCount++; lastCountIncrease=now; }
}
function drawEnemies(offset){
  enemies.forEach(e=>{
    const sx=e.x-offset.x, sy=e.y-offset.y;
    ctx.fillStyle=e.type;
    if(e.type==='red'){
      ctx.beginPath();
      ctx.moveTo(sx, sy-e.size/2);
      ctx.lineTo(sx-e.size/2, sy+e.size/2);
      ctx.lineTo(sx+e.size/2, sy+e.size/2);
      ctx.closePath(); ctx.fill();
    } else {
      ctx.fillRect(sx-e.size/2, sy-e.size/2, e.size, e.size);
    }
  });
}
function updateEnemies(){
  enemies.forEach(e=>{
    if(e.type==='red'){
      e.x+=e.dx; e.y+=e.dy;
      if(e.x<0||e.x>worldWidth) e.dx*=-1;
      if(e.y<0||e.y>worldHeight) e.dy*=-1;
    } else {
      const dx1=player.x-e.x, dy1=player.y-e.y;
      const d1=Math.hypot(dx1,dy1)||1;
      e.x+=(dx1/d1)*2; e.y+=(dy1/d1)*2;
      if(e.type==='purple'){
        projectiles.forEach(p=>{
          const dx2=p.x-e.x, dy2=p.y-e.y;
          const d2=Math.hypot(dx2,dy2)||1;
          if(d2<100){ e.x-=(dx2/d2)*2; e.y-=(dy2/d2)*2; }
        });
      }
    }
  });
  for(let i=0;i<enemies.length;i++){
    for(let j=i+1;j<enemies.length;j++){
      const dx3=enemies[i].x-enemies[j].x, dy3=enemies[i].y-enemies[j].y;
      const d3=Math.hypot(dx3,dy3)||1;
      if(d3<enemies[i].size){
        enemies[i].x+=dx3/d3; enemies[i].y+=dy3/d3;
        enemies[j].x-=dx3/d3; enemies[j].y-=dy3/d3;
      }
    }
  }
}

function checkCollisions(){
  const offset=getOffset();
  // Player-enemy collision
  if(enemies.some(e=>Math.hypot(player.x-e.x, player.y-e.y)<player.size)) gameOver=true;
  // Projectile-enemy collisions with explosion
  enemies=enemies.filter(e=>{
    const hit=projectiles.some(p=>Math.hypot(p.x-e.x, p.y-e.y)<e.size);
    if(hit){
      // draw explosion: red inner circle, orange outer circle
      const sx=e.x-offset.x, sy=e.y-offset.y;
      ctx.beginPath(); ctx.arc(sx, sy, e.size, 0, 2*Math.PI); ctx.fillStyle='red'; ctx.fill();
      ctx.beginPath(); ctx.arc(sx, sy, e.size*1.5, 0, 2*Math.PI); ctx.fillStyle='orange'; ctx.fill();
      // update score
      score++; updateScore();
      return false;
    }
    return true;
  });
}

function updateScore(){
  if(score>highScore){
    highScore=score;
    localStorage.setItem('space-highscore', highScore);
    highScoreEl.textContent=`High Score: ${highScore}`;
  }
}
function explodePlayer(){ ctx.fillStyle='red'; ctx.fillRect(0,0,canvas.width,canvas.height); }

function gameLoop(){
  if(!musicStarted){ bgMusic.play(); musicStarted=true; }
  const offset=getOffset();
  if(gameOver){
    explodePlayer(); bgMusic.pause();
    ctx.fillStyle='white'; ctx.font='48px sans-serif';
    ctx.fillText('Game Over', canvas.width/2-120, canvas.height/2);
    return;
  }
  drawStars(offset);
  movePlayer(); drawPlayer(offset);
  updateProjectiles(); drawProjectiles(offset);
  spawnEnemies(); updateEnemies(); drawEnemies(offset);
  checkCollisions();
  requestAnimationFrame(gameLoop);
}

// Input handlers
document.addEventListener('keydown', e=>{
  keys[e.key]=true;
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){
    let dx=0, dy=0;
    if(e.key==='ArrowUp') dy=-1;
    if(e.key==='ArrowDown') dy=1;
    if(e.key==='ArrowLeft') dx=-1;
    if(e.key==='ArrowRight') dx=1;
    shoot(dx, dy);
  }
});
document.addEventListener('keyup', e=>{ keys[e.key]=false; });
canvas.addEventListener('click', e=>{
  const rect=canvas.getBoundingClientRect();
  const mx=e.clientX-rect.left, my=e.clientY-rect.top;
  const offset=getOffset();
  const worldX=offset.x+mx, worldY=offset.y+my;
  shoot(worldX-player.x, worldY-player.y);
});

gameLoop();
