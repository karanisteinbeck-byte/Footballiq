// ============================================================
// FOOTBALL IQ TRAINER
// Clean game.js
// ============================================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");


// ============================================================
// SETTINGS
// ============================================================

const settings = {
    offside: true,
    teammates: 6,
    opponents: 7,
    offsideRings: true
};


// ============================================================
// GAME STATE
// ============================================================

let gameState = "menu";
let scenarioNumber = 1;

let teammates = [];
let opponents = [];

let player = null;
let ball = null;

let selectedPlayer = null;

let decisionStartTime = 0;
let scenarioActive = false;


// ============================================================
// CANVAS
// ============================================================

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


// ============================================================
// PERSPECTIVE
// ============================================================

const pitch = {
    width: 105,
    length: 68
};

const camera = {
    x: 0,
    y: 0,
    height: 1.7
};


function project3D(x, y, z = 0) {

    const w = window.innerWidth;
    const h = window.innerHeight;

    const relativeX = x - camera.x;
    const relativeY = y - camera.y;

    if (relativeY <= 0.5) {
        return null;
    }

    const scale = (h * 0.85) / relativeY;

    const screenX =
        w / 2 + relativeX * scale;

    const horizon =
        h * 0.30;

    const screenY =
        horizon +
        (camera.height - z) * scale;

    return {
        x: screenX,
        y: screenY,
        scale: scale
    };
}


// ============================================================
// PITCH
// ============================================================

function drawPitch() {

    const w = window.innerWidth;
    const h = window.innerHeight;

    const horizonY = h * 0.30;
    const bottomY = h;

    const topWidth = w * 0.18;
    const bottomWidth = w * 1.35;


    // SKY

    const sky =
        ctx.createLinearGradient(
            0,
            0,
            0,
            horizonY
        );

    sky.addColorStop(0, "#6caed3");
    sky.addColorStop(1, "#c5e2eb");

    ctx.fillStyle = sky;

    ctx.fillRect(
        0,
        0,
        w,
        h
    );


    // STADIUM

    ctx.fillStyle = "#3e4449";

    ctx.fillRect(
        0,
        horizonY,
        w,
        h * 0.25
    );


    // STANDS

    for (let i = 0; i < 14; i++) {

        const standX = i * w / 14;

        ctx.fillStyle =
            i % 2 === 0
                ? "#555b60"
                : "#474d52";

        ctx.fillRect(
            standX,
            horizonY + 15,
            w / 15,
            h * 0.17
        );
    }


    // PITCH

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

    grass.addColorStop(0, "#287b43");
    grass.addColorStop(0.5, "#218044");
    grass.addColorStop(1, "#155f31");

    ctx.fillStyle = grass;

    ctx.fill();


    // GRASS STRIPES

    for (let i = 0; i < 16; i++) {

        const p1 = i / 16;
        const p2 = (i + 1) / 16;

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

        if (i % 2 === 0) {

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
    }


    // SIDELINES

    ctx.strokeStyle =
        "rgba(255,255,255,0.92)";

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


    // FIELD LINES

    drawHorizontalPitchLine(0.20);
    drawHorizontalPitchLine(0.43);
    drawHorizontalPitchLine(0.68);
}


// ============================================================
// FIELD LINES
// ============================================================

function drawHorizontalPitchLine(position) {

    const w = window.innerWidth;
    const h = window.innerHeight;

    const horizonY = h * 0.30;
    const bottomY = h;

    const topWidth = w * 0.18;
    const bottomWidth = w * 1.35;

    const y =
        horizonY +
        (bottomY - horizonY) * position;

    const width =
        topWidth +
        (bottomWidth - topWidth) * position;

    ctx.strokeStyle =
        "rgba(255,255,255,0.82)";

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


// ============================================================
// PLAYER CREATION
// ============================================================

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

        selectable: team === "blue",

        offside: false,

        screenX: 0,
        screenY: 0,
        screenRadius: 0
    };
}


