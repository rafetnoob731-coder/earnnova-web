// =============================================
// EARNNOVA — Popular Games System
// Flappy Bird, Snake, 2048, Memory, Target, Color
// Each game shows ads + rewards on score
// =============================================

var EN_GAMES = {};

// ===== GAME UTILITIES =====
function _gameInit(canvasId) {
  var canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  var ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  return { canvas: canvas, ctx: ctx };
}

function _gameReward(score, baseReward) {
  // Must have minimum score to earn
  if (score < 1) {
    showToast('🎮','No Reward','Score too low! Score at least 1 to earn.','warning');
    return;
  }
  // Reward scales with score
  var bonus = Math.min(score * 0.005, 0.050); // Max $0.050 bonus
  var total = baseReward + bonus;
  var bal = parseFloat(localStorage.getItem('en_bal') || '0');
  bal += total;
  localStorage.setItem('en_bal', String(bal));
  if (currentUserData) currentUserData.balance = (currentUserData.balance || 0) + total;
  updateUI();
  showToast('🎮', 'Game Reward!', '+' + formatCurrency(total) + ' (Score: ' + score + ')', 'money');
  // Show interstitial ad after game
  setTimeout(function() {
    if (typeof show_9622450 === 'function') show_9622450();
  }, 500);
}

// ===== 1. FLAPPY BIRD =====
EN_GAMES.flappy = {
  name: 'Flappy Bird',
  icon: '🐦',
  desc: 'Tap to fly through pipes!',
  reward: 0.020,
  start: function(container) {
    container.innerHTML = 
      '<div style="text-align:center;margin-bottom:6px"><span style="font-size:20px;font-weight:800;color:var(--gold)">🐦 Flappy Bird</span></div>' +
      '<canvas id="gameFlappyCanvas" style="width:100%;height:300px;border-radius:12px;background:linear-gradient(180deg,#87CEEB,#E0F6FF);display:block;cursor:pointer"></canvas>' +
      '<div style="display:flex;justify-content:space-between;padding:6px 4px;font-size:11px">' +
        '<span id="flappyScore" style="color:var(--gold);font-weight:700">Score: 0</span>' +
        '<span style="color:var(--text-muted)">Tap to fly 🐦</span>' +
      '</div>' +
      '<div id="flappyResult" style="display:none;text-align:center;padding:8px;margin-top:4px;border-radius:8px;background:rgba(255,255,255,0.04)">' +
        '<div style="font-size:14px;font-weight:700;color:var(--emerald)">Game Over!</div>' +
        '<div style="font-size:12px;color:var(--text-secondary)">Score: <span id="flappyFinalScore">0</span></div>' +
        '<div style="font-size:11px;color:var(--gold)">+$<span id="flappyReward">0.020</span></div>' +
      '</div>';
    
    var gc = _gameInit('gameFlappyCanvas');
    if (!gc) return;
    
    // Game state
    var bird = { x: 50, y: 150, vy: 0, size: 12, gravity: 0.5, jump: -7 };
    var pipes = [];
    var score = 0;
    var gameOver = false;
    var started = false;
    var frame = null;
    var pipeTimer = 0;
    var pipeGap = 120;
    var pipeWidth = 30;
    
    function draw() {
      gc.ctx.clearRect(0, 0, gc.canvas.width, gc.canvas.height);
      
      // Draw bird
      gc.ctx.fillStyle = '#FFD700';
      gc.ctx.beginPath();
      gc.ctx.arc(bird.x, bird.y, bird.size, 0, Math.PI * 2);
      gc.ctx.fill();
      gc.ctx.fillStyle = '#FFA500';
      gc.ctx.beginPath();
      gc.ctx.arc(bird.x + 5, bird.y - 3, 4, 0, Math.PI * 2);
      gc.ctx.fill();
      // Eye
      gc.ctx.fillStyle = '#000';
      gc.ctx.beginPath();
      gc.ctx.arc(bird.x + 8, bird.y - 4, 2, 0, Math.PI * 2);
      gc.ctx.fill();
      
      // Draw pipes
      pipes.forEach(function(p) {
        gc.ctx.fillStyle = '#2ECC71';
        gc.ctx.fillRect(p.x, 0, pipeWidth, p.top);
        gc.ctx.fillRect(p.x, p.top + pipeGap, pipeWidth, gc.canvas.height - p.top - pipeGap);
        gc.ctx.fillStyle = '#27AE60';
        gc.ctx.fillRect(p.x - 3, p.top - 20, pipeWidth + 6, 20);
        gc.ctx.fillRect(p.x - 3, p.top + pipeGap, pipeWidth + 6, 20);
      });
      
      // Ground
      gc.ctx.fillStyle = '#8B4513';
      gc.ctx.fillRect(0, gc.canvas.height - 5, gc.canvas.width, 5);
      gc.ctx.fillStyle = '#228B22';
      gc.ctx.fillRect(0, gc.canvas.height - 8, gc.canvas.width, 3);
    }
    
    function update() {
      if (gameOver || !started) return;
      
      bird.vy += bird.gravity;
      bird.y += bird.vy;
      
      // Move pipes
      pipes.forEach(function(p) { p.x -= 2; });
      pipes = pipes.filter(function(p) { return p.x > -pipeWidth; });
      
      // Generate pipes
      pipeTimer++;
      if (pipeTimer > 80) {
        pipeTimer = 0;
        var top = Math.random() * (gc.canvas.height - pipeGap - 60) + 20;
        pipes.push({ x: gc.canvas.width, top: top });
      }
      
      // Collision
      var hit = bird.y - bird.size < 0 || bird.y + bird.size > gc.canvas.height - 5;
      pipes.forEach(function(p) {
        if (bird.x + bird.size > p.x && bird.x - bird.size < p.x + pipeWidth) {
          if (bird.y - bird.size < p.top || bird.y + bird.size > p.top + pipeGap) {
            hit = true;
          }
        }
        // Score
        if (!p.scored && p.x + pipeWidth < bird.x) {
          p.scored = true;
          score++;
          document.getElementById('flappyScore').textContent = 'Score: ' + score;
        }
      });
      
      if (hit) {
        gameOver = true;
        endGame(score);
        return;
      }
      
      draw();
      frame = requestAnimationFrame(update);
    }
    
    function endGame(s) {
      cancelAnimationFrame(frame);
      document.getElementById('flappyScore').textContent = 'Score: ' + s + ' - Game Over!';
      document.getElementById('flappyFinalScore').textContent = s;
      var reward = 0.020 + Math.min(s * 0.003, 0.040);
      document.getElementById('flappyReward').textContent = reward.toFixed(3);
      document.getElementById('flappyResult').style.display = 'block';
      _gameReward(s, 0.020);
    }
    
    gc.canvas.onclick = function() {
      if (!started) { started = true; update(); }
      if (!gameOver) {
        bird.vy = bird.jump;
        draw();
      }
    };
    
    draw();
    gc.ctx.fillStyle = 'rgba(0,0,0,0.3)';
    gc.ctx.fillRect(0, gc.canvas.height/2-20, gc.canvas.width, 40);
    gc.ctx.fillStyle = '#fff';
    gc.ctx.font = '14px sans-serif';
    gc.ctx.textAlign = 'center';
    gc.ctx.fillText('Tap to Start! 🐦', gc.canvas.width/2, gc.canvas.height/2 + 5);
  }
,
  restart: function(container) { this.start(container); }
};

