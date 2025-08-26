// ==========================
// Utilities
// ==========================
const rand = (n) => Math.floor(Math.random() * n);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const keyOf = (i,j)=> `${i},${j}`;

// ==========================
// Cell & Maze model
// ==========================
class Cell {
  constructor(i, j){
    this.i = i; this.j = j;          // column, row
    this.walls = { top:true, right:true, bottom:true, left:true };
    this.visited = false;             // used by generators
  }
}

class DSU {
  constructor(n){ this.p = Array.from({length:n}, (_,i)=>i); this.r = Array(n).fill(0); }
  find(x){ return this.p[x]===x ? x : (this.p[x]=this.find(this.p[x])); }
  union(a,b){
    a=this.find(a); b=this.find(b);
    if(a===b) return false;
    if(this.r[a]<this.r[b]) [a,b]=[b,a];
    this.p[b]=a; if(this.r[a]===this.r[b]) this.r[a]++;
    return true;
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
  resetGrid(){
    for(const row of this.grid){
      for(const c of row){
        c.visited=false;
        c.walls={top:true,right:true,bottom:true,left:true};
      }
    }
  }
  generateBacktracker(){
    this.resetGrid();
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
  generatePrim(){
    this.resetGrid();
    const inMaze = new Set();
    const frontier = [];
    const pushFrontier = (ci,cj)=>{
      const c = this.grid[cj][ci];
      const neigh = this.neighbors(ci,cj);
      for(const nb of neigh){
        if(!nb) continue;
        const k = keyOf(nb.i, nb.j);
        if(!inMaze.has(k) && !frontier.find(f=>f.i===nb.i && f.j===nb.j)){
          frontier.push({i:nb.i,j:nb.j});
        }
      }
    };
    // start at random cell
    const si = rand(this.cols), sj = rand(this.rows);
    inMaze.add(keyOf(si,sj));
    pushFrontier(si,sj);

    while(frontier.length){
      const idx = rand(frontier.length);
      const cell = frontier.splice(idx,1)[0]; // remove random frontier cell
      // connect to a random neighbor that's already in the maze
      const neigh = this.neighbors(cell.i,cell.j).filter(nb => nb && inMaze.has(keyOf(nb.i,nb.j)));
      if(neigh.length){
        const nb = neigh[rand(neigh.length)];
        const cur = this.grid[cell.j][cell.i];
        // knock wall between cell and nb
        if(nb.j === cell.j-1){ cur.walls.top=false; nb.walls.bottom=false; }
        else if(nb.i === cell.i+1){ cur.walls.right=false; nb.walls.left=false; }
        else if(nb.j === cell.j+1){ cur.walls.bottom=false; nb.walls.top=false; }
        else if(nb.i === cell.i-1){ cur.walls.left=false; nb.walls.right=false; }
      }
      inMaze.add(keyOf(cell.i,cell.j));
      pushFrontier(cell.i,cell.j);
    }
  }
  generateKruskal(){
    this.resetGrid();
    // list all edges between adjacent cells
    const edges = [];
    for(let j=0;j<this.rows;j++){
      for(let i=0;i<this.cols;i++){
        if(i+1<this.cols) edges.push({a:{i,j}, b:{i:i+1,j}, dir:'right'});
        if(j+1<this.rows) edges.push({a:{i,j}, b:{i,j:j+1}, dir:'bottom'});
      }
    }
    // shuffle edges
    for(let k=edges.length-1;k>0;k--){
      const r = rand(k+1); [edges[k], edges[r]] = [edges[r], edges[k]];
    }
    const idx = (i,j)=> j*this.cols + i;
    const dsu = new DSU(this.rows*this.cols);

    for(const e of edges){
      const a = idx(e.a.i, e.a.j), b = idx(e.b.i, e.b.j);
      if(dsu.union(a,b)){
        const ca = this.grid[e.a.j][e.a.i];
        const cb = this.grid[e.b.j][e.b.i];
        if(e.dir==='right'){ ca.walls.right=false; cb.walls.left=false; }
        else if(e.dir==='bottom'){ ca.walls.bottom=false; cb.walls.top=false; }
      }
    }
  }
  generate(method){
    if(method==='prim') return this.generatePrim();
    if(method==='kruskal') return this.generateKruskal();
    return this.generateBacktracker(); // default
  }
}

// ==========================
// Canvas & rendering
// ==========================
const canvas = document.getElementById('maze');
const ctx = canvas.getContext('2d');

let rows = 25, cols = 35, cellSize = 24;
let maze = new Maze(rows, cols);
maze.generate('backtracker');

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
  const wrap = canvas.parentElement.getBoundingClientRect();
  const maxW = Math.floor(wrap.width - 2);
  const maxH = Math.floor((window.innerHeight*0.75));
  cellSize = Math.max(8, Math.floor(Math.min(maxW/cols, maxH/rows)));
  canvas.width = cellSize * cols;
  canvas.height = cellSize * rows;
  draw();
}
window.addEventListener('resize', resizeCanvas);

function cellRect(i,j){ return { x: i*cellSize, y: j*cellSize, w: cellSize, h: cellSize }; }

function drawGrid(){
  ctx.fillStyle = '#0a0d14';
  ctx.fillRect(0,0,canvas.width, canvas.height);

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
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--start');
  ctx.beginPath(); ctx.arc(start.i*s + s/2, start.j*s + s/2, r, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--goal');
  ctx.beginPath(); ctx.arc(goal.i*s + s/2, goal.j*s + s/2, r, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--player');
  ctx.beginPath(); ctx.arc(player.i*s + s/2, player.j*s + s/2, r*0.9, 0, Math.PI*2); ctx.fill();
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

function draw(){ drawGrid(); drawPath(state.lastPath); drawMarkers(); }

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
  if(state.animating) return;
  if(!canMove(player, dir)) return;
  if(dir==='up') player.j -= 1;
  if(dir==='right') player.i += 1;
  if(dir==='down') player.j += 1;
  if(dir==='left') player.i -= 1;
  draw();
  if(player.i===goal.i && player.j===goal.j){ flash('You reached the goal!'); }
}
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
  if(key==='i') pickMode('start');
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
    start = {i,j}; player = {i,j}; state.pickMode=null; flash('Start cell set'); draw();
  } else if(state.pickMode==='goal'){
    goal = {i,j}; state.pickMode=null; flash('Goal cell set'); draw();
  }
});
function pickMode(kind){
  state.pickMode = kind;
  if(kind==='start') flash('Click a cell to set START');
  if(kind==='goal') flash('Click a cell to set GOAL');
}

