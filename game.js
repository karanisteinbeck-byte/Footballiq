// ============================================================
// FOOTBALL IQ TRAINER — CLEAN GAME.JS
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

    // ========================================================
    // CANVAS
    // ========================================================

    const canvas = document.getElementById("gameCanvas");

    if (!canvas) {
        console.error("gameCanvas not found");
        return;
    }

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

    let scenarioActive = false;
    let decisionStartTime = 0;


    // ========================================================
    // CANVAS SIZE
    // ========================================================

    function resizeCanvas() {

        const dpr = window.devicePixelRatio || 1;

        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;

        canvas.style.width =
            window.innerWidth + "px";

        canvas.style.height =
            window.innerHeight + "px";

        ctx.setTransform(
            dpr,
            0,
            0,
            dpr,
            0,
            0
        );
    }

    window.addEventListener(
        "resize",
        resizeCanvas
    );

    resizeCanvas();


    // ========================================================
    // PITCH
    // ========================================================

    const pitch = {
        width: 68,
        length: 105
    };


    // ========================================================
    // CAMERA
    // ========================================================

    const camera = {
        x: 0,
        y: 0
    };


    // ========================================================
    // 3D PROJECTION
    // ========================================================

    function project3D(x, y) {

        const w = window.innerWidth;
        const h = window.innerHeight;

        const relativeX = x - camera.x;
        const relativeY = y - camera.y;

        if (relativeY < 1) {
            return null;
        }

        const horizon = h * 0.25;

        const perspective =
            850 / relativeY;

        const screenX =
            w / 2 +
            relativeX * perspective;

        const screenY =
            horizon +
            perspective * 35;

        return {
            x: screenX,
            y: screenY,
            scale: perspective
        };
    }


    // ========================================================
    // PITCH DRAWING
    // ========================================================

    function drawPitch() {

        const w = window.innerWidth;
        const h = window.innerHeight;

        // Sky
        ctx.fillStyle = "#79b9dc";
        ctx.fillRect(
            0,
            0,
            w,
            h
        );


        // Stadium
        ctx.fillStyle = "#41464a";

        ctx.fillRect(
            0,
            h * 0.20,
            w,
            h * 0.28
        );


        // Pitch

        const horizonY = h * 0.25;

        const bottomY = h;

        const topWidth = w * 0.28;

        const bottomWidth = w * 1.6;


        ctx.beginPath();

        ctx.moveTo(
            w / 2 - topWidth / 2,
            horizonY
        );

        ctx.lineTo(
            w / 2 + topWidth / 2,
            horizonY
        );

        ctx.lineTo(
            w / 2 + bottomWidth / 2,
            bottomY
        );

        ctx.lineTo(
            w / 2 - bottomWidth / 2,
            bottomY
        );

        ctx.closePath();


        const grass =
            ctx.createLinearGradient(
                0,
                horizonY,
                0,
                bottomY
            );

        grass.addColorStop(
            0,
            "#2b8546"
        );

        grass.addColorStop(
            1,
            "#176633"
        );

        ctx.fillStyle = grass;

        ctx.fill();


        // Pitch stripes

        for (let i = 0; i < 12; i++) {

            if (i % 2 !== 0) continue;

            const p1 = i / 12;

            const p2 = (i + 1) / 12;

            const y1 =
                horizonY +
                (bottomY - horizonY) * p1;

            const y2 =
                horizonY +
                (bottomY - horizonY) * p2;

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


        // Pitch lines

        drawPitchLine(0.22);

        drawPitchLine(0.50);

        drawPitchLine(0.76);


        // Sidelines

        ctx.strokeStyle = "white";

        ctx.lineWidth = 3;

        ctx.beginPath();

        ctx.moveTo(
            w / 2 - topWidth / 2,
            horizonY
        );

        ctx.lineTo(
            w / 2 - bottomWidth / 2,
            bottomY
        );

        ctx.moveTo(
            w / 2 + topWidth / 2,
            horizonY
        );

        ctx.lineTo(
            w / 2 + bottomWidth / 2,
            bottomY
        );

        ctx.stroke();
    }


    function drawPitchLine(position) {

        const w = window.innerWidth;
        const h = window.innerHeight;

        const horizonY = h * 0.25;

        const bottomY = h;

        const topWidth = w * 0.28;

        const bottomWidth = w * 1.6;


        const y =
            horizonY +
            (bottomY - horizonY) *
            position;


        const width =
            topWidth +
            (bottomWidth - topWidth) *
            position;


        ctx.strokeStyle =
            "rgba(255,255,255,0.85)";

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
    // PLAYER
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
            team,
            number,

            offside: false,

            screenX: 0,
            screenY: 0,
            hitRadius: 25
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
    // DISTANCE
    // ========================================================

    function distance(a, b) {

        const dx = a.x - b.x;

        const dy = a.y - b.y;

        return Math.sqrt(
            dx * dx +
            dy * dy
        );
    }


    // ========================================================
    // CREATE USER
    // ========================================================

    function createUser() {

        player = createPlayer(
            0,
            8,
            "blue",
            10
        );

        player.isUser = true;
    }


    // ========================================================
    // GENERATE TEAMMATES
    // ========================================================

    function generateTeammates() {

        teammates = [];

        for (
            let i = 0;
            i < settings.teammates;
            i++
        ) {

            let x;
            let y;

            let valid = false;

            let attempts = 0;


            while (
                !valid &&
                attempts < 100
            ) {

                attempts++;

                // Players are spread throughout
                // the same area as opponents.

                x = random(-25, 25);

                y = random(15, 55);

                valid = true;


                for (
                    const p of teammates
                ) {

                    if (
                        Math.abs(x - p.x) < 5 &&
                        Math.abs(y - p.y) < 5
                    ) {

                        valid = false;

                        break;
                    }
                }
            }


            teammates.push(
                createPlayer(
                    x,
                    y,
                    "blue",
                    i + 1
                )
            );
        }
    }


    // ========================================================
    // GENERATE OPPONENTS
    // ========================================================

    function generateOpponents() {

        opponents = [];

        for (
            let i = 0;
            i < settings.opponents;
            i++
        ) {

            let x;
            let y;

            let valid = false;

            let attempts = 0;


            while (
                !valid &&
                attempts < 100
            ) {

                attempts++;

                // IMPORTANT:
                // Opponents are NOT put in a separate area.
                // They are mixed with teammates.

                x = random(-28, 28);

                y = random(12, 58);

                valid = true;


                // Don't put opponents directly
                // on top of each other.

                for (
                    const p of opponents
                ) {

                    if (
                        Math.abs(x - p.x) < 4 &&
                        Math.abs(y - p.y) < 4
                    ) {

                        valid = false;

                        break;
                    }
                }
            }


            opponents.push(
                createPlayer(
                    x,
                    y,
                    "red",
                    i + 1
                )
            );
        }
    }


    // ========================================================
    // BALL
    // ========================================================

    function createBall() {

        ball = {
            x: 0,
            y: 10
        };
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


        // Sort defenders by Y.
        // Highest Y = furthest forward.

        const defenders =
            [...opponents].sort(
                (a, b) =>
                    b.y - a.y
            );


        if (
            defenders.length < 2
        ) {
            return;
        }


        const secondLast =
            defenders[1];


        for (
            const teammate
            of teammates
        ) {

            const beyondBall =
                teammate.y > ball.y;


            const beyondDefender =
                teammate.y >
                secondLast.y;


            teammate.offside =
                beyondBall &&
                beyondDefender;
        }


        // ----------------------------------------------------
        // GUARANTEE LEGAL OPTIONS
        // ----------------------------------------------------

        let legalPlayers =
            teammates.filter(
                p => !p.offside
            );


        // If random generation somehow makes
        // everyone offside, move two players
        // back into a legal position.

        if (
            legalPlayers.length < 2
        ) {

            const sorted =
                [...teammates].sort(
                    (a, b) =>
                        a.y - b.y
                );


            sorted[0].y =
                Math.min(
                    sorted[0].y,
                    ball.y - 2
                );


            sorted[1].y =
                Math.min(
                    sorted[1].y,
                    ball.y - 1
                );


            calculateOffside();
        }
    }


    // ========================================================
    // GENERATE SCENARIO
    // ========================================================

    function generateScenario() {

        createUser();

        createBall();

        generateTeammates();

        generateOpponents();

        calculateOffside();

        scenarioActive = true;

        decisionStartTime =
            performance.now();
    }


    // ========================================================
    // DRAW PLAYER
    // ========================================================

    function drawPlayer(p) {

        const projected =
            project3D(
                p.x,
                p.y
            );


        if (!projected) {
            return;
        }


        const scale =
            Math.max(
                0.35,
                Math.min(
                    projected.scale,
                    3
                )
            );


        const x =
            projected.x;

        const y =
            projected.y;


        const size =
            Math.max(
                12,
                12 * scale
            );


        p.screenX = x;

        p.screenY = y;

        p.hitRadius =
            Math.max(
                25,
                size * 1.8
            );


        // Offside ring

        if (
            p.offside &&
            settings.offsideRings
        ) {

            ctx.beginPath();

            ctx.arc(
                x,
                y,
                size * 1.5,
                0,
                Math.PI * 2
            );

            ctx.strokeStyle =
                "#ff9d22";

            ctx.lineWidth = 3;

            ctx.stroke();
        }


        // ----------------------------------------------------
        // OLD BLOCKY STYLE
        // ----------------------------------------------------

        const color =
            p.team === "blue"
                ? "#287cff"
                : "#e83f3f";


        // Body

        ctx.fillStyle = color;

        ctx.fillRect(
            x - size * 0.45,
            y - size,
            size * 0.9,
            size * 1.15
        );


        // Head

        ctx.fillStyle =
            "#d69a72";

        ctx.fillRect(
            x - size * 0.35,
            y - size * 1.55,
            size * 0.7,
            size * 0.55
        );


        // Legs

        ctx.fillStyle =
            "#222";

        ctx.fillRect(
            x - size * 0.35,
            y + size * 0.1,
            size * 0.25,
            size * 0.65
        );

        ctx.fillRect(
            x + size * 0.10,
            y + size * 0.1,
            size * 0.25,
            size * 0.65
        );


        // Number

        ctx.fillStyle = "white";

        ctx.font =
            `bold ${Math.max(
                9,
                size * 0.65
            )}px Arial`;

        ctx.textAlign = "center";

        ctx.fillText(
            p.number,
            x,
            y - size * 0.15
        );
    }


    // ========================================================
    // DRAW BALL
    // ========================================================

    function drawBall() {

        const projected =
            project3D(
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
                    projected.scale * 0.6,
                    10
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

        ctx.stroke();
    }


    // ========================================================
    // DRAW SCENE
    // ========================================================

    function drawScene() {

        ctx.clearRect(
            0,
            0,
            window.innerWidth,
            window.innerHeight
        );


        drawPitch();


        // Draw players from farthest
        // to closest.

        const players = [
            ...teammates,
            ...opponents
        ].sort(
            (a, b) =>
                b.y - a.y
        );


        players.forEach(
            drawPlayer
        );


        drawBall();
    }


    // ========================================================
    // FIND CLICKED PLAYER
    // ========================================================

    function findClickedPlayer(
        x,
        y
    ) {

        let closest = null;

        let closestDistance =
            Infinity;


        for (
            const p of teammates
        ) {

            const dx =
                x - p.screenX;

            const dy =
                y - p.screenY;


            const d =
                Math.sqrt(
                    dx * dx +
                    dy * dy
                );


            if (
                d < p.hitRadius &&
                d < closestDistance
            ) {

                closest = p;

                closestDistance = d;
            }
        }


        return closest;
    }


    // ========================================================
    // INPUT
    // ========================================================

    canvas.addEventListener(
        "pointerdown",
        event => {

            if (
                gameState !== "playing"
            ) {
                return;
            }


            const target =
                findClickedPlayer(
                    event.clientX,
                    event.clientY
                );


            if (target) {

                makePass(target);
            }
        }
    );


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


        // Offside

        if (
            settings.offside &&
            target.offside
        ) {

            score -= 70;
        }


        // Distance

        const d =
            distance(
                player,
                target
            );


        if (d > 30) {
            score -= 20;
        } else if (d > 22) {
            score -= 10;
        }


        // Pressure

        let closestOpponent =
            Infinity;


        opponents.forEach(
            opponent => {

                const od =
                    distance(
                        target,
                        opponent
                    );

                closestOpponent =
                    Math.min(
                        closestOpponent,
                        od
                    );
            }
        );


        if (
            closestOpponent < 5
        ) {

            score -= 35;

        } else if (
            closestOpponent < 8
        ) {

            score -= 15;
        }


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


        const overall =
            document.getElementById(
                "overallScore"
            );

        const decision =
            document.getElementById(
                "decisionScore"
            );

        const timing =
            document.getElementById(
                "timingScore"
            );

        const time =
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


        if (overall)
            overall.textContent =
                score;


        if (decision)
            decision.textContent =
                score;


        if (timing)
            timing.textContent =
                Math.max(
                    0,
                    Math.round(
                        100 -
                        seconds * 15
                    )
                );


        if (time)
            time.textContent =
                seconds.toFixed(2) + "s";


        if (
            settings.offside &&
            target.offside
        ) {

            if (message)
                message.textContent =
                    "OFFSIDE";


            if (analysis)
                analysis.textContent =
                    "Your teammate was offside when the pass was made.";

        } else if (
            score >= 90
        ) {

            if (message)
                message.textContent =
                    "EXCELLENT DECISION";


            if (analysis)
                analysis.textContent =
                    "Excellent passing option.";

        } else if (
            score >= 70
        ) {

            if (message)
                message.textContent =
                    "GOOD DECISION";


            if (analysis)
                analysis.textContent =
                    "A solid passing option.";

        } else {

            if (message)
                message.textContent =
                    "COULD BE BETTER";


            if (analysis)
                analysis.textContent =
                    "Look for a safer passing lane.";
        }


        const resultScreen =
            document.getElementById(
                "resultScreen"
            );


        if (resultScreen) {

            resultScreen.classList.remove(
                "hidden"
            );
        }
    }


    // ========================================================
    // START GAME
    // ========================================================

    function startGame() {

        gameState = "playing";

        scenarioNumber =
            Math.max(
                1,
                scenarioNumber
            );


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


        if (startScreen)
            startScreen.classList.add(
                "hidden"
            );


        if (settingsScreen)
            settingsScreen.classList.add(
                "hidden"
            );


        if (resultScreen)
            resultScreen.classList.add(
                "hidden"
            );


        const scenarioText =
            document.getElementById(
                "scenarioNumber"
            );


        if (scenarioText)
            scenarioText.textContent =
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

        startButton.addEventListener(
            "click",
            event => {

                event.preventDefault();

                startGame();
            }
        );
    }


    // SETTINGS

    if (settingsButton) {

        settingsButton.addEventListener(
            "click",
            event => {

                event.preventDefault();

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
            }
        );
    }


    // BACK

    if (settingsBack) {

        settingsBack.addEventListener(
            "click",
            event => {

                event.preventDefault();

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
            }
        );
    }


    // NEXT SCENARIO

    if (nextButton) {

        nextButton.addEventListener(
            "click",
            event => {

                event.preventDefault();

                scenarioNumber++;

                startGame();
            }
        );
    }


    // ========================================================
    // SETTINGS CONTROLS
    // ========================================================

    const offsideButton =
        document.getElementById(
            "offsideButton"
        );

    const ringsButton =
        document.getElementById(
            "ringsButton"
        );

    const teamCount =
        document.getElementById(
            "teamCount"
        );

    const opponentCount =
        document.getElementById(
            "opponentCount"
        );


    const teamPlus =
        document.getElementById(
            "teamPlus"
        );

    const teamMinus =
        document.getElementById(
            "teamMinus"
        );

    const opponentPlus =
        document.getElementById(
            "opponentPlus"
        );

    const opponentMinus =
        document.getElementById(
            "opponentMinus"
        );


    if (offsideButton) {

        offsideButton.addEventListener(
            "click",
            () => {

                settings.offside =
                    !settings.offside;

                offsideButton.textContent =
                    settings.offside
                        ? "ON"
                        : "OFF";
            }
        );
    }


    if (ringsButton) {

        ringsButton.addEventListener(
            "click",
            () => {

                settings.offsideRings =
                    !settings.offsideRings;

                ringsButton.textContent =
                    settings.offsideRings
                        ? "ON"
                        : "OFF";
            }
        );
    }


    if (teamPlus) {

        teamPlus.addEventListener(
            "click",
            () => {

                settings.teammates =
                    Math.min(
                        10,
                        settings.teammates + 1
                    );

                if (teamCount)
                    teamCount.textContent =
                        settings.teammates;
            }
        );
    }


    if (teamMinus) {

        teamMinus.addEventListener(
            "click",
            () => {

                settings.teammates =
                    Math.max(
                        2,
                        settings.teammates - 1
                    );

                if (teamCount)
                    teamCount.textContent =
                        settings.teammates;
            }
        );
    }


    if (opponentPlus) {

        opponentPlus.addEventListener(
            "click",
            () => {

                settings.opponents =
                    Math.min(
                        12,
                        settings.opponents + 1
                    );

                if (opponentCount)
                    opponentCount.textContent =
                        settings.opponents;
            }
        );
    }


    if (opponentMinus) {

        opponentMinus.addEventListener(
            "click",
            () => {

                settings.opponents =
                    Math.max(
                        2,
                        settings.opponents - 1
                    );

                if (opponentCount)
                    opponentCount.textContent =
                        settings.opponents;
            }
        );
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


    gameLoop();


    // ========================================================
    // DEBUG
    // ========================================================

    console.log(
        "Football IQ game.js loaded successfully."
    );

});
