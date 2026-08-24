"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

type Direction = "left" | "right" | "up" | "down";
type Tile = { id: number; value: number; isNew?: boolean; isMerged?: boolean };
type TileGrid = (Tile | null)[][];
type Snapshot = { grid: TileGrid; score: number; moves: number };
type SavedSnapshot = { grid: number[][]; score: number; moves: number };

const STORAGE_KEY = "merge-2048-save-v1";
const BEST_KEY = "merge-2048-best-v1";
const SPEED_KEY = "merge-2048-speed-v1";
const SPEEDS = [
  { duration: 500, label: "标准" },
  { duration: 800, label: "慢速" },
  { duration: 1200, label: "极慢" },
];
let tileSequence = 0;

function emptyGrid(): TileGrid {
  return Array.from({ length: 4 }, () => Array<Tile | null>(4).fill(null));
}

function createTile(value: number, isNew = false): Tile {
  tileSequence += 1;
  return { id: tileSequence, value, isNew };
}

function gridFromValues(values: number[][]): TileGrid {
  return values.map((row) => row.map((value) => value ? createTile(value) : null));
}

function gridToValues(grid: TileGrid): number[][] {
  return grid.map((row) => row.map((tile) => tile?.value ?? 0));
}

function addRandomTile(source: TileGrid) {
  const grid = source.map((row) => [...row]);
  const empty: [number, number][] = [];
  grid.forEach((row, rowIndex) => row.forEach((tile, columnIndex) => {
    if (!tile) empty.push([rowIndex, columnIndex]);
  }));
  if (!empty.length) return grid;
  const [row, column] = empty[Math.floor(Math.random() * empty.length)];
  grid[row][column] = createTile(Math.random() < 0.9 ? 2 : 4, true);
  return grid;
}

function freshGrid() {
  return addRandomTile(addRandomTile(emptyGrid()));
}

function gridsMatch(a: TileGrid, b: TileGrid) {
  return a.every((row, r) => row.every((tile, c) => (tile?.value ?? 0) === (b[r][c]?.value ?? 0)));
}

function collapse(row: (Tile | null)[]) {
  const tiles = row.filter((tile): tile is Tile => Boolean(tile));
  const result: (Tile | null)[] = [];
  let gained = 0;
  for (let index = 0; index < tiles.length; index += 1) {
    if (tiles[index].value === tiles[index + 1]?.value) {
      const merged = tiles[index].value * 2;
      result.push({ id: tiles[index].id, value: merged, isMerged: true });
      gained += merged;
      index += 1;
    } else {
      result.push({ id: tiles[index].id, value: tiles[index].value });
    }
  }
  while (result.length < 4) result.push(null);
  return { row: result, gained };
}

function transpose(grid: TileGrid) {
  return grid[0].map((_, column) => grid.map((row) => row[column]));
}

function moveGrid(grid: TileGrid, direction: Direction) {
  let working = grid.map((row) => row.map((tile) => tile ? { id: tile.id, value: tile.value } : null));
  if (direction === "up" || direction === "down") working = transpose(working);
  if (direction === "right" || direction === "down") working = working.map((row) => [...row].reverse());
  let gained = 0;
  working = working.map((row) => {
    const collapsed = collapse(row);
    gained += collapsed.gained;
    return collapsed.row;
  });
  if (direction === "right" || direction === "down") working = working.map((row) => [...row].reverse());
  if (direction === "up" || direction === "down") working = transpose(working);
  return { grid: working, gained };
}

function hasMoves(grid: TileGrid) {
  if (grid.some((row) => row.some((tile) => !tile))) return true;
  for (let row = 0; row < 4; row += 1) {
    for (let column = 0; column < 4; column += 1) {
      const value = grid[row][column]?.value;
      if (value === grid[row]?.[column + 1]?.value) return true;
      if (value === grid[row + 1]?.[column]?.value) return true;
    }
  }
  return false;
}

function tileTone(value: number) {
  return value <= 2048 ? `tile-${value}` : "tile-super";
}

