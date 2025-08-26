// ==========================
// Utilities
// ==========================
const rand = (n) => Math.floor(Math.random() * n);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// ==========================
// Cell & Maze model
// ==========================
class Cell {
  constructor(i, j){
    this.i = i; this.j = j;          // column, row
    this.walls = { top:true, right:true, bottom:true, left:true };
    this.visited = false;             // for generation
  }
}

class Maze {
  constructor(rows, cols){
    this.rows = rows; this.cols = cols;
    this.grid = Array.from({length:rows}, (_, j) =>
      Array.from({length:cols}, (_, i) => new Cell(i, j))
    );
  }
  index(i, j){ return (i>=0 && j>=0 && i<this.cols && j<this.rows) ? this.grid[j][i] : null; }
  neighbors(i, j){
    return [
      this.index(i, j-1), // top
      this.index(i+1, j), // right
      this.index(i, j+1), // bottom
      this.index(i-1, j)  // left
    ];
  }
  // Randomized DFS (iterative backtracking) generator: creates a perfect maze
  generate(){
    for(const row of this.grid){
      for(const c of row){
        c.visited=false;
        c.walls={top:true,right:true,bottom:true,left:true};
      }
    }
    const stack = [];
    let current = this.index(0,0); current.visited = true; stack.push(current);
    while(stack.length){
      current = stack[stack.length-1];
      const {i,j} = current;
      const neigh = [];
      const list = this.neighbors(i,j);
      if(list[0] && !list[0].visited) neigh.push({dir:'top', cell:list[0]});
      if(list[1] && !list[1].visited) neigh.push({dir:'right', cell:list[1]});
      if(list[2] && !list[2].visited) neigh.push({dir:'bottom', cell:list[2]});
      if(list[3] && !list[3].visited) neigh.push({dir:'left', cell:list[3]});
      if(neigh.length){
        const next = neigh[rand(neigh.length)];
        // Knock down shared walls
        if(next.dir==='top'){ current.walls.top=false; next.cell.walls.bottom=false; }
        if(next.dir==='right'){ current.walls.right=false; next.cell.walls.left=false; }
        if(next.dir==='bottom'){ current.walls.bottom=false; next.cell.walls.top=false; }
        if(next.dir==='left'){ current.walls.left=false; next.cell.walls.right=false; }
        next.cell.visited = true; stack.push(next.cell);
      } else {
        stack.pop();
      }
    }
  }
}

// ==========================
// Canvas & rendering
// ==========================
const canvas = document.getElementById('maze');
const ctx = canvas.getContext('2d');

let rows = 25, cols = 35, cellSize = 24;
let maze = new Maze(rows, cols);
maze.generate();

let start = { i:0, j:0 };
let goal = { i: cols-1, j: rows-1 };
let player = { i: start.i, j: start.j };

const state = {
  animating:false,
  pickMode:null, // 'start' | 'goal' | null
  showWire:false,
  solver:null,
  lastPath:[],
  visitedSet:new Set(),
  frontierSet:new Set(),
};

function resizeCanvas(){
  // Responsive sizing while keeping square cells
  const wrap = canvas.parentElement.getBoundingClientRect();
  const maxW = Math.floor(wrap.width - 2);
  const maxH = Math.floor((window.innerHeight*0.75));
  cellSize = Math.max(8, Math.floor(Math.min(maxW/cols, maxH/rows)));
  canvas.width = cellSize * cols;
  canvas.height = cellSize * rows;
  draw();
}
window.addEventListener('resize', resizeCanvas);

function cellRect(i,j){
  return { x: i*cellSize, y: j*cellSize, w: cellSize, h: cellSize };
}

