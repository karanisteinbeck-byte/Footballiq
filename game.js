
// =========================================================

// FOOTBALL IQ TRAINER
// Game engine
// =========================================================


// =========================================================
// 1. CANVAS SETUP
// =========================================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");


// =========================================================
// 2. GAME SETTINGS
// =========================================================

const settings = {
    offside: true,
    teammates: 6,
    opponents: 7,
    offsideRings: true
};


// =========================================================
// 3. GAME STATE
// =========================================================

let gameState = "menu";

let scenarioNumber = 1;

let teammates = [];
let opponents = [];

let player = null;
let ball = null;

let decisionStartTime = 0;

let selectedPlayer = null;

let scenarioActive = false;


// =========================================================
// 4. CANVAS RESIZING
// =========================================================

function resizeCanvas() {

    const dpr = window.devicePixelRatio || 1;

    canvas.width =
        window.innerWidth * dpr;

    canvas.height =
        window.innerHeight * dpr;

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

// =========================================================
// 5. 3D PERSPECTIVE
// =========================================================

// The virtual football pitch.
// x = left/right
// y = distance up the pitch
const pitch = {
    width: 105,
    length: 68
};


// Camera position.
// The player is looking forward from this point.
const camera = {
    x: 0,
    y: 0,
    height: 1.7
};


// How wide the player's view is.
const FOV = 90;


// Converts a real pitch position into a screen position.
function project3D(x, y, z = 0) {

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Position relative to the camera
    const relativeX = x - camera.x;
    const relativeY = y - camera.y;

    // Prevent objects from being drawn behind the camera
    if (relativeY <= 0.5) {
        return null;
    }

    // Perspective scale.
    // Farther objects become smaller.
    const scale =
        (screenHeight * 0.85) /
        relativeY;

    // Convert pitch coordinates to screen coordinates
    const screenX =
        screenWidth / 2 +
        relativeX * scale;

    const horizon =
        screenHeight * 0.30;

    const screenY =
        horizon +
        (camera.height - z) *
        scale;

    return {
        x: screenX,
        y: screenY,
        scale: scale
    };
}

// =========================================================
// 6. PITCH DRAWING
// =========================================================

function drawPitch() {

    const w = window.innerWidth;
    const h = window.innerHeight;

    // -------------------------
    // Sky / stadium background
    // -------------------------

    const skyGradient =
        ctx.createLinearGradient(
            0,
            0,
            0,
            h * 0.55
        );

    skyGradient.addColorStop(
        0,
        "#75b9df"
    );

    skyGradient.addColorStop(
        1,
        "#c7e4ee"
    );

    ctx.fillStyle = skyGradient;

    ctx.fillRect(
        0,
        0,
        w,
        h * 0.55
    );


    // -------------------------
    // Stadium
    // -------------------------

    ctx.fillStyle = "#454b50";

    ctx.fillRect(
        0,
        h * 0.25,
        w,
        h * 0.30
    );


    // -------------------------
    // Pitch
    // -------------------------

    const horizonY = h * 0.30;

    const bottomY = h;

    const topWidth = w * 0.18;

    const bottomWidth = w * 1.35;

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

    const grassGradient =
        ctx.createLinearGradient(
            0,
            horizonY,
            0,
            bottomY
        );

    grassGradient.addColorStop(
        0,
        "#267b43"
    );

    grassGradient.addColorStop(
        0.5,
        "#218143"
    );

    grassGradient.addColorStop(
        1,
        "#176735"
    );

    ctx.fillStyle = grassGradient;

    ctx.fill();


    // -------------------------
    // Pitch mowing stripes
    // -------------------------

    for (let i = 0; i < 12; i++) {

        const y1 =
            horizonY +
            (bottomY - horizonY) *
            (i / 12);

        const y2 =
            horizonY +
            (bottomY - horizonY) *
            ((i + 1) / 12);

        const width1 =
            topWidth +
            (bottomWidth - topWidth) *
            (i / 12);

        const width2 =
            topWidth +
            (bottomWidth - topWidth) *
            ((i + 1) / 12);

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

        if (i % 2 === 0) {
            ctx.fillStyle =
                "rgba(255,255,255,0.025)";

            ctx.fill();
        }
    }


    // -------------------------
    // Pitch sidelines
    // -------------------------

    ctx.strokeStyle =
        "rgba(255,255,255,0.9)";

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


    // -------------------------
    // Perspective pitch lines
    // -------------------------

    drawPitchLine(
        0.18,
        "Penalty area"
    );

    drawPitchLine(
        0.42,
        "Midfield"
    );

    drawPitchLine(
        0.68,
        "Attacking area"
    );


    // -------------------------
    // Centre line
    // -------------------------

    drawHorizontalPitchLine(
        0.42
    );
}


// =========================================================
// PERSPECTIVE LINE
// =========================================================

function drawPitchLine(position) {

    const w = window.innerWidth;
    const h = window.innerHeight;

    const horizonY =
        h * 0.30;

    const bottomY =
        h;

    const topWidth =
        w * 0.18;

    const bottomWidth =
        w * 1.35;

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


// =========================================================
// HORIZONTAL PITCH LINE
// =========================================================

function drawHorizontalPitchLine(position) {

    const w = window.innerWidth;
    const h = window.innerHeight;

    const horizonY =
        h * 0.30;

    const bottomY =
        h;

    const topWidth =
        w * 0.18;

    const bottomWidth =
        w * 1.35;

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

// =========================================================
// 7. PLAYER CREATION
// =========================================================

function createPlayer(x, y, team, number) {

    return {
        x: x,
        y: y,

        // Height in our virtual world
        z: 0,

        team: team,
        number: number,

        // Used for drawing
        radius: 0.8,

        // Used for AI / pressure calculations later
        speed: 1,

        // Whether this player is currently selectable
        selectable: team === "blue",

        // Offside status
        offside: false
    };
}

// ============================================================
// FOOTBALL IQ TRAINER
// Complete game.js
// ============================================================


// ============================================================
// 1. CANVAS SETUP
// ============================================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");


// ============================================================
// 2. SETTINGS
// ============================================================

const settings = {
    offside: true,
    teammates: 6,
    opponents: 7,
    offsideRings: true
};


// ============================================================
// 3. GAME STATE
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
// 4. CANVAS RESIZING
// ============================================================

function resizeCanvas() {

    const dpr = window.devicePixelRatio || 1;

    canvas.width =
        window.innerWidth * dpr;

    canvas.height =
        window.innerHeight * dpr;

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


// ============================================================
// 5. 3D PERSPECTIVE
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

    const relativeX =
        x - camera.x;

    const relativeY =
        y - camera.y;

    if (relativeY <= 0.5) {
        return null;
    }

    const scale =
        (h * 0.85) /
        relativeY;

    const screenX =
        w / 2 +
        relativeX * scale;

    const horizon =
        h * 0.30;

    const screenY =
        horizon +
        (camera.height - z) *
        scale;

    return {
        x: screenX,
        y: screenY,
        scale: scale
    };
}


// ============================================================
// 6. PITCH DRAWING
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

    sky.addColorStop(
        0,
        "#6caed3"
    );

    sky.addColorStop(
        1,
        "#c5e2eb"
    );

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


    // DISTANT STANDS

    for (let i = 0; i < 14; i++) {

        const standX =
            i * w / 14;

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

    grass.addColorStop(
        0,
        "#287b43"
    );

    grass.addColorStop(
        0.5,
        "#218044"
    );

    grass.addColorStop(
        1,
        "#155f31"
    );

    ctx.fillStyle = grass;

    ctx.fill();


    // GRASS STRIPES

    for (let i = 0; i < 16; i++) {

        const p1 = i / 16;
        const p2 = (i + 1) / 16;

        const y1 =
            horizonY +
            (bottomY - horizonY) *
            p1;

        const y2 =
            horizonY +
            (bottomY - horizonY) *
            p2;

        const width1 =
            topWidth +
            (bottomWidth - topWidth) *
            p1;

        const width2 =
            topWidth +
            (bottomWidth - topWidth) *
            p2;

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
// 7. FIELD LINE
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
        (bottomY - horizonY) *
        position;

    const width =
        topWidth +
        (bottomWidth - topWidth) *
        position;

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
// 8. PLAYER OBJECT
// ============================================================

function createPlayer(
    x,
    y,
    team,
    number
) {

    return {

        x: x,
        y: y,

        z: 0,

        team: team,

        number: number,

        radius: 0.8,

        speed: 1,

        selectable:
            team === "blue",

        offside: false,

        screenX: 0,

        screenY: 0,

        screenRadius: 0
    };
}


// ============================================================
// 9. RANDOM NUMBERS
// ============================================================

function randomRange(min, max) {

    return (
        Math.random() *
        (max - min)
    ) + min;
}


function randomInt(min, max) {

    return Math.floor(
        Math.random() *
        (max - min + 1)
    ) + min;
}


// ============================================================
// 10. CREATE USER PLAYER
// ============================================================

function createUserPlayer() {

    player = createPlayer(
        0,
        3,
        "blue",
        10
    );

    player.isUser = true;

    player.selectable = false;
}


// ============================================================
// 11. GENERATE TEAMMATES
// ============================================================

function generateTeammates() {

    teammates = [];

    const usedPositions = [];

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

            /*
             * Keep teammates inside
             * the visible playing area.
             */

            x = randomRange(-24, 24);

            y = randomRange(10, 58);

            valid = true;


            for (
                const existing
                of usedPositions
            ) {

                const dx =
                    x - existing.x;

                const dy =
                    y - existing.y;

                const distance =
                    Math.sqrt(
                        dx * dx +
                        dy * dy
                    );


                if (distance < 5) {

                    valid = false;

                    break;
                }
            }
        }


        usedPositions.push({
            x: x,
            y: y
        });


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


// ============================================================
// 12. GENERATE OPPONENTS
// ============================================================

function generateOpponents() {

    opponents = [];

    const usedPositions = [];


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

            const type =
                Math.random();


            // PRESSURE PLAYERS

            if (type < 0.35) {

                x =
                    randomRange(
                        -12,
                        12
                    );

                y =
                    randomRange(
                        8,
                        24
                    );
            }


            // DEFENSIVE LINE

            else if (type < 0.75) {

                x =
                    randomRange(
                        -28,
                        28
                    );

                y =
                    randomRange(
                        30,
                        48
                    );
            }


            // WIDE / COVERING PLAYERS

            else {

                x =
                    randomRange(
                        -30,
                        30
                    );

                y =
                    randomRange(
                        18,
                        50
                    );
            }


            valid = true;


            for (
                const existing
                of usedPositions
            ) {

                const dx =
                    x - existing.x;

                const dy =
                    y - existing.y;

                const distance =
                    Math.sqrt(
                        dx * dx +
                        dy * dy
                    );


                if (distance < 4) {

                    valid = false;

                    break;
                }
            }
        }


        usedPositions.push({
            x: x,
            y: y
        });


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


// ============================================================
// 13. CREATE BALL
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
// 14. DISTANCE
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
// 15. SECOND-LAST DEFENDER
// ============================================================

function getSecondLastDefender() {

    if (
        opponents.length < 2
    ) {

        return null;
    }


    /*
     * Sort ALL defenders first.
     *
     * This fixes the previous bug where
     * the first defender generated was
     * incorrectly treated as the last defender.
     */

    const sorted =
        [...opponents].sort(
            (a, b) =>
                b.y - a.y
        );


    return sorted[1];
}


// ============================================================
// 16. OFFSIDE
// ============================================================

function calculateOffside() {

    if (!settings.offside) {

        teammates.forEach(
            p => {
                p.offside = false;
            }
        );

        return;
    }


    const secondLast =
        getSecondLastDefender();


    if (!secondLast) {

        teammates.forEach(
            p => {
                p.offside = false;
            }
        );

        return;
    }


    for (
        const teammate
        of teammates
    ) {

        /*
         * In this game increasing Y means
         * moving towards the opponent goal.
         */

        const aheadOfBall =
            teammate.y > ball.y;


        const beyondDefender =
            teammate.y >
            secondLast.y;


        teammate.offside =
            aheadOfBall &&
            beyondDefender;
    }
}


// ============================================================
// 17. CREATE RANDOM SCENARIO
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
// 18. PLAYER SHADOW
// ============================================================

function drawPlayerShadow(
    p,
    projected
) {

    if (!projected) {
        return;
    }


    const shadowWidth =
        Math.max(
            3,
            projected.scale *
            0.65
        );


    const shadowHeight =
        Math.max(
            2,
            projected.scale *
            0.22
        );


    ctx.beginPath();

    ctx.ellipse(
        projected.x,
        projected.y + 3,
        shadowWidth,
        shadowHeight,
        0,
        0,
        Math.PI * 2
    );


    ctx.fillStyle =
        "rgba(0,0,0,0.30)";

    ctx.fill();
}


// ============================================================
// 19. DRAW PLAYER
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
            0.12,
            Math.min(
                projected.scale,
                4
            )
        );


    const bodyHeight =
        9 * scale;

    const bodyWidth =
        4.5 * scale;


    p.screenX =
        projected.x;

    p.screenY =
        projected.y;

    p.screenRadius =
        Math.max(
            10,
            5 * scale
        );


    // SHADOW

    drawPlayerShadow(
        p,
        projected
    );


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
                14,
                8 * scale
            ),
            0,
            Math.PI * 2
        );


        ctx.strokeStyle =
            "#ff9b24";

        ctx.lineWidth =
            Math.max(
                2,
                2.5 * scale
            );

        ctx.stroke();
    }


    // BODY

    ctx.beginPath();

    ctx.ellipse(
        projected.x,
        projected.y -
            bodyHeight * 0.45,
        bodyWidth,
        bodyHeight,
        0,
        0,
        Math.PI * 2
    );


    ctx.fillStyle =
        p.team === "blue"
            ? "#2488f3"
            : "#e64242";

    ctx.fill();


    // HEAD

    ctx.beginPath();

    ctx.arc(
        projected.x,
        projected.y -
            bodyHeight * 1.05,
        Math.max(
            2.5,
            2.1 * scale
        ),
        0,
        Math.PI * 2
    );


    ctx.fillStyle =
        "#d79a70";

    ctx.fill();


    // SELECTABLE GLOW

    if (
        p.selectable &&
        !p.offside
    ) {

        ctx.beginPath();

        ctx.arc(
            projected.x,
            projected.y -
                bodyHeight * 0.45,
            Math.max(
                10,
                7 * scale
            ),
            0,
            Math.PI * 2
        );


        ctx.strokeStyle =
            "rgba(255,255,255,0.45)";

        ctx.lineWidth = 1.5;

        ctx.stroke();
    }


    // NUMBER

    if (scale > 0.35) {

        ctx.fillStyle =
            "white";

        ctx.font =
            `bold ${Math.max(
                7,
                4 * scale
            )}px Arial`;

        ctx.textAlign =
            "center";

        ctx.fillText(
            p.number,
            projected.x,
            projected.y -
                bodyHeight * 0.30
        );
    }
}


