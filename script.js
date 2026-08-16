// =========================================
// CANVAS
// =========================================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

resizeCanvas();

window.addEventListener("resize", resizeCanvas);


// =========================================
// LOAD CHARACTER IMAGES
// =========================================

const playerImage = new Image();
playerImage.src = "assets/images/player.png";

const enemyImage = new Image();
enemyImage.src = "assets/images/enemy.png";

const xpImage = new Image();
xpImage.src = "assets/images/xp.png";


// =========================================
// HTML ELEMENTS
// =========================================

const healthElement =
    document.getElementById("health");

const maxHealthElement =
    document.getElementById("max-health");

const levelElement =
    document.getElementById("level");

const killsElement =
    document.getElementById("kills");

const scoreElement =
    document.getElementById("score");

const timeElement =
    document.getElementById("time");

const fireRateElement =
    document.getElementById("fire-rate");

const xpElement =
    document.getElementById("xp");

const xpNeededElement =
    document.getElementById("xp-needed");

const xpBar =
    document.getElementById("xp-bar");

const upgradeMenu =
    document.getElementById("upgrade-menu");

const upgradeButtons =
    document.getElementById("upgrade-buttons");

const upgradeLevel =
    document.getElementById("upgrade-level");

const gameOverMenu =
    document.getElementById("game-over");

const finalLevel =
    document.getElementById("final-level");

const finalKills =
    document.getElementById("final-kills");

const finalScore =
    document.getElementById("final-score");

const finalTime =
    document.getElementById("final-time");

const restartButton =
    document.getElementById("restart-button");


// =========================================
// GAME STATE
// =========================================

let gameRunning = true;
let paused = false;

let kills = 0;
let score = 0;
let survivalTime = 0;

let level = 1;
let xp = 0;
let xpNeeded = 50;


// =========================================
// PLAYER
// =========================================

const player = {

    x: canvas.width / 2,
    y: canvas.height / 2,

    radius: 23,

    size: 70,

    speed: 5,

    health: 100,
    maxHealth: 100,

    damage: 1,

    bulletSpeed: 11,

    fireRate: 5,

    lastShot: 0

};


// =========================================
// OBJECT ARRAYS
// =========================================

let bullets = [];
let enemies = [];
let xpOrbs = [];
let particles = [];


// =========================================
// CONTROLS
// =========================================

const keys = {};

const mouse = {
    x: canvas.width / 2,
    y: canvas.height / 2
};

window.addEventListener(
    "keydown",
    event => {

        keys[event.key.toLowerCase()] = true;

        // Browsers don't allow audio until
        // the player interacts with the page.
        startAudio();

    }
);

window.addEventListener(
    "keyup",
    event => {

        keys[event.key.toLowerCase()] = false;

    }
);

canvas.addEventListener(
    "mousemove",
    event => {

        const rect =
            canvas.getBoundingClientRect();

        mouse.x =
            event.clientX - rect.left;

        mouse.y =
            event.clientY - rect.top;

    }
);

canvas.addEventListener(
    "mousedown",
    () => {

        startAudio();

    }
);


// =========================================
// AUDIO SYSTEM
// =========================================

let audioContext = null;
let masterVolume = null;
let audioStarted = false;


function startAudio() {

    if (audioStarted) {
        return;
    }

    audioContext =
        new (
            window.AudioContext ||
            window.webkitAudioContext
        )();

    masterVolume =
        audioContext.createGain();

    masterVolume.gain.value =
        0.18;

    masterVolume.connect(
        audioContext.destination
    );

    audioStarted = true;

}


// =========================================
// GENERATE SOUND
// =========================================

