(function attachSnakeGameLogic(globalScope, factory) {
    const api = factory();

    if (typeof module !== "undefined" && module.exports) {
        module.exports = api;
    }

    globalScope.SnakeGameLogic = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createSnakeGameLogic() {
    const DIRECTIONS = Object.freeze({
        up: Object.freeze({ x: 0, y: -1 }),
        down: Object.freeze({ x: 0, y: 1 }),
        left: Object.freeze({ x: -1, y: 0 }),
        right: Object.freeze({ x: 1, y: 0 })
    });

    const OPPOSITES = Object.freeze({
        up: "down",
        down: "up",
        left: "right",
        right: "left"
    });

    function clonePoint(point) {
        return { x: point.x, y: point.y };
    }

    function pointsMatch(left, right) {
        return left.x === right.x && left.y === right.y;
    }

    function createKey(point) {
        return `${point.x},${point.y}`;
    }

    function isInsideBoard(point, columns, rows) {
        return point.x >= 0 && point.x < columns && point.y >= 0 && point.y < rows;
    }

    function getStartingSnake(columns, rows) {
        const centerX = Math.floor(columns / 2);
        const centerY = Math.floor(rows / 2);

        return [
            { x: centerX, y: centerY },
            { x: centerX - 1, y: centerY },
            { x: centerX - 2, y: centerY }
        ];
    }

    function getFreeCells(columns, rows, snake) {
        const occupied = new Set(snake.map(createKey));
        const freeCells = [];

        for (let y = 0; y < rows; y += 1) {
            for (let x = 0; x < columns; x += 1) {
                const point = { x, y };

                if (!occupied.has(createKey(point))) {
                    freeCells.push(point);
                }
            }
        }

        return freeCells;
    }

    function placeFood(columns, rows, snake, random) {
        const freeCells = getFreeCells(columns, rows, snake);

        if (freeCells.length === 0) {
            return null;
        }

        const index = Math.floor(random() * freeCells.length);
        return clonePoint(freeCells[index]);
    }

    function createInitialState(options = {}) {
        const columns = options.columns ?? 16;
        const rows = options.rows ?? 16;
        const tickMs = options.tickMs ?? 140;
        const random = options.random ?? Math.random;
        const snake = (options.snake ?? getStartingSnake(columns, rows)).map(clonePoint);
        const direction = options.direction ?? "right";
        const food = options.food ? clonePoint(options.food) : placeFood(columns, rows, snake, random);

        return {
            columns,
            rows,
            tickMs,
            random,
            mode: "ready",
            outcome: null,
            direction,
            queuedDirection: direction,
            snake,
            food,
            score: 0
        };
    }

    function startGame(state) {
        if (state.mode === "ready" || state.mode === "paused") {
            return { ...state, mode: "running" };
        }

        return state;
    }

    function queueDirection(state, nextDirection) {
        if (!DIRECTIONS[nextDirection] || state.mode === "paused" || state.mode === "gameOver") {
            return state;
        }

        if (state.snake.length > 1 && OPPOSITES[state.direction] === nextDirection) {
            return state;
        }

        return {
            ...state,
            mode: state.mode === "ready" ? "running" : state.mode,
            queuedDirection: nextDirection
        };
    }

    function togglePause(state) {
        if (state.mode === "running") {
            return { ...state, mode: "paused" };
        }

        if (state.mode === "paused") {
            return { ...state, mode: "running" };
        }

        return state;
    }

    function restartGame(state, options = {}) {
        return createInitialState({
            columns: options.columns ?? state.columns,
            rows: options.rows ?? state.rows,
            tickMs: options.tickMs ?? state.tickMs,
            random: options.random ?? state.random ?? Math.random
        });
    }

    function getNextHead(head, direction) {
        const delta = DIRECTIONS[direction];
        return {
            x: head.x + delta.x,
            y: head.y + delta.y
        };
    }

    function stepGame(state, options = {}) {
        if (state.mode !== "running") {
            return state;
        }

        const random = options.random ?? state.random ?? Math.random;
        const direction = state.queuedDirection ?? state.direction;
        const nextHead = getNextHead(state.snake[0], direction);

        if (!isInsideBoard(nextHead, state.columns, state.rows)) {
            return {
                ...state,
                direction,
                queuedDirection: direction,
                mode: "gameOver",
                outcome: "loss"
            };
        }

        const grows = state.food !== null && pointsMatch(nextHead, state.food);
        const bodyToCheck = grows ? state.snake : state.snake.slice(0, -1);

        if (bodyToCheck.some((segment) => pointsMatch(segment, nextHead))) {
            return {
                ...state,
                direction,
                queuedDirection: direction,
                mode: "gameOver",
                outcome: "loss"
            };
        }

        const nextSnake = [nextHead, ...state.snake.map(clonePoint)];

        if (!grows) {
            nextSnake.pop();
        }

        const nextFood = grows ? placeFood(state.columns, state.rows, nextSnake, random) : state.food;
        const outcome = nextFood === null ? "won" : null;

        return {
            ...state,
            direction,
            queuedDirection: direction,
            snake: nextSnake,
            food: nextFood,
            score: state.score + (grows ? 1 : 0),
            mode: outcome === "won" ? "gameOver" : "running",
            outcome
        };
    }

    return {
        DIRECTIONS,
        createInitialState,
        getFreeCells,
        placeFood,
        queueDirection,
        restartGame,
        startGame,
        stepGame,
        togglePause
    };
});
