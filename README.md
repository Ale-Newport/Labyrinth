# Labyrinth
Generate grid mazes and solve them manually or with classic and modern search algorithms—all in vanilla HTML5, CSS, and JavaScript (no build tools, no dependencies). UI icons use Font Awesome via CDN.

## ✨ Features

### Maze generation:
Recursive Backtracker (DFS)
Randomized Prim
Randomized Kruskal

### Pathfinding:
BFS, DFS, Dijkstra, A*
Greedy Best-First
Bidirectional BFS
Iterative Deepening DFS (IDDFS)
Right-hand Wall Follower

### Interactive play:
Move the player with WASD/Arrow keys
Pick Start and Goal cells by clicking
Animate solving with speed control, pause, and step
Export the maze as PNG
Optional overlay for visited and frontier sets during search
No external JS libraries; only Font Awesome CSS for icons

## 🗂 Project structure
/your-folder
├─ index.html
├─ styles.css
└─ app.js

## 🚀 Getting started
Download the three files into the same folder.
Open index.html directly in your browser
or run a tiny local server (helps with some browsers’ security policies):

### Option A: Python 3
python3 -m http.server 5500

### Option B: Node (if you have http-server installed)
npx http-server -p 5500
Then go to http://localhost:5500.

## 🖱️ How to use
1. Set Rows × Columns and the Generator, then click Generate maze.
2. (Optional) Click Set start or Set goal, then click a cell on the canvas.
3. Choose a Search algorithm and click Solve.
4. Use Pause to stop, Step to advance one iteration, or Clear paths to remove the last computed path.
5. Toggle Visited/Frontier to visualize the search process.
6. Export PNG to save a snapshot of the canvas.

### Keyboard shortcuts:
| Action                  | Key(s)                        |
| ----------------------- | ----------------------------- |
| Generate                | `G`                           |
| Solve                   | `R`                           |
| Pause/Resume            | `P`                           |
| Clear paths             | `C`                           |
| Single step             | `.`                           |
| Set start               | `I`                           |
| Set goal                | `O`                           |
| Move up/right/down/left | `W / D / S / A` or Arrow keys |

## 🔬 Algorithms included
| Algorithm             | Complete | Optimal | Notes                                                          |
| --------------------- | :------: | :-----: | -------------------------------------------------------------- |
| **BFS**               |     ✅    |    ✅    | Optimal on unweighted grids (uniform cost).                    |
| **DFS**               |     ✅    |    ❌    | Fast to implement; explores deep first; not optimal.           |
| **Dijkstra**          |     ✅    |    ✅    | Uniform-cost optimal; here all edges cost 1.                   |
| **A\***               |     ✅    |    ✅    | Uses Manhattan heuristic on a grid; efficient and optimal.     |
| **Greedy Best-First** |     ✅    |    ❌    | Uses only heuristic; fast but not optimal.                     |
| **Bidirectional BFS** |     ✅    |    ✅    | Explores from start and goal; very fast on large grids.        |
| **IDDFS**             |     ✅    |    ❌    | DFS with increasing depth limit; low memory; not optimal here. |
| **Wall Follower**     |     ✅    |    ❌    | Right-hand rule; guaranteed on **perfect mazes** (*no loops*). |



## 🧱 Generators included
Recursive Backtracker (DFS): classic depth-first carving; produces long corridors.
Randomized Prim: frontier-based; tends to create bushy/organic mazes.
Randomized Kruskal: union-find over edges; uniform spanning tree with interesting patterns.

## 🎨 Customization
Colors & theme: tweak CSS variables in styles.css (look for :root { --... }).
Stroke thickness: controlled by cellSize in app.js and ctx.lineWidth in the renderer.
Canvas size: auto-fits to the container; change the layout in CSS if you want a fixed size.


## ⚙️ Dependencies
Runtime: modern browser (Chrome, Firefox, Safari, Edge).
Icons: Font Awesome via CDN (already linked in index.html):
```bash
<link rel="stylesheet"
  href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
  referrerpolicy="no-referrer" />
```
No other frameworks or libraries are required.

## 🏎 Performance tips
Large grids (e.g., 100×100) can be heavy to render. Start with ~30–50 columns.
Increase the Speed slider to accelerate animations.
Turn off Visited/Frontier overlay for faster drawing.

## ♿ Accessibility notes
All key actions are available via keyboard.
Visual distinction for start/goal/player uses color and shape (circle markers).
Consider adding ARIA labels to buttons if you integrate into a larger app.

## 🧭 Roadmap (nice-to-haves)
Additional generators: Recursive Division, Wilson’s, Aldous–Broder
Weighted tiles & costs (true weighted Dijkstra/A* demo)
Generation animation step-by-step
Mobile gesture controls (swipe to move)

## 🧪 Testing ideas
Ensure each generator yields a single connected maze (perfect maze property).
Verify that BFS path length equals the A* path length (optimality check on uniform costs).
Confirm Wall Follower reaches the goal on any generated maze.

## 📄 License
Choose a license that fits your needs. For open-source, MIT is a good default:
MIT License — Copyright (c) 2025 Alejandro Newport
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the “Software”), to deal
in the Software without restriction...
(Replace with your preferred full license text.)

## 👤 Attribution
Built by Alejandro Newport.
Icons by Font Awesome.