function playTone(
    frequency,
    duration,
    type = "square",
    volume = 0.2,
    endFrequency = null
) {

    if (!audioStarted) {
        return;
    }

    const oscillator =
        audioContext.createOscillator();

    const gain =
        audioContext.createGain();


    oscillator.type =
        type;

    oscillator.frequency.setValueAtTime(
        frequency,
        audioContext.currentTime
    );


    if (endFrequency !== null) {

        oscillator.frequency.exponentialRampToValueAtTime(
            endFrequency,
            audioContext.currentTime + duration
        );

    }


    gain.gain.setValueAtTime(
        volume,
        audioContext.currentTime
    );


    gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + duration
    );


    oscillator.connect(
        gain
    );

    gain.connect(
        masterVolume
    );


    oscillator.start();

    oscillator.stop(
        audioContext.currentTime +
        duration
    );

}


// =========================================
// SOUND EFFECTS
// =========================================

function soundShoot() {

    playTone(
        240,
        0.045,
        "square",
        0.10,
        100
    );

}


function soundEnemyHit() {

    playTone(
        120,
        0.06,
        "sawtooth",
        0.07,
        70
    );

}


function soundEnemyDeath() {

    playTone(
        150,
        0.13,
        "sawtooth",
        0.12,
        45
    );

}


function soundXP() {

    playTone(
        650,
        0.07,
        "sine",
        0.08,
        900
    );

}


function soundPlayerHit() {

    playTone(
        90,
        0.20,
        "sawtooth",
        0.16,
        40
    );

}


function soundLevelUp() {

    if (!audioStarted) {
        return;
    }

    playTone(
        400,
        0.12,
        "sine",
        0.15,
        600
    );


    setTimeout(
        () => {

            playTone(
                600,
                0.12,
                "sine",
                0.15,
                800
            );

        },
        110
    );


    setTimeout(
        () => {

            playTone(
                800,
                0.25,
                "sine",
                0.18,
                1200
            );

        },
        220
    );

}


function soundGameOver() {

    playTone(
        260,
        0.8,
        "sawtooth",
        0.18,
        45
    );

}


// =========================================
// PLAYER MOVEMENT
// =========================================

function updatePlayer() {

    let moveX = 0;
    let moveY = 0;


    if (
        keys["w"] ||
        keys["arrowup"]
    ) {
        moveY -= 1;
    }


    if (
        keys["s"] ||
        keys["arrowdown"]
    ) {
        moveY += 1;
    }


    if (
        keys["a"] ||
        keys["arrowleft"]
    ) {
        moveX -= 1;
    }


    if (
        keys["d"] ||
        keys["arrowright"]
    ) {
        moveX += 1;
    }


    if (
        moveX !== 0 ||
        moveY !== 0
    ) {

        const length =
            Math.hypot(
                moveX,
                moveY
            );

        moveX /= length;
        moveY /= length;

    }


    player.x +=
        moveX *
        player.speed;

    player.y +=
        moveY *
        player.speed;


    player.x =
        Math.max(
            player.radius,
            Math.min(
                canvas.width -
                player.radius,
                player.x
            )
        );


    player.y =
        Math.max(
            player.radius,
            Math.min(
                canvas.height -
                player.radius,
                player.y
            )
        );

}


// =========================================
// AUTOMATIC SHOOTING
// =========================================

function automaticShooting(
    timestamp
) {

    if (
        enemies.length === 0
    ) {
        return;
    }


    const delay =
        1000 /
        player.fireRate;


    if (
        timestamp -
        player.lastShot >=
        delay
    ) {

        shoot();

        player.lastShot =
            timestamp;

    }

}


// =========================================
// SHOOT
// =========================================

function shoot() {

    const angle =
        Math.atan2(
            mouse.y -
            player.y,

            mouse.x -
            player.x
        );


    bullets.push({

        x:
            player.x +
            Math.cos(angle) *
            30,

        y:
            player.y +
            Math.sin(angle) *
            30,

        dx:
            Math.cos(angle) *
            player.bulletSpeed,

        dy:
            Math.sin(angle) *
            player.bulletSpeed,

        radius: 5,

        damage:
            player.damage

    });


    soundShoot();

}