function drawGrid(){
  ctx.fillStyle = '#0a0d14';
  ctx.fillRect(0,0,canvas.width, canvas.height);

  // visited & frontier (during search)
  if(state.showWire){
    ctx.fillStyle = 'rgba(100,116,139,0.25)';
    for(const key of state.visitedSet){
      const [i,j] = key.split(',').map(Number);
      const r = cellRect(i,j); ctx.fillRect(r.x, r.y, r.w, r.h);
    }
    ctx.fillStyle = 'rgba(167,139,250,0.25)';
    for(const key of state.frontierSet){
      const [i,j] = key.split(',').map(Number);
      const r = cellRect(i,j); ctx.fillRect(r.x, r.y, r.w, r.h);
    }
  }

  // walls
  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--wall');
  ctx.lineWidth = Math.max(2, Math.floor(cellSize*0.18));
  ctx.lineCap = 'square';
  ctx.beginPath();
  for(let j=0;j<rows;j++){
    for(let i=0;i<cols;i++){
      const c = maze.grid[j][i];
      const x = i*cellSize, y = j*cellSize, s = cellSize;
      if(c.walls.top){ ctx.moveTo(x, y); ctx.lineTo(x+s, y); }
      if(c.walls.right){ ctx.moveTo(x+s, y); ctx.lineTo(x+s, y+s); }
      if(c.walls.bottom){ ctx.moveTo(x, y+s); ctx.lineTo(x+s, y+s); }
      if(c.walls.left){ ctx.moveTo(x, y); ctx.lineTo(x, y+s); }
    }
  }
  ctx.stroke();
}

function drawMarkers(){
  const s = cellSize;
  const r = Math.max(4, Math.floor(s*0.3));

  // start
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--start');
  ctx.beginPath();
  ctx.arc(start.i*s + s/2, start.j*s + s/2, r, 0, Math.PI*2); ctx.fill();

  // goal
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--goal');
  ctx.beginPath();
  ctx.arc(goal.i*s + s/2, goal.j*s + s/2, r, 0, Math.PI*2); ctx.fill();

  // player
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--player');
  ctx.beginPath();
  ctx.arc(player.i*s + s/2, player.j*s + s/2, r*0.9, 0, Math.PI*2); ctx.fill();
}