// ============================================================
// RANDOM
// ============================================================

function randomRange(min, max) {

    return Math.random() *
        (max - min) +
        min;
}


// ============================================================
// USER PLAYER
// ============================================================

function createUserPlayer() {

    player =
        createPlayer(
            0,
            3,
            "blue",
            10
        );

    player.isUser = true;
    player.selectable = false;
}


// ============================================================
// TEAMMATES
// ============================================================

function generateTeammates() {

    teammates = [];

    for (
        let i = 0;
        i < settings.teammates;
        i++
    ) {

        teammates.push(
            createPlayer(
                randomRange(-24, 24),
                randomRange(10, 58),
                "blue",
                i + 1
            )
        );
    }
}


// ============================================================
// OPPONENTS
// ============================================================

function generateOpponents() {

    opponents = [];

    for (
        let i = 0;
        i < settings.opponents;
        i++
    ) {

        opponents.push(
            createPlayer(
                randomRange(-28, 28),
                randomRange(15, 52),
                "red",
                i + 1
            )
        );
    }
}


// ============================================================
// BALL
// ============================================================

function createBall() {

    ball = {

        x: 0,
        y: 5,
        z: 0.15,
        radius: 0.35
    };
}


// ============================================================
// DISTANCE
// ============================================================

function distanceBetween(a, b) {

    const dx = a.x - b.x;
    const dy = a.y - b.y;

    return Math.sqrt(
        dx * dx +
        dy * dy
    );
}


// ============================================================
// SECOND LAST DEFENDER
// ============================================================

function getSecondLastDefender() {

    if (opponents.length < 2) {
        return null;
    }

    const sorted =
        [...opponents].sort(
            (a, b) => b.y - a.y
        );

    return sorted[1];
}


// ============================================================
// OFFSIDE
// ============================================================

function calculateOffside() {

    if (!settings.offside) {

        teammates.forEach(
            p => p.offside = false
        );

        return;
    }

    const defender =
        getSecondLastDefender();

    if (!defender) {
        return;
    }

    teammates.forEach(
        teammate => {

            teammate.offside =
                teammate.y > ball.y &&
                teammate.y > defender.y;
        }
    );
}


// ============================================================
// GENERATE SCENARIO
// ============================================================

function generateScenario() {

    createUserPlayer();

    createBall();

    generateTeammates();

    generateOpponents();

    calculateOffside();

    selectedPlayer = null;

    decisionStartTime =
        performance.now();

    scenarioActive = true;
}


// ============================================================
// BLOCKY PLAYER
// ============================================================