// ===== 2. SNAKE =====
EN_GAMES.snake = {
  name: 'Snake',
  icon: '🐍',
  desc: 'Eat food, grow longer!',
  reward: 0.020,
  start: function(container) {
    container.innerHTML = 
      '<div style="text-align:center;margin-bottom:6px"><span style="font-size:20px;font-weight:800;color:var(--gold)">🐍 Snake</span></div>' +
      '<canvas id="gameSnakeCanvas" style="width:100%;height:300px;border-radius:12px;background:#0a0e1a;display:block"></canvas>' +
      '<div style="display:flex;justify-content:space-between;padding:6px 4px;font-size:11px">' +
        '<span id="snakeScore" style="color:var(--gold);font-weight:700">Score: 0</span>' +
        '<span style="color:var(--text-muted)">Arrow keys / Swipe</span>' +
      '</div>' +
      '<div id="snakeControls" style="display:grid;grid-template-columns:repeat(3,48px);gap:4px;justify-content:center;margin:6px 0">' +
        '<div></div><button onclick="EN_GAMES.snake._dir=\'up\'" style="padding:8px;border-radius:6px;background:rgba(255,255,255,0.06);border:none;color:#fff;font-size:16px;cursor:pointer">⬆️</button><div></div>' +
        '<button onclick="EN_GAMES.snake._dir=\'left\'" style="padding:8px;border-radius:6px;background:rgba(255,255,255,0.06);border:none;color:#fff;font-size:16px;cursor:pointer">⬅️</button><button onclick="EN_GAMES.snake._dir=\'down\'" style="padding:8px;border-radius:6px;background:rgba(255,255,255,0.06);border:none;color:#fff;font-size:16px;cursor:pointer">⬇️</button><button onclick="EN_GAMES.snake._dir=\'right\'" style="padding:8px;border-radius:6px;background:rgba(255,255,255,0.06);border:none;color:#fff;font-size:16px;cursor:pointer">➡️</button>' +
        '<div></div><button onclick="EN_GAMES.snake._start()" style="padding:8px;border-radius:6px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.2);color:var(--emerald);font-size:11px;cursor:pointer;font-weight:600">🔄 Restart</button><div></div>' +
      '</div>' +
      '<div id="snakeResult" style="display:none;text-align:center;padding:8px;margin-top:4px;border-radius:8px;background:rgba(255,255,255,0.04)">' +
        '<div style="font-size:14px;font-weight:700;color:var(--emerald)">Game Over!</div>' +
        '<div style="font-size:12px;color:var(--text-secondary)">Score: <span id="snakeFinalScore">0</span></div>' +
        '<div style="font-size:11px;color:var(--gold)">+$<span id="snakeReward">0.020</span></div>' +
      '</div>';
    
    EN_GAMES.snake._dir = 'right';
    EN_GAMES.snake._nextDir = 'right';
    EN_GAMES.snake._running = false;
    EN_GAMES.snake._start = function() { snakeStart(); };
    
    function snakeStart() {
      var gc = _gameInit('gameSnakeCanvas');
      if (!gc) return;
      
      var grid = 15;
      var cols = Math.floor(gc.canvas.width / grid);
      var rows = Math.floor(gc.canvas.height / grid);
      var snake = [{x: 5, y: Math.floor(rows/2)}];
      var food = {x: Math.floor(cols/2), y: Math.floor(rows/2)};
      var dir = {x: 1, y: 0};
      var score = 0;
      var gameOver = false;
      var interval = null;
      
      function placeFood() {
        var placed = false;
        while (!placed) {
          food.x = Math.floor(Math.random() * cols);
          food.y = Math.floor(Math.random() * rows);
          var onSnake = snake.some(function(s) { return s.x === food.x && s.y === food.y; });
          if (!onSnake) placed = true;
        }
      }
      
      placeFood();
      
      function updateSnake() {
        if (gameOver) return;
        
        var nd = EN_GAMES.snake._nextDir || EN_GAMES.snake._dir;
        if (nd === 'up' && dir.y === 0) { dir = {x: 0, y: -1}; EN_GAMES.snake._dir = 'up'; }
        else if (nd === 'down' && dir.y === 0) { dir = {x: 0, y: 1}; EN_GAMES.snake._dir = 'down'; }
        else if (nd === 'left' && dir.x === 0) { dir = {x: -1, y: 0}; EN_GAMES.snake._dir = 'left'; }
        else if (nd === 'right' && dir.x === 0) { dir = {x: 1, y: 0}; EN_GAMES.snake._dir = 'right'; }
        
        var head = {x: snake[0].x + dir.x, y: snake[0].y + dir.y};
        
        // Wall wrap
        if (head.x < 0) head.x = cols - 1;
        if (head.x >= cols) head.x = 0;
        if (head.y < 0) head.y = rows - 1;
        if (head.y >= rows) head.y = 0;
        
        // Self collision
        var hit = snake.some(function(s) { return s.x === head.x && s.y === head.y; });
        if (hit) {
          gameOver = true;
          clearInterval(interval);
          document.getElementById('snakeScore').textContent = 'Score: ' + score + ' - Game Over!';
          document.getElementById('snakeFinalScore').textContent = score;
          var reward = 0.020 + Math.min(score * 0.001, 0.030);
          document.getElementById('snakeReward').textContent = reward.toFixed(3);
          document.getElementById('snakeResult').style.display = 'block';
          _gameReward(score, 0.020);
          return;
        }
        
        snake.unshift(head);
        if (head.x === food.x && head.y === food.y) {
          score++;
          document.getElementById('snakeScore').textContent = 'Score: ' + score;
          placeFood();
        } else {
          snake.pop();
        }
        
        renderSnake();
      }
      
      function renderSnake() {
        gc.ctx.fillStyle = '#0a0e1a';
        gc.ctx.fillRect(0, 0, gc.canvas.width, gc.canvas.height);
        
        // Draw grid
        gc.ctx.strokeStyle = 'rgba(255,255,255,0.02)';
        gc.ctx.lineWidth = 0.5;
        for (var i = 1; i < cols; i++) { gc.ctx.beginPath(); gc.ctx.moveTo(i * grid, 0); gc.ctx.lineTo(i * grid, gc.canvas.height); gc.ctx.stroke(); }
        for (var i = 1; i < rows; i++) { gc.ctx.beginPath(); gc.ctx.moveTo(0, i * grid); gc.ctx.lineTo(gc.canvas.width, i * grid); gc.ctx.stroke(); }
        
        // Snake
        snake.forEach(function(s, i) {
          gc.ctx.fillStyle = i === 0 ? '#10B981' : '#059669';
          gc.ctx.beginPath();
          gc.ctx.roundRect(s.x * grid + 1, s.y * grid + 1, grid - 2, grid - 2, 3);
          gc.ctx.fill();
        });
        
        // Food
        gc.ctx.fillStyle = '#EF4444';
        gc.ctx.beginPath();
        gc.ctx.arc(food.x * grid + grid/2, food.y * grid + grid/2, grid/2 - 2, 0, Math.PI * 2);
        gc.ctx.fill();
      }
      
      if (interval) clearInterval(interval);
      renderSnake();
      interval = setInterval(updateSnake, 120);
    }
    
    snakeStart();
  },
  restart: function(container) { this.start(container); }
};