// =========================================
// BULLETS
// =========================================

function updateBullets() {

    for (
        let i =
            bullets.length - 1;

        i >= 0;

        i--
    ) {

        const bullet =
            bullets[i];


        bullet.x +=
            bullet.dx;

        bullet.y +=
            bullet.dy;


        if (
            bullet.x < -100 ||
            bullet.x >
            canvas.width + 100 ||
            bullet.y < -100 ||
            bullet.y >
            canvas.height + 100
        ) {

            bullets.splice(
                i,
                1
            );

        }

    }

}


// =========================================
// SPAWN ENEMY
// =========================================

function spawnEnemy() {

    if (
        !gameRunning ||
        paused
    ) {
        return;
    }


    let x;
    let y;


    const side =
        Math.floor(
            Math.random() * 4
        );


    if (side === 0) {

        x =
            Math.random() *
            canvas.width;

        y = -50;

    }


    else if (side === 1) {

        x =
            canvas.width + 50;

        y =
            Math.random() *
            canvas.height;

    }


    else if (side === 2) {

        x =
            Math.random() *
            canvas.width;

        y =
            canvas.height + 50;

    }


    else {

        x = -50;

        y =
            Math.random() *
            canvas.height;

    }


    const healthBonus =
        Math.floor(
            survivalTime /
            25
        );


    const enemyHealth =
        2 +
        healthBonus;


    enemies.push({

        x,
        y,

        radius: 22,

        size: 65,

        health:
            enemyHealth,

        maxHealth:
            enemyHealth,

        speed:
            1.1 +
            survivalTime *
            0.003,

        xpValue:
            10 +
            healthBonus *
            2,

        damage: 15,

        hitCooldown: 0

    });

}


// =========================================
// ENEMY MOVEMENT
// =========================================

function updateEnemies() {

    const now =
        performance.now();


    for (
        let i =
            enemies.length - 1;

        i >= 0;

        i--
    ) {

        const enemy =
            enemies[i];


        const angle =
            Math.atan2(
                player.y -
                enemy.y,

                player.x -
                enemy.x
            );


        enemy.x +=
            Math.cos(angle) *
            enemy.speed;

        enemy.y +=
            Math.sin(angle) *
            enemy.speed;


        const distance =
            Math.hypot(
                player.x -
                enemy.x,

                player.y -
                enemy.y
            );


        if (
            distance <
            player.radius +
            enemy.radius
        ) {

            if (
                now >=
                enemy.hitCooldown
            ) {

                damagePlayer(
                    enemy.damage
                );


                enemy.hitCooldown =
                    now +
                    600;

            }

        }

    }

}


// =========================================
// PLAYER DAMAGE
// =========================================

function damagePlayer(
    amount
) {

    player.health -=
        amount;


    player.health =
        Math.max(
            0,
            player.health
        );


    soundPlayerHit();


    createParticles(
        player.x,
        player.y,
        12,
        "#ff4444"
    );


    if (
        player.health <= 0
    ) {

        endGame();

    }

}


// =========================================
// BULLET COLLISIONS
// =========================================

function checkBulletEnemyCollisions() {

    for (
        let b =
            bullets.length - 1;

        b >= 0;

        b--
    ) {

        const bullet =
            bullets[b];


        for (
            let e =
                enemies.length - 1;

            e >= 0;

            e--
        ) {

            const enemy =
                enemies[e];


            const distance =
                Math.hypot(
                    bullet.x -
                    enemy.x,

                    bullet.y -
                    enemy.y
                );


            if (
                distance <
                bullet.radius +
                enemy.radius
            ) {

                enemy.health -=
                    bullet.damage;


                soundEnemyHit();


                createParticles(
                    bullet.x,
                    bullet.y,
                    5,
                    "#ff9c38"
                );


                bullets.splice(
                    b,
                    1
                );


                if (
                    enemy.health <= 0
                ) {

                    killEnemy(e);

                }


                break;

            }

        }

    }

}