// ============================================================
// 20. DRAW BALL
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
            3,
            Math.min(
                projected.scale *
                0.65,
                18
            )
        );


    // BALL SHADOW

    ctx.beginPath();

    ctx.ellipse(
        projected.x,
        projected.y + 4,
        radius * 1.2,
        radius * 0.45,
        0,
        0,
        Math.PI * 2
    );


    ctx.fillStyle =
        "rgba(0,0,0,0.3)";

    ctx.fill();


    // BALL

    ctx.beginPath();

    ctx.arc(
        projected.x,
        projected.y,
        radius,
        0,
        Math.PI * 2
    );


    ctx.fillStyle =
        "#ffffff";

    ctx.fill();


    ctx.strokeStyle =
        "#222";

    ctx.lineWidth =
        Math.max(
            1,
            radius * 0.12
        );

    ctx.stroke();
}


// ============================================================
// 21. DRAW ALL PLAYERS
// ============================================================

function drawPlayers() {

    const allPlayers = [
        ...opponents,
        ...teammates
    ];


    /*
     * Draw distant players first.
     */

    allPlayers.sort(
        (a, b) =>
            b.y - a.y
    );


    for (
        const p
        of allPlayers
    ) {

        drawPlayer(p);
    }
}


// ============================================================
// 22. DRAW COMPLETE SCENE
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
// 23. START SCENARIO
// ============================================================

