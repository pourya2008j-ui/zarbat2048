// نسخه ارتقا یافته 2048 با:
// - صفحه 6×6
// - تایمر 4 دقیقه‌ای
// - پشتیبانی کامل لمس موبایل (Swipe)
// - جلوگیری از اسکرول صفحه با کلیدهای جهت‌نما

const SIZE = 6;
const TILE_SIZE = 100;
const TILE_GAP = 10;

let tiles = [];
let nextId = 1;
let score = 0;
let isMoving = false;
let timerInterval = null;
let timeLeft = 240; // 4 دقیقه
let gameStopped = false; // ← اضافه شد

const tilesLayer = document.getElementById("tiles-layer");
const gridBackground = document.getElementById("grid-background");
const scoreEl = document.getElementById("score");
const msgEl = document.getElementById("message");
const timerEl = document.getElementById("timer");
const restartBtn = document.getElementById("restart-btn");

function initGridBackground() {
  gridBackground.innerHTML = "";
  for (let i = 0; i < SIZE * SIZE; i++) {
    const cell = document.createElement("div");
    cell.className = "grid-cell";
    gridBackground.appendChild(cell);
  }
}

function resetGame() {
  gameStopped = false; // ← اضافه شد
  tiles = [];
  nextId = 1;
  score = 0;
  scoreEl.textContent = "0";
  msgEl.classList.add("hidden");
  msgEl.textContent = "";
  tilesLayer.innerHTML = "";

  timeLeft = 240;
  updateTimerDisplay();
  startTimer();

  addRandomTile();
  addRandomTile();
}

function updateTimerDisplay() {
  const m = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const s = String(timeLeft % 60).padStart(2, "0");
  timerEl.textContent = `${m}:${s}`;
}

function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      endGameByTime();
    }
  }, 1000);
}

function endGameByTime() {
  msgEl.textContent = `⏳ زمان شما تمام شد! امتیاز شما: ${score}`;
  msgEl.classList.remove("hidden");
  gameStopped = true; // ← بازی کاملاً فریز شد
}

function randomEmptyCell() {
  const occupied = new Set(tiles.map((t) => `${t.row},${t.col}`));
  const empties = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (!occupied.has(`${r},${c}`)) empties.push({ row: r, col: c });
    }
  }
  if (empties.length === 0) return null;
  return empties[Math.floor(Math.random() * empties.length)];
}

function addRandomTile() {
  const cell = randomEmptyCell();
  if (!cell) return;

  const value = Math.random() < 0.9 ? 2 : 4;
  const tile = {
    id: nextId++,
    value,
    row: cell.row,
    col: cell.col,
    merged: false,
  };
  tiles.push(tile);
  createTileElement(tile, true);
}

function createTileElement(tile, isNew = false) {
  const el = document.createElement("div");
  el.className = "tile";
  if (isNew) el.classList.add("new-tile");
  el.dataset.id = tile.id;
  el.textContent = tile.value;
  tilesLayer.appendChild(el);
  updateTileStyle(tile);
  positionTileElement(tile);

  if (isNew) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.classList.remove("new-tile");
      });
    });
  }
}

function getTileElement(tile) {
  return tilesLayer.querySelector(`.tile[data-id="${tile.id}"]`);
}

function positionTileElement(tile) {
  const el = getTileElement(tile);
  if (!el) return;
  const top = tile.row * (TILE_SIZE + TILE_GAP);
  const left = tile.col * (TILE_SIZE + TILE_GAP);
  el.style.top = top + "px";
  el.style.left = left + "px";
}

function updateTileStyle(tile) {
  const el = getTileElement(tile);
  if (!el) return;

  el.textContent = tile.value;

  const val = tile.value;
  let bg = "#eee4da";
  let color = "#776e65";

  if (val === 2) bg = "#eee4da";
  else if (val === 4) bg = "#ede0c8";
  else if (val === 8) { bg = "#f2b179"; color = "#f9f6f2"; }
  else if (val === 16) { bg = "#f59563"; color = "#f9f6f2"; }
  else if (val === 32) { bg = "#f67c5f"; color = "#f9f6f2"; }
  else if (val === 64) { bg = "#f65e3b"; color = "#f9f6f2"; }
  else if (val === 128) { bg = "#edcf72"; color = "#f9f6f2"; }
  else if (val === 256) { bg = "#edcc61"; color = "#f9f6f2"; }
  else if (val === 512) { bg = "#edc850"; color = "#f9f6f2"; }
  else if (val === 1024) { bg = "#edc53f"; color = "#f9f6f2"; }
  else if (val >= 2048) { bg = "#edc22e"; color = "#f9f6f2"; }

  el.style.backgroundColor = bg;
  el.style.color = color;

  if (val < 100) el.style.fontSize = "36px";
  else if (val < 1000) el.style.fontSize = "32px";
  else el.style.fontSize = "28px";
}