function drawPlayer(p) {

    const projected =
        project3D(
            p.x,
            p.y,
            p.z
        );

    if (!projected) {
        return;
    }


    const scale =
        Math.max(
            0.15,
            Math.min(
                projected.scale,
                3
            )
        );


    const x = projected.x;
    const y = projected.y;


    // Larger touch target

    p.screenX = x;
    p.screenY = y;
    p.screenRadius =
        Math.max(
            18,
            9 * scale
        );


    // -------------------------
    // SHADOW
    // -------------------------

    ctx.beginPath();

    ctx.ellipse(
        x,
        y + 3,
        9 * scale,
        4 * scale,
        0,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "rgba(0,0,0,0.35)";

    ctx.fill();


    // -------------------------
    // OFFSIDE RING
    // -------------------------

    if (
        p.offside &&
        settings.offsideRings
    ) {

        ctx.beginPath();

        ctx.arc(
            x,
            y - 10 * scale,
            18 * scale,
            0,
            Math.PI * 2
        );

        ctx.strokeStyle =
            "#ff9b24";

        ctx.lineWidth =
            3 * scale;

        ctx.stroke();
    }


    // -------------------------
    // BLOCKY BODY
    // -------------------------

    const bodyWidth =
        12 * scale;

    const bodyHeight =
        18 * scale;

    const bodyY =
        y - bodyHeight;


    ctx.fillStyle =
        p.team === "blue"
            ? "#1677e8"
            : "#e53935";


    ctx.fillRect(
        x - bodyWidth / 2,
        bodyY,
        bodyWidth,
        bodyHeight
    );


    // -------------------------
    // HEAD
    // -------------------------

    const headSize =
        10 * scale;


    ctx.fillStyle =
        "#d99a72";


    ctx.fillRect(
        x - headSize / 2,
        bodyY - headSize,
        headSize,
        headSize
    );


    // -------------------------
    // LEGS
    // -------------------------

    ctx.fillStyle =
        "#20242a";


    ctx.fillRect(
        x - 6 * scale,
        y,
        5 * scale,
        10 * scale
    );


    ctx.fillRect(
        x + 1 * scale,
        y,
        5 * scale,
        10 * scale
    );


    // -------------------------
    // ARMS
    // -------------------------

    ctx.fillStyle =
        p.team === "blue"
            ? "#1677e8"
            : "#e53935";


    ctx.fillRect(
        x - bodyWidth / 2 - 4 * scale,
        bodyY + 2 * scale,
        4 * scale,
        12 * scale
    );


    ctx.fillRect(
        x + bodyWidth / 2,
        bodyY + 2 * scale,
        4 * scale,
        12 * scale
    );


    // -------------------------
    // SELECTABLE GLOW
    // -------------------------

    if (
        p.selectable &&
        !p.offside
    ) {

        ctx.beginPath();

        ctx.arc(
            x,
            bodyY + bodyHeight / 2,
            19 * scale,
            0,
            Math.PI * 2
        );

        ctx.strokeStyle =
            "rgba(255,255,255,0.45)";

        ctx.lineWidth = 2;

        ctx.stroke();
    }


    // -------------------------
    // NUMBER
    // -------------------------

    if (scale > 0.45) {

        ctx.fillStyle = "white";

        ctx.font =
            `bold ${Math.max(
                8,
                6 * scale
            )}px Arial`;

        ctx.textAlign = "center";

        ctx.fillText(
            p.number,
            x,
            bodyY +
            bodyHeight * 0.65
        );
    }
}


// ============================================================
// BALL
// ============================================================

function drawBall() {

    const projected =
        project3D(
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
                projected.scale * 0.65,
                16
            )
        );


    ctx.beginPath();

    ctx.ellipse(
        projected.x,
        projected.y + 4,
        radius * 1.3,
        radius * 0.45,
        0,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "rgba(0,0,0,0.3)";

    ctx.fill();


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

    ctx.lineWidth = 1;

    ctx.stroke();
}


// ============================================================
// DRAW PLAYERS
// ============================================================

function drawPlayers() {

    const allPlayers = [
        ...opponents,
        ...teammates
    ];

    allPlayers.sort(
        (a, b) =>
            b.y - a.y
    );

    allPlayers.forEach(
        drawPlayer
    );
}


// ============================================================
// DRAW SCENE
// ============================================================

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
}


// ============================================================
// START SCENARIO
// ============================================================

function startScenario() {

    gameState = "playing";

    generateScenario();


    const scenarioText =
        document.getElementById(
            "scenarioNumber"
        );

    if (scenarioText) {

        scenarioText.textContent =
            `SCENARIO ${scenarioNumber}`;
    }


    const instruction =
        document.getElementById(
            "instruction"
        );

    if (instruction) {

        instruction.textContent =
            "TAP A TEAMMATE TO PASS";
    }


    hide("startScreen");
    hide("settingsScreen");
    hide("resultScreen");
}


// ============================================================
// HIDE / SHOW
// ============================================================

function hide(id) {

    const element =
        document.getElementById(id);

    if (element) {
        element.classList.add("hidden");
    }
}


function show(id) {

    const element =
        document.getElementById(id);

    if (element) {
        element.classList.remove("hidden");
    }
}


// ============================================================
// PASS QUALITY
// ============================================================