// ===== 3. 2048 =====
EN_GAMES.game2048 = {
  name: '2048',
  icon: '🧩',
  desc: 'Merge tiles to reach 2048!',
  reward: 0.025,
  start: function(container) {
    container.innerHTML = 
      '<div style="text-align:center;margin-bottom:6px"><span style="font-size:20px;font-weight:800;color:var(--gold)">🧩 2048</span></div>' +
      '<div id="game2048Area" style="width:100%;max-width:300px;margin:0 auto;padding:8px;border-radius:12px;background:rgba(255,255,255,0.03)">' +
        '<div style="display:flex;justify-content:space-between;padding:4px 2px;margin-bottom:6px">' +
          '<span id="score2048" style="font-size:12px;font-weight:700;color:var(--gold)">Score: 0</span>' +
          '<button onclick="EN_GAMES.game2048._reset()" style="padding:4px 10px;border-radius:6px;background:rgba(16,185,129,0.1);border:none;color:var(--emerald);font-size:10px;cursor:pointer;font-weight:600">🔄 New</button>' +
        '</div>' +
        '<div id="grid2048" style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;background:rgba(255,255,255,0.02);border-radius:8px;padding:4px"></div>' +
        '<div id="result2048" style="display:none;text-align:center;padding:8px;margin-top:6px;border-radius:8px;background:rgba(255,255,255,0.04)">' +
          '<div style="font-size:13px;font-weight:700;color:var(--emerald)">Game Over!</div>' +
          '<div style="font-size:11px;color:var(--gold)">+$<span id="reward2048">0.025</span></div>' +
        '</div>' +
      '</div>';
    
    var grid = [];
    var score = 0;
    
    function initGrid() {
      grid = Array(4).fill(null).map(function() { return Array(4).fill(0); });
      addRandom();
      addRandom();
      score = 0;
      render2048();
    }
    
    function addRandom() {
      var empty = [];
      for (var r = 0; r < 4; r++) for (var c = 0; c < 4; c++) if (grid[r][c] === 0) empty.push({r: r, c: c});
      if (empty.length === 0) return;
      var pos = empty[Math.floor(Math.random() * empty.length)];
      grid[pos.r][pos.c] = Math.random() < 0.9 ? 2 : 4;
    }
    
    function render2048() {
      document.getElementById('score2048').textContent = 'Score: ' + score;
      var g = document.getElementById('grid2048');
      g.innerHTML = '';
      var colors = {0:'transparent',2:'#eee4da',4:'#ede0c8',8:'#f2b179',16:'#f59563',32:'#f67c5f',64:'#f65e3b',128:'#edcf72',256:'#edcc61',512:'#edc850',1024:'#edc53f',2048:'#edc22e',4096:'#3c3a32'};
      var txtColors = {2:'#776e65',4:'#776e65',8:'#f9f6f2',16:'#f9f6f2',32:'#f9f6f2',64:'#f9f6f2',128:'#f9f6f2',256:'#f9f6f2',512:'#f9f6f2',1024:'#f9f6f2',2048:'#f9f6f2',4096:'#f9f6f2'};
      
      for (var r = 0; r < 4; r++) {
        for (var c = 0; c < 4; c++) {
          var val = grid[r][c];
          var cell = document.createElement('div');
          cell.style.cssText = 
            'aspect-ratio:1;border-radius:6px;display:flex;align-items:center;justify-content:center;' +
            'font-size:' + (val >= 1000 ? '11px' : val >= 100 ? '14px' : '18px') + ';font-weight:800;' +
            'transition:all 0.1s;background:' + (colors[val] || '#cdc1b4') + ';' +
            'color:' + (txtColors[val] || '#f9f6f2');
          cell.textContent = val || '';
          g.appendChild(cell);
        }
      }
    }
    
    function slide(row) {
      var arr = row.filter(function(v) { return v !== 0; });
      var merged = [];
      var pts = 0;
      for (var i = 0; i < arr.length; i++) {
        if (i + 1 < arr.length && arr[i] === arr[i + 1]) {
          merged.push(arr[i] * 2);
          pts += arr[i] * 2;
          i++;
        } else {
          merged.push(arr[i]);
        }
      }
      while (merged.length < 4) merged.push(0);
      return { row: merged, points: pts };
    }
    
    function move(dir) {
      var moved = false;
      var pts = 0;
      var old = JSON.stringify(grid);
      
      for (var i = 0; i < 4; i++) {
        var row = [];
        for (var j = 0; j < 4; j++) {
          if (dir === 'left') row.push(grid[i][j]);
          else if (dir === 'right') row.push(grid[i][3 - j]);
          else if (dir === 'up') row.push(grid[j][i]);
          else if (dir === 'down') row.push(grid[3 - j][i]);
        }
        var result = slide(row);
        pts += result.points;
        for (var j = 0; j < 4; j++) {
          if (dir === 'left') grid[i][j] = result.row[j];
          else if (dir === 'right') grid[i][3 - j] = result.row[j];
          else if (dir === 'up') grid[j][i] = result.row[j];
          else if (dir === 'down') grid[3 - j][i] = result.row[j];
        }
      }
      
      if (JSON.stringify(grid) !== old) {
        moved = true;
        score += pts;
        addRandom();
        render2048();
      }
      
      // Check game over
      if (moved && !canMove()) {
        document.getElementById('score2048').textContent = 'Score: ' + score + ' - Game Over!';
        document.getElementById('reward2048').textContent = (0.025 + Math.min(score * 0.0005, 0.035)).toFixed(3);
        document.getElementById('result2048').style.display = 'block';
        _gameReward(score, 0.025);
      }
    }
    
    function canMove() {
      for (var r = 0; r < 4; r++) for (var c = 0; c < 4; c++) {
        if (grid[r][c] === 0) return true;
        if (c < 3 && grid[r][c] === grid[r][c+1]) return true;
        if (r < 3 && grid[r][c] === grid[r+1][c]) return true;
      }
      return false;
    }
    
    EN_GAMES.game2048._reset = function() { initGrid(); document.getElementById('result2048').style.display = 'none'; };
    
    // Keyboard
    document.onkeydown = function(e) {
      if (!document.getElementById('game2048Area')) return;
      if (e.key === 'ArrowLeft') move('left');
      else if (e.key === 'ArrowRight') move('right');
      else if (e.key === 'ArrowUp') move('up');
      else if (e.key === 'ArrowDown') move('down');
    };
    
    // Touch swipe
    var touchX = 0, touchY = 0;
    var area = document.getElementById('game2048Area');
    area.ontouchstart = function(e) { touchX = e.touches[0].clientX; touchY = e.touches[0].clientY; };
    area.ontouchend = function(e) {
      var dx = e.changedTouches[0].clientX - touchX;
      var dy = e.changedTouches[0].clientY - touchY;
      if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 'right' : 'left');
      else move(dy > 0 ? 'down' : 'up');
    };
    
    initGrid();
  }
};

