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

    radius: 20,

    speed: 5,

    health: 100,
    maxHealth: 100,

    damage: 1,

    bulletSpeed: 11,

    // Shots per second
    fireRate: 5,

    lastShot: 0,

    color: "#38aaff"

};


// =========================================
// GAME OBJECTS
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


window.addEventListener("keydown", event => {

    keys[event.key.toLowerCase()] = true;

});


window.addEventListener("keyup", event => {

    keys[event.key.toLowerCase()] = false;

});


canvas.addEventListener("mousemove", event => {

    const rect =
        canvas.getBoundingClientRect();

    mouse.x =
        event.clientX - rect.left;

    mouse.y =
        event.clientY - rect.top;

});


// =========================================
// PLAYER MOVEMENT
// =========================================

function updatePlayer() {

    let moveX = 0;
    let moveY = 0;


    if (keys["w"] || keys["arrowup"]) {
        moveY -= 1;
    }

    if (keys["s"] || keys["arrowdown"]) {
        moveY += 1;
    }

    if (keys["a"] || keys["arrowleft"]) {
        moveX -= 1;
    }

    if (keys["d"] || keys["arrowright"]) {
        moveX += 1;
    }


    // Normalize diagonal movement
    if (moveX !== 0 || moveY !== 0) {

        const length =
            Math.hypot(moveX, moveY);

        moveX /= length;
        moveY /= length;

    }


    player.x +=
        moveX * player.speed;

    player.y +=
        moveY * player.speed;


    // Keep player on screen
    player.x =
        Math.max(
            player.radius,
            Math.min(
                canvas.width - player.radius,
                player.x
            )
        );

    player.y =
        Math.max(
            player.radius,
            Math.min(
                canvas.height - player.radius,
                player.y
            )
        );

}


// =========================================
// AUTOMATIC SHOOTING
// =========================================

function automaticShooting(timestamp) {

    if (enemies.length === 0) {
        return;
    }


    const delay =
        1000 / player.fireRate;


    if (
        timestamp - player.lastShot
        >= delay
    ) {

        shoot();

        player.lastShot = timestamp;

    }

}


// =========================================
// SHOOT
// =========================================

function shoot() {

    const angle =
        Math.atan2(
            mouse.y - player.y,
            mouse.x - player.x
        );


    bullets.push({

        x:
            player.x +
            Math.cos(angle) *
            (player.radius + 5),

        y:
            player.y +
            Math.sin(angle) *
            (player.radius + 5),

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

}


// =========================================
// BULLET UPDATE
// =========================================

function updateBullets() {

    for (
        let i = bullets.length - 1;
        i >= 0;
        i--
    ) {

        const bullet = bullets[i];


        bullet.x += bullet.dx;
        bullet.y += bullet.dy;


        if (
            bullet.x < -100 ||
            bullet.x > canvas.width + 100 ||
            bullet.y < -100 ||
            bullet.y > canvas.height + 100
        ) {

            bullets.splice(i, 1);

        }

    }

}


// =========================================
// ENEMY SPAWN
// =========================================

function spawnEnemy() {

    if (!gameRunning || paused) {
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

        y = -40;

    }

    else if (side === 1) {

        x =
            canvas.width + 40;

        y =
            Math.random() *
            canvas.height;

    }

    else if (side === 2) {

        x =
            Math.random() *
            canvas.width;

        y =
            canvas.height + 40;

    }

    else {

        x = -40;

        y =
            Math.random() *
            canvas.height;

    }


    // Difficulty increases over time
    const healthBonus =
        Math.floor(
            survivalTime / 25
        );


    const enemyHealth =
        2 + healthBonus;


    enemies.push({

        x: x,
        y: y,

        radius: 18,

        health: enemyHealth,
        maxHealth: enemyHealth,

        speed:
            1.1 +
            survivalTime * 0.003,

        xpValue:
            10 +
            healthBonus * 2,

        damage:
            15,

        hitCooldown: 0,

        color: "#db4040"

    });

}


// =========================================
// ENEMY MOVEMENT
// =========================================

function updateEnemies() {

    const now =
        performance.now();


    for (
        let i = enemies.length - 1;
        i >= 0;
        i--
    ) {

        const enemy =
            enemies[i];


        const angle =
            Math.atan2(
                player.y - enemy.y,
                player.x - enemy.x
            );


        enemy.x +=
            Math.cos(angle) *
            enemy.speed;

        enemy.y +=
            Math.sin(angle) *
            enemy.speed;


        const distance =
            Math.hypot(
                player.x - enemy.x,
                player.y - enemy.y
            );


        // Enemy touches player
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
                    now + 600;

            }

        }

    }

}


