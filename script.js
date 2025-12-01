// Game Constants
const CANVAS_WIDTH = window.innerWidth > 500 ? 500 : window.innerWidth;
const CANVAS_HEIGHT = window.innerHeight > 900 ? 900 : window.innerHeight;
const PLAYER_SIZE = 50;
const OBSTACLE_SIZE = 40;
const MAX_STAGES = 10;
const ITEMS_PER_STAGE = 20;

const STAGE_COLORS = [
    "linear-gradient(to bottom, #87CEEB 0%, #E0F7FA 100%)", // Stage 1 (Default)
    "linear-gradient(to bottom, #90EE90 0%, #F0FFF0 100%)", // Stage 2 (Green)
    "linear-gradient(to bottom, #FFB6C1 0%, #FFF0F5 100%)", // Stage 3 (Pink)
    "linear-gradient(to bottom, #FFD700 0%, #FFFFE0 100%)", // Stage 4 (Gold)
    "linear-gradient(to bottom, #FFA07A 0%, #FFE4E1 100%)", // Stage 5 (Orange)
    "linear-gradient(to bottom, #DDA0DD 0%, #F8F8FF 100%)", // Stage 6 (Plum)
    "linear-gradient(to bottom, #FF6347 0%, #FFE4E1 100%)", // Stage 7 (Tomato)
    "linear-gradient(to bottom, #40E0D0 0%, #E0FFFF 100%)", // Stage 8 (Turquoise)
    "linear-gradient(to bottom, #9370DB 0%, #E6E6FA 100%)", // Stage 9 (Purple)
    "linear-gradient(to bottom, #FF4500 0%, #FFDAB9 100%)"  // Stage 10 (Red-Orange)
];

// Game State
let canvas, ctx;
let gameLoopId;
let lastTime = 0;
let score = 0;
let stage = 1;
let itemsDodgedInStage = 0;
let isGameOver = false;
let isVictory = false;

// Collision Effect State
let isColliding = false;
let collisionTime = 0;
let shakeIntensity = 0;
let flashOpacity = 0;

// Entities
let player = {
    x: CANVAS_WIDTH / 2 - PLAYER_SIZE / 2,
    y: CANVAS_HEIGHT - PLAYER_SIZE - 20,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    speed: 300, // pixels per second
    isImage: false,
    emoji: '🦈' // Default
};
// player.img.src = player.src; // Removed image loading

let obstacles = [];
let obstacleSpeed = 200; // Initial speed
let spawnRate = 1000; // ms
let lastSpawnTime = 0;
let obstacleEmoji = '💩'; // Default

// User Settings
let playerName = "익명";

// DOM Elements
const screens = {
    start: document.getElementById('start-screen'),
    // game container is not a screen to be hidden/shown, it's the parent
    gameOver: document.getElementById('game-over-screen'),
    victory: document.getElementById('victory-screen'),
    leaderboard: document.getElementById('leaderboard-screen')
};

const hud = {
    container: document.getElementById('hud'),
    stage: document.getElementById('stage-display'),
    score: document.getElementById('score-display')
};

// Initialization
window.onload = () => {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    setupEventListeners();
    loadLeaderboard();
};