// ===== 4. TARGET RUSH =====
EN_GAMES.target = {
  name: 'Target Rush',
  icon: '🎯',
  desc: 'Click targets before they disappear!',
  reward: 0.015,
  start: function(container) {
    container.innerHTML = 
      '<div style="text-align:center;margin-bottom:6px"><span style="font-size:20px;font-weight:800;color:var(--gold)">🎯 Target Rush</span></div>' +
      '<div id="targetGameArea" style="width:100%;height:280px;border-radius:12px;background:#0a0e1a;position:relative;overflow:hidden;cursor:crosshair;border:1px solid rgba(255,255,255,0.06)">' +
        '<div id="targetScore" style="position:absolute;top:6px;left:8px;font-size:12px;font-weight:700;color:var(--gold);z-index:5">Score: 0</div>' +
        '<div id="targetTimer" style="position:absolute;top:6px;right:8px;font-size:12px;font-weight:700;color:var(--text-muted);z-index:5">30s</div>' +
        '<div id="targetHit" style="position:absolute;bottom:6px;left:8px;font-size:10px;color:var(--emerald);z-index:5">Hits: 0</div>' +
      '</div>' +
      '<div id="targetResult" style="display:none;text-align:center;padding:8px;margin-top:4px;border-radius:8px;background:rgba(255,255,255,0.04)">' +
        '<div style="font-size:14px;font-weight:700;color:var(--emerald)">Time\'s Up!</div>' +
        '<div style="font-size:12px;color:var(--text-secondary)">Score: <span id="targetFinalScore">0</span> | Hits: <span id="targetFinalHits">0</span></div>' +
        '<div style="font-size:11px;color:var(--gold)">+$<span id="targetReward">0.015</span></div>' +
      '</div>';
    
    var score = 0;
    var hits = 0;
    var timeLeft = 30;
    var targets = [];
    var interval = null;
    var timer = null;
    var area = document.getElementById('targetGameArea');
    
    function spawnTarget() {
      if (timeLeft <= 0) return;
      var t = document.createElement('div');
      var size = 30 + Math.random() * 20;
      var x = Math.random() * (area.offsetWidth - size - 10) + 5;
      var y = Math.random() * (area.offsetHeight - size - 10) + 5;
      var colors = ['#EF4444','#F59E0B','#10B981','#3B82F6','#8B5CF6','#EC4899'];
      var color = colors[Math.floor(Math.random() * colors.length)];
      
      t.style.cssText = 
        'position:absolute;width:' + size + 'px;height:' + size + 'px;border-radius:50%;' +
        'left:' + x + 'px;top:' + y + 'px;background:radial-gradient(circle at 35% 35%,' + color + 'cc,' + color + ');' +
        'cursor:pointer;z-index:2;transition:transform 0.1s;' +
        'box-shadow:0 0 20px ' + color + '66;display:flex;align-items:center;justify-content:center;' +
        'animation:targetPulse 0.5s ease infinite';
      t.textContent = '🎯';
      t.style.fontSize = (size * 0.4) + 'px';
      
      var lifetime = 1000 + Math.random() * 1500;
      var expires = setTimeout(function() { if (t.parentNode) t.remove(); }, lifetime);
      
      t.onclick = function() {
        var pts = Math.max(1, Math.floor(10 - (30 - timeLeft) / 3));
        score += pts;
        hits++;
        document.getElementById('targetScore').textContent = 'Score: ' + score;
        document.getElementById('targetHit').textContent = 'Hits: ' + hits;
        t.style.transform = 'scale(1.5)';
        t.style.opacity = '0';
        clearTimeout(expires);
        setTimeout(function() { if (t.parentNode) t.remove(); }, 200);
      };
      
      area.appendChild(t);
    }
    
    function endTarget() {
      clearInterval(interval);
      clearInterval(timer);
      document.getElementById('targetScore').textContent = 'Score: ' + score + ' - Done!';
      document.getElementById('targetFinalScore').textContent = score;
      document.getElementById('targetFinalHits').textContent = hits;
      var reward = 0.015 + Math.min(score * 0.002, 0.035);
      document.getElementById('targetReward').textContent = reward.toFixed(3);
      document.getElementById('targetResult').style.display = 'block';
      _gameReward(score, 0.015);
    }
    
    // Start
    interval = setInterval(spawnTarget, 600);
    timer = setInterval(function() {
      timeLeft--;
      document.getElementById('targetTimer').textContent = timeLeft + 's';
      if (timeLeft <= 0) {
        endTarget();
      }
    }, 1000);
    
    // Add CSS animation
    if (!document.getElementById('targetAnimStyle')) {
      var style = document.createElement('style');
      style.id = 'targetAnimStyle';
      style.textContent = '@keyframes targetPulse { 0%,100% { transform:scale(1); } 50% { transform:scale(1.08); } }';
      document.head.appendChild(style);
    }
  }
  restart: function(container) { this.start(container); }
};

