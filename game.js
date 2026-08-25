// ============================================================
// FOOTBALL IQ — GAME.JS
// Close-up football decision trainer
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

let player = null;
let ball = null;

let teammates = [];
let opponents = [];

let scenarioActive = false;
let decisionStartTime = 0;


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
// FIELD
// ============================================================

const FIELD_WIDTH = 60;
const FIELD_HEIGHT = 70;


// ============================================================
// PLAYER OBJECT
// ============================================================

function createPlayer(x, y, team, number) {

    return {
        x,
        y,
        team,
        number,

        offside: false,

        selectable: team === "blue",

        screenX: 0,
        screenY: 0,
        hitRadius: 35
    };
}


// ============================================================
// CREATE USER
// ============================================================

function createUser() {

    player = createPlayer(
        0,
        0,
        "blue",
        10
    );

    player.isUser = true;
    player.selectable = false;
}


// ============================================================
// RANDOM
// ============================================================

function random(min, max) {
    return Math.random() * (max - min) + min;
}


// ============================================================
// GENERATE TEAMMATES
// ============================================================

function generateTeammates() {

    teammates = [];

    /*
     * These positions are intentionally close
     * to the user.
     *
     * The user is always at:
     *
     *              O
     *
     * Teammates appear around them.
     */

    const positions = [
        [-14, -10],
        [ 14, -8],

        [-18,  3],
        [ 18,  5],

        [-10, 15],
        [ 11, 18],

        [-22, 12],
        [ 22, 14]
    ];


    for (
        let i = 0;
        i < settings.teammates;
        i++
    ) {

        const p = positions[i];

        teammates.push(
            createPlayer(
                p[0] + random(-2, 2),
                p[1] + random(-2, 2),
                "blue",
                i + 1
            )
        );
    }
}


// ============================================================
// GENERATE OPPONENTS
// ============================================================

