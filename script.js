const SIZE = 4;
const STORAGE_KEY = 'gameState2048_v1';
const LEADERS_KEY = 'leaders2048_v1';
const UNDO_KEY = 'undoStack2048_v1';


const gridContainer = document.getElementById('grid-container');
const scoreEl = document.getElementById('score');
const btnUndo = document.getElementById('btn-undo');
const btnRestart = document.getElementById('btn-restart');
const btnLeaders = document.getElementById('btn-leaders');
const overlay = document.getElementById('overlay');
const gameOverBox = document.getElementById('game-over-box');
const gameOverMsg = document.getElementById('game-over-msg');
const playerNameInput = document.getElementById('player-name');
const saveScoreBtn = document.getElementById('save-score');
const restart2 = document.getElementById('restart-2');
const leaderboardBox = document.getElementById('leaderboard-box');
const leadersTableBody = document.querySelector('#leaders-table tbody');
const closeLeadersBtn = document.getElementById('close-leaders');
const mobileControls = document.getElementById('mobile-controls');


let board = [];
let score = 0;
let gameOver = false;
let undoStack = []; 
let tileSizePx = 0; 
let moving = false; 


function init() {
  createGridCells();
  loadState() || newGame();
  attachEvents();
  render();
  updateMobileControlsVisibility();
}


function createGridCells() {
  gridContainer.style.gridTemplateColumns = `repeat(${SIZE}, 1fr)`;
  gridContainer.style.gridTemplateRows = `repeat(${SIZE}, 1fr)`;

  while (gridContainer.firstChild) gridContainer.removeChild(gridContainer.firstChild);
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.row = r;
      cell.dataset.col = c;
      gridContainer.appendChild(cell);
    }
  }
 
  requestAnimationFrame(() => {
    const rect = gridContainer.getBoundingClientRect();
    tileSizePx = (rect.width - (SIZE - 1) * 12) / SIZE; 
  });
}


function newGame() {
  board = createEmpty();
  score = 0;
  gameOver = false;
  undoStack = [];

  const startCount = randInt(1, 3);
  for (let i = 0; i < startCount; i++) spawnRandom();
  saveState();
  render();
}


function createEmpty() {
  return Array.from({length: SIZE}, () => Array.from({length: SIZE}, () => 0));
}


function saveState() {
  const state = {board, score, gameOver};
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch(e) {
    console.warn('Failed to save state', e);
  }

  try {
    localStorage.setItem(UNDO_KEY, JSON.stringify(undoStack));
  } catch(e){}
}


function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const st = JSON.parse(raw);
    if (!st || !st.board) return false;
    board = st.board;
    score = st.score || 0;
    gameOver = !!st.gameOver;
  
    const rawUndo = localStorage.getItem(UNDO_KEY);
    undoStack = rawUndo ? JSON.parse(rawUndo) : [];
    return true;
  } catch(e){
    console.warn('Load failed', e);
    return false;
  }
}


function clearSaved() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(UNDO_KEY);
}


function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


function spawnRandom(count = 1) {
  const empties = [];
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (board[r][c] === 0) empties.push([r,c]);
  if (empties.length === 0) return;

  count = Math.min(count, empties.length);
  for (let i = 0; i < count; i++) {
    const idx = randInt(0, empties.length - 1);
    const [r,c] = empties.splice(idx,1)[0];
    board[r][c] = Math.random() < 0.9 ? 2 : 4;

  }
}


function render() {

  const existing = gridContainer.querySelectorAll('.tile');
  existing.forEach(t => t.remove());

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const val = board[r][c];
      if (val === 0) continue;
      const tile = document.createElement('div');
      tile.className = 'tile pop';
      tile.dataset.val = String(val);
      tile.textContent = String(val);
    
      const cell = gridContainer.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
      if (cell) {
      
        tile.style.width = `calc(100% - 8px)`;
        tile.style.height = `calc(100% - 8px)`;
        tile.style.left = `4px`;
        tile.style.top = `4px`;
       
        cell.appendChild(tile);
        
        setTimeout(() => tile.classList.remove('pop'), 200);
      }
    }
  }

  
  scoreEl.textContent = String(score);

  
  if (gameOver) {
    showGameOver();
  } else {
    hideOverlay();
  }

  
  updateUndoButton();
  saveState();
}