// ===== 5. COLOR CLASH =====
EN_GAMES.color = {
  name: 'Color Clash',
  icon: '🎨',
  desc: 'Quick! Does the text match the color?',
  reward: 0.015,
  start: function(container) {
    container.innerHTML = 
      '<div style="text-align:center;margin-bottom:6px"><span style="font-size:20px;font-weight:800;color:var(--gold)">🎨 Color Clash</span></div>' +
      '<div id="colorGameArea" style="width:100%;padding:16px;border-radius:12px;background:#0a0e1a;text-align:center;border:1px solid rgba(255,255,255,0.06);min-height:200px;display:flex;flex-direction:column;align-items:center;justify-content:center">' +
        '<div id="colorScore" style="font-size:13px;font-weight:700;color:var(--gold);margin-bottom:8px">Score: 0 | <span id="colorStreak">Streak: 0</span></div>' +
        '<div id="colorWord" style="font-size:36px;font-weight:800;margin:16px 0;cursor:pointer;transition:all 0.1s;user-select:none">RED</div>' +
        '<div style="font-size:10px;color:var(--text-muted);margin-bottom:12px">Does the TEXT match the COLOR it\'s displayed in?</div>' +
        '<div style="display:flex;gap:12px">' +
          '<button id="colorMatchBtn" onclick="EN_GAMES.color._answer(true)" style="padding:10px 28px;border-radius:10px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.2);color:var(--emerald);font-size:14px;font-weight:700;cursor:pointer">✅ MATCH</button>' +
          '<button id="colorNoMatchBtn" onclick="EN_GAMES.color._answer(false)" style="padding:10px 28px;border-radius:10px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);color:#ef4444;font-size:14px;font-weight:700;cursor:pointer">❌ NO MATCH</button>' +
        '</div>' +
        '<div id="colorFeedback" style="margin-top:8px;font-size:12px"></div>' +
        '<div id="colorResult" style="display:none;margin-top:12px;padding:12px;border-radius:8px;background:rgba(255,255,255,0.04)">' +
          '<div style="font-size:14px;font-weight:700;color:var(--emerald)">Challenge Complete!</div>' +
          '<div style="font-size:11px;color:var(--gold)">+$<span id="colorReward">0.015</span></div>' +
        '</div>' +
      '</div>';
    
    var score = 0;
    var streak = 0;
    var colors = ['RED','BLUE','GREEN','YELLOW','PURPLE','ORANGE','PINK'];
    var colorValues = {RED:'#EF4444',BLUE:'#3B82F6',GREEN:'#10B981',YELLOW:'#F59E0B',PURPLE:'#8B5CF6',ORANGE:'#F97316',PINK:'#EC4899'};
    var total = 0;
    var MAX_ROUNDS = 15;
    
    function nextRound() {
      if (total >= MAX_ROUNDS) {
        endColor();
        return;
      }
      total++;
      var word = colors[Math.floor(Math.random() * colors.length)];
      var displayColor = colors[Math.floor(Math.random() * colors.length)];
      var match = word === displayColor;
      
      document.getElementById('colorWord').textContent = word;
      document.getElementById('colorWord').style.color = colorValues[displayColor];
      document.getElementById('colorFeedback').textContent = '';
      document.getElementById('colorWord').dataset.match = match;
    }
    
    EN_GAMES.color._answer = function(guess) {
      var isMatch = document.getElementById('colorWord').dataset.match === 'true';
      var fb = document.getElementById('colorFeedback');
      
      if (guess === isMatch) {
        score++;
        streak++;
        fb.textContent = '✅ Correct! (Streak: ' + streak + ')';
        fb.style.color = '#34d399';
      } else {
        streak = 0;
        fb.textContent = '❌ Wrong! The word ' + (isMatch ? 'DID' : 'DID NOT') + ' match the color';
        fb.style.color = '#ef4444';
      }
      document.getElementById('colorScore').textContent = 'Score: ' + score + ' | Streak: ' + streak;
      document.getElementById('colorStreak').textContent = 'Streak: ' + streak;
      
      setTimeout(nextRound, 600);
    };
    
    function endColor() {
      document.getElementById('colorWord').style.display = 'none';
      document.getElementById('colorMatchBtn').style.display = 'none';
      document.getElementById('colorNoMatchBtn').style.display = 'none';
      document.getElementById('colorFeedback').style.display = 'none';
      document.getElementById('colorScore').textContent = 'Final Score: ' + score + '/15';
      var reward = 0.015 + Math.min(score * 0.003, 0.035);
      document.getElementById('colorReward').textContent = reward.toFixed(3);
      document.getElementById('colorResult').style.display = 'block';
      _gameReward(score, 0.015);
    }
    
    nextRound();
  }
  restart: function(container) { this.start(container); }
};

