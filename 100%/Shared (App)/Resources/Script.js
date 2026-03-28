function show(platform) {
    document.body.dataset.platform = platform;

    const platformLabel = document.querySelector("[data-platform]");

    if (!platformLabel) {
        return;
    }

    if (platform === "ios") {
        platformLabel.textContent = "Running in the iOS host app.";
        return;
    }

    if (platform === "mac") {
        platformLabel.textContent = "Running in the macOS host app.";
        return;
    }

    platformLabel.textContent = "Running in the host app.";
}

(function bootstrapSnake() {
    const logic = window.SnakeGameLogic;
    const boardElement = document.querySelector("[data-board]");

    if (!logic || !boardElement) {
        return;
    }

    const scoreElement = document.querySelector("[data-score]");
    const statusElement = document.querySelector("[data-status]");
    const playButtons = Array.from(document.querySelectorAll("[data-toggle-play]"));
    const restartButton = document.querySelector("[data-restart]");
    const directionButtons = Array.from(document.querySelectorAll("[data-direction]"));
    const runtime = { random: Math.random };

    let state = logic.createInitialState({
        columns: 16,
        rows: 16,
        tickMs: 140,
        random: runtime.random
    });

    let cellElements = [];

    function buildBoard() {
        boardElement.style.setProperty("--columns", state.columns);
        boardElement.replaceChildren();
        cellElements = [];

        for (let y = 0; y < state.rows; y += 1) {
            for (let x = 0; x < state.columns; x += 1) {
                const cell = document.createElement("div");
                cell.className = "board-cell";
                cell.setAttribute("role", "gridcell");
                cell.dataset.x = String(x);
                cell.dataset.y = String(y);
                boardElement.append(cell);
                cellElements.push(cell);
            }
        }
    }

    function getCellIndex(point) {
        return point.y * state.columns + point.x;
    }

    function getStatusText() {
        if (state.mode === "running") {
            return "Running";
        }

        if (state.mode === "paused") {
            return "Paused";
        }

        if (state.mode === "gameOver" && state.outcome === "won") {
            return "Board cleared";
        }

        if (state.mode === "gameOver") {
            return "Game over";
        }

        return "Ready";
    }

    function getPlayButtonText() {
        if (state.mode === "running") {
            return "Pause";
        }

        if (state.mode === "paused") {
            return "Resume";
        }

        return "Start";
    }

    function render() {
        for (const cell of cellElements) {
            cell.classList.remove("snake", "head", "food");
        }

        if (state.food) {
            cellElements[getCellIndex(state.food)]?.classList.add("food");
        }

        state.snake.forEach((segment, index) => {
            const cell = cellElements[getCellIndex(segment)];

            if (!cell) {
                return;
            }

            cell.classList.add("snake");

            if (index === 0) {
                cell.classList.add("head");
            }
        });

        if (scoreElement) {
            scoreElement.textContent = String(state.score);
        }

        if (statusElement) {
            statusElement.textContent = getStatusText();
        }

        for (const button of playButtons) {
            button.textContent = getPlayButtonText();
        }
    }

    function setDirection(direction) {
        state = logic.queueDirection(state, direction);
        render();
    }

    function togglePlay() {
        if (state.mode === "ready") {
            state = logic.startGame(state);
        } else if (state.mode === "gameOver") {
            state = logic.restartGame(state, runtime);
        } else {
            state = logic.togglePause(state);
        }

        render();
    }

    function restart() {
        state = logic.restartGame(state, runtime);
        render();
    }

    function tick() {
        state = logic.stepGame(state, runtime);
        render();
    }

    function handleKeydown(event) {
        const directionMap = {
            ArrowUp: "up",
            ArrowDown: "down",
            ArrowLeft: "left",
            ArrowRight: "right",
            w: "up",
            W: "up",
            a: "left",
            A: "left",
            s: "down",
            S: "down",
            d: "right",
            D: "right"
        };

        const direction = directionMap[event.key];

        if (direction) {
            event.preventDefault();
            setDirection(direction);
            return;
        }

        if (event.key === " " || event.key === "Spacebar") {
            event.preventDefault();
            togglePlay();
            return;
        }

        if (event.key === "r" || event.key === "R") {
            event.preventDefault();
            restart();
        }
    }

    window.render_game_to_text = function renderGameToText() {
        return JSON.stringify({
            mode: state.mode,
            outcome: state.outcome,
            coordinateSystem: "origin: top-left; x increases right; y increases down",
            board: {
                columns: state.columns,
                rows: state.rows
            },
            direction: state.direction,
            score: state.score,
            food: state.food,
            snake: state.snake
        });
    };

    window.advanceTime = function advanceTime(milliseconds) {
        const ticks = Math.max(0, Math.floor(milliseconds / state.tickMs));

        for (let step = 0; step < ticks; step += 1) {
            state = logic.stepGame(state, runtime);

            if (state.mode !== "running") {
                break;
            }
        }

        render();
        return window.render_game_to_text();
    };

    for (const button of playButtons) {
        button.addEventListener("click", togglePlay);
    }

    restartButton?.addEventListener("click", restart);

    for (const button of directionButtons) {
        button.addEventListener("click", function onDirectionButtonClick() {
            setDirection(button.dataset.direction);
        });
    }

    window.addEventListener("keydown", handleKeydown);
    window.setInterval(tick, state.tickMs);

    buildBoard();
    render();
    show(document.body.dataset.platform || "host");
})();