function calculatePassQuality(target) {

    let score = 100;

    const distance =
        distanceBetween(
            player,
            target
        );


    if (distance > 35) {
        score -= 15;
    }
    else if (distance > 25) {
        score -= 8;
    }


    let closestOpponent =
        Infinity;


    opponents.forEach(
        opponent => {

            const d =
                distanceBetween(
                    target,
                    opponent
                );

            if (
                d < closestOpponent
            ) {
                closestOpponent = d;
            }
        }
    );


    if (closestOpponent < 5) {
        score -= 40;
    }
    else if (closestOpponent < 8) {
        score -= 20;
    }
    else if (closestOpponent < 12) {
        score -= 8;
    }


    if (
        settings.offside &&
        target.offside
    ) {
        score -= 80;
    }


    return Math.max(
        0,
        Math.round(score)
    );
}


// ============================================================
// TIMING
// ============================================================

function calculateTimingScore(seconds) {

    if (seconds <= 0.8) return 100;
    if (seconds <= 1.2) return 95;
    if (seconds <= 1.6) return 88;
    if (seconds <= 2.0) return 80;
    if (seconds <= 2.5) return 70;
    if (seconds <= 3.0) return 60;
    if (seconds <= 4.0) return 45;

    return 30;
}


// ============================================================
// PASS
// ============================================================

function makePass(target) {

    if (!scenarioActive) {
        return;
    }

    scenarioActive = false;

    selectedPlayer = target;


    const seconds =
        (
            performance.now() -
            decisionStartTime
        ) / 1000;


    const decisionScore =
        calculatePassQuality(
            target
        );


    const timingScore =
        calculateTimingScore(
            seconds
        );


    const overall =
        Math.round(
            decisionScore * 0.7 +
            timingScore * 0.3
        );


    showResult(
        overall,
        decisionScore,
        timingScore,
        seconds,
        target
    );
}


// ============================================================
// RESULT
// ============================================================

function showResult(
    overall,
    decisionScore,
    timingScore,
    seconds,
    target
) {

    gameState = "result";


    setText(
        "overallScore",
        overall
    );

    setText(
        "decisionScore",
        decisionScore
    );

    setText(
        "timingScore",
        timingScore
    );

    setText(
        "decisionTime",
        seconds.toFixed(2) + "s"
    );


    if (
        settings.offside &&
        target.offside
    ) {

        setText(
            "resultMessage",
            "OFFSIDE!"
        );

        setText(
            "analysis",
            "Your teammate was beyond the second-last defender when the pass was made."
        );

    }
    else if (overall >= 90) {

        setText(
            "resultMessage",
            "EXCELLENT DECISION"
        );

        setText(
            "analysis",
            "Excellent awareness, passing choice and reaction speed."
        );

    }
    else if (overall >= 75) {

        setText(
            "resultMessage",
            "GOOD DECISION"
        );

        setText(
            "analysis",
            "A good passing option, although there may have been a better choice."
        );

    }
    else if (overall >= 50) {

        setText(
            "resultMessage",
            "COULD BE BETTER"
        );

        setText(
            "analysis",
            "The pass was possible, but pressure or positioning made it less effective."
        );

    }
    else {

        setText(
            "resultMessage",
            "POOR DECISION"
        );

        setText(
            "analysis",
            "Look for safer passing lanes and check the defensive line before passing."
        );
    }


    show("resultScreen");
}


function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}


// ============================================================
// FIND TEAMMATE
// ============================================================

function findClickedTeammate(
    mouseX,
    mouseY
) {

    let closest = null;
    let closestDistance = Infinity;


    teammates.forEach(
        teammate => {

            if (!teammate.selectable) {
                return;
            }


            const dx =
                mouseX -
                teammate.screenX;


            const dy =
                mouseY -
                (
                    teammate.screenY -
                    10
                );


            const distance =
                Math.sqrt(
                    dx * dx +
                    dy * dy
                );


            const hitRadius =
                Math.max(
                    30,
                    teammate.screenRadius * 2.5
                );


            if (
                distance < hitRadius &&
                distance < closestDistance
            ) {

                closest =
                    teammate;

                closestDistance =
                    distance;
            }
        }
    );


    return closest;
}