function generateOpponents() {

    opponents = [];

    /*
     * Defenders are also close.
     *
     * They create pressure around the
     * player instead of appearing miles away.
     */

    const positions = [
        [-8,  8],
        [ 8,  9],

        [-16, 16],
        [ 16, 17],

        [-5, 24],
        [ 7, 25],

        [-20, 25],

        [20, 26],

        [0, 32],
        [-13, 31],
        [14, 32],
        [0, 40]
    ];


    for (
        let i = 0;
        i < settings.opponents;
        i++
    ) {

        const p = positions[i];

        opponents.push(
            createPlayer(
                p[0] + random(-2, 2),
                p[1] + random(-2, 2),
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
        y: 2
    };
}


// ============================================================
// OFFSIDE
// ============================================================

function calculateOffside() {

    teammates.forEach(
        teammate => {
            teammate.offside = false;
        }
    );

    if (!settings.offside) {
        return;
    }

    if (opponents.length < 2) {
        return;
    }

    /*
     * The two highest defenders form
     * the offside line.
     */

    const defenders =
        [...opponents].sort(
            (a, b) => b.y - a.y
        );

    const secondLast =
        defenders[1];

    teammates.forEach(
        teammate => {

            const aheadOfBall =
                teammate.y > ball.y;

            const beyondLine =
                teammate.y >
                secondLast.y;

            teammate.offside =
                aheadOfBall &&
                beyondLine;
        }
    );
}


// ============================================================
// NEW SCENARIO
// ============================================================

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


// ============================================================
// FIELD PROJECTION
// ============================================================

function project(x, y) {

    const w = window.innerWidth;
    const h = window.innerHeight;

    /*
     * We deliberately keep the playable area
     * close to the centre of the screen.
     */

    const fieldLeft = w * 0.06;
    const fieldRight = w * 0.94;

    const fieldTop = h * 0.22;
    const fieldBottom = h * 0.95;

    const screenX =
        w / 2 +
        (x / FIELD_WIDTH) *
        (fieldRight - fieldLeft);

    const screenY =
        fieldBottom -
        ((y + 15) / FIELD_HEIGHT) *
        (fieldBottom - fieldTop);

    return {
        x: screenX,
        y: screenY
    };
}


// ============================================================
// DRAW PITCH
// ============================================================

function drawPitch() {

    const w = window.innerWidth;
    const h = window.innerHeight;

    // BACKGROUND

    ctx.fillStyle = "#111820";

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
        h * 0.12,
        w,
        h * 0.18
    );


    // PITCH

    const left = w * 0.06;
    const right = w * 0.94;

    const top = h * 0.22;
    const bottom = h * 0.96;


    ctx.fillStyle = "#247b42";

    ctx.fillRect(
        left,
        top,
        right - left,
        bottom - top
    );


    // STRIPES

    const stripeHeight =
        (bottom - top) / 10;

    for (let i = 0; i < 10; i++) {

        if (i % 2 === 0) {

            ctx.fillStyle =
                "rgba(255,255,255,0.025)";

            ctx.fillRect(
                left,
                top + i * stripeHeight,
                right - left,
                stripeHeight
            );
        }
    }


    // SIDELINES

    ctx.strokeStyle = "white";
    ctx.lineWidth = 3;

    ctx.strokeRect(
        left,
        top,
        right - left,
        bottom - top
    );


    // HORIZONTAL FIELD LINES

    for (let i = 1; i < 5; i++) {

        const y =
            top +
            (bottom - top) *
            (i / 5);

        ctx.lineWidth = 2;

        ctx.beginPath();

        ctx.moveTo(left, y);
        ctx.lineTo(right, y);

        ctx.stroke();
    }


    // CENTRE CIRCLE

    const centreX = w / 2;

    const centreY =
        top +
        (bottom - top) * 0.50;

    ctx.beginPath();

    ctx.arc(
        centreX,
        centreY,
        Math.min(w, h) * 0.09,
        0,
        Math.PI * 2
    );

    ctx.stroke();


    // CENTRE SPOT

    ctx.beginPath();

    ctx.arc(
        centreX,
        centreY,
        4,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = "white";

    ctx.fill();
}


// ============================================================
// BLOCKY PLAYER
// ============================================================

function drawPlayer(p) {

    const pos =
        project(
            p.x,
            p.y
        );

    const x = pos.x;
    const y = pos.y;

    const size =
        Math.max(
            0.75,
            Math.min(
                window.innerWidth / 700,
                1.35
            )
        );


    p.screenX = x;
    p.screenY = y;

    p.hitRadius =
        35 * size;


    // SHADOW

    ctx.beginPath();

    ctx.ellipse(
        x,
        y + 7 * size,
        14 * size,
        5 * size,
        0,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "rgba(0,0,0,0.35)";

    ctx.fill();


    // OFFSIDE RING

    if (
        p.offside &&
        settings.offsideRings
    ) {

        ctx.beginPath();

        ctx.arc(
            x,
            y - 18 * size,
            27 * size,
            0,
            Math.PI * 2
        );

        ctx.strokeStyle =
            "#ff9f24";

        ctx.lineWidth = 3;

        ctx.stroke();
    }


    // BODY

    ctx.fillStyle =
        p.team === "blue"
            ? "#2185ed"
            : "#e63946";

    ctx.fillRect(
        x - 10 * size,
        y - 30 * size,
        20 * size,
        22 * size
    );


    // HEAD

    ctx.fillStyle =
        "#d79b73";

    ctx.fillRect(
        x - 8 * size,
        y - 46 * size,
        16 * size,
        16 * size
    );


    // HAIR

    ctx.fillStyle = "#202020";

    ctx.fillRect(
        x - 8 * size,
        y - 47 * size,
        16 * size,
        5 * size
    );


    // ARMS

    ctx.fillStyle =
        p.team === "blue"
            ? "#2185ed"
            : "#e63946";

    ctx.fillRect(
        x - 16 * size,
        y - 29 * size,
        6 * size,
        18 * size
    );

    ctx.fillRect(
        x + 10 * size,
        y - 29 * size,
        6 * size,
        18 * size
    );


    // LEGS

    ctx.fillRect(
        x - 8 * size,
        y - 8 * size,
        7 * size,
        15 * size
    );

    ctx.fillRect(
        x + 1 * size,
        y - 8 * size,
        7 * size,
        15 * size
    );


    // NUMBER

    ctx.fillStyle = "white";

    ctx.font =
        `bold ${Math.max(
            10,
            11 * size
        )}px Arial`;

    ctx.textAlign = "center";

    ctx.fillText(
        p.number,
        x,
        y - 15 * size
    );


    // SELECTABLE BORDER

    if (
        p.selectable &&
        !p.offside
    ) {

        ctx.strokeStyle =
            "rgba(255,255,255,0.65)";

        ctx.lineWidth = 2;

        ctx.strokeRect(
            x - 17 * size,
            y - 49 * size,
            34 * size,
            43 * size
        );
    }
}


// ============================================================
// BALL
// ============================================================

function drawBall() {

    const pos =
        project(
            ball.x,
            ball.y
        );


    ctx.beginPath();

    ctx.ellipse(
        pos.x,
        pos.y + 5,
        8,
        4,
        0,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "rgba(0,0,0,0.35)";

    ctx.fill();


    ctx.beginPath();

    ctx.arc(
        pos.x,
        pos.y,
        7,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = "white";

    ctx.fill();

    ctx.strokeStyle = "#222";

    ctx.lineWidth = 1.5;

    ctx.stroke();
}


// ============================================================
// DRAW SCENE
// ============================================================

function drawScene() {

    drawPitch();


    // Furthest first

    opponents
        .sort((a, b) => b.y - a.y)
        .forEach(drawPlayer);

    teammates
        .sort((a, b) => b.y - a.y)
        .forEach(drawPlayer);


    // User

    if (player) {
        drawPlayer(player);
    }


    drawBall();
}


// ============================================================
// FIND CLICKED PLAYER
// ============================================================

function findClickedPlayer(x, y) {

    let closest = null;
    let closestDistance = Infinity;


    for (const teammate of teammates) {

        if (!teammate.selectable) {
            continue;
        }


        const dx =
            x - teammate.screenX;

        const dy =
            y -
            (teammate.screenY - 20);


        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        if (
            distance <
            teammate.hitRadius &&
            distance <
            closestDistance
        ) {

            closest = teammate;

            closestDistance =
                distance;
        }
    }


    return closest;
}


// ============================================================
// INPUT
// ============================================================

canvas.addEventListener(
    "pointerdown",
    function(event) {

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


// ============================================================
// PASS
// ============================================================

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


    const distance =
        distanceBetween(
            player,
            target
        );


    if (distance > 25) {
        score -= 15;
    }


    if (target.offside) {
        score -= 80;
    }


    const result =
        Math.max(
            0,
            Math.round(score)
        );


    showResult(
        result,
        seconds,
        target
    );
}


// ============================================================
// DISTANCE
// ============================================================

function distanceBetween(a, b) {

    const dx =
        a.x - b.x;

    const dy =
        a.y - b.y;

    return Math.sqrt(
        dx * dx +
        dy * dy
    );
}


// ============================================================
// RESULT
// ============================================================

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
        overall.textContent = score;

    if (decision)
        decision.textContent = score;

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


    if (target.offside) {

        if (message)
            message.textContent =
                "OFFSIDE!";

        if (analysis)
            analysis.textContent =
                "Your teammate was in an offside position.";
    }

    else if (score >= 90) {

        if (message)
            message.textContent =
                "EXCELLENT DECISION";

        if (analysis)
            analysis.textContent =
                "Great passing option.";
    }

    else if (score >= 70) {

        if (message)
            message.textContent =
                "GOOD DECISION";

        if (analysis)
            analysis.textContent =
                "A solid passing option.";
    }

    else {

        if (message)
            message.textContent =
                "POOR DECISION";

        if (analysis)
            analysis.textContent =
                "There was probably a safer option.";
    }


    show("resultScreen");
}


// ============================================================
// SCREEN HELPERS
// ============================================================

function hide(id) {

    const element =
        document.getElementById(id);

    if (element)
        element.classList.add("hidden");
}


function show(id) {

    const element =
        document.getElementById(id);

    if (element)
        element.classList.remove("hidden");
}


// ============================================================
// START BUTTON
// ============================================================

const startButton =
    document.getElementById(
        "startButton"
    );

if (startButton) {

    startButton.onclick =
        function() {

            startScenario();
        };
}


// ============================================================
// SETTINGS BUTTON
// ============================================================

const settingsButton =
    document.getElementById(
        "settingsButton"
    );

if (settingsButton) {

    settingsButton.onclick =
        function() {

            hide("startScreen");
            show("settingsScreen");
        };
}


// ============================================================
// SETTINGS BACK
// ============================================================

const settingsBack =
    document.getElementById(
        "settingsBack"
    );

if (settingsBack) {

    settingsBack.onclick =
        function() {

            hide("settingsScreen");
            show("startScreen");
        };
}


// ============================================================
// NEXT SCENARIO
// ============================================================

const nextButton =
    document.getElementById(
        "nextButton"
    );

if (nextButton) {

    nextButton.onclick =
        function() {

            scenarioNumber++;

            hide("resultScreen");

            startScenario();
        };
}


// ============================================================
// SETTINGS CONTROLS
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

    offsideButton.onclick =
        function() {

            settings.offside =
                !settings.offside;

            offsideButton.textContent =
                settings.offside
                    ? "ON"
                    : "OFF";
        };
}


if (ringsButton) {

    ringsButton.onclick =
        function() {

            settings.offsideRings =
                !settings.offsideRings;

            ringsButton.textContent =
                settings.offsideRings
                    ? "ON"
                    : "OFF";
        };
}


if (teamPlus) {

    teamPlus.onclick =
        function() {

            settings.teammates =
                Math.min(
                    8,
                    settings.teammates + 1
                );

            if (teamCount)
                teamCount.textContent =
                    settings.teammates;
        };
}


if (teamMinus) {

    teamMinus.onclick =
        function() {

            settings.teammates =
                Math.max(
                    2,
                    settings.teammates - 1
                );

            if (teamCount)
                teamCount.textContent =
                    settings.teammates;
        };
}


if (opponentPlus) {

    opponentPlus.onclick =
        function() {

            settings.opponents =
                Math.min(
                    12,
                    settings.opponents + 1
                );

            if (opponentCount)
                opponentCount.textContent =
                    settings.opponents;
        };
}


if (opponentMinus) {

    opponentMinus.onclick =
        function() {

            settings.opponents =
                Math.max(
                    2,
                    settings.opponents - 1
                );

            if (opponentCount)
                opponentCount.textContent =
                    settings.opponents;
        };
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


gameLoop();

console.log(
    "Football IQ game loaded"
);
}