function tileAt(row, col) {
  return tiles.find((t) => t.row === row && t.col === col);
}

function move(direction) {
  if (gameStopped) return; // ← جلوگیری از حرکت
  if (isMoving) return;
  isMoving = true;

  let moved = false;
  tiles.forEach((t) => (t.merged = false));

  const dir = {
    left:  { dr: 0,  dc: -1 },
    right: { dr: 0,  dc: 1  },
    up:    { dr: -1, dc: 0  },
    down:  { dr: 1,  dc: 0  },
  }[direction];

  if (!dir) {
    isMoving = false;
    return;
  }

  let sorted = [...tiles];
  if (direction === "left") {
    sorted.sort((a, b) => a.row - b.row || a.col - b.col);
  } else if (direction === "right") {
    sorted.sort((a, b) => a.row - b.row || b.col - a.col);
  } else if (direction === "up") {
    sorted.sort((a, b) => a.col - b.col || a.row - b.row);
  } else if (direction === "down") {
    sorted.sort((a, b) => a.col - b.col || b.row - a.row);
  }

  const toRemove = [];

  for (const tile of sorted) {
    let { row, col } = tile;
    while (true) {
      const nextRow = row + dir.dr;
      const nextCol = col + dir.dc;
      if (nextRow < 0 || nextRow >= SIZE || nextCol < 0 || nextCol >= SIZE) break;

      const blocker = tileAt(nextRow, nextCol);
      if (!blocker) {
        row = nextRow;
        col = nextCol;
        continue;
      }

      if (blocker.value === tile.value && !blocker.merged && !tile.merged) {
        row = nextRow;
        col = nextCol;
        blocker.value *= 2;
        blocker.merged = true;
        score += blocker.value;
        scoreEl.textContent = score;
        updateTileStyle(blocker);

        const el = getTileElement(blocker);
        if (el) {
          el.classList.add("merged-tile");
          setTimeout(() => el.classList.remove("merged-tile"), 180);
        }

        toRemove.push(tile);
        break;
      } else break;
    }

    if (row !== tile.row || col !== tile.col) {
      moved = true;
      tile.row = row;
      tile.col = col;
    }
  }

  tiles.forEach((t) => positionTileElement(t));

  setTimeout(() => {
    for (const t of toRemove) {
      const el = getTileElement(t);
      if (el) el.remove();
      tiles = tiles.filter((x) => x !== t);
    }

    if (moved) {
      addRandomTile();
      checkGameState();
    }

    isMoving = false;
  }, 190);
}

function checkGameState() {
  if (tiles.some((t) => t.value === 2048)) {
    msgEl.textContent = "تبریک! به 2048 رسیدی 🎉";
    msgEl.classList.remove("hidden");
    return;
  }

  if (randomEmptyCell()) return;

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const t = tileAt(r, c);
      if (!t) continue;
      const neighbors = [
        tileAt(r + 1, c),
        tileAt(r - 1, c),
        tileAt(r, c + 1),
        tileAt(r, c - 1),
      ];
      if (neighbors.some((n) => n && n.value === t.value)) return;
    }
  }

  msgEl.textContent = "بازی تموم شد! حرکت دیگه‌ای نداری.";
  msgEl.classList.remove("hidden");
}

/* -------------------------
   جلوگیری از اسکرول با کلیدهای جهت‌نما
-------------------------- */

document.addEventListener("keydown", (e) => {
  if (gameStopped) return; // ← اضافه شد

  const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
  if (keys.includes(e.key)) {
    e.preventDefault();
  }

  if (isMoving) return;

  if (e.key === "ArrowLeft") move("left");
  else if (e.key === "ArrowRight") move("right");
  else if (e.key === "ArrowUp") move("up");
  else if (e.key === "ArrowDown") move("down");
});

/* -------------------------
   پشتیبانی لمس موبایل (Swipe)
-------------------------- */

let touchStartX = 0;
let touchStartY = 0;

document.addEventListener("touchstart", (e) => {
  const t = e.touches[0];
  touchStartX = t.clientX;
  touchStartY = t.clientY;
});

document.addEventListener("touchend", (e) => {
  if (gameStopped) return; // ← اضافه شد

  const t = e.changedTouches[0];
  const dx = t.clientX - touchStartX;
  const dy = t.clientY - touchStartY;

  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 30) move("right");
    else if (dx < -30) move("left");
  } else {
    if (dy > 30) move("down");
    else if (dy < -30) move("up");
  }
});

restartBtn.addEventListener("click", resetGame);

initGridBackground();
resetGame();

document.addEventListener("touchmove", function (e) {
  e.preventDefault();
}, { passive: false });

window.addEventListener("scroll", () => {
  window.scrollTo(0, 0);
});

document.querySelectorAll(".ctrl-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    if (gameStopped) return; // ← اضافه شد
    const dir = btn.dataset.dir;
    move(dir);
  });
});