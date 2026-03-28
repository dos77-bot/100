(function attachSnakeHost(globalScope) {
    const logic = globalScope.SnakeGameLogic;

    if (!logic) {
        return;
    }

    const boardElement = document.querySelector("[data-board]");
    const scoreElement = document.querySelector("[data-score]");
    const statusElement = document.querySelector("[data-status]");
    const platformElement = document.querySelector("[data-platform]");
    const toggleButtons = Array.from(document.querySelectorAll("[data-toggle-play]"));
    const restartButtons = Array.from(document.querySelectorAll("[data-restart]"));
    const directionButtons = Array.from(document.querySelectorAll("[data-direction]"));

    const columns = 20;
    const rows = 20;
    const tickMs = 150;
    const seed = 1337;

    let timerId = null;
    let state = createFreshState();
    let platformName = "host app";

    if (boardElement) {
        buildBoard(boardElement, columns, rows);
    }

    document.addEventListener("keydown", handleKeydown);
    toggleButtons.forEach((button) => button.addEventListener("click", togglePlayState));
    restartButtons.forEach((button) => button.addEventListener("click", restartGame));
    directionButtons.forEach((button) => {
        button.addEventListener("click", () => queueDirection(button.dataset.direction));
    });

    ensureTimer();
    render();

    function createFreshState() {
        return logic.createInitialState({
            columns,
            rows,
            tickMs,
            random: createSeededRandom(seed)
        });
    }

    function createSeededRandom(initialSeed) {
        let current = initialSeed >>> 0;

        return function seededRandom() {
            current = (current * 1664525 + 1013904223) >>> 0;
            return current / 0x100000000;
        };
    }

    function buildBoard(container, width, height) {
        container.innerHTML = "";
        container.style.setProperty("--board-columns", String(width));
        container.style.setProperty("--board-rows", String(height));

        for (let index = 0; index < width * height; index += 1) {
            const cell = document.createElement("div");
            cell.className = "board-cell";
            cell.dataset.index = String(index);
            container.appendChild(cell);
        }
    }

    function getBoardCell(point) {
        if (!boardElement || !point) {
            return null;
        }

        const index = point.y * columns + point.x;
        return boardElement.children[index] || null;
    }

    function handleKeydown(event) {
        const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
        const directionMap = {
            ArrowUp: "up",
            ArrowDown: "down",
            ArrowLeft: "left",
            ArrowRight: "right",
            w: "up",
            a: "left",
            s: "down",
            d: "right"
        };

        if (key === " " || event.code === "Space") {
            event.preventDefault();
            togglePlayState();
            return;
        }

        if (key === "r") {
            event.preventDefault();
            restartGame();
            return;
        }

        const direction = directionMap[key];

        if (direction) {
            event.preventDefault();
            queueDirection(direction);
        }
    }

    function queueDirection(direction) {
        state = logic.queueDirection(state, direction);
        render();
    }

    function togglePlayState() {
        if (state.mode === "ready") {
            state = logic.startGame(state);
        } else {
            state = logic.togglePause(state);
        }

        render();
    }

    function restartGame() {
        state = logic.restartGame(state, {
            columns,
            rows,
            tickMs,
            random: createSeededRandom(seed)
        });
        render();
    }

    function ensureTimer() {
        if (timerId !== null) {
            globalScope.clearInterval(timerId);
        }

        timerId = globalScope.setInterval(() => {
            advanceTime(tickMs);
        }, tickMs);
    }

    function advanceTime(milliseconds) {
        const steps = Math.max(1, Math.round(milliseconds / tickMs));

        for (let index = 0; index < steps; index += 1) {
            if (state.mode === "ready" || state.mode === "paused" || state.mode === "gameOver") {
                break;
            }

            state = logic.stepGame(state);
        }

        render();
    }

    function render() {
        if (scoreElement) {
            scoreElement.textContent = String(state.score);
        }

        if (statusElement) {
            statusElement.textContent = getStatusLabel(state);
        }

        if (platformElement) {
            platformElement.textContent = `Running in ${platformName}.`;
        }

        toggleButtons.forEach((button) => {
            button.textContent = getToggleLabel(state);
        });

        directionButtons.forEach((button) => {
            const direction = button.dataset.direction;
            button.disabled = state.mode === "gameOver" || !direction;
        });

        renderBoard();
    }

    function renderBoard() {
        if (!boardElement) {
            return;
        }

        Array.from(boardElement.children).forEach((cell) => {
            cell.className = "board-cell";
        });

        if (state.food) {
            const foodCell = getBoardCell(state.food);

            if (foodCell) {
                foodCell.classList.add("food");
            }
        }

        state.snake.forEach((segment, index) => {
            const cell = getBoardCell(segment);

            if (!cell) {
                return;
            }

            cell.classList.add(index === 0 ? "snake-head" : "snake");
        });
    }

    function getStatusLabel(gameState) {
        if (gameState.mode === "ready") {
            return "Ready";
        }

        if (gameState.mode === "paused") {
            return "Paused";
        }

        if (gameState.mode === "gameOver") {
            return gameState.outcome === "won" ? "Won" : "Game Over";
        }

        return "Running";
    }

    function getToggleLabel(gameState) {
        if (gameState.mode === "ready") {
            return "Start";
        }

        if (gameState.mode === "paused") {
            return "Resume";
        }

        if (gameState.mode === "gameOver") {
            return "Start";
        }

        return "Pause";
    }

    function renderGameToText() {
        return JSON.stringify({
            mode: state.mode,
            outcome: state.outcome,
            board: {
                origin: "top-left",
                xAxis: "right",
                yAxis: "down",
                columns: state.columns,
                rows: state.rows
            },
            direction: state.direction,
            queuedDirection: state.queuedDirection,
            score: state.score,
            snake: state.snake,
            food: state.food
        });
    }

    function show(platform, extensionEnabled, canOpenPreferences) {
        platformName = platform;

        if (platformElement) {
            const details = [];

            if (platform === "mac") {
                details.push(extensionEnabled ? "extension enabled" : "extension disabled");
                if (canOpenPreferences) {
                    details.push("Safari settings supported");
                }
            }

            platformElement.textContent = details.length > 0
                ? `Running in ${platform}. ${details.join(". ")}.`
                : `Running in ${platform}.`;
        }
    }

    globalScope.advanceTime = advanceTime;
    globalScope.render_game_to_text = renderGameToText;
    globalScope.show = show;
    globalScope.restartSnakeGame = restartGame;

    globalScope.addEventListener("beforeunload", () => {
        if (timerId !== null) {
            globalScope.clearInterval(timerId);
        }
    });
})(typeof globalThis !== "undefined" ? globalThis : window);