function drawPath(path){
  if(!path || !path.length) return;
  const s = cellSize;
  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--path');
  ctx.lineWidth = Math.max(2, Math.floor(s*0.22));
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  for(let k=0;k<path.length;k++){
    const {i,j} = path[k];
    const x = i*s + s/2, y = j*s + s/2;
    if(k===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  }
  ctx.stroke();
}

function draw(){
  drawGrid();
  drawPath(state.lastPath);
  drawMarkers();
}

// ==========================
// Manual player movement
// ==========================
function canMove(from, dir){
  const c = maze.grid[from.j][from.i];
  if(dir==='up' && !c.walls.top) return true;
  if(dir==='right' && !c.walls.right) return true;
  if(dir==='down' && !c.walls.bottom) return true;
  if(dir==='left' && !c.walls.left) return true;
  return false;
}

function stepPlayer(dir){
  if(state.animating) return;        // block while animating solver
  if(!canMove(player, dir)) return;
  if(dir==='up') player.j -= 1;
  if(dir==='right') player.i += 1;
  if(dir==='down') player.j += 1;
  if(dir==='left') player.i -= 1;
  draw();
  if(player.i===goal.i && player.j===goal.j){
    flash('You reached the goal!');
  }
}

// Keyboard controls
document.addEventListener('keydown', (e)=>{
  const key = e.key.toLowerCase();
  if(['arrowup','w'].includes(key)) { e.preventDefault(); stepPlayer('up'); }
  if(['arrowright','d'].includes(key)) { e.preventDefault(); stepPlayer('right'); }
  if(['arrowdown','s'].includes(key)) { e.preventDefault(); stepPlayer('down'); }
  if(['arrowleft','a'].includes(key)) { e.preventDefault(); stepPlayer('left'); }

  if(key==='g') onGenerate();
  if(key==='r') onSolve();
  if(key==='p') onPause();
  if(key==='c') onClear();
  if(key==='.') onStep();
  if(key==='i') pickMode('start');  // avoid conflict with 's' (down)
  if(key==='o') pickMode('goal');
});

// ==========================
// Canvas interaction (pick start/goal)
// ==========================
canvas.addEventListener('click', (e)=>{
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left; const y = e.clientY - rect.top;
  const i = clamp(Math.floor(x / cellSize), 0, cols-1);
  const j = clamp(Math.floor(y / cellSize), 0, rows-1);
  if(state.pickMode==='start'){
    start = {i,j}; player = {i,j}; state.pickMode=null; flash('Start cell set');
    draw();
  } else if(state.pickMode==='goal'){
    goal = {i,j}; state.pickMode=null; flash('Goal cell set');
    draw();
  }
});

function pickMode(kind){
  state.pickMode = kind; // 'start' or 'goal'
  if(kind==='start') flash('Click a cell to set START');
  if(kind==='goal') flash('Click a cell to set GOAL');
}

// ==========================
// Search algorithms
// ==========================
function neighborsOpen(i,j){
  const c = maze.grid[j][i];
  const out = [];
  if(!c.walls.top) out.push({i, j:j-1, dir:'up'});
  if(!c.walls.right) out.push({i:i+1, j, dir:'right'});
  if(!c.walls.bottom) out.push({i, j:j+1, dir:'down'});
  if(!c.walls.left) out.push({i:i-1, j, dir:'left'});
  return out;
}

const keyOf = (i,j)=> `${i},${j}`;

class PriorityQueue {
  constructor(score){ this._data=[]; this._score = score || (x=>x); }
  push(x){ this._data.push(x); this._data.sort((a,b)=> this._score(a)-this._score(b)); }
  shift(){ return this._data.shift(); }
  get length(){ return this._data.length; }
}

function manhattan(a,b){ return Math.abs(a.i-b.i) + Math.abs(a.j-b.j); }

function reconstruct(came, endKey){
  const path = [];
  let cur = endKey;
  while(cur){
    const [i,j] = cur.split(',').map(Number);
    path.push({i,j});
    cur = came.get(cur) || null;
  }
  return path.reverse();
}

function makeSolver(algo, start, goal){
  const startKey = keyOf(start.i,start.j);
  const goalKey  = keyOf(goal.i,goal.j);

  const visited = new Set();
  const frontier = (algo==='dfs') ? [] : (algo==='bfs') ? [] : new PriorityQueue(n=>n.score);
  const came = new Map(); // childKey -> parentKey
  const dist = new Map([[startKey,0]]);

  // Add to frontier helper
  const enqueue = (node, score=0)=>{
    const key = keyOf(node.i,node.j);
    if(visited.has(key)) return;
    if(algo==='bfs' || algo==='dfs'){ frontier.push(node); }
    else{ frontier.push({...node, score}); }
  };

  // init
  enqueue({i:start.i, j:start.j});

  function step(){
    if((algo==='bfs' || algo==='dfs') && frontier.length===0) return {done:true, found:false};
    if(!(algo==='bfs' || algo==='dfs') && frontier.length===0) return {done:true, found:false};

    let cur;
    if(algo==='dfs') cur = frontier.pop();
    else if(algo==='bfs') cur = frontier.shift();
    else cur = frontier.shift();

    const curKey = keyOf(cur.i, cur.j);
    if(visited.has(curKey)) return {done:false};
    visited.add(curKey);

    // expose for debug UI
    state.visitedSet = new Set(visited);

    if(curKey===goalKey){
      return {done:true, found:true, path: reconstruct(came, curKey)};
    }

    const neigh = neighborsOpen(cur.i, cur.j);
    for(const nb of neigh){
      const nbKey = keyOf(nb.i, nb.j);
      if(visited.has(nbKey)) continue;
      const newDist = (dist.get(curKey)||0) + 1; // uniform cost
      if(!dist.has(nbKey) || newDist < dist.get(nbKey)){
        dist.set(nbKey, newDist);
        came.set(nbKey, curKey);
        if(algo==='bfs'){
          frontier.push({i:nb.i, j:nb.j});
        } else if(algo==='dfs'){
          frontier.push({i:nb.i, j:nb.j});
        } else if(algo==='dijkstra'){
          const score = newDist;
          frontier.push({i:nb.i, j:nb.j, score});
        } else if(algo==='astar'){
          const h = manhattan(nb, goal);
          const g = newDist;
          frontier.push({i:nb.i, j:nb.j, score: g + h});
        }
      }
    }

    // frontier set for visualization
    const fset = new Set();
    if(algo==='bfs' || algo==='dfs'){
      for(const n of frontier){ fset.add(keyOf(n.i,n.j)); }
    } else {
      for(const n of frontier._data){ fset.add(keyOf(n.i,n.j)); }
    }
    state.frontierSet = fset;

    return {done:false};
  }

  return { step };
}

// ==========================
// Solver animation
// ==========================
let rafId = 0; let lastTick = 0; let accumulator = 0;

function animateSolver(){
  if(!state.solver){ state.animating=false; return; }
  const fps = parseInt(document.getElementById('speed').value, 10);
  const stepPerSec = clamp(fps, 1, 240);

  function loop(ts){
    if(!state.animating) return;
    const dt = (ts - lastTick) / 1000;
    lastTick = ts; accumulator += dt;

    const stepsToDo = Math.max(1, Math.floor(accumulator * stepPerSec));
    if(stepsToDo>0) accumulator -= stepsToDo / stepPerSec;

    for(let k=0;k<stepsToDo;k++){
      const r = state.solver.step();
      if(r && r.done){
        state.animating=false; state.solver=null; state.frontierSet.clear();
        if(r.found){ state.lastPath = r.path; draw(); flash('Path found'); }
        else { flash('No path'); }
        return;
      }
    }
    draw();
    rafId = requestAnimationFrame(loop);
  }
  lastTick = performance.now(); accumulator = 0; rafId = requestAnimationFrame(loop);
}

// ==========================
// UI handlers
// ==========================
const $ = (id)=> document.getElementById(id);

function onGenerate(){
  rows = clamp(parseInt($('rows').value||rows,10), 5, 120);
  cols = clamp(parseInt($('cols').value||cols,10), 5, 120);
  maze = new Maze(rows, cols); maze.generate();
  start = {i:0, j:0}; goal = {i:cols-1, j:rows-1}; player = {i:start.i, j:start.j};
  state.lastPath = []; state.visitedSet.clear(); state.frontierSet.clear();
  state.animating=false; state.solver=null; resizeCanvas(); flash('New maze generated');
}

function onSolve(){
  const algo = $('algo').value;
  state.solver = makeSolver(algo, start, goal);
  state.lastPath = []; state.visitedSet.clear(); state.frontierSet.clear();
  state.animating = true; animateSolver();
}

function onPause(){
  if(state.animating){ state.animating=false; cancelAnimationFrame(rafId); flash('Paused'); }
  else if(state.solver){ state.animating=true; animateSolver(); flash('Resumed'); }
}

function onStep(){
  if(!state.solver){ flash('Press Solve first'); return; }
  const r = state.solver.step(); draw();
  if(r && r.done){
    state.solver=null; state.frontierSet.clear();
    if(r.found){ state.lastPath=r.path; draw(); flash('Path found'); }
    else flash('No path');
  }
}

function onClear(){ state.lastPath = []; state.visitedSet.clear(); state.frontierSet.clear(); draw(); }
function onResetPlayer(){ player = {i:start.i, j:start.j}; draw(); }
function onExport(){
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = `maze_${cols}x${rows}.png`;
  a.click();
}
function onWire(){ state.showWire = !state.showWire; draw(); }

// Buttons
$('btnGen').addEventListener('click', onGenerate);
$('btnSolve').addEventListener('click', onSolve);
$('btnPause').addEventListener('click', onPause);
$('btnStep').addEventListener('click', onStep);
$('btnClear').addEventListener('click', onClear);
$('btnResetPlayer').addEventListener('click', onResetPlayer);
$('btnExport').addEventListener('click', onExport);
$('btnWireframe').addEventListener('click', onWire);
$('btnPickStart').addEventListener('click', ()=> pickMode('start'));
$('btnPickGoal').addEventListener('click', ()=> pickMode('goal'));

// Toasts
let toastTimer = 0;
function flash(text){
  clearTimeout(toastTimer);
  let el = document.getElementById('toast');
  if(!el){ el = document.createElement('div'); el.id='toast'; document.body.appendChild(el); }
  el.textContent = text;
  Object.assign(el.style, {
    position:'fixed', left:'50%', bottom:'22px', transform:'translateX(-50%)',
    background:'rgba(20,24,35,0.9)', color:'white', padding:'10px 14px', borderRadius:'10px',
    border:'1px solid #ffffff22', zIndex:9999, boxShadow:'0 8px 30px rgba(0,0,0,0.35)'
  });
  el.style.opacity='1';
  toastTimer = setTimeout(()=>{ el.style.transition='opacity .6s ease'; el.style.opacity='0'; }, 1100);
}

// Init
resizeCanvas(); draw();