function startScenario() {

    gameState = "playing";

    scenarioActive = true;

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


    const startScreen =
        document.getElementById(
            "startScreen"
        );


    if (startScreen) {

        startScreen.classList.add(
            "hidden"
        );
    }


    const settingsScreen =
        document.getElementById(
            "settingsScreen"
        );


    if (settingsScreen) {

        settingsScreen.classList.add(
            "hidden"
        );
    }


    const resultScreen =
        document.getElementById(
            "resultScreen"
        );


    if (resultScreen) {

        resultScreen.classList.add(
            "hidden"
        );
    }
}


// ============================================================
// 24. PASS QUALITY
// ============================================================

function calculatePassQuality(target) {

    let score = 100;


    const distance =
        distanceBetween(
            player,
            target
        );


    // DISTANCE

    if (distance > 35) {

        score -= 15;

    } else if (distance > 25) {

        score -= 8;
    }


    // CLOSEST OPPONENT

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


    // PRESSURE

    if (
        closestOpponent < 5
    ) {

        score -= 40;

    } else if (
        closestOpponent < 8
    ) {

        score -= 20;

    } else if (
        closestOpponent < 12
    ) {

        score -= 8;
    }


    // OFFSIDE

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
// 25. TIMING SCORE
// ============================================================

function calculateTimingScore(
    seconds
) {

    if (seconds <= 0.8)
        return 100;

    if (seconds <= 1.2)
        return 95;

    if (seconds <= 1.6)
        return 88;

    if (seconds <= 2.0)
        return 80;

    if (seconds <= 2.5)
        return 70;

    if (seconds <= 3.0)
        return 60;

    if (seconds <= 4.0)
        return 45;

    return 30;
}


// ============================================================
// 26. MAKE PASS
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
// 27. RESULT SCREEN
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


    if (overallElement) {

        overallElement.textContent =
            overall;
    }


    if (decisionElement) {

        decisionElement.textContent =
            decisionScore;
    }


    if (timingElement) {

        timingElement.textContent =
            timingScore;
    }


    if (timeElement) {

        timeElement.textContent =
            seconds.toFixed(2) + "s";
    }


    const message =
        document.getElementById(
            "resultMessage"
        );


    const analysis =
        document.getElementById(
            "analysis"
        );


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

    } else if (
        overall >= 90
    ) {

        if (message) {

            message.textContent =
                "EXCELLENT DECISION";
        }


        if (analysis) {

            analysis.textContent =
                "Excellent awareness, passing choice and reaction speed.";
        }

    } else if (
        overall >= 75
    ) {

        if (message) {

            message.textContent =
                "GOOD DECISION";
        }


        if (analysis) {

            analysis.textContent =
                "A good passing option, although there may have been a better choice.";
        }

    } else if (
        overall >= 50
    ) {

        if (message) {

            message.textContent =
                "COULD BE BETTER";
        }


        if (analysis) {

            analysis.textContent =
                "The pass was possible, but pressure or positioning made it less effective.";
        }

    } else {

        if (message) {

            message.textContent =
                "POOR DECISION";
        }


        if (analysis) {

            analysis.textContent =
                "Look for safer passing lanes and check the defensive line before passing.";
        }
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


// ============================================================
// 28. FIND CLICKED TEAMMATE
// ============================================================

function findClickedTeammate(
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
                8
            );


        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        const hitRadius =
            Math.max(
                22,
                teammate.screenRadius *
                2.2
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


    return closest;
}


// ============================================================
// 29. TOUCH / MOUSE INPUT
// ============================================================

function handleInput(
    clientX,
    clientY
) {

    if (
        gameState !== "playing"
    ) {

        return;
    }


    const target =
        findClickedTeammate(
            clientX,
            clientY
        );


    if (target) {

        makePass(target);
    }
}


canvas.addEventListener(
    "pointerdown",
    function(event) {

        handleInput(
            event.clientX,
            event.clientY
        );
    }
);


// ============================================================
// 30. SETTINGS
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


// OFFSIDE ON/OFF

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


// OFFSIDE RINGS

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


            if (teamCount) {

                teamCount.textContent =
                    settings.teammates;
            }
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


            if (teamCount) {

                teamCount.textContent =
                    settings.teammates;
            }
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


            if (opponentCount) {

                opponentCount.textContent =
                    settings.opponents;
            }
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


            if (opponentCount) {

                opponentCount.textContent =
                    settings.opponents;
            }
        }
    );
}


// ============================================================
// 31. START BUTTON
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
// 32. SETTINGS BUTTON
// ============================================================

const settingsButton =
    document.getElementById(
        "settingsButton"
    );


if (settingsButton) {

    settingsButton.addEventListener(
        "click",
        function() {

            const startScreen =
                document.getElementById(
                    "startScreen"
                );


            const settingsScreen =
                document.getElementById(
                    "settingsScreen"
                );


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
        }
    );
}


// ============================================================
// 33. SETTINGS BACK
// ============================================================

const settingsBack =
    document.getElementById(
        "settingsBack"
    );


if (settingsBack) {

    settingsBack.addEventListener(
        "click",
        function() {

            const settingsScreen =
                document.getElementById(
                    "settingsScreen"
                );


            const startScreen =
                document.getElementById(
                    "startScreen"
                );


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
        }
    );
}


// ============================================================
// 34. NEXT SCENARIO
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
// 35. GAME LOOP
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
// 36. START GAME
// ============================================================

gameLoop();

console.log("FOOTBALL IQ GAME.JS LOADED");