// ===== 6. MEMORY MATCH (Enhanced) =====
EN_GAMES.memory = {
  name: 'Memory Match',
  icon: '🧠',
  desc: 'Match all card pairs!',
  reward: 0.020,
  start: function(container) {
    var emojis = ['🐶','🐱','🐰','🐻','🐼','🐨','🦊','🐸','🐵','🦁','🐯','🐮'];
    var pairs = emojis.slice(0, 6); // 6 pairs = 12 cards
    var cards = pairs.concat(pairs);
    // Shuffle
    for (var i = cards.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = cards[i]; cards[i] = cards[j]; cards[j] = temp;
    }
    
    container.innerHTML = 
      '<div style="text-align:center;margin-bottom:6px"><span style="font-size:20px;font-weight:800;color:var(--gold)">🧠 Memory Match</span></div>' +
      '<div style="font-size:10px;color:var(--text-muted);text-align:center;margin-bottom:6px">Match all 6 pairs!</div>' +
      '<div id="memoryGrid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:6px;border-radius:12px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06)">';
    
    cards.forEach(function(emoji, idx) {
      container.innerHTML += 
        '<div id="memcard_' + idx + '" onclick="EN_GAMES.memory._flip(' + idx + ')" style="aspect-ratio:1;border-radius:10px;background:linear-gradient(135deg,rgba(212,175,55,0.2),rgba(212,175,55,0.05));border:1px solid rgba(212,175,55,0.15);display:flex;align-items:center;justify-content:center;font-size:24px;cursor:pointer;transition:all 0.3s" data-emoji="' + emoji + '" data-matched="false">?</div>';
    });
    
    container.innerHTML += 
      '</div>' +
      '<div style="display:flex;justify-content:space-between;padding:6px 4px;font-size:11px">' +
        '<span id="memoryScore" style="color:var(--gold);font-weight:700">Pairs: 0/6</span>' +
        '<span id="memoryMoves" style="color:var(--text-muted)">Moves: 0</span>' +
      '</div>' +
      '<div id="memoryResult" style="display:none;text-align:center;padding:8px;margin-top:4px;border-radius:8px;background:rgba(255,255,255,0.04)">' +
        '<div style="font-size:14px;font-weight:700;color:var(--emerald)">All matched!</div>' +
        '<div style="font-size:11px;color:var(--gold)">+$<span id="memoryReward">0.020</span></div>' +
      '</div>';
    
    var flipped = [];
    var matched = 0;
    var moves = 0;
    var locked = false;
    
    EN_GAMES.memory._flip = function(idx) {
      if (locked) return;
      var el = document.getElementById('memcard_' + idx);
      if (!el || el.dataset.matched === 'true' || flipped.includes(el)) return;
      
      el.textContent = el.dataset.emoji;
      el.style.transform = 'rotateY(180deg)';
      el.style.background = 'rgba(212,175,55,0.1)';
      flipped.push(el);
      
      if (flipped.length === 2) {
        locked = true;
        moves++;
        document.getElementById('memoryMoves').textContent = 'Moves: ' + moves;
        var c1 = flipped[0], c2 = flipped[1];
        
        if (c1.dataset.emoji === c2.dataset.emoji) {
          c1.dataset.matched = 'true';
          c2.dataset.matched = 'true';
          c1.style.background = 'rgba(16,185,129,0.15)';
          c1.style.borderColor = 'rgba(16,185,129,0.3)';
          c2.style.background = 'rgba(16,185,129,0.15)';
          c2.style.borderColor = 'rgba(16,185,129,0.3)';
          matched++;
          document.getElementById('memoryScore').textContent = 'Pairs: ' + matched + '/6';
          flipped = [];
          locked = false;
          
          if (matched >= 6) {
            // Bonus for fewer moves
            var bonus = Math.max(0, (12 - moves) * 0.003);
            var reward = 0.020 + Math.min(bonus, 0.030);
            document.getElementById('memoryReward').textContent = reward.toFixed(3);
            document.getElementById('memoryResult').style.display = 'block';
            _gameReward(Math.max(1, 12 - moves), 0.020);
          }
        } else {
          setTimeout(function() {
            c1.textContent = '?';
            c1.style.transform = '';
            c1.style.background = '';
            c2.textContent = '?';
            c2.style.transform = '';
            c2.style.background = '';
            flipped = [];
            locked = false;
          }, 800);
        }
      }
    };
  }
  restart: function(container) { this.start(container); }
};