export default function Home() {
  const [grid, setGrid] = useState<TileGrid>(emptyGrid);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [moves, setMoves] = useState(0);
  const [speedIndex, setSpeedIndex] = useState(1);
  const [previous, setPrevious] = useState<Snapshot | null>(null);
  const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");
  const [keepPlaying, setKeepPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const animationLock = useRef(false);
  const animationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        setBest(Number(localStorage.getItem(BEST_KEY) || 0));
        const storedSpeed = Number(localStorage.getItem(SPEED_KEY));
        if (Number.isInteger(storedSpeed) && storedSpeed >= 0 && storedSpeed < SPEEDS.length) setSpeedIndex(storedSpeed);
        if (saved) {
          const parsed = JSON.parse(saved) as SavedSnapshot;
          const restored = gridFromValues(parsed.grid);
          setGrid(restored);
          setScore(parsed.score);
          setMoves(parsed.moves);
          if (!hasMoves(restored)) setStatus("lost");
        } else setGrid(freshGrid());
      } catch { setGrid(freshGrid()); }
      setReady(true);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => () => {
    if (animationTimer.current) clearTimeout(animationTimer.current);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ grid: gridToValues(grid), score, moves }));
  }, [grid, score, moves, ready]);

  useEffect(() => {
    if (ready) localStorage.setItem(BEST_KEY, String(best));
  }, [best, ready]);

  const releaseAnimationLock = useCallback(() => {
    if (animationTimer.current) clearTimeout(animationTimer.current);
    animationLock.current = false;
  }, []);

  const move = useCallback((direction: Direction) => {
    if (!ready || animationLock.current || status === "lost" || (status === "won" && !keepPlaying)) return;
    const moved = moveGrid(grid, direction);
    if (gridsMatch(grid, moved.grid)) return;

    animationLock.current = true;
    animationTimer.current = setTimeout(() => { animationLock.current = false; }, SPEEDS[speedIndex].duration);
    setPrevious({ grid: grid.map((row) => [...row]), score, moves });
    const next = addRandomTile(moved.grid);
    const nextScore = score + moved.gained;
    setGrid(next);
    setScore(nextScore);
    if (nextScore > best) setBest(nextScore);
    setMoves((count) => count + 1);
    if (!keepPlaying && next.some((row) => row.some((tile) => tile?.value === 2048))) setStatus("won");
    else if (!hasMoves(next)) setStatus("lost");
  }, [best, grid, keepPlaying, moves, ready, score, speedIndex, status]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const directions: Record<string, Direction> = {
        ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right",
        ArrowUp: "up", w: "up", W: "up", ArrowDown: "down", s: "down", S: "down",
      };
      if (directions[event.key]) {
        event.preventDefault();
        move(directions[event.key]);
      }
    };
    window.addEventListener("keydown", onKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [move]);

  function restart() {
    releaseAnimationLock();
    setGrid(freshGrid()); setScore(0); setMoves(0); setPrevious(null);
    setStatus("playing"); setKeepPlaying(false);
  }

  function undo() {
    if (!previous) return;
    releaseAnimationLock();
    setGrid(previous.grid); setScore(previous.score); setMoves(previous.moves);
    setPrevious(null); setStatus("playing");
  }

  function cycleSpeed() {
    releaseAnimationLock();
    setSpeedIndex((current) => {
      const next = (current + 1) % SPEEDS.length;
      localStorage.setItem(SPEED_KEY, String(next));
      return next;
    });
  }

  function finishSwipe(x: number, y: number) {
    if (!touchStart.current) return;
    const deltaX = x - touchStart.current.x;
    const deltaY = y - touchStart.current.y;
    touchStart.current = null;
    if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 32) return;
    if (Math.abs(deltaX) > Math.abs(deltaY)) move(deltaX > 0 ? "right" : "left");
    else move(deltaY > 0 ? "down" : "up");
  }

  const maxTile = Math.max(...grid.flat().map((tile) => tile?.value ?? 0));

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <section className="game-wrap" aria-label="2048 游戏">
        <header className="topbar">
          <a className="brand" href="#game" aria-label="回到游戏"><span className="brand-mark">M</span><span>MERGE</span></a>
          <span className="edition">NO. 2048</span>
        </header>

        <div className="hero">
          <div>
            <p className="eyebrow">A TINY NUMBER PUZZLE</p>
            <h1>合并数字，<br /><span>抵达 2048。</span></h1>
            <p className="intro">用方向键或滑动移动方块。相同数字相遇时，它们会合二为一。</p>
          </div>
          <div className="score-panel" aria-label="分数">
            <div className="score-card primary"><span>当前分数</span><strong>{score.toLocaleString()}</strong></div>
            <div className="score-card"><span>最佳记录</span><strong>{best.toLocaleString()}</strong></div>
          </div>
        </div>

        <div className="game-area" id="game">
          <div className="board-column">
            <div className={`board ${ready ? "is-ready" : ""}`} style={{ "--move-duration": `${SPEEDS[speedIndex].duration}ms` } as CSSProperties} role="application" aria-label="2048 棋盘，可使用方向键或 WASD 操作"
              onTouchStart={(event) => { const touch = event.touches[0]; touchStart.current = { x: touch.clientX, y: touch.clientY }; }}
              onTouchEnd={(event) => { const touch = event.changedTouches[0]; finishSwipe(touch.clientX, touch.clientY); }}>
              {Array.from({ length: 16 }, (_, index) => <div className="cell" key={index} />)}
              <div className="tile-layer" aria-live="polite">
                {grid.flatMap((row, rowIndex) => row.map((tile, columnIndex) => tile ? (
                  <div
                    className={`tile row-${rowIndex} column-${columnIndex} ${tileTone(tile.value)}${tile.isNew ? " is-new" : ""}${tile.isMerged ? " is-merged" : ""}`}
                    key={tile.id}
                    aria-label={String(tile.value)}
                  >
                    {tile.value}
                  </div>
                ) : null))}
              </div>
              {status !== "playing" && (
                <div className="game-message" role="dialog" aria-live="polite">
                  <span>{status === "won" ? "2048!" : "本局结束"}</span>
                  <h2>{status === "won" ? "漂亮，继续创造纪录？" : "差一点，再来一局吧。"}</h2>
                  <div>
                    {status === "won" && <button className="button ghost-light" onClick={() => { setKeepPlaying(true); setStatus("playing"); }}>继续挑战</button>}
                    <button className="button lime" onClick={restart}>重新开始</button>
                  </div>
                </div>
              )}
            </div>
            <div className="actions">
              <button className="button dark" onClick={restart}><span aria-hidden="true">↻</span> 新游戏</button>
              <button className="button outline" onClick={undo} disabled={!previous}><span aria-hidden="true">↶</span> 撤销一步</button>
              <button className="button outline speed-button" onClick={cycleSpeed} aria-label={`动画速度：${SPEEDS[speedIndex].label}，点击切换`}><span aria-hidden="true">◴</span> {SPEEDS[speedIndex].label}</button>
            </div>
          </div>

          <aside className="side-panel">
            <div className="tip-card">
              <span className="tip-number">01</span>
              <div><h2>如何操作</h2><p>使用键盘方向键 / WASD，或在棋盘上滑动。</p></div>
              <div className="key-grid" aria-hidden="true"><span>↑</span><span>W</span><span>←</span><span>↓</span><span>→</span></div>
            </div>
            <div className="stats-card">
              <div><span>移动次数</span><strong>{moves}</strong></div>
              <div><span>最大方块</span><strong>{maxTile || "—"}</strong></div>
            </div>
            <p className="local-note"><span className="pulse" /> 本局进度已保存在你的浏览器中</p>
          </aside>
        </div>
        <footer><span>MERGE / 2048</span><span>THINK. SLIDE. REPEAT.</span></footer>
      </section>
    </main>
  );
}