function setupEventListeners() {
    // Character Selection
    document.querySelectorAll('.char-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.char-btn').forEach(b => b.classList.remove('selected'));
            const target = e.currentTarget; // Use currentTarget to ensure we get the button, not child
            target.classList.add('selected');

            player.isImage = false;
            player.emoji = target.dataset.char;
        });
    });

    // Obstacle Selection
    document.querySelectorAll('.obs-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.obs-btn').forEach(b => b.classList.remove('selected'));
            const target = e.currentTarget;
            target.classList.add('selected');
            obstacleEmoji = target.dataset.obs;
        });
    });

    // Buttons
    document.getElementById('start-btn').addEventListener('click', startGame);
    document.getElementById('restart-btn').addEventListener('click', resetGame);
    document.getElementById('home-btn').addEventListener('click', goHome);
    document.getElementById('quit-btn').addEventListener('click', quitGame);
    document.getElementById('victory-home-btn').addEventListener('click', goHome);
    document.getElementById('show-leaderboard-btn').addEventListener('click', showLeaderboard);
    document.getElementById('leaderboard-back-btn').addEventListener('click', () => showScreen('start'));

    // Input
    document.getElementById('player-name').addEventListener('input', (e) => {
        playerName = e.target.value.trim() || "익명";
    });

    // Controls
    window.addEventListener('keydown', handleInput);
    window.addEventListener('keyup', handleInputUp);

    // Touch Controls (Simple left/right based on screen side)
    canvas.addEventListener('touchstart', handleTouch);
    canvas.addEventListener('touchend', handleTouchEnd);

    // Mobile Control Buttons
    const leftBtn = document.getElementById('left-btn');
    const rightBtn = document.getElementById('right-btn');

    leftBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        touchInput = -1;
    });

    leftBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        touchInput = 0;
    });

    rightBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        touchInput = 1;
    });

    rightBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        touchInput = 0;
    });

    // Also support mouse events for testing on desktop
    leftBtn.addEventListener('mousedown', () => touchInput = -1);
    leftBtn.addEventListener('mouseup', () => touchInput = 0);
    leftBtn.addEventListener('mouseleave', () => touchInput = 0);

    rightBtn.addEventListener('mousedown', () => touchInput = 1);
    rightBtn.addEventListener('mouseup', () => touchInput = 0);
    rightBtn.addEventListener('mouseleave', () => touchInput = 0);
}

// Input Handling
let keys = {};
let touchInput = 0; // -1 left, 1 right, 0 none

function handleInput(e) {
    keys[e.code] = true;
}

function handleInputUp(e) {
    keys[e.code] = false;
}

function handleTouch(e) {
    e.preventDefault();
    const touchX = e.touches[0].clientX;
    const rect = canvas.getBoundingClientRect();
    const relativeX = touchX - rect.left;

    if (relativeX < CANVAS_WIDTH / 2) {
        touchInput = -1;
    } else {
        touchInput = 1;
    }
}

function handleTouchEnd(e) {
    e.preventDefault();
    touchInput = 0;
}

// Game Logic
function startGame() {
    const nameInput = document.getElementById('player-name').value.trim();
    if (nameInput) playerName = nameInput;

    resetGameState();
    showScreen('game');
    hud.container.classList.remove('hidden');
    document.getElementById('mobile-controls').classList.remove('hidden');

    lastTime = performance.now();
    gameLoopId = requestAnimationFrame(gameLoop);
}

function resetGameState() {
    score = 0;
    stage = 1;
    itemsDodgedInStage = 0;
    isGameOver = false;
    isVictory = false;
    obstacles = [];
    obstacleSpeed = 200;
    spawnRate = 1000;

    // Reset collision effects
    isColliding = false;
    collisionTime = 0;
    shakeIntensity = 0;
    flashOpacity = 0;
    collisionParticles = [];

    player.x = CANVAS_WIDTH / 2 - PLAYER_SIZE / 2;

    // Reset Background
    canvas.style.background = STAGE_COLORS[0];
    initBackground();

    updateHUD();
}

function gameLoop(timestamp) {
    if (isGameOver || isVictory) return;

    const deltaTime = (timestamp - lastTime) / 1000; // seconds
    lastTime = timestamp;

    update(deltaTime);
    updateBackground(deltaTime);
    updateCollisionParticles(deltaTime);
    draw();

    gameLoopId = requestAnimationFrame(gameLoop);
}