// =========================================
// DAMAGE PLAYER
// =========================================

function damagePlayer(amount) {

    player.health -= amount;


    if (player.health < 0) {
        player.health = 0;
    }


    createParticles(
        player.x,
        player.y,
        8
    );


    if (player.health <= 0) {
        endGame();
    }

}


// =========================================
// BULLET / ENEMY COLLISIONS
// =========================================

function checkBulletEnemyCollisions() {

    for (
        let bulletIndex =
            bullets.length - 1;

        bulletIndex >= 0;

        bulletIndex--
    ) {

        const bullet =
            bullets[bulletIndex];


        let bulletRemoved = false;


        for (
            let enemyIndex =
                enemies.length - 1;

            enemyIndex >= 0;

            enemyIndex--
        ) {

            const enemy =
                enemies[enemyIndex];


            const distance =
                Math.hypot(
                    bullet.x - enemy.x,
                    bullet.y - enemy.y
                );


            if (
                distance <
                bullet.radius +
                enemy.radius
            ) {

                enemy.health -=
                    bullet.damage;


                createParticles(
                    bullet.x,
                    bullet.y,
                    4
                );


                bullets.splice(
                    bulletIndex,
                    1
                );


                bulletRemoved = true;


                if (enemy.health <= 0) {

                    killEnemy(
                        enemyIndex
                    );

                }


                break;

            }

        }


        if (bulletRemoved) {
            continue;
        }

    }

}


// =========================================
// KILL ENEMY
// =========================================

function killEnemy(index) {

    const enemy =
        enemies[index];


    createParticles(
        enemy.x,
        enemy.y,
        12
    );


    dropXP(enemy);


    enemies.splice(
        index,
        1
    );


    kills += 1;

    score += 100;

}


// =========================================
// XP DROP
// =========================================

function dropXP(enemy) {

    xpOrbs.push({

        x: enemy.x,
        y: enemy.y,

        radius: 8,

        value:
            enemy.xpValue,

        pulse:
            Math.random() *
            Math.PI * 2

    });

}


// =========================================
// XP ORBS
// =========================================

