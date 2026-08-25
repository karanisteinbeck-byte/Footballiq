// ============================================================
// FOOTBALL IQ TRAINER — FIRST PERSON GAME
// ============================================================

"use strict";

console.log("NEW GAME.JS LOADED");

// ============================================================
// CANVAS
// ============================================================

const canvas = document.getElementById("gameCanvas");

if (!canvas) {
    console.error("gameCanvas was not found.");
} else {

    const ctx = canvas.getContext("2d");

    // ========================================================
    // SETTINGS
    // ========================================================

    const settings = {
        offside: true,
        teammates: 6,
        opponents: 7,
        offsideRings: true
    };

    // ========================================================
    // GAME STATE
    // ========================================================

    let gameState = "menu";
    let scenarioNumber = 1;

    let teammates = [];
    let opponents = [];

    let player = null;
    let ball = null;

    let decisionStartTime = 0;
    let scenarioActive = false;

    // ========================================================
    // CANVAS RESIZE
    // ========================================================

    function resizeCanvas() {

        const dpr = window.devicePixelRatio || 1;

        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;

        canvas.style.width = window.innerWidth + "px";
        canvas.style.height = window.innerHeight + "px";

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    window.addEventListener("resize", resizeCanvas);

    resizeCanvas();

    // ========================================================
    // FIRST PERSON CAMERA
    // ========================================================

    const camera = {
        x: 0,
        y: 0,
        z: 1.7
    };

    /*
        The important change:

        The player is standing on the pitch.
        Everything is positioned relative to the player.

        +Y = forward
        -Y = behind the player
        X  = left/right
    */

    const FOV = 75;

    function project(x, y, z = 0) {

        const relativeX = x - camera.x;
        const relativeY = y - camera.y;

        if (relativeY <= 0.8) {
            return null;
        }

        const focalLength =
            (window.innerWidth / 2) /
            Math.tan((FOV * Math.PI / 180) / 2);

        const scale =
            focalLength / relativeY;

        const screenX =
            window.innerWidth / 2 +
            relativeX * scale;

        const horizon =
            window.innerHeight * 0.43;

        const screenY =
            horizon +
            (camera.z - z) * scale;

        return {
            x: screenX,
            y: screenY,
            scale: scale
        };
    }

    // ========================================================
    // PITCH
    // ========================================================

    function drawPitch() {

        const w = window.innerWidth;
        const h = window.innerHeight;

        const horizon = h * 0.43;

        // SKY

        const sky = ctx.createLinearGradient(
            0,
            0,
            0,
            horizon
        );

        sky.addColorStop(0, "#70b7df");
        sky.addColorStop(1, "#d4edf5");

        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, horizon);

        // STADIUM

        ctx.fillStyle = "#444a50";

        ctx.fillRect(
            0,
            horizon,
            w,
            h * 0.18
        );

        // STANDS

        for (let i = 0; i < 18; i++) {

            const x = i * w / 18;

            ctx.fillStyle =
                i % 2 === 0
                    ? "#555b60"
                    : "#484e53";

            ctx.fillRect(
                x,
                horizon + 10,
                w / 19,
                h * 0.12
            );
        }

        // PITCH

        const topWidth = w * 0.15;
        const bottomWidth = w * 1.45;

        ctx.beginPath();

        ctx.moveTo(
            w / 2 - topWidth / 2,
            horizon
        );

        ctx.lineTo(
            w / 2 + topWidth / 2,
            horizon
        );

        ctx.lineTo(
            w / 2 + bottomWidth / 2,
            h
        );

        ctx.lineTo(
            w / 2 - bottomWidth / 2,
            h
        );

        ctx.closePath();

        const grass = ctx.createLinearGradient(
            0,
            horizon,
            0,
            h
        );

        grass.addColorStop(0, "#2b8147");
        grass.addColorStop(1, "#145d30");

        ctx.fillStyle = grass;
        ctx.fill();

        // GRASS STRIPES

        for (let i = 0; i < 14; i++) {

            if (i % 2 !== 0) continue;

            const p1 = i / 14;
            const p2 = (i + 1) / 14;

            const y1 =
                horizon +
                (h - horizon) * p1;

            const y2 =
                horizon +
                (h - horizon) * p2;

            const width1 =
                topWidth +
                (bottomWidth - topWidth) * p1;

            const width2 =
                topWidth +
                (bottomWidth - topWidth) * p2;

            ctx.beginPath();

            ctx.moveTo(
                w / 2 - width1 / 2,
                y1
            );

            ctx.lineTo(
                w / 2 + width1 / 2,
                y1
            );

            ctx.lineTo(
                w / 2 + width2 / 2,
                y2
            );

            ctx.lineTo(
                w / 2 - width2 / 2,
                y2
            );

            ctx.closePath();

            ctx.fillStyle =
                "rgba(255,255,255,0.025)";

            ctx.fill();
        }

        // PERSPECTIVE SIDELINES

        ctx.strokeStyle = "white";
        ctx.lineWidth = 3;

        ctx.beginPath();

        ctx.moveTo(
            w / 2 - topWidth / 2,
            horizon
        );

        ctx.lineTo(
            w / 2 - bottomWidth / 2,
            h
        );

        ctx.moveTo(
            w / 2 + topWidth / 2,
            horizon
        );

        ctx.lineTo(
            w / 2 + bottomWidth / 2,
            h
        );

        ctx.stroke();

        // FIELD LINES

        drawFieldLine(0.25);
        drawFieldLine(0.50);
        drawFieldLine(0.75);
    }

    // ========================================================
    // FIELD LINE
    // ========================================================

    function drawFieldLine(position) {

        const w = window.innerWidth;
        const h = window.innerHeight;

        const horizon = h * 0.43;

        const topWidth = w * 0.15;
        const bottomWidth = w * 1.45;

        const y =
            horizon +
            (h - horizon) * position;

        const width =
            topWidth +
            (bottomWidth - topWidth) * position;

        ctx.strokeStyle =
            "rgba(255,255,255,0.8)";

        ctx.lineWidth = 2;

        ctx.beginPath();

        ctx.moveTo(
            w / 2 - width / 2,
            y
        );

        ctx.lineTo(
            w / 2 + width / 2,
            y
        );

        ctx.stroke();
    }

    // ========================================================
    // PLAYER CREATION
    // ========================================================

    function createPlayer(
        x,
        y,
        team,
        number
    ) {

        return {
            x,
            y,

            z: 0,

            team,
            number,

            offside: false,

            screenX: 0,
            screenY: 0,
            screenRadius: 0,

            selectable:
                team === "blue"
        };
    }

    // ========================================================
    // RANDOM
    // ========================================================

    function random(min, max) {

        return Math.random() *
            (max - min) +
            min;
    }

    // ========================================================
    // CREATE USER
    // ========================================================

    function createUserPlayer() {

        player = createPlayer(
            0,
            0,
            "blue",
            10
        );

        player.isUser = true;
        player.selectable = false;
    }

    // ========================================================
    // CREATE BALL
    // ========================================================

    function createBall() {

        ball = {
            x: 0,
            y: 5,
            z: 0.18
        };
    }

    // ========================================================
    // GENERATE REALISTIC SCENARIO
    // ========================================================

    function generateScenario() {

        teammates = [];
        opponents = [];

        createUserPlayer();
        createBall();

        /*
            Players are deliberately mixed together.

            Everyone is placed between roughly
            8 and 45 metres in front of the user.

            This prevents the old problem where:
              BLUE = one side
              RED  = miles away
        */

        const positions = [];

        // TEAMMATES

        for (
            let i = 0;
            i < settings.teammates;
            i++
        ) {

            let x;
            let y;

            let valid = false;

            while (!valid) {

                x = random(-18, 18);
                y = random(10, 42);

                valid = true;

                for (
                    const p of positions
                ) {

                    const dx =
                        x - p.x;

                    const dy =
                        y - p.y;

                    const d =
                        Math.sqrt(
                            dx * dx +
                            dy * dy
                        );

                    if (d < 5) {
                        valid = false;
                        break;
                    }
                }
            }

            positions.push({ x, y });

            teammates.push(
                createPlayer(
                    x,
                    y,
                    "blue",
                    i + 1
                )
            );
        }

        // OPPONENTS

        for (
            let i = 0;
            i < settings.opponents;
            i++
        ) {

            let x;
            let y;

            let valid = false;

            while (!valid) {

                x = random(-20, 20);
                y = random(12, 45);

                valid = true;

                for (
                    const p of positions
                ) {

                    const dx =
                        x - p.x;

                    const dy =
                        y - p.y;

                    const d =
                        Math.sqrt(
                            dx * dx +
                            dy * dy
                        );

                    /*
                        Opponents can be close,
                        but not directly stacked
                        on top of another player.
                    */

                    if (d < 4) {
                        valid = false;
                        break;
                    }
                }
            }

            positions.push({ x, y });

            opponents.push(
                createPlayer(
                    x,
                    y,
                    "red",
                    i + 1
                )
            );
        }

        calculateOffside();

        decisionStartTime =
            performance.now();

        scenarioActive = true;
    }

    // ========================================================
    // DISTANCE
    // ========================================================

    function distance(a, b) {

        const dx = a.x - b.x;
        const dy = a.y - b.y;

        return Math.sqrt(
            dx * dx + dy * dy
        );
    }

    // ========================================================
    // OFFSIDE
    // ========================================================

    function calculateOffside() {

        teammates.forEach(
            p => p.offside = false
        );

        if (!settings.offside) {
            return;
        }

        /*
            The ball is at y = 5.

            Defenders with the highest y
            are farther forward.

            Find the two defenders furthest
            forward.
        */

        const defenders =
            [...opponents].sort(
                (a, b) =>
                    b.y - a.y
            );

        if (defenders.length < 2) {
            return;
        }

        const secondLast =
            defenders[1].y;

        for (
            const teammate
            of teammates
        ) {

            const beyondBall =
                teammate.y >
                ball.y;

            const beyondDefender =
                teammate.y >
                secondLast;

            teammate.offside =
                beyondBall &&
                beyondDefender;
        }
    }

    // ========================================================
    // DRAW PLAYER
    // ========================================================

    function drawPlayer(p) {

        const projected =
            project(
                p.x,
                p.y,
                p.z
            );

        if (!projected) {
            return;
        }

        /*
            Players become smaller with distance,
            but never become microscopic.
        */

        const size =
            Math.max(
                0.35,
                Math.min(
                    projected.scale,
                    2.8
                )
            );

        const bodyHeight =
            14 * size;

        const bodyWidth =
            7 * size;

        p.screenX =
            projected.x;

        p.screenY =
            projected.y;

        p.screenRadius =
            Math.max(
                14,
                7 * size
            );

        // SHADOW

        ctx.beginPath();

        ctx.ellipse(
            projected.x,
            projected.y + 3,
            bodyWidth * 1.1,
            bodyWidth * 0.4,
            0,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            "rgba(0,0,0,0.3)";

        ctx.fill();

        // OFFSIDE RING

        if (
            p.offside &&
            settings.offsideRings
        ) {

            ctx.beginPath();

            ctx.arc(
                projected.x,
                projected.y,
                Math.max(
                    18,
                    10 * size
                ),
                0,
                Math.PI * 2
            );

            ctx.strokeStyle =
                "#ffae24";

            ctx.lineWidth = 3;

            ctx.stroke();
        }

        // BODY

        ctx.fillStyle =
            p.team === "blue"
                ? "#1976e8"
                : "#e53935";

        ctx.fillRect(
            projected.x -
                bodyWidth / 2,
            projected.y -
                bodyHeight,
            bodyWidth,
            bodyHeight
        );

        // HEAD

        ctx.beginPath();

        ctx.arc(
            projected.x,
            projected.y -
                bodyHeight -
                bodyWidth * 0.55,
            bodyWidth * 0.55,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            "#c98b62";

        ctx.fill();

        // NUMBER

        if (size > 0.5) {

            ctx.fillStyle = "white";

            ctx.font =
                `bold ${Math.max(
                    9,
                    7 * size
                )}px Arial`;

            ctx.textAlign = "center";

            ctx.fillText(
                p.number,
                projected.x,
                projected.y -
                    bodyHeight * 0.35
            );
        }
    }

    // ========================================================
    // DRAW BALL
    // ========================================================

    function drawBall() {

        const projected =
            project(
                ball.x,
                ball.y,
                ball.z
            );

        if (!projected) {
            return;
        }

        const radius =
            Math.max(
                4,
                Math.min(
                    projected.scale * 0.8,
                    14
                )
            );

        ctx.beginPath();

        ctx.arc(
            projected.x,
            projected.y,
            radius,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "white";
        ctx.fill();

        ctx.strokeStyle = "#222";
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    // ========================================================
    // DRAW ALL PLAYERS
    // ========================================================

    function drawPlayers() {

        const players = [
            ...teammates,
            ...opponents
        ];

        /*
            Farther players first.
        */

        players.sort(
            (a, b) =>
                b.y - a.y
        );

        players.forEach(
            drawPlayer
        );
    }

    // ========================================================
    // PLAYER YOU ARE
    // ========================================================

    function drawUserIndicator() {

        const w = window.innerWidth;
        const h = window.innerHeight;

        /*
            You don't need to see a giant
            character in first person.

            Instead show the bottom of the
            screen as your player's position.
        */

        ctx.fillStyle =
            "rgba(25,118,232,0.9)";

        ctx.beginPath();

        ctx.moveTo(
            w / 2 - 25,
            h
        );

        ctx.lineTo(
            w / 2 + 25,
            h
        );

        ctx.lineTo(
            w / 2,
            h - 45
        );

        ctx.closePath();

        ctx.fill();

        ctx.fillStyle = "white";

        ctx.font =
            "bold 13px Arial";

        ctx.textAlign = "center";

        ctx.fillText(
            "YOU",
            w / 2,
            h - 15
        );
    }

    // ========================================================
    // SCENE
    // ========================================================

    function drawScene() {

        ctx.clearRect(
            0,
            0,
            window.innerWidth,
            window.innerHeight
        );

        drawPitch();

        drawPlayers();

        drawBall();

        drawUserIndicator();
    }

    // ========================================================
    // FIND TEAMMATE
    // ========================================================

    function findClickedTeammate(
        x,
        y
    ) {

        let closest = null;
        let closestDistance =
            Infinity;

        for (
            const teammate
            of teammates
        ) {

            const dx =
                x -
                teammate.screenX;

            const dy =
                y -
                (
                    teammate.screenY -
                    8
                );

            const d =
                Math.sqrt(
                    dx * dx +
                    dy * dy
                );

            const radius =
                Math.max(
                    25,
                    teammate.screenRadius * 2
                );

            if (
                d < radius &&
                d < closestDistance
            ) {

                closest =
                    teammate;

                closestDistance =
                    d;
            }
        }

        return closest;
    }

    // ========================================================
    // PASS
    // ========================================================

    function makePass(target) {

        if (!scenarioActive) {
            return;
        }

        scenarioActive = false;

        const seconds =
            (
                performance.now() -
                decisionStartTime
            ) / 1000;

        let score = 100;

        const nearestOpponent =
            Math.min(
                ...opponents.map(
                    o =>
                        distance(
                            target,
                            o
                        )
                )
            );

        if (nearestOpponent < 5)
            score -= 35;

        else if (nearestOpponent < 8)
            score -= 18;

        else if (nearestOpponent < 12)
            score -= 8;

        if (
            settings.offside &&
            target.offside
        ) {
            score -= 80;
        }

        if (seconds > 3)
            score -= 25;

        else if (seconds > 2)
            score -= 15;

        else if (seconds > 1.5)
            score -= 7;

        score =
            Math.max(
                0,
                Math.round(score)
            );

        showResult(
            score,
            seconds,
            target
        );
    }

    // ========================================================
    // RESULT
    // ========================================================

    function showResult(
        score,
        seconds,
        target
    ) {

        gameState = "result";

        const result =
            document.getElementById(
                "resultScreen"
            );

        const overall =
            document.getElementById(
                "overallScore"
            );

        const message =
            document.getElementById(
                "resultMessage"
            );

        const analysis =
            document.getElementById(
                "analysis"
            );

        const time =
            document.getElementById(
                "decisionTime"
            );

        if (overall)
            overall.textContent = score;

        if (time)
            time.textContent =
                seconds.toFixed(2) + "s";

        if (
            settings.offside &&
            target.offside
        ) {

            if (message)
                message.textContent =
                    "OFFSIDE!";

            if (analysis)
                analysis.textContent =
                    "Your teammate was beyond the second-last defender when the pass was made.";

        } else if (score >= 90) {

            if (message)
                message.textContent =
                    "EXCELLENT DECISION";

            if (analysis)
                analysis.textContent =
                    "Great awareness and a strong passing option.";

        } else if (score >= 75) {

            if (message)
                message.textContent =
                    "GOOD DECISION";

            if (analysis)
                analysis.textContent =
                    "A solid option, although there may have been an even better pass.";

        } else if (score >= 50) {

            if (message)
                message.textContent =
                    "COULD BE BETTER";

            if (analysis)
                analysis.textContent =
                    "The pass was playable, but pressure or positioning reduced its quality.";

        } else {

            if (message)
                message.textContent =
                    "POOR DECISION";

            if (analysis)
                analysis.textContent =
                    "Check the defensive line and nearby pressure before passing.";
        }

        if (result) {

            result.classList.remove(
                "hidden"
            );
        }
    }

    // ========================================================
    // START SCENARIO
    // ========================================================

    function startScenario() {

        gameState = "playing";

        generateScenario();

        const start =
            document.getElementById(
                "startScreen"
            );

        const settingsScreen =
            document.getElementById(
                "settingsScreen"
            );

        const result =
            document.getElementById(
                "resultScreen"
            );

        if (start)
            start.classList.add("hidden");

        if (settingsScreen)
            settingsScreen.classList.add("hidden");

        if (result)
            result.classList.add("hidden");

        const scenario =
            document.getElementById(
                "scenarioNumber"
            );

        if (scenario)
            scenario.textContent =
                "SCENARIO " +
                scenarioNumber;

        const instruction =
            document.getElementById(
                "instruction"
            );

        if (instruction)
            instruction.textContent =
                "TAP A TEAMMATE TO PASS";
    }

    // ========================================================
    // INPUT
    // ========================================================

    canvas.addEventListener(
        "pointerdown",
        function(event) {

            if (
                gameState !==
                "playing"
            ) {
                return;
            }

            const target =
                findClickedTeammate(
                    event.clientX,
                    event.clientY
                );

            if (target) {

                makePass(target);
            }
        }
    );

    // ========================================================
    // BUTTONS
    // ========================================================

    const startButton =
        document.getElementById(
            "startButton"
        );

    const settingsButton =
        document.getElementById(
            "settingsButton"
        );

    const settingsBack =
        document.getElementById(
            "settingsBack"
        );

    const nextButton =
        document.getElementById(
            "nextButton"
        );

    // START

    if (startButton) {

        startButton.onclick =
            function() {

                startScenario();
            };
    }

    // SETTINGS

    if (settingsButton) {

        settingsButton.onclick =
            function() {

                const start =
                    document.getElementById(
                        "startScreen"
                    );

                const settingsScreen =
                    document.getElementById(
                        "settingsScreen"
                    );

                if (start)
                    start.classList.add(
                        "hidden"
                    );

                if (settingsScreen)
                    settingsScreen.classList.remove(
                        "hidden"
                    );
            };
    }

    // BACK

    if (settingsBack) {

        settingsBack.onclick =
            function() {

                const start =
                    document.getElementById(
                        "startScreen"
                    );

                const settingsScreen =
                    document.getElementById(
                        "settingsScreen"
                    );

                if (settingsScreen)
                    settingsScreen.classList.add(
                        "hidden"
                    );

                if (start)
                    start.classList.remove(
                        "hidden"
                    );
            };
    }

    // NEXT

    if (nextButton) {

        nextButton.onclick =
            function() {

                scenarioNumber++;

                startScenario();
            };
    }

    // ========================================================
    // GAME LOOP
    // ========================================================

    function gameLoop() {

        if (
            gameState === "playing"
        ) {

            drawScene();
        }

        requestAnimationFrame(
            gameLoop
        );
    }

    // ========================================================
    // INITIALISE
    // ========================================================

    gameLoop();

    console.log(
        "Football IQ first-person game ready."
    );
}