// =========================================
// KILL ENEMY
// =========================================

function killEnemy(
    index
) {

    const enemy =
        enemies[index];


    soundEnemyDeath();


    createParticles(
        enemy.x,
        enemy.y,
        18,
        "#ff4444"
    );


    dropXP(
        enemy
    );


    enemies.splice(
        index,
        1
    );


    kills++;

    score += 100;

}


// =========================================
// DROP XP
// =========================================

function dropXP(
    enemy
) {

    xpOrbs.push({

        x:
            enemy.x,

        y:
            enemy.y,

        radius: 9,

        size: 28,

        value:
            enemy.xpValue,

        pulse:
            Math.random() *
            Math.PI *
            2

    });

}


// =========================================
// XP ORBS
// =========================================

function updateXPOrbs() {

    for (
        let i =
            xpOrbs.length - 1;

        i >= 0;

        i--
    ) {

        const orb =
            xpOrbs[i];


        orb.pulse +=
            0.08;


        const distance =
            Math.hypot(
                player.x -
                orb.x,

                player.y -
                orb.y
            );


        if (
            distance < 160
        ) {

            const angle =
                Math.atan2(
                    player.y -
                    orb.y,

                    player.x -
                    orb.x
                );


            const speed =
                4 +
                (
                    160 -
                    distance
                ) *
                0.04;


            orb.x +=
                Math.cos(angle) *
                speed;

            orb.y +=
                Math.sin(angle) *
                speed;

        }


        if (
            distance <
            player.radius +
            orb.radius +
            5
        ) {

            soundXP();

            gainXP(
                orb.value
            );


            xpOrbs.splice(
                i,
                1
            );

        }

    }

}


// =========================================
// XP / LEVELS
// =========================================

function gainXP(
    amount
) {

    xp += amount;

    checkLevelUp();

}


function checkLevelUp() {

    if (paused) {
        return;
    }


    if (
        xp >=
        xpNeeded
    ) {

        xp -=
            xpNeeded;


        level++;


        xpNeeded =
            Math.floor(
                xpNeeded *
                1.35
            );


        soundLevelUp();

        openUpgradeMenu();

    }

}


// =========================================
// UPGRADES
// =========================================

const upgrades = [

    {

        name:
            "Rapid Fire",

        description:
            "+20% fire rate",

        apply() {

            player.fireRate *=
                1.20;

        }

    },


    {

        name:
            "Heavy Bullets",

        description:
            "+1 damage",

        apply() {

            player.damage +=
                1;

        }

    },


    {

        name:
            "Speed Boost",

        description:
            "+12% movement speed",

        apply() {

            player.speed *=
                1.12;

        }

    },


    {

        name:
            "Vitality",

        description:
            "+25 max HP and heal 25",

        apply() {

            player.maxHealth +=
                25;


            player.health =
                Math.min(
                    player.health +
                    25,

                    player.maxHealth
                );

        }

    },


    {

        name:
            "First Aid",

        description:
            "Heal 40% of max health",

        apply() {

            player.health +=
                player.maxHealth *
                0.40;


            player.health =
                Math.min(
                    player.health,
                    player.maxHealth
                );

        }

    },


    {

        name:
            "High Velocity",

        description:
            "+25% bullet speed",

        apply() {

            player.bulletSpeed *=
                1.25;

        }

    }

];


// =========================================
// UPGRADE MENU
// =========================================

function getUpgradeChoices() {

    const available =
        [...upgrades];

    const choices =
        [];


    while (
        choices.length < 3
    ) {

        const index =
            Math.floor(
                Math.random() *
                available.length
            );


        choices.push(
            available[index]
        );


        available.splice(
            index,
            1
        );

    }


    return choices;

}