function update(deltaTime) {
    // Player Movement
    let moveDir = 0;
    if (keys['ArrowLeft'] || touchInput === -1) moveDir = -1;
    if (keys['ArrowRight'] || touchInput === 1) moveDir = 1;

    player.x += moveDir * player.speed * deltaTime;

    // Boundary Check
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > CANVAS_WIDTH) player.x = CANVAS_WIDTH - player.width;

    // Obstacle Spawning
    if (lastTime - lastSpawnTime > spawnRate) {
        spawnObstacle();
        lastSpawnTime = lastTime;
    }

    // Obstacle Update
    for (let i = obstacles.length - 1; i >= 0; i--) {
        let obs = obstacles[i];
        obs.y += obstacleSpeed * deltaTime;

        // Collision Detection
        if (!isColliding && checkCollision(player, obs)) {
            triggerCollisionEffect();
            // Store collision position for particle effect
            obs.collided = true;
            obs.collisionX = obs.x + obs.width / 2;
            obs.collisionY = obs.y + obs.height / 2;
            return;
        }

        // Remove if off screen
        if (obs.y > CANVAS_HEIGHT) {
            obstacles.splice(i, 1);
            score++;
            itemsDodgedInStage++;
            checkProgression();
            updateHUD();
        }
    }

    // Update collision effect
    if (isColliding) {
        collisionTime += deltaTime;

        // Screen shake effect
        shakeIntensity = Math.max(0, 15 - collisionTime * 30);

        // Flash effect
        flashOpacity = Math.max(0, 0.7 - collisionTime * 1.4);

        // End game after effect duration
        if (collisionTime > 0.5) {
            gameOver();
        }
    }
}

function spawnObstacle() {
    const size = Math.floor(Math.random() * (60 - 30 + 1)) + 30; // Random size 30-60
    const x = Math.random() * (CANVAS_WIDTH - size);
    obstacles.push({
        x: x,
        y: -size,
        width: size,
        height: size,
        emoji: obstacleEmoji
    });
}

function checkCollision(rect1, rect2) {
    // Shrink hitboxes slightly for fairer gameplay
    const padding = 10;
    return (
        rect1.x + padding < rect2.x + rect2.width - padding &&
        rect1.x + rect1.width - padding > rect2.x + padding &&
        rect1.y + padding < rect2.y + rect2.height - padding &&
        rect1.y + rect1.height - padding > rect2.y + padding
    );
}

function checkProgression() {
    if (itemsDodgedInStage >= ITEMS_PER_STAGE) {
        if (stage >= MAX_STAGES) {
            victory();
        } else {
            stage++;
            itemsDodgedInStage = 0;
            increaseDifficulty();
        }
    }
}

function triggerCollisionEffect() {
    isColliding = true;
    collisionTime = 0;
    shakeIntensity = 15;
    flashOpacity = 0.7;

    // Vibrate if supported (mobile devices)
    if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
    }

    // Create collision particles
    createCollisionParticles();
}

let collisionParticles = [];

function createCollisionParticles() {
    const centerX = player.x + player.width / 2;
    const centerY = player.y + player.height / 2;

    for (let i = 0; i < 20; i++) {
        const angle = (Math.PI * 2 * i) / 20;
        const speed = 150 + Math.random() * 100;
        collisionParticles.push({
            x: centerX,
            y: centerY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.0,
            size: 5 + Math.random() * 5
        });
    }
}

function updateCollisionParticles(deltaTime) {
    for (let i = collisionParticles.length - 1; i >= 0; i--) {
        const p = collisionParticles[i];
        p.x += p.vx * deltaTime;
        p.y += p.vy * deltaTime;
        p.life -= deltaTime * 2;

        if (p.life <= 0) {
            collisionParticles.splice(i, 1);
        }
    }
}

function increaseDifficulty() {
    obstacleSpeed += 50; // Increase speed
    spawnRate = Math.max(200, spawnRate - 80); // Spawn faster, min 200ms

    // Change background
    if (stage <= MAX_STAGES) {
        canvas.style.background = STAGE_COLORS[stage - 1];
    }
}

function updateHUD() {
    hud.stage.textContent = stage;
    hud.score.textContent = score;
}