// ============================================================
// INPUT
// ============================================================

canvas.addEventListener(
    "pointerdown",
    function(event) {

        handleInput(
            event.clientX,
            event.clientY
        );
    }
);


function handleInput(
    x,
    y
) {

    if (gameState !== "playing") {
        return;
    }


    const target =
        findClickedTeammate(
            x,
            y
        );


    if (target) {
        makePass(target);
    }
}


// ============================================================
// SETTINGS
// ============================================================

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


if (offsideButton) {

    offsideButton.addEventListener(
        "click",
        function() {

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
        function() {

            settings.offsideRings =
                !settings.offsideRings;

            ringsButton.textContent =
                settings.offsideRings
                    ? "ON"
                    : "OFF";
        }
    );
}


// TEAMMATES +

const teamPlus =
    document.getElementById(
        "teamPlus"
    );

if (teamPlus) {

    teamPlus.addEventListener(
        "click",
        function() {

            settings.teammates =
                Math.min(
                    10,
                    settings.teammates + 1
                );

            setText(
                "teamCount",
                settings.teammates
            );
        }
    );
}


// TEAMMATES -

const teamMinus =
    document.getElementById(
        "teamMinus"
    );

if (teamMinus) {

    teamMinus.addEventListener(
        "click",
        function() {

            settings.teammates =
                Math.max(
                    2,
                    settings.teammates - 1
                );

            setText(
                "teamCount",
                settings.teammates
            );
        }
    );
}


// OPPONENTS +

const opponentPlus =
    document.getElementById(
        "opponentPlus"
    );

if (opponentPlus) {

    opponentPlus.addEventListener(
        "click",
        function() {

            settings.opponents =
                Math.min(
                    12,
                    settings.opponents + 1
                );

            setText(
                "opponentCount",
                settings.opponents
            );
        }
    );
}


// OPPONENTS -

const opponentMinus =
    document.getElementById(
        "opponentMinus"
    );

if (opponentMinus) {

    opponentMinus.addEventListener(
        "click",
        function() {

            settings.opponents =
                Math.max(
                    2,
                    settings.opponents - 1
                );

            setText(
                "opponentCount",
                settings.opponents
            );
        }
    );
}


// ============================================================
// START BUTTON
// ============================================================

const startButton =
    document.getElementById(
        "startButton"
    );

if (startButton) {

    startButton.addEventListener(
        "click",
        function() {

            startScenario();
        }
    );
}


// ============================================================
// SETTINGS BUTTON
// ============================================================

const settingsButton =
    document.getElementById(
        "settingsButton"
    );

if (settingsButton) {

    settingsButton.addEventListener(
        "click",
        function() {

            hide("startScreen");

            show("settingsScreen");
        }
    );
}


// ============================================================
// SETTINGS BACK
// ============================================================

const settingsBack =
    document.getElementById(
        "settingsBack"
    );

if (settingsBack) {

    settingsBack.addEventListener(
        "click",
        function() {

            hide("settingsScreen");

            show("startScreen");
        }
    );
}


// ============================================================
// NEXT SCENARIO
// ============================================================

const nextButton =
    document.getElementById(
        "nextButton"
    );

if (nextButton) {

    nextButton.addEventListener(
        "click",
        function() {

            scenarioNumber++;

            startScenario();
        }
    );
}


// ============================================================
// GAME LOOP
// ============================================================

function gameLoop() {

    if (gameState === "playing") {

        drawScene();
    }

    requestAnimationFrame(
        gameLoop
    );
}


// ============================================================
// START
// ============================================================

gameLoop();

console.log(
    "Football IQ game.js loaded successfully."
);