// ==========================
// Search algorithms
// ==========================
class PriorityQueue {
  constructor(score){ this._data=[]; this._score = score || (x=>x); }
  push(x){ this._data.push(x); this._data.sort((a,b)=> this._score(a)-this._score(b)); }
  shift(){ return this._data.shift(); }
  get length(){ return this._data.length; }
}
function neighborsOpen(i,j){
  const c = maze.grid[j][i];
  const out = [];
  if(!c.walls.top) out.push({i, j:j-1, dir:'up'});
  if(!c.walls.right) out.push({i:i+1, j, dir:'right'});
  if(!c.walls.bottom) out.push({i, j:j+1, dir:'down'});
  if(!c.walls.left) out.push({i:i-1, j, dir:'left'});
  return out;
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

// --- Solver factory ---
function makeSolver(algo, start, goal){
  if(algo==='wall-right') return makeWallFollowerSolver(start, goal);
  if(algo==='bidir-bfs') return makeBidirectionalBFSSolver(start, goal);
  if(algo==='iddfs') return makeIDDfsSolver(start, goal);
  if(algo==='greedy') return makeGreedySolver(start, goal);
  // default set: bfs / dfs / dijkstra / astar
  return makeClassicSolver(algo, start, goal);
}

// Classic graph search family: BFS, DFS, Dijkstra, A*
function makeClassicSolver(algo, start, goal){
  const startKey = keyOf(start.i,start.j);
  const goalKey  = keyOf(goal.i,goal.j);
  const visited = new Set();
  const frontier = (algo==='dfs') ? [] : (algo==='bfs') ? [] : new PriorityQueue(n=>n.score);
  const came = new Map();
  const dist = new Map([[startKey,0]]);

  const pushNode = (node, score=0)=>{
    const key = keyOf(node.i,node.j);
    if(visited.has(key)) return;
    if(algo==='bfs' || algo==='dfs'){ frontier.push(node); }
    else { frontier.push({...node, score}); }
  };
  pushNode({i:start.i, j:start.j});

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
    state.visitedSet = new Set(visited);

    if(curKey===goalKey){
      return {done:true, found:true, path: reconstruct(came, curKey)};
    }

    for(const nb of neighborsOpen(cur.i, cur.j)){
      const nbKey = keyOf(nb.i, nb.j);
      if(visited.has(nbKey)) continue;
      const newDist = (dist.get(curKey)||0) + 1;
      if(!dist.has(nbKey) || newDist < dist.get(nbKey)){
        dist.set(nbKey, newDist);
        came.set(nbKey, curKey);
        if(algo==='bfs' || algo==='dfs'){
          frontier.push({i:nb.i, j:nb.j});
        } else if(algo==='dijkstra'){
          frontier.push({i:nb.i, j:nb.j, score:newDist});
        } else if(algo==='astar'){
          frontier.push({i:nb.i, j:nb.j, score:newDist + manhattan(nb, goal)});
        }
      }
    }

    const fset = new Set();
    if(algo==='bfs' || algo==='dfs'){ for(const n of frontier){ fset.add(keyOf(n.i,n.j)); } }
    else { for(const n of frontier._data){ fset.add(keyOf(n.i,n.j)); } }
    state.frontierSet = fset;
    return {done:false};
  }
  return { step };
}