function showGameOver() {
  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden','false');
  
  leaderboardBox.classList.add('hidden');
  gameOverBox.classList.remove('hidden');
  gameOverMsg.textContent = 'Игра окончена';
  playerNameInput.value = '';
  playerNameInput.style.display = ''; 
  saveScoreBtn.style.display = '';
  updateMobileControlsVisibility();
}


function hideOverlay() {
  overlay.classList.add('hidden');
  overlay.setAttribute('aria-hidden','true');
}


function showLeaders() {
  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden','false');
  leaderboardBox.classList.remove('hidden');
  gameOverBox.classList.add('hidden');
  renderLeaders();
  updateMobileControlsVisibility();
}


function renderLeaders() {
  while (leadersTableBody.firstChild) leadersTableBody.removeChild(leadersTableBody.firstChild);
  const raw = localStorage.getItem(LEADERS_KEY);
  let list = raw ? JSON.parse(raw) : [];
  list = list.slice(0,10);
  list.forEach(entry => {
    const tr = document.createElement('tr');
    const tdName = document.createElement('td');
    tdName.textContent = entry.name;
    const tdScore = document.createElement('td');
    tdScore.textContent = String(entry.score);
    const tdDate = document.createElement('td');
    tdDate.textContent = entry.date;
    tr.appendChild(tdName);
    tr.appendChild(tdScore);
    tr.appendChild(tdDate);
    leadersTableBody.appendChild(tr);
  });
}


function addLeader(name, scoreValue) {
  const raw = localStorage.getItem(LEADERS_KEY);
  const list = raw ? JSON.parse(raw) : [];
  const date = new Date().toLocaleString();
  list.push({name: name || 'Аноним', score: scoreValue, date});

  list.sort((a,b) => b.score - a.score);

  localStorage.setItem(LEADERS_KEY, JSON.stringify(list.slice(0, 50)));
}


function updateUndoButton() {
  btnUndo.disabled = undoStack.length === 0 || gameOver;
}

function pushUndo() {
  try {
    const stateCopy = {
      board: board.map(row => row.slice()),
      score
    };
    undoStack.push(stateCopy);
   
    if (undoStack.length > 20) undoStack.shift();
    localStorage.setItem(UNDO_KEY, JSON.stringify(undoStack));
  } catch(e){}
}


function undo() {
  if (undoStack.length === 0 || gameOver) return;
  const prev = undoStack.pop();
  board = prev.board.map(row => row.slice());
  score = prev.score;
  saveState();
  localStorage.setItem(UNDO_KEY, JSON.stringify(undoStack));
  render();
}


function checkGameOver() {

  for (let r=0;r<SIZE;r++) for (let c=0;c<SIZE;c++) if (board[r][c] === 0) return false;
 
  for (let r=0;r<SIZE;r++){
    for (let c=0;c<SIZE-1;c++){
      if (board[r][c] === board[r][c+1]) return false;
    }
  }
  for (let c=0;c<SIZE;c++){
    for (let r=0;r<SIZE-1;r++){
      if (board[r][c] === board[r+1][c]) return false;
    }
  }
  return true;
}


