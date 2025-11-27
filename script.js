
let grid = [];
let previousGrid = null;
let score = 0;
let previousScore = 0;


const gridEl = document.getElementById("grid");
const scoreEl = document.getElementById("score");
const gameOverEl = document.getElementById("game-over");
const gameOverMsg = document.getElementById("game-over-message");
const nameInput = document.getElementById("name-input");
const leadersBody = document.getElementById("leaders-body");

initGame();

function initGame() {
    loadState();
    if (grid.length === 0) {
        createEmptyGrid();
        spawnRandomTiles(2);
        saveState();
    }
    render();
    setupControls();
}


function createEmptyGrid() {
    grid = [];
    for (let i = 0; i < 4; i++) {
        grid[i] = [0, 0, 0, 0];
    }
}

function render() {
    while (gridEl.firstChild) gridEl.removeChild(gridEl.firstChild);

    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            const tile = document.createElement("div");
            tile.className = "tile";

            if (grid[r][c] !== 0) {
                tile.textContent = grid[r][c];
            }

            gridEl.appendChild(tile);
        }
    }

    scoreEl.textContent = score;
}



function spawnRandomTiles(count = 1) {
    const free = [];
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            if (grid[r][c] === 0) free.push({ r, c });
        }
    }

    if (free.length === 0) return;

    for (let i = 0; i < count; i++) {
        if (free.length === 0) break;
        const idx = Math.floor(Math.random() * free.length);
        const { r, c } = free[idx];
        grid[r][c] = Math.random() < 0.9 ? 2 : 4;
        free.splice(idx, 1);
    }
}



function moveLeft() { savePrevious();  }
function moveRight() { savePrevious();  }
function moveUp() { savePrevious();  }
function moveDown() { savePrevious();  }



function savePrevious() {
    previousGrid = JSON.parse(JSON.stringify(grid));
    previousScore = score;
}

function saveState() {
    localStorage.setItem("gameGrid", JSON.stringify(grid));
    localStorage.setItem("gameScore", score);
}

function loadState() {
    const g = localStorage.getItem("gameGrid");
    const s = localStorage.getItem("gameScore");
    if (g && s !== null) {
        grid = JSON.parse(g);
        score = Number(s);
    }
}



document.getElementById("undo-btn").addEventListener("click", () => {
    if (!previousGrid) return;
    grid = JSON.parse(JSON.stringify(previousGrid));
    score = previousScore;
    render();
});



document.getElementById("restart-btn").addEventListener("click", restart);
document.getElementById("restart-btn2").addEventListener("click", restart);

function restart() {
    score = 0;
    previousGrid = null;
    createEmptyGrid();
    spawnRandomTiles(2);
    render();
    gameOverEl.classList.add("hidden");
    saveState();
}



function setupControls() {
    document.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") moveLeft();
        if (e.key === "ArrowRight") moveRight();
        if (e.key === "ArrowUp") moveUp();
        if (e.key === "ArrowDown") moveDown();
    });
}


document.getElementById("leaders-btn").addEventListener("click", showLeaders);
document.getElementById("close-leaders-btn").addEventListener("click", () => {
    document.getElementById("leaders-modal").classList.add("hidden");
});

function showLeaders() {
    while (leadersBody.firstChild) leadersBody.removeChild(leadersBody.firstChild);

    const leaders = JSON.parse(localStorage.getItem("leaders") || "[]");

    leaders.forEach(row => {
        const tr = document.createElement("tr");

        const td1 = document.createElement("td");
        td1.textContent = row.name;

        const td2 = document.createElement("td");
        td2.textContent = row.score;

        const td3 = document.createElement("td");
        td3.textContent = row.date;

        tr.appendChild(td1);
        tr.appendChild(td2);
        tr.appendChild(td3);

        leadersBody.appendChild(tr);
    });

    document.getElementById("leaders-modal").classList.remove("hidden");
}



document.getElementById("save-result-btn").addEventListener("click", saveResult);

function saveResult() {
    const name = nameInput.value.trim();
    if (!name) return;

    const leaders = JSON.parse(localStorage.getItem("leaders") || "[]");

    leaders.push({
        name,
        score,
        date: new Date().toLocaleString()
    });

    leaders.sort((a, b) => b.score - a.score);
    localStorage.setItem("leaders", JSON.stringify(leaders.slice(0, 10)));

    nameInput.classList.add("hidden");
    gameOverMsg.textContent = "Ваш рекорд сохранён";
}

// -------------- GAME OVER --------------

function gameOver() {
    gameOverEl.classList.remove("hidden");
}