// Greedy Best-First Search (uses only heuristic h)
function makeGreedySolver(start, goal){
  const visited = new Set();
  const pq = new PriorityQueue(n => n.h);
  const came = new Map();
  pq.push({i:start.i,j:start.j,h:manhattan(start,goal)});
  const goalKey = keyOf(goal.i,goal.j);

  function step(){
    if(pq.length===0) return {done:true, found:false};
    const cur = pq.shift();
    const curKey = keyOf(cur.i,cur.j);
    if(visited.has(curKey)) return {done:false};
    visited.add(curKey);
    state.visitedSet = new Set(visited);
    if(curKey===goalKey) return {done:true, found:true, path: reconstruct(came, curKey)};
    for(const nb of neighborsOpen(cur.i,cur.j)){
      const k = keyOf(nb.i,nb.j);
      if(visited.has(k)) continue;
      if(!came.has(k)) came.set(k, curKey);
      pq.push({i:nb.i,j:nb.j,h:manhattan(nb,goal)});
    }
    const fset = new Set(); for(const n of pq._data){ fset.add(keyOf(n.i,n.j)); } state.frontierSet = fset;
    return {done:false};
  }
  return { step };
}

// Bidirectional BFS
function makeBidirectionalBFSSolver(start, goal){
  const qA = [{i:start.i,j:start.j}];
  const qB = [{i:goal.i,j:goal.j}];
  const cameA = new Map(); const cameB = new Map();
  const visA = new Set([keyOf(start.i,start.j)]);
  const visB = new Set([keyOf(goal.i,goal.j)]);
  let turnA = true;

  function joinPaths(meetKey){
    const left = reconstruct(cameA, meetKey);       // start..meet
    // reconstruct from goal-side: path goal..meet
    const pathB = [];
    let cur = meetKey;
    while(cur){
      pathB.push(cur);
      cur = cameB.get(cur) || null;
    }
    pathB.reverse(); // meet..goal
    const right = pathB.map(k=>{ const [i,j]=k.split(',').map(Number); return {i,j}; });
    // merge without duplicating the meeting node
    const leftCoords = left.map(p=>keyOf(p.i,p.j));
    const merged = [...left, ...right.slice(1)];
    return merged;
  }

  function step(){
    if(!qA.length && !qB.length) return {done:true, found:false};
    let cur, fromA = turnA;
    if(turnA && qA.length){ cur = qA.shift(); }
    else if(!turnA && qB.length){ cur = qB.shift(); }
    else { // if one queue empty, use the other
      fromA = qA.length>0; cur = (fromA ? qA.shift() : qB.shift());
    }
    turnA = !turnA;

    const curKey = keyOf(cur.i,cur.j);
    if(fromA){
      for(const nb of neighborsOpen(cur.i,cur.j)){
        const k = keyOf(nb.i,nb.j);
        if(!visA.has(k)){
          visA.add(k); cameA.set(k, curKey); qA.push({i:nb.i,j:nb.j});
          if(visB.has(k)){
            state.visitedSet = new Set([...visA, ...visB]);
            return {done:true, found:true, path: joinPaths(k)};
          }
        }
      }
    } else {
      for(const nb of neighborsOpen(cur.i,cur.j)){
        const k = keyOf(nb.i,nb.j);
        if(!visB.has(k)){
          visB.add(k); cameB.set(k, curKey); qB.push({i:nb.i,j:nb.j});
          if(visA.has(k)){
            state.visitedSet = new Set([...visA, ...visB]);
            return {done:true, found:true, path: joinPaths(k)};
          }
        }
      }
    }
    // visualize
    const f = new Set(); for(const n of qA){ f.add(keyOf(n.i,n.j)); } for(const n of qB){ f.add(keyOf(n.i,n.j)); }
    state.frontierSet = f; state.visitedSet = new Set([...visA, ...visB]);
    return {done:false};
  }
  return { step };
}