function openUpgradeMenu() {

    paused = true;


    upgradeLevel.textContent =
        level;


    upgradeButtons.innerHTML =
        "";


    const choices =
        getUpgradeChoices();


    choices.forEach(
        upgrade => {

            const button =
                document.createElement(
                    "button"
                );


            button.className =
                "upgrade-button";


            button.innerHTML = `
                <span class="upgrade-name">
                    ${upgrade.name}
                </span>

                <span class="upgrade-description">
                    ${upgrade.description}
                </span>
            `;


            button.onclick =
                () => {

                    upgrade.apply();


                    upgradeMenu
                        .classList
                        .add(
                            "hidden"
                        );


                    paused =
                        false;


                    updateHUD();


                    if (
                        xp >=
                        xpNeeded
                    ) {

                        checkLevelUp();

                    }

                };


            upgradeButtons
                .appendChild(
                    button
                );

        }
    );


    upgradeMenu
        .classList
        .remove(
            "hidden"
        );

}


// =========================================
// PARTICLES
// =========================================

function createParticles(
    x,
    y,
    amount,
    color = "white"
) {

    for (
        let i = 0;
        i < amount;
        i++
    ) {

        const angle =
            Math.random() *
            Math.PI *
            2;


        const speed =
            Math.random() *
            4 +
            1;


        particles.push({

            x,
            y,

            dx:
                Math.cos(angle) *
                speed,

            dy:
                Math.sin(angle) *
                speed,

            life: 25,

            radius:
                Math.random() *
                3 +
                2,

            color

        });

    }

}


function updateParticles() {

    for (
        let i =
            particles.length - 1;

        i >= 0;

        i--
    ) {

        const particle =
            particles[i];


        particle.x +=
            particle.dx;

        particle.y +=
            particle.dy;


        particle.dx *=
            0.95;

        particle.dy *=
            0.95;


        particle.life--;


        if (
            particle.life <= 0
        ) {

            particles.splice(
                i,
                1
            );

        }

    }

}


// =========================================
// BACKGROUND
// =========================================

function drawBackground() {

    const gradient =
        ctx.createRadialGradient(
            player.x,
            player.y,
            40,

            player.x,
            player.y,
            700
        );


    gradient.addColorStop(
        0,
        "#24472d"
    );


    gradient.addColorStop(
        1,
        "#07110a"
    );


    ctx.fillStyle =
        gradient;


    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    // Ground grid

    ctx.strokeStyle =
        "rgba(255,255,255,0.035)";


    const size =
        50;


    for (
        let x = 0;
        x < canvas.width;
        x += size
    ) {

        ctx.beginPath();

        ctx.moveTo(
            x,
            0
        );

        ctx.lineTo(
            x,
            canvas.height
        );

        ctx.stroke();

    }


    for (
        let y = 0;
        y < canvas.height;
        y += size
    ) {

        ctx.beginPath();

        ctx.moveTo(
            0,
            y
        );

        ctx.lineTo(
            canvas.width,
            y
        );

        ctx.stroke();

    }

}


// =========================================
// DRAW IMAGE ROTATED
// =========================================

function drawRotatedImage(
    image,
    x,
    y,
    size,
    angle
) {

    ctx.save();


    ctx.translate(
        x,
        y
    );


    ctx.rotate(
        angle
    );


    ctx.drawImage(
        image,

        -size / 2,
        -size / 2,

        size,
        size
    );


    ctx.restore();

}


// =========================================
// DRAW PLAYER
// =========================================