function move(dir) {
  if (moving || gameOver) return;
  moving = true;
  pushUndo(); 
  let moved = false;
  let gained = 0;

  function compressLine(line) {
   
    const arr = line.filter(v => v !== 0);
    const res = [];
    let i = 0;
    while (i < arr.length) {
      if (i+1 < arr.length && arr[i] === arr[i+1]) {
        const merged = arr[i]*2;
        res.push(merged);
        gained += merged;
        i += 2;
      } else {
        res.push(arr[i]);
        i += 1;
      }
    }
   
    while (res.length < SIZE) res.push(0);
    return res;
  }

  if (dir === 'left' || dir === 'right') {
    for (let r=0;r<SIZE;r++){
      const row = board[r].slice();
      const original = row.slice();
      let newRow = dir === 'left' ? compressLine(row) : compressLine(row.reverse()).reverse();
      if (dir === 'right') row.reverse();
      board[r] = newRow;
    
      for (let c=0;c<SIZE;c++) if (board[r][c] !== original[c]) moved = true;
    }
  } else {
    
    for (let c=0;c<SIZE;c++){
      const col = [];
      for (let r=0;r<SIZE;r++) col.push(board[r][c]);
      const original = col.slice();
      let newCol = dir === 'up' ? compressLine(col) : compressLine(col.reverse()).reverse();
      for (let r=0;r<SIZE;r++) board[r][c] = newCol[r];
      for (let r=0;r<SIZE;r++) if (board[r][c] !== original[r]) moved = true;
    }
  }

  if (moved) {
    score += gained;
   
    spawnRandom(Math.random() < 0.3 ? 2 : 1);

    if (checkGameOver()) {
      gameOver = true;
    }
  } else {
   
    undoStack.pop();
  }
 
  setTimeout(() => {
    render();
    moving = false;
  }, 120);

  return moved;
}

function attachEvents() {
  
  window.addEventListener('keydown', (e) => {
    if (gameOver) return;
    switch (e.key) {
      case 'ArrowLeft': e.preventDefault(); move('left'); break;
      case 'ArrowRight': e.preventDefault(); move('right'); break;
      case 'ArrowUp': e.preventDefault(); move('up'); break;
      case 'ArrowDown': e.preventDefault(); move('down'); break;
      case 'z': 
        if ((e.ctrlKey || e.metaKey)) { e.preventDefault(); undo(); }
        break;
      default: break;
    }
  });


  btnUndo.addEventListener('click', () => { undo(); });
  btnRestart.addEventListener('click', () => { newGame(); render(); updateMobileControlsVisibility(); });
  restart2.addEventListener('click', () => { newGame(); render(); hideOverlay(); updateMobileControlsVisibility(); });
  btnLeaders.addEventListener('click', () => { showLeaders(); });
  closeLeadersBtn.addEventListener('click', () => { hideOverlay(); });

 
  saveScoreBtn.addEventListener('click', () => {
    const name = playerNameInput.value.trim() || 'Аноним';
    addLeader(name, score);
    
    playerNameInput.style.display = 'none';
    saveScoreBtn.style.display = 'none';
    gameOverMsg.textContent = 'Ваш рекорд сохранён.';
    renderLeaders();
 
    setTimeout(() => {
      leaderboardBox.classList.remove('hidden');
      gameOverBox.classList.add('hidden');
    }, 300);
  });


  mobileControls.addEventListener('click', (e) => {
    const dir = e.target.dataset && e.target.dataset.dir;
    if (!dir) return;
    move(dir);
  });


  let touchStartX = 0, touchStartY = 0;
  gridContainer.addEventListener('touchstart', (e) => {
    if (!e.touches || e.touches.length === 0) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, {passive:true});

  gridContainer.addEventListener('touchend', (e) => {
    if (gameOver) return;
    if (!e.changedTouches || e.changedTouches.length === 0) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      dx > 0 ? move('right') : move('left');
    } else {
      dy > 0 ? move('down') : move('up');
    }
  }, {passive:true});
}


function updateMobileControlsVisibility() {
  const isMobile = window.matchMedia('(max-width: 900px)').matches;
  
  const overlayVisible = !overlay.classList.contains('hidden');
  if (isMobile && !overlayVisible) {
    mobileControls.classList.remove('hidden');
    mobileControls.setAttribute('aria-hidden','false');
  } else {
    mobileControls.classList.add('hidden');
    mobileControls.setAttribute('aria-hidden','true');
  }
}

window.addEventListener('resize', () => updateMobileControlsVisibility());


function handleGameOverIfNeeded() {
  if (gameOver) showGameOver();
}


init();
window.addEventListener('beforeunload', saveState);