// Iterative Deepening DFS (IDDFS)
function makeIDDfsSolver(start, goal){
  const goalKey = keyOf(goal.i,goal.j);
  let limit = 0;
  const maxLimit = rows*cols + 10;
  let stack = []; // entries: {i,j,depth, parentKey}
  let came = new Map();
  let visitedThisDepth = new Set();
  let initialized = false;

  function initDepth(d){
    stack = [{i:start.i, j:start.j, depth:0, parentKey:null}];
    came = new Map();
    visitedThisDepth = new Set();
    initialized = true;
  }
  initDepth(limit);

  function step(){
    if(stack.length===0){
      limit++;
      if(limit>maxLimit) return {done:true, found:false};
      initDepth(limit);
      state.frontierSet = new Set(); state.visitedSet = new Set();
      return {done:false};
    }
    const node = stack.pop();
    const k = keyOf(node.i,node.j);
    if(visitedThisDepth.has(k)) return {done:false};
    visitedThisDepth.add(k); state.visitedSet = new Set(visitedThisDepth);
    if(node.parentKey && !came.has(k)) came.set(k, node.parentKey);
    if(k===goalKey) return {done:true, found:true, path: reconstruct(came, k)};

    if(node.depth < limit){
      const neigh = neighborsOpen(node.i,node.j).reverse(); // reverse for a slightly deeper bias
      for(const nb of neigh){
        stack.push({i:nb.i, j:nb.j, depth:node.depth+1, parentKey:k});
      }
    }
    const f = new Set(); for(const n of stack){ f.add(keyOf(n.i,n.j)); } state.frontierSet = f;
    return {done:false};
  }
  return { step };
}

// Wall Follower (Right-hand rule) — orientation-based
function makeWallFollowerSolver(start, goal){
  const dirs = ['up','right','down','left']; // 0,1,2,3
  let facing = 1; // initial facing: right
  let pos = {i:start.i, j:start.j};
  const path = [{i:pos.i, j:pos.j}];
  const visited = new Set([keyOf(pos.i,pos.j)]);
  const goalKey = keyOf(goal.i,goal.j);
  const maxSteps = rows*cols*8; // guard against loops in loopy mazes

  function canMoveFrom(i,j,dir){
    const c = maze.grid[j][i];
    if(dir==='up' && c.walls.top) return false;
    if(dir==='right' && c.walls.right) return false;
    if(dir==='down' && c.walls.bottom) return false;
    if(dir==='left' && c.walls.left) return false;
    // ensure inside bounds
    const ni = dir==='left' ? i-1 : dir==='right' ? i+1 : i;
    const nj = dir==='up' ? j-1 : dir==='down' ? j+1 : j;
    return ni>=0 && nj>=0 && ni<cols && nj<rows;
  }

  let steps = 0;
  function move(dir){
    if(dir==='up') pos.j -= 1;
    if(dir==='right') pos.i += 1;
    if(dir==='down') pos.j += 1;
    if(dir==='left') pos.i -= 1;
  }
  function step(){
    if(steps++ > maxSteps) return {done:true, found:false};
    const right = (facing+1)%4, left = (facing+3)%4, back = (facing+2)%4;
    const tryRight = dirs[right], tryForward = dirs[facing], tryLeft = dirs[left], tryBack = dirs[back];

    let chosen;
    if(canMoveFrom(pos.i,pos.j,tryRight)){ facing = right; chosen = tryRight; }
    else if(canMoveFrom(pos.i,pos.j,tryForward)){ chosen = tryForward; }
    else if(canMoveFrom(pos.i,pos.j,tryLeft)){ facing = left; chosen = tryLeft; }
    else { facing = back; chosen = tryBack; }

    const prev = {i:pos.i, j:pos.j};
    move(chosen);
    const k = keyOf(pos.i,pos.j);
    if(path.length>=1){
      const p2 = path[path.length-1];
      if(p2.i===pos.i && p2.j===pos.j){
        // no-op
      } else if(path.length>=2 && path[path.length-2].i===pos.i && path[path.length-2].j===pos.j){
        // immediate backtrack — collapse loop
        path.pop();
      } else {
        path.push({i:pos.i,j:pos.j});
      }
    } else {
      path.push({i:pos.i,j:pos.j});
    }
    visited.add(k);
    state.visitedSet = new Set(visited);
    state.frontierSet = new Set(); // not meaningful here

    if(k===goalKey){ return {done:true, found:true, path: path.slice()}; }
    return {done:false};
  }
  return { step };
}

// ==========================
// Animation
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
  maze = new Maze(rows, cols);
  const method = $('gen').value || 'backtracker';
  maze.generate(method);
  start = {i:0, j:0}; goal = {i:cols-1, j:rows-1}; player = {i:start.i, j:start.j};
  state.lastPath = []; state.visitedSet.clear(); state.frontierSet.clear();
  state.animating=false; state.solver=null; resizeCanvas(); flash(`New maze generated (${method})`);
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
