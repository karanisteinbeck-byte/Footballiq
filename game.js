// ============================================================
// FOOTBALL IQ — GAME.JS
// Realistic mixed-player decision trainer
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
// FIELD SETTINGS
// ============================================================

const FIELD_WIDTH = 60;
const FIELD_HEIGHT = 70;


// ============================================================
// PLAYER CREATION
// ============================================================

function createPlayer(x, y, team, number) {

    return {
        x: x,
        y: y,

        team: team,
        number: number,

        offside: false,
        selectable: team === "blue",

        screenX: 0,
        screenY: 0,
        hitRadius: 40
    };
}


// ============================================================
// RANDOM HELPERS
// ============================================================

function random(min, max) {
    return Math.random() * (max - min) + min;
}


function randomInt(min, max) {
    return Math.floor(
        Math.random() * (max - min + 1)
    ) + min;
}


// ============================================================
// DISTANCE
// ============================================================

function distanceBetween(a, b) {

    const dx = a.x - b.x;
    const dy = a.y - b.y;

    return Math.sqrt(
        dx * dx + dy * dy
    );
}


// ============================================================
// USER PLAYER
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
// BALL
// ============================================================

function createBall() {

    ball = {
        x: 0,
        y: 2
    };
}


// ============================================================
// GENERATE TEAMMATES
// ============================================================