function updateXPOrbs() {

    for (
        let i = xpOrbs.length - 1;
        i >= 0;
        i--
    ) {

        const orb =
            xpOrbs[i];


        orb.pulse += 0.08;


        const distance =
            Math.hypot(
                player.x - orb.x,
                player.y - orb.y
            );


        // XP magnet
        if (distance < 140) {

            const angle =
                Math.atan2(
                    player.y - orb.y,
                    player.x - orb.x
                );


            const magnetSpeed =
                3 +
                (140 - distance) *
                0.04;


            orb.x +=
                Math.cos(angle) *
                magnetSpeed;

            orb.y +=
                Math.sin(angle) *
                magnetSpeed;

        }


        // Collect orb
        if (
            distance <
            player.radius +
            orb.radius +
            4
        ) {

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
// GAIN XP
// =========================================

function gainXP(amount) {

    xp += amount;


    checkLevelUp();

}


// =========================================
// CHECK LEVEL UP
// =========================================

function checkLevelUp() {

    if (paused) {
        return;
    }


    if (xp >= xpNeeded) {

        xp -= xpNeeded;

        level += 1;


        // Each level needs 35% more XP
        xpNeeded =
            Math.floor(
                xpNeeded * 1.35
            );


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

            player.fireRate *= 1.20;

        }
    },


    {
        name:
            "Heavy Bullets",

        description:
            "+1 bullet damage",

        apply() {

            player.damage += 1;

        }
    },


    {
        name:
            "Speed Boost",

        description:
            "+12% movement speed",

        apply() {

            player.speed *= 1.12;

        }
    },


    {
        name:
            "Vitality",

        description:
            "+25 maximum health and heal 25 HP",

        apply() {

            player.maxHealth += 25;

            player.health =
                Math.min(
                    player.health + 25,
                    player.maxHealth
                );

        }
    },


    {
        name:
            "First Aid",

        description:
            "Restore 40% of maximum health",

        apply() {

            player.health +=
                player.maxHealth * 0.40;


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

            player.bulletSpeed *= 1.25;

        }
    }

];


// =========================================
// GET RANDOM UPGRADES
// =========================================

function getUpgradeChoices() {

    const available =
        [...upgrades];


    const choices = [];


    while (
        choices.length < 3 &&
        available.length > 0
    ) {

        const randomIndex =
            Math.floor(
                Math.random() *
                available.length
            );


        choices.push(
            available[randomIndex]
        );


        available.splice(
            randomIndex,
            1
        );

    }


    return choices;

}


// =========================================
// OPEN LEVEL-UP MENU
// =========================================

function openUpgradeMenu() {

    paused = true;


    upgradeLevel.textContent =
        level;


    upgradeButtons.innerHTML =
        "";


    const choices =
        getUpgradeChoices();


    for (const upgrade of choices) {

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


        button.addEventListener(
            "click",
            () => selectUpgrade(upgrade)
        );


        upgradeButtons.appendChild(
            button
        );

    }


    upgradeMenu.classList.remove(
        "hidden"
    );

}


// =========================================
// SELECT UPGRADE
// =========================================

function selectUpgrade(upgrade) {

    upgrade.apply();


    upgradeMenu.classList.add(
        "hidden"
    );


    paused = false;


    updateHUD();


    // Player could have earned enough
    // XP for multiple levels
    if (xp >= xpNeeded) {

        checkLevelUp();

    }

}


// =========================================
// PARTICLES
// =========================================

function createParticles(
    x,
    y,
    amount
) {

    for (
        let i = 0;
        i < amount;
        i++
    ) {

        const angle =
            Math.random() *
            Math.PI * 2;


        const speed =
            Math.random() * 3 + 1;


        particles.push({

            x: x,
            y: y,

            dx:
                Math.cos(angle) *
                speed,

            dy:
                Math.sin(angle) *
                speed,

            life: 25,

            radius:
                Math.random() * 3 + 2

        });

    }

}


// =========================================
// UPDATE PARTICLES
// =========================================

function updateParticles() {

    for (
        let i = particles.length - 1;
        i >= 0;
        i--
    ) {

        const particle =
            particles[i];


        particle.x +=
            particle.dx;

        particle.y +=
            particle.dy;


        particle.dx *= 0.95;
        particle.dy *= 0.95;


        particle.life--;


        if (particle.life <= 0) {

            particles.splice(
                i,
                1
            );

        }

    }

}


// =========================================
// DRAW BACKGROUND
// =========================================

function drawBackground() {

    ctx.fillStyle =
        "#162816";


    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    // Grid
    ctx.strokeStyle =
        "rgba(255,255,255,0.04)";

    ctx.lineWidth = 1;


    const gridSize = 50;


    for (
        let x = 0;
        x < canvas.width;
        x += gridSize
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
        y += gridSize
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
// DRAW PLAYER
// =========================================

function drawPlayer() {

    // Player body
    ctx.beginPath();

    ctx.arc(
        player.x,
        player.y,
        player.radius,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        player.color;

    ctx.fill();


    ctx.strokeStyle =
        "white";

    ctx.lineWidth = 3;

    ctx.stroke();


    // Gun
    const angle =
        Math.atan2(
            mouse.y - player.y,
            mouse.x - player.x
        );


    ctx.beginPath();

    ctx.moveTo(
        player.x,
        player.y
    );

    ctx.lineTo(
        player.x +
        Math.cos(angle) *
        35,

        player.y +
        Math.sin(angle) *
        35
    );


    ctx.strokeStyle =
        "#eeeeee";

    ctx.lineWidth = 7;

    ctx.lineCap =
        "round";

    ctx.stroke();


    ctx.lineCap =
        "butt";

}


// =========================================
// DRAW BULLETS
// =========================================

function drawBullets() {

    for (const bullet of bullets) {

        ctx.beginPath();

        ctx.arc(
            bullet.x,
            bullet.y,
            bullet.radius,
            0,
            Math.PI * 2
        );


        ctx.fillStyle =
            "#ffe23d";

        ctx.fill();


        ctx.shadowBlur = 12;

        ctx.shadowColor =
            "#ffe23d";

        ctx.fill();


        ctx.shadowBlur = 0;

    }

}


// =========================================
// DRAW ENEMIES
// =========================================

function drawEnemies() {

    for (const enemy of enemies) {

        // Body
        ctx.beginPath();

        ctx.arc(
            enemy.x,
            enemy.y,
            enemy.radius,
            0,
            Math.PI * 2
        );


        ctx.fillStyle =
            enemy.color;

        ctx.fill();


        ctx.strokeStyle =
            "#ff8888";

        ctx.lineWidth = 2;

        ctx.stroke();


        // Health bar
        const barWidth = 40;

        const barHeight = 6;


        const healthPercent =
            Math.max(
                0,
                enemy.health /
                enemy.maxHealth
            );


        ctx.fillStyle =
            "#222";


        ctx.fillRect(
            enemy.x -
            barWidth / 2,

            enemy.y - 30,

            barWidth,

            barHeight
        );


        ctx.fillStyle =
            "#50ff50";


        ctx.fillRect(
            enemy.x -
            barWidth / 2,

            enemy.y - 30,

            barWidth *
            healthPercent,

            barHeight
        );

    }

}


// =========================================
// DRAW XP
// =========================================

function drawXPOrbs() {

    for (const orb of xpOrbs) {

        const pulseAmount =
            Math.sin(
                orb.pulse
            ) * 2;


        ctx.beginPath();


        ctx.arc(
            orb.x,
            orb.y,

            orb.radius +
            pulseAmount,

            0,
            Math.PI * 2
        );


        ctx.fillStyle =
            "#6dff45";


        ctx.shadowBlur = 15;

        ctx.shadowColor =
            "#6dff45";


        ctx.fill();


        ctx.shadowBlur = 0;


        ctx.strokeStyle =
            "white";

        ctx.lineWidth = 1;

        ctx.stroke();

    }

}


// =========================================
// DRAW PARTICLES
// =========================================

function drawParticles() {

    for (const particle of particles) {

        ctx.globalAlpha =
            particle.life / 25;


        ctx.beginPath();


        ctx.arc(
            particle.x,
            particle.y,
            particle.radius,
            0,
            Math.PI * 2
        );


        ctx.fillStyle =
            "white";


        ctx.fill();

    }


    ctx.globalAlpha = 1;

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
        player.fireRate.toFixed(1);


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

    gameRunning = false;


    finalLevel.textContent =
        level;


    finalKills.textContent =
        kills;


    finalScore.textContent =
        score;


    finalTime.textContent =
        survivalTime;


    gameOverMenu.classList.remove(
        "hidden"
    );

}


// =========================================
// RESTART
// =========================================

function restartGame() {

    gameRunning = true;

    paused = false;


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
        canvas.width / 2;

    player.y =
        canvas.height / 2;


    player.speed = 5;


    player.health = 100;

    player.maxHealth = 100;


    player.damage = 1;


    player.bulletSpeed = 11;


    player.fireRate = 5;


    player.lastShot = 0;


    gameOverMenu.classList.add(
        "hidden"
    );


    upgradeMenu.classList.add(
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
// ENEMY SPAWN TIMER
// =========================================

setInterval(
    () => {

        if (
            !gameRunning ||
            paused
        ) {

            return;

        }


        // Base enemy
        spawnEnemy();


        // More enemies later
        if (survivalTime >= 25) {

            spawnEnemy();

        }


        if (survivalTime >= 60) {

            spawnEnemy();

        }


        if (survivalTime >= 120) {

            spawnEnemy();

        }


        if (survivalTime >= 180) {

            spawnEnemy();

        }

    },

    900
);


// =========================================
// GAME TIMER
// =========================================

setInterval(
    () => {

        if (
            !gameRunning ||
            paused
        ) {

            return;

        }


        survivalTime += 1;

        score += 10;

    },

    1000
);


// =========================================
// GAME LOOP
// =========================================

function gameLoop(timestamp) {

    if (!gameRunning) {
        return;
    }


    drawBackground();


    if (!paused) {

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
// START
// =========================================

updateHUD();

requestAnimationFrame(
    gameLoop
);