function draw() {
    // Apply screen shake
    ctx.save();
    if (shakeIntensity > 0) {
        const shakeX = (Math.random() - 0.5) * shakeIntensity;
        const shakeY = (Math.random() - 0.5) * shakeIntensity;
        ctx.translate(shakeX, shakeY);
    }

    // Clear Canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw Background Particles
    drawBackground();

    // Add shadow for better visibility
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    // Draw Player (with collision effect)
    if (isColliding) {
        // Make player flash/blink
        if (Math.floor(collisionTime * 20) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
    }

    if (player.isImage && player.img.complete) {
        ctx.drawImage(player.img, player.x, player.y, player.width, player.height);
    } else {
        ctx.font = `${PLAYER_SIZE}px serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(player.emoji || '❓', player.x, player.y);
    }

    ctx.globalAlpha = 1.0;

    // Draw Obstacles
    for (let obs of obstacles) {
        ctx.font = `${obs.width}px serif`;
        ctx.fillText(obs.emoji, obs.x, obs.y);
    }

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Draw collision particles
    if (collisionParticles.length > 0) {
        ctx.fillStyle = '#FF6B6B';
        for (let p of collisionParticles) {
            ctx.globalAlpha = p.life;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;
    }

    ctx.restore();

    // Draw flash overlay (outside of shake transform)
    if (flashOpacity > 0) {
        ctx.fillStyle = `rgba(255, 0, 0, ${flashOpacity})`;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
}

// Background Particles
let bgParticles = [];
const PARTICLE_COUNT = 40;

function initBackground() {
    bgParticles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        bgParticles.push({
            x: Math.random() * CANVAS_WIDTH,
            y: Math.random() * CANVAS_HEIGHT,
            size: Math.random() * 30 + 10,
            speedMultiplier: Math.random() * 0.5 + 0.5, // 0.5 ~ 1.0
            opacity: Math.random() * 0.15 + 0.05 // Reduced opacity
        });
    }
}

function updateBackground(deltaTime) {
    for (let p of bgParticles) {
        // Move at a speed similar to obstacles
        p.y += obstacleSpeed * p.speedMultiplier * deltaTime;
        if (p.y > CANVAS_HEIGHT + p.size) {
            p.y = -p.size;
            p.x = Math.random() * CANVAS_WIDTH;
        }
    }
}

function drawBackground() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    for (let p of bgParticles) {
        ctx.globalAlpha = p.opacity;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1.0; // Reset opacity
}

function gameOver() {
    isGameOver = true;
    cancelAnimationFrame(gameLoopId);
    saveScore();

    document.getElementById('final-score').textContent = score;
    document.getElementById('final-stage').textContent = stage;
    showScreen('gameOver');
}

function victory() {
    isVictory = true;
    cancelAnimationFrame(gameLoopId);
    saveScore();

    document.getElementById('victory-score').textContent = score;
    showScreen('victory');
}

function saveScore() {
    const highScores = JSON.parse(localStorage.getItem('poopDodgeScores')) || [];
    highScores.push({
        name: playerName,
        score: score,
        stage: stage,
        date: new Date().toLocaleDateString()
    });

    // Sort by score desc
    highScores.sort((a, b) => b.score - a.score);

    // Keep top 10
    if (highScores.length > 10) highScores.length = 10;

    localStorage.setItem('poopDodgeScores', JSON.stringify(highScores));
}

function loadLeaderboard() {
    const list = document.getElementById('leaderboard-list');
    list.innerHTML = '';

    const highScores = JSON.parse(localStorage.getItem('poopDodgeScores')) || [];

    if (highScores.length === 0) {
        list.innerHTML = '<li class="leaderboard-item">아직 기록이 없어요!</li>';
        return;
    }

    highScores.forEach((entry, index) => {
        const li = document.createElement('li');
        li.className = `leaderboard-item rank-${index + 1}`;
        li.innerHTML = `
            <span>${index + 1}. ${entry.name}</span>
            <span>${entry.stage}단계 (${entry.score}점)</span>
        `;
        list.appendChild(li);
    });
}

function showLeaderboard() {
    loadLeaderboard();
    showScreen('leaderboard');
}

function resetGame() {
    startGame();
}

function quitGame() {
    isGameOver = true; // Stop the loop
    cancelAnimationFrame(gameLoopId);
    saveScore(); // Save current progress
    goHome(); // Return to start screen
}

function goHome() {
    showScreen('start');
    hud.container.classList.add('hidden');
    document.getElementById('mobile-controls').classList.add('hidden');
}

function showScreen(screenName) {
    // Hide all screens
    Object.values(screens).forEach(s => {
        if (s && s.classList) s.classList.add('hidden');
    });

    // Show target screen
    if (screenName === 'game') {
        // No overlay for game, just canvas visible (which is always behind)
        // But we need to hide start/gameover/etc
    } else if (screens[screenName]) {
        screens[screenName].classList.remove('hidden');
    }
}