function drawPlayer() {

    const angle =
        Math.atan2(
            mouse.y -
            player.y,

            mouse.x -
            player.x
        );


    // Shadow

    ctx.beginPath();

    ctx.ellipse(
        player.x,
        player.y + 20,

        27,
        13,

        0,
        0,
        Math.PI * 2
    );


    ctx.fillStyle =
        "rgba(0,0,0,0.4)";

    ctx.fill();


    // Character image

    if (
        playerImage.complete &&
        playerImage.naturalWidth > 0
    ) {

        drawRotatedImage(
            playerImage,

            player.x,
            player.y,

            player.size,

            angle +
            Math.PI / 2
        );

    }

    else {

        // Fallback if the PNG
        // hasn't been uploaded yet

        ctx.beginPath();

        ctx.arc(
            player.x,
            player.y,
            player.radius,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            "#38aaff";

        ctx.fill();

    }


    // Gun direction

    ctx.beginPath();

    ctx.moveTo(
        player.x,
        player.y
    );


    ctx.lineTo(
        player.x +
        Math.cos(angle) *
        42,

        player.y +
        Math.sin(angle) *
        42
    );


    ctx.strokeStyle =
        "#dddddd";

    ctx.lineWidth =
        7;

    ctx.lineCap =
        "round";

    ctx.stroke();

    ctx.lineCap =
        "butt";

}


// =========================================
// DRAW ENEMIES
// =========================================

function drawEnemies() {

    enemies.forEach(
        enemy => {

            const angle =
                Math.atan2(
                    player.y -
                    enemy.y,

                    player.x -
                    enemy.x
                );


            // Shadow

            ctx.beginPath();

            ctx.ellipse(
                enemy.x,
                enemy.y + 18,

                24,
                11,

                0,
                0,
                Math.PI * 2
            );


            ctx.fillStyle =
                "rgba(0,0,0,0.4)";

            ctx.fill();


            if (
                enemyImage.complete &&
                enemyImage.naturalWidth > 0
            ) {

                drawRotatedImage(
                    enemyImage,

                    enemy.x,
                    enemy.y,

                    enemy.size,

                    angle +
                    Math.PI / 2
                );

            }

            else {

                ctx.beginPath();

                ctx.arc(
                    enemy.x,
                    enemy.y,
                    enemy.radius,
                    0,
                    Math.PI * 2
                );

                ctx.fillStyle =
                    "#db4040";

                ctx.fill();

            }


            // HP bar

            const barWidth =
                44;


            const hpPercent =
                Math.max(
                    0,
                    enemy.health /
                    enemy.maxHealth
                );


            ctx.fillStyle =
                "#111";


            ctx.fillRect(
                enemy.x -
                barWidth / 2,

                enemy.y -
                40,

                barWidth,
                6
            );


            ctx.fillStyle =
                "#4cff4c";


            ctx.fillRect(
                enemy.x -
                barWidth / 2,

                enemy.y -
                40,

                barWidth *
                hpPercent,

                6
            );

        }
    );

}


// =========================================
// DRAW BULLETS
// =========================================

function drawBullets() {

    bullets.forEach(
        bullet => {

            ctx.beginPath();

            ctx.arc(
                bullet.x,
                bullet.y,
                bullet.radius,
                0,
                Math.PI * 2
            );


            ctx.shadowBlur =
                15;

            ctx.shadowColor =
                "#ffdd40";


            ctx.fillStyle =
                "#fff36a";

            ctx.fill();


            ctx.shadowBlur =
                0;

        }
    );

}


// =========================================
// DRAW XP
// =========================================

function drawXPOrbs() {

    xpOrbs.forEach(
        orb => {

            const pulse =
                Math.sin(
                    orb.pulse
                ) *
                3;


            const size =
                orb.size +
                pulse;


            ctx.shadowBlur =
                16;

            ctx.shadowColor =
                "#66ff44";


            if (
                xpImage.complete &&
                xpImage.naturalWidth > 0
            ) {

                ctx.drawImage(
                    xpImage,

                    orb.x -
                    size / 2,

                    orb.y -
                    size / 2,

                    size,
                    size
                );

            }

            else {

                ctx.beginPath();

                ctx.arc(
                    orb.x,
                    orb.y,
                    orb.radius,
                    0,
                    Math.PI * 2
                );

                ctx.fillStyle =
                    "#6cff45";

                ctx.fill();

            }


            ctx.shadowBlur =
                0;

        }
    );

}


// =========================================
// DRAW PARTICLES
// =========================================

function drawParticles() {

    particles.forEach(
        particle => {

            ctx.globalAlpha =
                particle.life /
                25;


            ctx.beginPath();

            ctx.arc(
                particle.x,
                particle.y,
                particle.radius,
                0,
                Math.PI * 2
            );


            ctx.fillStyle =
                particle.color;

            ctx.fill();

        }
    );


    ctx.globalAlpha =
        1;

}


// =========================================
// HUD
// =========================================

function updateHUD() {

    healthElement.textContent =
        Math.ceil(
            player.health
        );


    maxHealthElement.textContent =
        Math.ceil(
            player.maxHealth
        );


    levelElement.textContent =
        level;


    killsElement.textContent =
        kills;


    scoreElement.textContent =
        score;


    timeElement.textContent =
        survivalTime;


    fireRateElement.textContent =
        player.fireRate
            .toFixed(1);


    xpElement.textContent =
        Math.floor(xp);


    xpNeededElement.textContent =
        xpNeeded;


    const percent =
        Math.min(
            100,

            xp /
            xpNeeded *
            100
        );


    xpBar.style.width =
        percent + "%";

}


// =========================================
// GAME OVER
// =========================================

function endGame() {

    gameRunning =
        false;


    soundGameOver();


    finalLevel.textContent =
        level;


    finalKills.textContent =
        kills;


    finalScore.textContent =
        score;


    finalTime.textContent =
        survivalTime;


    gameOverMenu
        .classList
        .remove(
            "hidden"
        );

}


// =========================================
// RESTART
// =========================================

function restartGame() {

    gameRunning =
        true;

    paused =
        false;


    kills = 0;
    score = 0;
    survivalTime = 0;

    level = 1;

    xp = 0;

    xpNeeded = 50;


    bullets = [];
    enemies = [];
    xpOrbs = [];
    particles = [];


    player.x =
        canvas.width /
        2;

    player.y =
        canvas.height /
        2;


    player.speed = 5;

    player.health = 100;
    player.maxHealth = 100;

    player.damage = 1;

    player.bulletSpeed = 11;

    player.fireRate = 5;

    player.lastShot = 0;


    gameOverMenu
        .classList
        .add(
            "hidden"
        );


    upgradeMenu
        .classList
        .add(
            "hidden"
        );


    updateHUD();


    requestAnimationFrame(
        gameLoop
    );

}


restartButton.addEventListener(
    "click",
    restartGame
);


// =========================================
// ENEMY SPAWNER
// =========================================

setInterval(
    () => {

        if (
            !gameRunning ||
            paused
        ) {
            return;
        }


        spawnEnemy();


        if (
            survivalTime >= 25
        ) {
            spawnEnemy();
        }


        if (
            survivalTime >= 60
        ) {
            spawnEnemy();
        }


        if (
            survivalTime >= 120
        ) {
            spawnEnemy();
        }


        if (
            survivalTime >= 180
        ) {
            spawnEnemy();
        }

    },

    900
);


// =========================================
// TIMER
// =========================================

setInterval(
    () => {

        if (
            !gameRunning ||
            paused
        ) {
            return;
        }


        survivalTime++;

        score += 10;

    },

    1000
);


// =========================================
// MAIN LOOP
// =========================================

function gameLoop(
    timestamp
) {

    if (
        !gameRunning
    ) {
        return;
    }


    drawBackground();


    if (
        !paused
    ) {

        updatePlayer();

        automaticShooting(
            timestamp
        );

        updateBullets();

        updateEnemies();

        updateXPOrbs();

        checkBulletEnemyCollisions();

        updateParticles();

    }


    drawXPOrbs();

    drawEnemies();

    drawBullets();

    drawParticles();

    drawPlayer();

    updateHUD();


    requestAnimationFrame(
        gameLoop
    );

}


// =========================================
// START GAME
// =========================================

updateHUD();

requestAnimationFrame(
    gameLoop
);