function generateTeammates() {

    teammates = [];

    /*
     * Players are deliberately spread around
     * the user rather than forming a straight line.
     *
     * Some are behind the ball.
     * Some are beside the ball.
     * Some are ahead of the ball.
     */

    const possiblePositions = [

        [-17, -8],
        [ 15, -7],

        [-20, -1],
        [ 18,  2],

        [-12,  7],
        [ 12,  9],

        [-21, 10],
        [ 21, 12],

        [-8,  16],
        [  9, 18]
    ];


    /*
     * Shuffle positions so every scenario
     * can feel slightly different.
     */

    const shuffled =
        [...possiblePositions]
        .sort(
            () => Math.random() - 0.5
        );


    for (
        let i = 0;
        i < settings.teammates;
        i++
    ) {

        const position =
            shuffled[i];

        teammates.push(
            createPlayer(
                position[0] +
                    random(-2.5, 2.5),

                position[1] +
                    random(-2, 2),

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
     * Opponents are deliberately mixed
     * between the teammates.
     *
     * This is NOT a blue-vs-red formation.
     */

    const possiblePositions = [

        [-10, -4],
        [ 10, -2],

        [-18,  3],
        [ 17,  5],

        [-5,   8],
        [  7, 11],

        [-19, 12],
        [ 20, 14],

        [-11, 17],
        [ 11, 20],

        [ -3, 25],
        [ 17, 25],

        [-20, 24],
        [  4, 30]
    ];


    const shuffled =
        [...possiblePositions]
        .sort(
            () => Math.random() - 0.5
        );


    for (
        let i = 0;
        i < settings.opponents;
        i++
    ) {

        const position =
            shuffled[i];

        opponents.push(
            createPlayer(
                position[0] +
                    random(-2, 2),

                position[1] +
                    random(-2, 2),

                "red",

                i + 1
            )
        );
    }
}


// ============================================================
// OFFSIDE LINE
// ============================================================

function getSecondLastDefender() {

    if (opponents.length < 2) {
        return null;
    }


    /*
     * Highest Y = furthest forward.
     *
     * The second-highest defender is
     * the second-last defender.
     */

    const defenders =
        [...opponents].sort(
            (a, b) => b.y - a.y
        );


    return defenders[1];
}


// ============================================================
// CALCULATE OFFSIDE
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


    const secondLastDefender =
        getSecondLastDefender();


    if (!secondLastDefender) {
        return;
    }


    teammates.forEach(
        teammate => {

            /*
             * Player must be ahead of the ball
             * AND ahead of the second-last defender.
             */

            const aheadOfBall =
                teammate.y > ball.y;


            const aheadOfDefender =
                teammate.y >
                secondLastDefender.y;


            teammate.offside =
                aheadOfBall &&
                aheadOfDefender;
        }
    );
}


// ============================================================
// GUARANTEE LEGAL OPTIONS
// ============================================================

function guaranteeLegalOptions() {

    /*
     * We always want at least 3 legal
     * teammates.
     */

    let legalPlayers =
        teammates.filter(
            p => !p.offside
        );


    if (legalPlayers.length >= 3) {
        return;
    }


    /*
     * Move some teammates backwards
     * until we have enough legal options.
     */

    const sorted =
        [...teammates]
        .sort(
            (a, b) => b.y - a.y
        );


    for (
        const teammate
        of sorted
    ) {

        if (legalPlayers.length >= 3) {
            break;
        }


        teammate.y =
            Math.min(
                teammate.y,
                ball.y + 3
            );


        teammate.offside = false;


        legalPlayers =
            teammates.filter(
                p => !p.offside
            );
    }
}


// ============================================================
// GENERATE SCENARIO
// ============================================================

function generateScenario() {

    createUser();

    createBall();

    generateTeammates();

    generateOpponents();

    calculateOffside();

    guaranteeLegalOptions();

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

    const left = w * 0.055;
    const right = w * 0.945;

    const top = h * 0.20;
    const bottom = h * 0.96;


    /*
     * Convert virtual field coordinates
     * into screen coordinates.
     */

    const normalizedX =
        (x + FIELD_WIDTH / 2) /
        FIELD_WIDTH;


    const normalizedY =
        (y + 15) /
        FIELD_HEIGHT;


    return {

        x:
            left +
            normalizedX *
            (right - left),

        y:
            bottom -
            normalizedY *
            (bottom - top)
    };
}


// ============================================================
// DRAW PITCH
// ============================================================

function drawPitch() {

    const w = window.innerWidth;
    const h = window.innerHeight;


    // BACKGROUND

    ctx.fillStyle =
        "#111820";

    ctx.fillRect(
        0,
        0,
        w,
        h
    );


    // STADIUM

    ctx.fillStyle =
        "#3e4449";

    ctx.fillRect(
        0,
        h * 0.10,
        w,
        h * 0.16
    );


    // PITCH

    const left =
        w * 0.055;

    const right =
        w * 0.945;

    const top =
        h * 0.20;

    const bottom =
        h * 0.96;


    ctx.fillStyle =
        "#247b42";

    ctx.fillRect(
        left,
        top,
        right - left,
        bottom - top
    );


    // GRASS STRIPES

    const stripeHeight =
        (bottom - top) / 12;


    for (
        let i = 0;
        i < 12;
        i++
    ) {

        if (i % 2 === 0) {

            ctx.fillStyle =
                "rgba(255,255,255,0.025)";

            ctx.fillRect(
                left,
                top +
                    i * stripeHeight,

                right - left,

                stripeHeight
            );
        }
    }


    // OUTER LINES

    ctx.strokeStyle =
        "rgba(255,255,255,0.9)";

    ctx.lineWidth = 3;

    ctx.strokeRect(
        left,
        top,
        right - left,
        bottom - top
    );


    // FIELD LINES

    for (
        let i = 1;
        i < 5;
        i++
    ) {

        const y =
            top +
            (bottom - top) *
            (i / 5);


        ctx.beginPath();

        ctx.moveTo(
            left,
            y
        );

        ctx.lineTo(
            right,
            y
        );

        ctx.strokeStyle =
            "rgba(255,255,255,0.65)";

        ctx.lineWidth = 2;

        ctx.stroke();
    }


    // CENTRE CIRCLE

    const centreX =
        w / 2;

    const centreY =
        top +
        (bottom - top) *
        0.5;


    ctx.beginPath();

    ctx.arc(
        centreX,
        centreY,
        Math.min(w, h) * 0.08,
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

    ctx.fillStyle =
        "white";

    ctx.fill();
}


// ============================================================
// DRAW BLOCKY PLAYER
// ============================================================

function drawPlayer(p) {

    const pos =
        project(
            p.x,
            p.y
        );


    const x =
        pos.x;

    const y =
        pos.y;


    /*
     * Slightly smaller players when
     * they are further away.
     */

    const depth =
        Math.max(
            0.75,
            Math.min(
                1.25,
                1.15 -
                p.y * 0.008
            )
        );


    p.screenX =
        x;

    p.screenY =
        y;

    p.hitRadius =
        34 * depth;


    // SHADOW

    ctx.beginPath();

    ctx.ellipse(
        x,
        y + 7 * depth,
        14 * depth,
        5 * depth,
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
            y - 20 * depth,
            28 * depth,
            0,
            Math.PI * 2
        );

        ctx.strokeStyle =
            "#ff9f24";

        ctx.lineWidth = 3;

        ctx.stroke();
    }


    // TEAM COLOUR

    const teamColour =
        p.team === "blue"
            ? "#2586ed"
            : "#e63946";


    // BODY

    ctx.fillStyle =
        teamColour;

    ctx.fillRect(
        x - 10 * depth,
        y - 30 * depth,
        20 * depth,
        22 * depth
    );


    // HEAD

    ctx.fillStyle =
        "#d79b73";

    ctx.fillRect(
        x - 8 * depth,
        y - 46 * depth,
        16 * depth,
        16 * depth
    );


    // HAIR

    ctx.fillStyle =
        "#202020";

    ctx.fillRect(
        x - 8 * depth,
        y - 47 * depth,
        16 * depth,
        5 * depth
    );


    // ARMS

    ctx.fillStyle =
        teamColour;

    ctx.fillRect(
        x - 16 * depth,
        y - 29 * depth,
        6 * depth,
        18 * depth
    );

    ctx.fillRect(
        x + 10 * depth,
        y - 29 * depth,
        6 * depth,
        18 * depth
    );


    // LEGS

    ctx.fillRect(
        x - 8 * depth,
        y - 8 * depth,
        7 * depth,
        15 * depth
    );

    ctx.fillRect(
        x + 1 * depth,
        y - 8 * depth,
        7 * depth,
        15 * depth
    );


    // NUMBER

    ctx.fillStyle =
        "white";

    ctx.font =
        `bold ${Math.max(
            10,
            11 * depth
        )}px Arial`;

    ctx.textAlign =
        "center";

    ctx.fillText(
        p.number,
        x,
        y - 15 * depth
    );


    // SELECTABLE OUTLINE

    if (
        p.selectable &&
        !p.offside
    ) {

        ctx.strokeStyle =
            "rgba(255,255,255,0.55)";

        ctx.lineWidth = 2;

        ctx.strokeRect(
            x - 17 * depth,
            y - 49 * depth,
            34 * depth,
            43 * depth
        );
    }
}


// ============================================================
// DRAW BALL
// ============================================================

function drawBall() {

    const pos =
        project(
            ball.x,
            ball.y
        );


    // SHADOW

    ctx.beginPath();

    ctx.ellipse(
        pos.x,
        pos.y + 5,
        9,
        4,
        0,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "rgba(0,0,0,0.35)";

    ctx.fill();


    // BALL

    ctx.beginPath();

    ctx.arc(
        pos.x,
        pos.y,
        7,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "white";

    ctx.fill();

    ctx.strokeStyle =
        "#222";

    ctx.lineWidth = 1.5;

    ctx.stroke();
}


// ============================================================
// DRAW SCENE
// ============================================================

function drawScene() {

    drawPitch();


    /*
     * Draw players furthest away first.
     */

    const allPlayers = [
        ...opponents,
        ...teammates,
        player
    ].filter(Boolean);


    allPlayers.sort(
        (a, b) => b.y - a.y
    );


    allPlayers.forEach(
        drawPlayer
    );


    drawBall();
}


// ============================================================
// CLICK DETECTION
// ============================================================

function findClickedPlayer(
    mouseX,
    mouseY
) {

    let closest = null;
    let closestDistance =
        Infinity;


    for (
        const teammate
        of teammates
    ) {

        if (
            !teammate.selectable
        ) {
            continue;
        }


        const dx =
            mouseX -
            teammate.screenX;


        const dy =
            mouseY -
            (
                teammate.screenY -
                20
            );


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

            closest =
                teammate;

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

            makePass(
                target
            );
        }
    }
);


// ============================================================
// PASS SCORING
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


    let decisionScore = 100;


    // OFFSIDE

    if (
        target.offside
    ) {

        decisionScore -= 80;
    }


    // DISTANCE

    const distance =
        distanceBetween(
            player,
            target
        );


    if (
        distance > 25
    ) {

        decisionScore -= 15;

    } else if (
        distance > 18
    ) {

        decisionScore -= 7;
    }


    // NEARBY OPPONENT

    let closestOpponent =
        Infinity;


    for (
        const opponent
        of opponents
    ) {

        const d =
            distanceBetween(
                target,
                opponent
            );


        if (
            d <
            closestOpponent
        ) {

            closestOpponent =
                d;
        }
    }


    if (
        closestOpponent < 5
    ) {

        decisionScore -= 35;

    } else if (
        closestOpponent < 8
    ) {

        decisionScore -= 15;
    }


    decisionScore =
        Math.max(
            0,
            Math.round(
                decisionScore
            )
        );


    // TIMING

    let timingScore =
        Math.round(
            100 -
            seconds * 15
        );


    timingScore =
        Math.max(
            25,
            Math.min(
                100,
                timingScore
            )
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
// RESULT SCREEN
// ============================================================

function showResult(
    overall,
    decisionScore,
    timingScore,
    seconds,
    target
) {

    gameState = "result";


    const overallElement =
        document.getElementById(
            "overallScore"
        );

    const decisionElement =
        document.getElementById(
            "decisionScore"
        );

    const timingElement =
        document.getElementById(
            "timingScore"
        );

    const timeElement =
        document.getElementById(
            "decisionTime"
        );

    const messageElement =
        document.getElementById(
            "resultMessage"
        );

    const analysisElement =
        document.getElementById(
            "analysis"
        );


    if (overallElement)
        overallElement.textContent =
            overall;


    if (decisionElement)
        decisionElement.textContent =
            decisionScore;


    if (timingElement)
        timingElement.textContent =
            timingScore;


    if (timeElement)
        timeElement.textContent =
            seconds.toFixed(2) + "s";


    if (
        settings.offside &&
        target.offside
    ) {

        if (messageElement)
            messageElement.textContent =
                "OFFSIDE!";


        if (analysisElement)
            analysisElement.textContent =
                "Your teammate was ahead of the second-last defender when the pass was made.";

    } else if (
        overall >= 90
    ) {

        if (messageElement)
            messageElement.textContent =
                "EXCELLENT DECISION";


        if (analysisElement)
            analysisElement.textContent =
                "Excellent awareness and passing choice.";

    } else if (
        overall >= 75
    ) {

        if (messageElement)
            messageElement.textContent =
                "GOOD DECISION";


        if (analysisElement)
            analysisElement.textContent =
                "A good passing option with relatively low pressure.";

    } else if (
        overall >= 50
    ) {

        if (messageElement)
            messageElement.textContent =
                "COULD BE BETTER";


        if (analysisElement)
            analysisElement.textContent =
                "There was a possible option, but another pass may have been safer.";

    } else {

        if (messageElement)
            messageElement.textContent =
                "POOR DECISION";


        if (analysisElement)
            analysisElement.textContent =
                "Look around before passing and identify the safest option.";
    }


    showScreen(
        "resultScreen"
    );
}


// ============================================================
// SCREEN HELPERS
// ============================================================

function hideScreen(id) {

    const element =
        document.getElementById(id);

    if (element) {

        element.classList.add(
            "hidden"
        );
    }
}


function showScreen(id) {

    const element =
        document.getElementById(id);

    if (element) {

        element.classList.remove(
            "hidden"
        );
    }
}


// ============================================================
// START SCENARIO
// ============================================================

function startScenario() {

    gameState =
        "playing";


    generateScenario();


    const scenarioText =
        document.getElementById(
            "scenarioNumber"
        );


    if (scenarioText) {

        scenarioText.textContent =
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


    hideScreen(
        "startScreen"
    );

    hideScreen(
        "settingsScreen"
    );

    hideScreen(
        "resultScreen"
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

            hideScreen(
                "startScreen"
            );

            showScreen(
                "settingsScreen"
            );
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

            hideScreen(
                "settingsScreen"
            );

            showScreen(
                "startScreen"
            );
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

            startScenario();
        };
}


// ============================================================
// OFFSIDE SETTING
// ============================================================

const offsideButton =
    document.getElementById(
        "offsideButton"
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


// ============================================================
// RINGS SETTING
// ============================================================

const ringsButton =
    document.getElementById(
        "ringsButton"
    );


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


// ============================================================
// TEAMMATES
// ============================================================

const teamCount =
    document.getElementById(
        "teamCount"
    );

const teamPlus =
    document.getElementById(
        "teamPlus"
    );

const teamMinus =
    document.getElementById(
        "teamMinus"
    );


if (teamPlus) {

    teamPlus.onclick =
        function() {

            settings.teammates =
                Math.min(
                    8,
                    settings.teammates + 1
                );


            if (teamCount) {

                teamCount.textContent =
                    settings.teammates;
            }
        };
}


if (teamMinus) {

    teamMinus.onclick =
        function() {

            settings.teammates =
                Math.max(
                    3,
                    settings.teammates - 1
                );


            if (teamCount) {

                teamCount.textContent =
                    settings.teammates;
            }
        };
}


// ============================================================
// OPPONENTS
// ============================================================

const opponentCount =
    document.getElementById(
        "opponentCount"
    );

const opponentPlus =
    document.getElementById(
        "opponentPlus"
    );

const opponentMinus =
    document.getElementById(
        "opponentMinus"
    );


if (opponentPlus) {

    opponentPlus.onclick =
        function() {

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


if (opponentMinus) {

    opponentMinus.onclick =
        function() {

            settings.opponents =
                Math.max(
                    4,
                    settings.opponents - 1
                );


            if (opponentCount) {

                opponentCount.textContent =
                    settings.opponents;
            }
        };
}


// ============================================================
// GAME LOOP
// ============================================================

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


// ============================================================
// START LOOP
// ============================================================

gameLoop();

console.log(
    "FOOTBALL IQ GAME.JS LOADED"
);
