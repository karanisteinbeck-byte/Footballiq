"use strict";

console.log("Football IQ game.js loaded");

const canvas = document.getElementById("gameCanvas");

if (!canvas) {
    console.error("ERROR: gameCanvas not found in index.html");
} else {

    const ctx = canvas.getContext("2d");

    // =========================================================
    // SETTINGS
    // =========================================================

    const settings = {
        offside: true,
        teammates: 6,
        opponents: 7,
        offsideRings: true
    };

    // =========================================================
    // GAME STATE
    // =========================================================

    let gameState = "menu";
    let scenarioNumber = 1;

    let teammates = [];
    let opponents = [];

    let player = null;
    let ball = null;

    let scenarioActive = false;
    let decisionStartTime = 0;

    // =========================================================
    // CANVAS
    // =========================================================

    function resizeCanvas() {

        const dpr = window.devicePixelRatio || 1;

        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;

        canvas.style.width = window.innerWidth + "px";
        canvas.style.height = window.innerHeight + "px";

        ctx.setTransform(
            dpr,
            0,
            0,
            dpr,
            0,
            0
        );
    }

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    // =========================================================
    // FIRST-PERSON PERSPECTIVE
    // =========================================================
    //
    // The player is at the bottom of the screen.
    //
    // World coordinates:
    //
    // X = left / right
    // Y = distance forward
    //
    // We deliberately map players to the pitch trapezoid.
    // This prevents them from ever appearing in the sky/void.
    // =========================================================

    function projectPlayer(x, y) {

        const w = window.innerWidth;
        const h = window.innerHeight;

        const horizon = h * 0.38;

        // How far down the pitch is visible.
        const maxDistance = 48;

        // Clamp players to the visible pitch.
        y = Math.max(3, Math.min(y, maxDistance));

        // Perspective factor.
        const depth = y / maxDistance;

        /*
         * At the horizon the pitch is narrow.
         * Near the player it is wide.
         */
        const nearHalfWidth = w * 0.70;
        const farHalfWidth = w * 0.09;

        const halfWidth =
            farHalfWidth +
            (nearHalfWidth - farHalfWidth) *
            Math.pow(depth, 0.72);

        /*
         * Horizontal position.
         *
         * World pitch width is roughly -30 to +30.
         */
        const normalizedX =
            Math.max(-1, Math.min(1, x / 30));

        const screenX =
            w / 2 +
            normalizedX * halfWidth;

        /*
         * Vertical position.
         *
         * Far players are near the horizon.
         * Close players are lower on screen.
         */
        const screenY =
            horizon +
            Math.pow(depth, 0.72) *
            (h - horizon + 20);

        /*
         * Player size follows perspective.
         */
        const scale =
            0.35 +
            Math.pow(depth, 0.75) * 1.9;

        return {
            x: screenX,
            y: screenY,
            scale: scale
        };
    }

    // =========================================================
    // PITCH
    // =========================================================

    function drawPitch() {

        const w = window.innerWidth;
        const h = window.innerHeight;

        const horizon = h * 0.38;

        // -----------------------------------------------------
        // SKY
        // -----------------------------------------------------

        const sky =
            ctx.createLinearGradient(
                0,
                0,
                0,
                horizon
            );

        sky.addColorStop(0, "#69add5");
        sky.addColorStop(1, "#d7edf4");

        ctx.fillStyle = sky;

        ctx.fillRect(
            0,
            0,
            w,
            horizon
        );

        // -----------------------------------------------------
        // STADIUM
        // -----------------------------------------------------

        ctx.fillStyle = "#41474c";

        ctx.fillRect(
            0,
            horizon,
            w,
            h * 0.20
        );

        // Stadium stands

        for (let i = 0; i < 20; i++) {

            const x = i * w / 20;

            ctx.fillStyle =
                i % 2 === 0
                    ? "#555b60"
                    : "#494f54";

            ctx.fillRect(
                x,
                horizon + 8,
                w / 21,
                h * 0.13
            );
        }

        // -----------------------------------------------------
        // PITCH
        // -----------------------------------------------------

        const farHalf = w * 0.09;
        const nearHalf = w * 0.70;

        ctx.beginPath();

        ctx.moveTo(
            w / 2 - farHalf,
            horizon
        );

        ctx.lineTo(
            w / 2 + farHalf,
            horizon
        );

        ctx.lineTo(
            w / 2 + nearHalf,
            h
        );

        ctx.lineTo(
            w / 2 - nearHalf,
            h
        );

        ctx.closePath();

        const grass =
            ctx.createLinearGradient(
                0,
                horizon,
                0,
                h
            );

        grass.addColorStop(
            0,
            "#34844b"
        );

        grass.addColorStop(
            0.5,
            "#277a41"
        );

        grass.addColorStop(
            1,
            "#155d30"
        );

        ctx.fillStyle = grass;
        ctx.fill();

        // -----------------------------------------------------
        // GRASS STRIPES
        // -----------------------------------------------------

        for (let i = 0; i < 12; i++) {

            if (i % 2 !== 0) continue;

            const p1 = i / 12;
            const p2 = (i + 1) / 12;

            const y1 =
                horizon +
                Math.pow(p1, 0.72) *
                (h - horizon);

            const y2 =
                horizon +
                Math.pow(p2, 0.72) *
                (h - horizon);

            const width1 =
                farHalf +
                (nearHalf - farHalf) *
                Math.pow(p1, 0.72);

            const width2 =
                farHalf +
                (nearHalf - farHalf) *
                Math.pow(p2, 0.72);

            ctx.beginPath();

            ctx.moveTo(
                w / 2 - width1,
                y1
            );

            ctx.lineTo(
                w / 2 + width1,
                y1
            );

            ctx.lineTo(
                w / 2 + width2,
                y2
            );

            ctx.lineTo(
                w / 2 - width2,
                y2
            );

            ctx.closePath();

            ctx.fillStyle =
                "rgba(255,255,255,0.025)";

            ctx.fill();
        }

        // -----------------------------------------------------
        // SIDELINES
        // -----------------------------------------------------

        ctx.strokeStyle =
            "rgba(255,255,255,0.9)";

        ctx.lineWidth = 3;

        ctx.beginPath();

        ctx.moveTo(
            w / 2 - farHalf,
            horizon
        );

        ctx.lineTo(
            w / 2 - nearHalf,
            h
        );

        ctx.moveTo(
            w / 2 + farHalf,
            horizon
        );

        ctx.lineTo(
            w / 2 + nearHalf,
            h
        );

        ctx.stroke();

        // -----------------------------------------------------
        // FIELD LINES
        // -----------------------------------------------------

        drawPitchLine(0.22);
        drawPitchLine(0.48);
        drawPitchLine(0.74);
    }

    // =========================================================
    // PERSPECTIVE FIELD LINE
    // =========================================================

    function drawPitchLine(position) {

        const w = window.innerWidth;
        const h = window.innerHeight;

        const horizon = h * 0.38;

        const farHalf = w * 0.09;
        const nearHalf = w * 0.70;

        const depth =
            Math.pow(position, 0.72);

        const y =
            horizon +
            depth *
            (h - horizon);

        const halfWidth =
            farHalf +
            (nearHalf - farHalf) *
            depth;

        ctx.strokeStyle =
            "rgba(255,255,255,0.8)";

        ctx.lineWidth = 2;

        ctx.beginPath();

        ctx.moveTo(
            w / 2 - halfWidth,
            y
        );

        ctx.lineTo(
            w / 2 + halfWidth,
            y
        );

        ctx.stroke();
    }

    // =========================================================
    // PLAYER CREATION
    // =========================================================

    function createPlayer(
        x,
        y,
        team,
        number
    ) {

        return {
            x: x,
            y: y,
            team: team,
            number: number,

            offside: false,

            screenX: 0,
            screenY: 0,
            screenRadius: 20,

            selectable:
                team === "blue"
        };
    }

    // =========================================================
    // USER PLAYER
    // =========================================================

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

    // =========================================================
    // BALL
    // =========================================================

    function createBall() {

        ball = {
            x: 0,
            y: 5
        };
    }

    // =========================================================
    // RANDOM
    // =========================================================

    function random(min, max) {

        return Math.random() *
            (max - min) +
            min;
    }

    // =========================================================
    // POSITION VALIDATION
    // =========================================================

    function positionIsFree(
        x,
        y,
        players,
        minimumDistance
    ) {

        for (const p of players) {

            const dx = x - p.x;
            const dy = y - p.y;

            const d =
                Math.sqrt(
                    dx * dx +
                    dy * dy
                );

            if (d < minimumDistance) {
                return false;
            }
        }

        return true;
    }

    // =========================================================
    // GENERATE REALISTIC SCENARIO
    // =========================================================

    function generateScenario() {

        teammates = [];
        opponents = [];

        createUserPlayer();
        createBall();

        const occupied = [];

        // -----------------------------------------------------
        // TEAMMATES
        // -----------------------------------------------------
        //
        // Teammates are spread around the user.
        // Some are ahead, some beside and one can be behind.
        // This creates actual passing choices.
        // -----------------------------------------------------

        const teammateZones = [
            [-10, 8, 2],
            [8, 11, 3],
            [-13, 17, 4],
            [12, 19, 5],
            [-8, 25, 6],
            [8, 29, 7],
            [-14, 13, 8],
            [14, 24, 9]
        ];

        let attempts = 0;

        for (
            let i = 0;
            i < settings.teammates;
            i++
        ) {

            let x;
            let y;
            let valid = false;

            while (!valid && attempts < 500) {

                attempts++;

                const zone =
                    teammateZones[
                        i %
                        teammateZones.length
                    ];

                x =
                    zone[0] +
                    random(-4, 4);

                y =
                    zone[1] +
                    random(-3, 3);

                // Keep players on the pitch.

                x =
                    Math.max(
                        -24,
                        Math.min(24, x)
                    );

                y =
                    Math.max(
                        6,
                        Math.min(35, y)
                    );

                valid =
                    positionIsFree(
                        x,
                        y,
                        occupied,
                        4.2
                    );
            }

            const teammate =
                createPlayer(
                    x,
                    y,
                    "blue",
                    i + 1
                );

            teammates.push(
                teammate
            );

            occupied.push(
                teammate
            );
        }

        // -----------------------------------------------------
        // OPPONENTS
        // -----------------------------------------------------
        //
        // Opponents are NOT placed in one separate group.
        // They are mixed between teammates.
        // -----------------------------------------------------

        const opponentZones = [
            [-7, 10],
            [7, 13],
            [-14, 18],
            [14, 20],
            [-5, 23],
            [6, 27],
            [0, 31],
            [-17, 15],
            [17, 26]
        ];

        attempts = 0;

        for (
            let i = 0;
            i < settings.opponents;
            i++
        ) {

            let x;
            let y;
            let valid = false;

            while (!valid && attempts < 1000) {

                attempts++;

                const zone =
                    opponentZones[
                        i %
                        opponentZones.length
                    ];

                x =
                    zone[0] +
                    random(-4, 4);

                y =
                    zone[1] +
                    random(-3, 3);

                x =
                    Math.max(
                        -25,
                        Math.min(25, x)
                    );

                y =
                    Math.max(
                        7,
                        Math.min(37, y)
                    );

                valid =
                    positionIsFree(
                        x,
                        y,
                        occupied,
                        3.5
                    );
            }

            const opponent =
                createPlayer(
                    x,
                    y,
                    "red",
                    i + 1
                );

            opponents.push(
                opponent
            );

            occupied.push(
                opponent
            );
        }

        // =====================================================
        // OFFSIDE
        // =====================================================

        calculateOffside();

        decisionStartTime =
            performance.now();

        scenarioActive = true;
    }

    // =========================================================
    // OFFSIDE CALCULATION
    // =========================================================
    //
    // IMPORTANT:
    // There are deliberately legal teammates.
    //
    // A teammate is offside only when:
    //
    // 1. They are beyond the ball
    // 2. AND beyond the second-last opponent
    //
    // Being ahead of the ball alone is NOT offside.
    // =========================================================

    function calculateOffside() {

        for (const p of teammates) {
            p.offside = false;
        }

        if (!settings.offside) {
            return;
        }

        if (opponents.length < 2) {
            return;
        }

        const sorted =
            [...opponents].sort(
                (a, b) =>
                    b.y - a.y
            );

        const secondLastDefender =
            sorted[1].y;

        for (const teammate of teammates) {

            const beyondBall =
                teammate.y >
                ball.y;

            const beyondSecondLast =
                teammate.y >
                secondLastDefender;

            teammate.offside =
                beyondBall &&
                beyondSecondLast;
        }

        // -----------------------------------------------------
        // GUARANTEE AT LEAST 2 LEGAL OPTIONS
        // -----------------------------------------------------

        const legal =
            teammates.filter(
                p => !p.offside
            );

        if (legal.length < 2) {

            // Move the first two teammates
            // back into legal positions.

            const safeY =
                Math.min(
                    ball.y + 2,
                    secondLastDefender - 2
                );

            teammates[0].y =
                Math.max(
                    6,
                    safeY
                );

            teammates[1].y =
                Math.max(
                    7,
                    safeY - 2
                );

            teammates[0].offside = false;
            teammates[1].offside = false;
        }
    }

    // =========================================================
    // DRAW BLOCKY PLAYER
    // =========================================================

    function drawPlayer(p) {

        const projected =
            projectPlayer(
                p.x,
                p.y
            );

        if (!projected) {
            return;
        }

        const s =
            projected.scale;

        const bodyWidth =
            Math.max(
                7,
                7 * s
            );

        const bodyHeight =
            Math.max(
                12,
                15 * s
            );

        const headRadius =
            Math.max(
                4,
                4 * s
            );

        p.screenX =
            projected.x;

        p.screenY =
            projected.y;

        p.screenRadius =
            Math.max(
                20,
                14 * s
            );

        // -----------------------------------------------------
        // SHADOW
        // -----------------------------------------------------

        ctx.beginPath();

        ctx.ellipse(
            projected.x,
            projected.y + 3,
            bodyWidth * 1.2,
            bodyWidth * 0.45,
            0,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            "rgba(0,0,0,0.28)";

        ctx.fill();

        // -----------------------------------------------------
        // OFFSIDE RING
        // -----------------------------------------------------

        if (
            p.offside &&
            settings.offsideRings
        ) {

            ctx.beginPath();

            ctx.arc(
                projected.x,
                projected.y,
                Math.max(
                    16,
                    12 * s
                ),
                0,
                Math.PI * 2
            );

            ctx.strokeStyle =
                "#ffae22";

            ctx.lineWidth = 3;

            ctx.stroke();
        }

        // -----------------------------------------------------
        // BLOCKY BODY
        // -----------------------------------------------------

        ctx.fillStyle =
            p.team === "blue"
                ? "#1683ed"
                : "#e43d3d";

        ctx.fillRect(
            projected.x -
            bodyWidth / 2,

            projected.y -
            bodyHeight,

            bodyWidth,
            bodyHeight
        );

        // -----------------------------------------------------
        // BLOCKY ARMS
        // -----------------------------------------------------

        const armWidth =
            Math.max(
                3,
                bodyWidth * 0.38
            );

        ctx.fillRect(
            projected.x -
            bodyWidth / 2 -
            armWidth,

            projected.y -
            bodyHeight * 0.88,

            armWidth,

            bodyHeight * 0.65
        );

        ctx.fillRect(
            projected.x +
            bodyWidth / 2,

            projected.y -
            bodyHeight * 0.88,

            armWidth,

            bodyHeight * 0.65
        );

        // -----------------------------------------------------
        // BLOCKY LEGS
        // -----------------------------------------------------

        const legWidth =
            Math.max(
                3,
                bodyWidth * 0.38
            );

        ctx.fillRect(
            projected.x -
            bodyWidth * 0.43,

            projected.y -
            2,

            legWidth,

            bodyHeight * 0.55
        );

        ctx.fillRect(
            projected.x +
            bodyWidth * 0.05,

            projected.y -
            2,

            legWidth,

            bodyHeight * 0.55
        );

        // -----------------------------------------------------
        // HEAD
        // -----------------------------------------------------

        ctx.fillStyle =
            "#c98a62";

        ctx.fillRect(
            projected.x -
            headRadius,

            projected.y -
            bodyHeight -
            headRadius * 2,

            headRadius * 2,

            headRadius * 2
        );

        // -----------------------------------------------------
        // NUMBER
        // -----------------------------------------------------

        if (s > 0.55) {

            ctx.fillStyle =
                "white";

            ctx.font =
                "bold " +
                Math.max(
                    9,
                    8 * s
                ) +
                "px Arial";

            ctx.textAlign =
                "center";

            ctx.fillText(
                p.number,
                projected.x,
                projected.y -
                bodyHeight * 0.35
            );
        }
    }

    // =========================================================
    // DRAW BALL
    // =========================================================

    function drawBall() {

        const projected =
            projectPlayer(
                ball.x,
                ball.y
            );

        if (!projected) {
            return;
        }

        const radius =
            Math.max(
                4,
                Math.min(
                    12,
                    projected.scale * 5
                )
            );

        // Shadow

        ctx.beginPath();

        ctx.ellipse(
            projected.x,
            projected.y + 3,
            radius * 1.3,
            radius * 0.45,
            0,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            "rgba(0,0,0,0.3)";

        ctx.fill();

        // Ball

        ctx.beginPath();

        ctx.arc(
            projected.x,
            projected.y,
            radius,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            "white";

        ctx.fill();

        ctx.strokeStyle =
            "#222";

        ctx.lineWidth = 1;

        ctx.stroke();
    }

    // =========================================================
    // DRAW ALL PLAYERS
    // =========================================================

    function drawPlayers() {

        const all =
            [
                ...teammates,
                ...opponents
            ];

        // Farther players first.

        all.sort(
            (a, b) =>
                b.y - a.y
        );

        for (const p of all) {
            drawPlayer(p);
        }
    }

    // =========================================================
    // USER POSITION
    // =========================================================

    function drawUserPosition() {

        const w =
            window.innerWidth;

        const h =
            window.innerHeight;

        /*
         * This is your player's position.
         * It gives the first-person perspective
         * a clear reference point.
         */

        ctx.fillStyle =
            "#1683ed";

        ctx.beginPath();

        ctx.moveTo(
            w / 2 - 28,
            h
        );

        ctx.lineTo(
            w / 2 + 28,
            h
        );

        ctx.lineTo(
            w / 2,
            h - 48
        );

        ctx.closePath();

        ctx.fill();

        ctx.fillStyle =
            "white";

        ctx.font =
            "bold 13px Arial";

        ctx.textAlign =
            "center";

        ctx.fillText(
            "YOU",
            w / 2,
            h - 15
        );
    }

    // =========================================================
    // SCENE
    // =========================================================

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
        drawUserPosition();
    }

    // =========================================================
    // FIND TEAMMATE
    // =========================================================

    function findClickedTeammate(
        x,
        y
    ) {

        let closest = null;
        let closestDistance = Infinity;

        for (const teammate of teammates) {

            const dx =
                x -
                teammate.screenX;

            const dy =
                y -
                (
                    teammate.screenY -
                    20
                );

            const d =
                Math.sqrt(
                    dx * dx +
                    dy * dy
                );

            const hitRadius =
                Math.max(
                    28,
                    teammate.screenRadius * 1.7
                );

            if (
                d < hitRadius &&
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

    // =========================================================
    // PASS QUALITY
    // =========================================================

    function calculateScore(target) {

        let score = 100;

        // Pressure

        let closestOpponent =
            Infinity;

        for (const opponent of opponents) {

            const dx =
                target.x -
                opponent.x;

            const dy =
                target.y -
                opponent.y;

            const d =
                Math.sqrt(
                    dx * dx +
                    dy * dy
                );

            if (
                d <
                closestOpponent
            ) {

                closestOpponent = d;
            }
        }

        if (
            closestOpponent < 4
        ) {

            score -= 35;

        } else if (
            closestOpponent < 7
        ) {

            score -= 18;

        } else if (
            closestOpponent < 11
        ) {

            score -= 7;
        }

        // Offside

        if (
            settings.offside &&
            target.offside
        ) {

            score -= 80;
        }

        // Distance

        const dx =
            target.x -
            player.x;

        const dy =
            target.y -
            player.y;

        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );

        if (distance > 30) {
            score -= 12;
        }

        return Math.max(
            0,
            Math.round(score)
        );
    }

    // =========================================================
    // MAKE PASS
    // =========================================================

    function makePass(target) {

        if (!scenarioActive) {
            return;
        }

        scenarioActive = false;

        const elapsed =
            (
                performance.now() -
                decisionStartTime
            ) / 1000;

        let score =
            calculateScore(target);

        // Reaction bonus

        if (elapsed <= 1.0) {
            score += 5;
        } else if (elapsed > 3) {
            score -= 10;
        }

        score =
            Math.max(
                0,
                Math.min(
                    100,
                    Math.round(score)
                )
            );

        showResult(
            score,
            elapsed,
            target
        );
    }

    // =========================================================
    // RESULT
    // =========================================================

    function showResult(
        score,
        seconds,
        target
    ) {

        gameState = "result";

        const resultScreen =
            document.getElementById(
                "resultScreen"
            );

        const overall =
            document.getElementById(
                "overallScore"
            );

        const decisionTime =
            document.getElementById(
                "decisionTime"
            );

        const message =
            document.getElementById(
                "resultMessage"
            );

        const analysis =
            document.getElementById(
                "analysis"
            );

        if (overall) {
            overall.textContent =
                score;
        }

        if (decisionTime) {
            decisionTime.textContent =
                seconds.toFixed(2) + "s";
        }

        if (
            settings.offside &&
            target.offside
        ) {

            if (message) {
                message.textContent =
                    "OFFSIDE!";
            }

            if (analysis) {
                analysis.textContent =
                    "Your teammate was beyond the second-last defender when the pass was made.";
            }

        } else if (score >= 90) {

            if (message) {
                message.textContent =
                    "EXCELLENT DECISION";
            }

            if (analysis) {
                analysis.textContent =
                    "Excellent awareness and a strong passing option.";
            }

        } else if (score >= 75) {

            if (message) {
                message.textContent =
                    "GOOD DECISION";
            }

            if (analysis) {
                analysis.textContent =
                    "A good option, although there may have been an even better pass.";
            }

        } else if (score >= 50) {

            if (message) {
                message.textContent =
                    "COULD BE BETTER";
            }

            if (analysis) {
                analysis.textContent =
                    "The pass was playable, but pressure or positioning reduced its quality.";
            }

        } else {

            if (message) {
                message.textContent =
                    "POOR DECISION";
            }

            if (analysis) {
                analysis.textContent =
                    "Look at the defensive line and nearby pressure before passing.";
            }
        }

        if (resultScreen) {
            resultScreen.classList.remove(
                "hidden"
            );
        }
    }

    // =========================================================
    // START GAME
    // =========================================================

    function startScenario() {

        gameState = "playing";

        generateScenario();

        const startScreen =
            document.getElementById(
                "startScreen"
            );

        const settingsScreen =
            document.getElementById(
                "settingsScreen"
            );

        const resultScreen =
            document.getElementById(
                "resultScreen"
            );

        if (startScreen) {
            startScreen.classList.add(
                "hidden"
            );
        }

        if (settingsScreen) {
            settingsScreen.classList.add(
                "hidden"
            );
        }

        if (resultScreen) {
            resultScreen.classList.add(
                "hidden"
            );
        }

        const scenario =
            document.getElementById(
                "scenarioNumber"
            );

        if (scenario) {
            scenario.textContent =
                "SCENARIO " +
                scenarioNumber;
        }

        const instruction =
            document.getElementById(
                "instruction"
            );

        if (instruction) {
            instruction.textContent =
                "TAP A TEAMMATE TO PASS";
        }
    }

    // =========================================================
    // POINTER / IPAD TOUCH
    // =========================================================

    canvas.addEventListener(
        "pointerdown",
        function(event) {

            if (
                gameState !==
                "playing"
            ) {
                return;
            }

            event.preventDefault();

            const target =
                findClickedTeammate(
                    event.clientX,
                    event.clientY
                );

            if (target) {
                makePass(target);
            }
        },
        {
            passive: false
        }
    );

    // =========================================================
    // BUTTON HELPERS
    // =========================================================

    function get(id) {
        return document.getElementById(id);
    }

    // =========================================================
    // START BUTTON
    // =========================================================

    const startButton =
        get("startButton");

    if (startButton) {

        startButton.onclick =
            function(event) {

                event.preventDefault();

                startScenario();
            };
    }

    // =========================================================
    // SETTINGS BUTTON
    // =========================================================

    const settingsButton =
        get("settingsButton");

    if (settingsButton) {

        settingsButton.onclick =
            function(event) {

                event.preventDefault();

                const startScreen =
                    get("startScreen");

                const settingsScreen =
                    get("settingsScreen");

                if (startScreen) {
                    startScreen.classList.add(
                        "hidden"
                    );
                }

                if (settingsScreen) {
                    settingsScreen.classList.remove(
                        "hidden"
                    );
                }
            };
    }

    // =========================================================
    // SETTINGS BACK
    // =========================================================

    const settingsBack =
        get("settingsBack");

    if (settingsBack) {

        settingsBack.onclick =
            function(event) {

                event.preventDefault();

                const startScreen =
                    get("startScreen");

                const settingsScreen =
                    get("settingsScreen");

                if (settingsScreen) {
                    settingsScreen.classList.add(
                        "hidden"
                    );
                }

                if (startScreen) {
                    startScreen.classList.remove(
                        "hidden"
                    );
                }
            };
    }

    // =========================================================
    // NEXT BUTTON
    // =========================================================

    const nextButton =
        get("nextButton");

    if (nextButton) {

        nextButton.onclick =
            function(event) {

                event.preventDefault();

                scenarioNumber++;

                startScenario();
            };
    }

    // =========================================================
    // SETTINGS CONTROLS
    // =========================================================

    const offsideButton =
        get("offsideButton");

    const ringsButton =
        get("ringsButton");

    const teamCount =
        get("teamCount");

    const opponentCount =
        get("opponentCount");

    const teamPlus =
        get("teamPlus");

    const teamMinus =
        get("teamMinus");

    const opponentPlus =
        get("opponentPlus");

    const opponentMinus =
        get("opponentMinus");

    // OFFSIDE

    if (offsideButton) {

        offsideButton.onclick =
            function(event) {

                event.preventDefault();

                settings.offside =
                    !settings.offside;

                offsideButton.textContent =
                    settings.offside
                        ? "ON"
                        : "OFF";
            };
    }

    // RINGS

    if (ringsButton) {

        ringsButton.onclick =
            function(event) {

                event.preventDefault();

                settings.offsideRings =
                    !settings.offsideRings;

                ringsButton.textContent =
                    settings.offsideRings
                        ? "ON"
                        : "OFF";
            };
    }

    // TEAMMATES +

    if (teamPlus) {

        teamPlus.onclick =
            function(event) {

                event.preventDefault();

                settings.teammates =
                    Math.min(
                        10,
                        settings.teammates + 1
                    );

                if (teamCount) {
                    teamCount.textContent =
                        settings.teammates;
                }
            };
    }

    // TEAMMATES -

    if (teamMinus) {

        teamMinus.onclick =
            function(event) {

                event.preventDefault();

                settings.teammates =
                    Math.max(
                        2,
                        settings.teammates - 1
                    );

                if (teamCount) {
                    teamCount.textContent =
                        settings.teammates;
                }
            };
    }

    // OPPONENTS +

    if (opponentPlus) {

        opponentPlus.onclick =
            function(event) {

                event.preventDefault();

                settings.opponents =
                    Math.min(
                        12,
                        settings.opponents + 1
                    );

                if (opponentCount) {
                    opponentCount.textContent =
                        settings.opponents;
                }
            };
    }

    // OPPONENTS -

    if (opponentMinus) {

        opponentMinus.onclick =
            function(event) {

                event.preventDefault();

                settings.opponents =
                    Math.max(
                        2,
                        settings.opponents - 1
                    );

                if (opponentCount) {
                    opponentCount.textContent =
                        settings.opponents;
                }
            };
    }

    // =========================================================
    // GAME LOOP
    // =========================================================

    function gameLoop() {

        if (gameState === "playing") {
            drawScene();
        }

        requestAnimationFrame(gameLoop);
    }

    gameLoop();

    console.log(
        "Football IQ ready — first-person pitch active."
    );
}
