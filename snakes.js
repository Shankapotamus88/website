// snakes.js
// Clean, working Snake game with 1 human and 3 AI snakes
// - Snakes initialize at corners and draw on load
// - Game starts on first keypress (or swipe)
// - Food turns rotten after 5s but immediately respawns
// - AI avoid walls, snakes, and rotten food

const canvas = document.getElementById('game');
if (!canvas) {
  console.error('Canvas not found');
} else {
  const ctx = canvas.getContext('2d');
  const tileSize = 20;
  const tileCount = canvas.width / tileSize;

  const bgMusic = document.getElementById('bg-music');
  let musicStarted = false;

  const highScoreEl = document.getElementById('high-score');
  let highScore = parseInt(localStorage.getItem('snake-highscore')||'0',10);
  if(highScoreEl) highScoreEl.textContent = `High Score: ${highScore}`;

  const HUMAN_COLOR = 'lime';
  const AI_COLORS = ['cyan','magenta','orange'];

  let humanSnake = [];
  let humanVel = {x:0,y:0};
  let aiSnakes = [];
  let foods = [];
  let score = 0;
  let gameStarted = false;
  let invincibleUntil = 0;

  let touchStart = null;

  function randomPos() {
    return {x:Math.floor(Math.random()*tileCount), y:Math.floor(Math.random()*tileCount), spawnTime:Date.now()};
  }

  function initPositions() {
    const corners = [
      {x:0,y:0},
      {x:tileCount-1,y:0},
      {x:0,y:tileCount-1},
      {x:tileCount-1,y:tileCount-1}
    ];
    // assign human + AIs
    humanSnake = [corners[0]];
    humanVel = {x:0,y:0};
    aiSnakes = corners.slice(1).map((c,i)=>({segments:[c],color:AI_COLORS[i]}));
  }

  function isSafe(x,y) {
    if(x<0||y<0||x>=tileCount||y>=tileCount) return false;
    if(humanSnake.some(s=>s.x===x&&s.y===y)) return false;
    for(const ai of aiSnakes) if(ai.segments.some(s=>s.x===x&&s.y===y)) return false;
    for(const f of foods) if(f.x===x&&f.y===y && Date.now()-f.spawnTime>5000) return false;
    return true;
  }

  function startGame() {
    gameStarted = true;
    score = 0;
    invincibleUntil = Date.now()+5000;
    foods = [randomPos()];
    if(highScoreEl) highScoreEl.textContent = `High Score: ${highScore}`;
  }

  function spawnFood() {
    for(let i=0;i<foods.length;i++){
      const f = foods[i];
      if(Date.now()-f.spawnTime>5000){
        foods[i]=randomPos();
      }
    }
  }

  function updateHuman() {
    if(!gameStarted || (humanVel.x===0&&humanVel.y===0)) return;
    const head = {x:humanSnake[0].x+humanVel.x, y:humanSnake[0].y+humanVel.y};
    humanSnake.unshift(head);
    if(Date.now()>=invincibleUntil && !isSafe(head.x,head.y)){
      alert(`Game Over! Score: ${score}`);
      resetGame(); return;
    }
    spawnFood();
    const idx=foods.findIndex(f=>f.x===head.x&&f.y===head.y);
    if(idx!==-1){
      const f=foods[idx]; foods[idx]=randomPos();
      if(Date.now()-f.spawnTime>5000){ alert(`Oh no—rotten! Score: ${score}`); resetGame(); return; }
      score++; if(score>highScore){highScore=score;localStorage.setItem('snake-highscore',highScore);if(highScoreEl)highScoreEl.textContent=`High Score: ${highScore}`;}
    } else humanSnake.pop();
  }

  function updateAI() {
    if(!gameStarted) return;
    for(let i=aiSnakes.length-1;i>=0;i--){
      const ai=aiSnakes[i]; const head=ai.segments[0];
      spawnFood();
      // choose nearest fresh food
      let target=foods[0],dmin=Infinity;
      for(const f of foods){ const age=Date.now()-f.spawnTime; if(age<=5000){ const d=Math.hypot(f.x-head.x,f.y-head.y); if(d<dmin){dmin=d;target=f;} }}
      // moves
      const moves=[{x:head.x+1,y:head.y},{x:head.x-1,y:head.y},{x:head.x,y:head.y+1},{x:head.x,y:head.y-1}];
      moves.sort((a,b)=>Math.hypot(a.x-target.x,a.y-target.y)-Math.hypot(b.x-target.x,b.y-target.y));
      let ok=false;
      for(const m of moves){ if(isSafe(m.x,m.y)){ ai.segments.unshift(m); ok=true; break; }}
      if(!ok){aiSnakes.splice(i,1);continue;}
      const nh=ai.segments[0]; const fi=foods.findIndex(f=>f.x===nh.x&&f.y===nh.y);
      if(fi!==-1){ const f=foods[fi]; foods[fi]=randomPos(); if(Date.now()-f.spawnTime>5000){aiSnakes.splice(i,1);continue;} }
      else ai.segments.pop();
    }
  }

  function draw() {
    ctx.fillStyle='#222';ctx.fillRect(0,0,canvas.width,canvas.height);
    for(const f of foods){ const age=Date.now()-f.spawnTime; ctx.fillStyle=age>5000?'white':'red';ctx.fillRect(f.x*tileSize,f.y*tileSize,tileSize,tileSize); }
    ctx.fillStyle=HUMAN_COLOR; for(const s of humanSnake)ctx.fillRect(s.x*tileSize,s.y*tileSize,tileSize,tileSize);
    for(const ai of aiSnakes){ ctx.fillStyle=ai.color; for(const s of ai.segments)ctx.fillRect(s.x*tileSize,s.y*tileSize,tileSize,tileSize);}    
    ctx.fillStyle='#fff';ctx.font='16px sans-serif';ctx.fillText(`Score: ${score}`,10,canvas.height-10);
  }

  function resetGame(){ musicStarted=false; gameStarted=false; if(bgMusic){bgMusic.pause();bgMusic.currentTime=0;} initPositions(); draw(); }

  document.addEventListener('keydown',e=>{
    if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))return;
    if(!musicStarted&&bgMusic){bgMusic.volume=0.5;bgMusic.play();musicStarted=true;}
    if(!gameStarted){startGame();return;}    
    if(e.key==='ArrowUp'&&humanVel.y===0)humanVel={x:0,y:-1};
    if(e.key==='ArrowDown'&&humanVel.y===0)humanVel={x:0,y:1};
    if(e.key==='ArrowLeft'&&humanVel.x===0)humanVel={x:-1,y:0};
    if(e.key==='ArrowRight'&&humanVel.x===0)humanVel={x:1,y:0};
  });

  canvas.addEventListener('touchstart',e=>{touchStart={x:e.touches[0].clientX,y:e.touches[0].clientY};},{passive:true});
  canvas.addEventListener('touchend',e=>{const d={x:e.changedTouches[0].clientX-touchStart.x,y:e.changedTouches[0].clientY-touchStart.y}; if(Math.hypot(d.x,d.y)>=20){ if(!gameStarted)startGame(); else if(Math.abs(d.x)>Math.abs(d.y)&&humanVel.x===0)humanVel={x:d.x>0?1:-1,y:0}; else if(Math.abs(d.y)>=Math.abs(d.x)&&humanVel.y===0)humanVel={x:0,y:d.y>0?1:-1}; }} ,{passive:true});

  // initial
  initPositions(); draw(); setInterval(()=>{updateHuman();updateAI();draw();},100);
}
