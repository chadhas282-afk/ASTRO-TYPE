const WORDS = [
    "ion", "nova", "warp", "core", "fuel", "boost", "star", "dust", "moon", "wave",
    "jet", "dark", "fire", "void", "storm", "solar", "lunar", "orbit", "comet", "plasma",
    "photon", "laser", "rocket", "meteor", "nebula", "galaxy", "pulsar", "quasar", "eclipse", "cosmos",
    "planet", "drone", "probe", "radar", "signal", "beacon", "engine", "target", "system", "mission",
    "launch", "capsule", "station", "gravity", "oxygen", "stellar", "shield", "module", "thruster", "momentum",
    "telescope", "satellite", "asteroid", "universe"
];

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const DPR = Math.min(window.devicePixelRatio || 1, 2);

const scoreEl = document.getElementById("score");
const levelEl = document.getElementById("level");
const comboEl = document.getElementById("combo");
const livesEl = document.getElementById("lives");
const bufferEl = document.getElementById("buffer");
const startScreen = document.getElementById("start-screen");
const gameoverScreen = document.getElementById("gameover-screen");
const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");
const diffBtns = document.querySelectorAll(".diff-btn");

const finalScoreEl = document.getElementById("final-score");
const finalWpmEl = document.getElementById("final-wpm");
const finalAccEl = document.getElementById("final-acc");
const finalLevelEl = document.getElementById("final-level");
const finalComboEl = document.getElementById("final-combo");
const bestEl = document.getElementById("best");

const ACCENT = "#e2b714";
const WHITE = "#e3e6ee";
const SUB = "#6b7285";
const DANGER = "#ff5d5d";
const DAMAGE_LINE_OFFSET = 96;

let W = 0;
let H = 0;

let state = "menu";
let score = 0;
let level = 1;
let lives = 3;
let kills = 0;
let buffer = "";
let spawnTimer = 0;
let asteroids = [];
let particles = [];
let stars = [];
let shipX = 0;
let startTime = 0;
let keystrokesTotal = 0;
let keystrokesCorrect = 0;
let shake = 0;
let lastTime = 0;

let shots = [];
let muzzleFlash = 0;
let screenFlash = 0;
let levelUpTimer = 0;
let combo = 0;
let maxCombo = 0;
let perfectWord = true;
let spawnWarnings = [];

let difficulty = "medium";

const DIFF_SPEED = {
    easy: 0.6,
    medium: 1.0,
    hard: 1.5
};

function resize() {
    const rect = document.getElementById("game").getBoundingClientRect();
    const w = rect.width - 36;
    const h = rect.height - 36 - 90 - 44;
    canvas.width = Math.max(1, w * DPR);
    canvas.height = Math.max(1, h * DPR);
     canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    W = w;
    H = h;
    shipX = W / 2;
    makeStars();
}

function makeStars() {
    stars = [];
    const count = Math.floor((W * H) / 4500);
    for (let i = 0; i < count; i++) {
        stars.push({
            x: Math.random() * W,
            y: Math.random() * H,
            r: Math.random() * 1.6 + 0.3,
            phase: Math.random() * Math.PI * 2,
            speed: Math.random() * 2 + 1
        });
    }
}

function randomWord() {
    return WORDS[Math.floor(Math.random() * WORDS.length)];
}

function spawnInterval() {
    return Math.max(0.65, 2.4 - (level - 1) * 0.16);
}

function asteroidSpeed() {
    return (46 + level * 13) * (0.8 + Math.random() * 0.45) * DIFF_SPEED[difficulty];
}

function spawnAsteroid() {
    const word = randomWord();
    const r = 20 + word.length * 5.5;
    asteroids.push({
        x: r + 14 + Math.random() * Math.max(10, W - 2 * r - 28),
         y: -r,
        r: r,
        vy: asteroidSpeed(),
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.04,
        wob: Math.random() * Math.PI * 2,
        word: word,
        seed: Math.floor(Math.random() * 1000)
    });
}

function activeAsteroid() {
    let best = null;
    for (const a of asteroids) {
        if (a.word.startsWith(buffer)) {
            if (!best || a.y > best.y) best = a;
        }
    }
    return best;
}

function explode(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 60 + Math.random() * 260;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0.5 + Math.random() * 0.5,
            maxLife: 1,
            r: 1.5 + Math.random() * 3,
            color: Math.random() < 0.6 ? color : WHITE
        });
    }
}

function fireShot(targetX, targetY) {
    const shipY = H - 58;
    shots.push({
        x: shipX,
        y: shipY,
        targetX: targetX,
        targetY: targetY,
        life: 0.18,
        maxLife: 0.18,
        trail: []
    });
    muzzleFlash = 0.12;
}

function updateShots(dt) {
    for (const s of shots) {
        s.life -= dt;
        const t = 1 - s.life / s.maxLife;
        s.trail.push({ x: s.x + (s.targetX - s.x) * t, y: s.y + (s.targetY - s.y) * t, life: 0.25 });
        if (s.trail.length > 12) s.trail.shift();
        for (const pt of s.trail) pt.life -= dt;
        s.trail = s.trail.filter(pt => pt.life > 0);
    }
    shots = shots.filter(s => s.life > 0);

    if (muzzleFlash > 0) muzzleFlash -= dt;
}

function drawShots() {
    for (const s of shots) {
        const t = 1 - s.life / s.maxLife;
        const cx = s.x + (s.targetX - s.x) * t;
        const cy = s.y + (s.targetY - s.y) * t;

        ctx.strokeStyle = ACCENT;
        ctx.lineWidth = 3;
        ctx.shadowColor = ACCENT;
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(cx, cy);
        ctx.stroke();

        for (const pt of s.trail) {
            ctx.globalAlpha = pt.life / 0.25;
            ctx.fillStyle = ACCENT;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
    ctx.shadowBlur = 0;

    if (muzzleFlash > 0) {
        const shipY = H - 58;
        const alpha = muzzleFlash / 0.12;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = ACCENT;
        ctx.shadowColor = ACCENT;
        ctx.shadowBlur = 24;
        ctx.beginPath();
        ctx.moveTo(shipX - 8, shipY + 18);
        ctx.lineTo(shipX + 8, shipY + 18);
        ctx.lineTo(shipX, shipY + 18 + 30);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }
}

function shockwave(x, y, color) {
    particles.push({
        x: x, y: y,
        vx: 0, vy: 0,
        life: 0.6,
        maxLife: 0.6,
        r: 0,
        maxR: 120,
        color: color,
        type: "shockwave"
         });
}

function levelUpEffect() {
    levelUpTimer = 1.5;
    for (let i = 0; i < 30; i++) {
        const angle = (i / 30) * Math.PI * 2;
        particles.push({
            x: W / 2, y: H - 58,
            vx: Math.cos(angle) * (200 + Math.random() * 100),
            vy: Math.sin(angle) * (200 + Math.random() * 100),
            life: 1.2, maxLife: 1.2,
            r: 3 + Math.random() * 3,
            color: Math.random() < 0.5 ? ACCENT : "#ffd700",
            type: "levelup"
        });
    }
    screenFlash = 0.3;
}

function updateShockwaves(dt) {
    for (const p of particles) {
        if (p.type === "shockwave") {
            p.life -= dt;
            p.r = p.maxR * (1 - p.life / p.maxLife);
        }
    }
}

function drawShockwaves() {
    for (const p of particles) {
        if (p.type === "shockwave" && p.life > 0) {
            const alpha = p.life / p.maxLife;
            ctx.globalAlpha = alpha * 0.6;
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 3;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
        }
    }
}

function updateSpawnWarnings(dt) {
    for (const w of spawnWarnings) w.t -= dt;
    spawnWarnings = spawnWarnings.filter(w => w.t > 0);
}

function drawSpawnWarnings() {
    for (const w of spawnWarnings) {
        const alpha = Math.min(1, w.t * 2);
        ctx.globalAlpha = alpha * 0.4;
        ctx.strokeStyle = DANGER;
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.moveTo(w.x, 0);
        ctx.lineTo(w.x, 60);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = DANGER;
        ctx.font = "600 10px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText("INCOMING", w.x, 70);
        ctx.globalAlpha = 1;
    }
}

function destroyAsteroid(a) {
    fireShot(a.x, a.y);
    explode(a.x, a.y, ACCENT, 22);
    shockwave(a.x, a.y, ACCENT);
    const gained = a.word.length * 10;
    score += gained;
    kills++;
    asteroids = asteroids.filter((x) => x !== a);
    buffer = "";
    screenFlash = 0.1;

    if (kills % 8 === 0) {
        level++;
        levelUpEffect();
    }
    updateHUD();
}

function hitShip() {
    lives--;
    shake = 12;
    if (lives <= 0) {
        endGame();
    }
}

function damageAsteroid(a) {
    explode(a.x, a.y, DANGER, 16);
    asteroids = asteroids.filter((x) => x !== a);
    hitShip();
}

function setState(s) {
    state = s;
}

function startGame() {
    score = 0;
    level = 1;
    lives = 3;
    kills = 0;
    combo = 0;
    maxCombo = 0;
    buffer = "";
    asteroids = [];
    particles = [];
    spawnWarnings = [];
    spawnTimer = 1.2;
     keystrokesTotal = 0;
    keystrokesCorrect = 0;
    shake = 0;
    screenFlash = 0;
    levelUpTimer = 0;
    perfectWord = true;
    startTime = performance.now();

    startScreen.hidden = true;
    gameoverScreen.hidden = true;
    setState("playing");

    updateHUD();
    renderBuffer();
}

function endGame() {
    setState("gameover");

    const elapsed = Math.max((performance.now() - startTime) / 60000, 1 / 60);
    const wpm = Math.round((keystrokesCorrect / 5) / elapsed);
    const accuracy = keystrokesTotal > 0 ? Math.round((keystrokesCorrect / keystrokesTotal) * 100) : 100;

    finalScoreEl.textContent = score;
    finalWpmEl.textContent = wpm;
    finalAccEl.textContent = accuracy + "%";
    finalLevelEl.textContent = level;
    finalComboEl.textContent = maxCombo;

    const best = Math.max(score, Number(localStorage.getItem("astrotype-best") || 0));
    localStorage.setItem("astrotype-best", best);
    bestEl.textContent = "Best: " + best;

    gameoverScreen.hidden = false;
}

function updateHUD() {
    scoreEl.textContent = score;
    levelEl.textContent = level;
    comboEl.textContent = combo;
    livesEl.textContent = "\u2665".repeat(Math.max(0, lives)) + "\u2661".repeat(Math.max(0, 3 - lives));
}

function renderBuffer() {
    const active = activeAsteroid();
    if (state !== "playing") {
        bufferEl.innerHTML = "type the words on the asteroids";
        return;
    }
    if (buffer.length === 0) {
        bufferEl.innerHTML = "type the word on an asteroid to fire!";
        return;
    }
    let html = "";
    for (const ch of buffer) {
        html += '<span class="typed">' + ch + "</span>";
    }
    if (active) {
        const rest = active.word.slice(buffer.length);
        html += '<span>' + rest + "</span>";
    }
    bufferEl.innerHTML = html;
}

function handleTyping(key) {
    if (/^[a-z]$/.test(key)) {
        keystrokesTotal++;
        const trial = buffer + key;
        let best = null;
        for (const a of asteroids) {
            if (a.word.startsWith(trial)) {
                if (!best || a.y > best.y) best = a;
            }
        }
        if (best) {
            keystrokesCorrect++;
            buffer = trial;
            if (buffer === best.word) {
                if (perfectWord) {
                    combo++;
                    maxCombo = Math.max(maxCombo, combo);
                } else {
                    combo = 0;
                }
                perfectWord = true;
                destroyAsteroid(best);
            }
        } else {
            perfectWord = false;
            triggerWrongFlash();
        }
    } else if (key === "Backspace" && buffer.length > 0) {
        buffer = buffer.slice(0, -1);
        perfectWord = false;
    }
    renderBuffer();
}

function drawStars(time) {
    for (const s of stars) {
        const twinkle = 0.4 + 0.6 * Math.abs(Math.sin(time * 0.001 * s.speed + s.phase));
        ctx.globalAlpha = twinkle;
        ctx.fillStyle = WHITE;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

let wrongFlashTimer = 0;

function triggerWrongFlash() {
    wrongFlashTimer = 0.15;
}

function drawAsteroid(a) {
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.rot);

    const n = 9;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
        const angle = (i / n) * Math.PI * 2;
        const rr = a.r * (0.78 + 0.22 * Math.sin(a.seed + i * 1.7 + a.wob));
        const px = Math.cos(angle) * rr;
        const py = Math.sin(angle) * rr;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    
    const isActive = a === activeAsteroid();
    if (isActive && wrongFlashTimer > 0) {
        ctx.fillStyle = "rgba(255, 93, 93, 0.4)";
        ctx.shadowColor = DANGER;
        ctx.shadowBlur = 20;
    } else {
        ctx.fillStyle = "#232a3d";
    }
    ctx.fill();
    ctx.strokeStyle = "#3a4260";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();

    const progress = isActive ? buffer.length : 0;
    const prefix = a.word.slice(0, progress);
    const rest = a.word.slice(progress);
    ctx.font = '600 ' + Math.min(19, a.r * 0.62) + 'px "JetBrains Mono", monospace';
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const pw = ctx.measureText(prefix).width;
    const rw = ctx.measureText(rest).width;
    const total = pw + rw;
    const x0 = a.x - total / 2;

    ctx.fillStyle = WHITE;
    ctx.fillText(rest, x0 + pw, a.y);
    ctx.fillStyle = ACCENT;
    ctx.fillText(prefix, x0, a.y);

    if (isActive) {
        const lineY = a.y + ctx.measureText(prefix).width * 0 + 12;
        ctx.strokeStyle = ACCENT;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x0, lineY + a.r * 0.28);
        ctx.lineTo(x0 + total, lineY + a.r * 0.28);
        ctx.stroke();
    }
}

function drawShip(time) {
    const y = H - 58;
    const flameLen = 16 + Math.sin(time * 0.02) * 6 + Math.random() * 4;

    ctx.save();
    ctx.translate(shipX, y);

    ctx.fillStyle = "rgba(226,183,20,0.35)";
    ctx.beginPath();
    ctx.moveTo(-7, 18);
    ctx.lineTo(7, 18);
    ctx.lineTo(0, 18 + flameLen);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#3a4260";
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(-20, 20);
    ctx.lineTo(20, 20);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#5b6aa0";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = ACCENT;
    ctx.beginPath();
    ctx.arc(0, -4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.setLineDash([6, 10]);
    ctx.strokeStyle = "rgba(107,114,133,0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, H - DAMAGE_LINE_OFFSET);
    ctx.lineTo(W, H - DAMAGE_LINE_OFFSET);
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawParticles(dt) {
    for (const p of particles) {
        if (p.type === "shockwave" || p.type === "levelup") continue;
        p.life -= dt;
        if (p.life <= 0) continue;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.96;
        p.vy *= 0.96;
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
    particles = particles.filter((p) => p.life > 0);
}

function update(dt) {
    if (state !== "playing") return;

    spawnTimer -= dt;
    if (spawnTimer <= 0) {
        const x = Math.random() * (W * 0.8) + W * 0.1;
        spawnWarnings.push({ x: x, t: 0.8 });
        setTimeout(() => {
            if (state === "playing") {
                const word = randomWord();
                const r = 20 + word.length * 5.5;
                asteroids.push({
                    x: x, y: -r, r: r, vy: asteroidSpeed(),
                    rot: Math.random() * Math.PI * 2,
                    vr: (Math.random() - 0.5) * 0.04,
                    wob: Math.random() * Math.PI * 2, word: word,
                    seed: Math.floor(Math.random() * 1000)
                });
            }
        }, 800);
        spawnTimer = spawnInterval();
    }

    const damageLine = H - DAMAGE_LINE_OFFSET;
    for (const a of asteroids) {
        a.y += a.vy * dt;
        a.rot += a.vr * dt;
        a.wob += dt * 2;
        if (a.y + a.r >= damageLine) {
            damageAsteroid(a);
        }
    }

    updateShots(dt);
    updateShockwaves(dt);
    updateSpawnWarnings(dt);

    if (levelUpTimer > 0) levelUpTimer -= dt;
    if (screenFlash > 0) screenFlash -= dt;
    if (wrongFlashTimer > 0) wrongFlashTimer -= dt;
    if (shake > 0) shake *= Math.pow(0.02, dt);
}

function draw(dt, time) {
     ctx.save();

    ctx.clearRect(0, 0, W, H);

    ctx.fillStyle = "#131722";
    ctx.fillRect(0, 0, W, H);

    if (shake > 0.5) {
        ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    }

    drawStars(time);

    for (const a of asteroids) {
        drawAsteroid(a);
    }

    drawSpawnWarnings();
    drawShip(time);
    drawParticles(dt);
    drawShots();
    drawShockwaves();

    if (screenFlash > 0) {
        ctx.globalAlpha = screenFlash * 0.6;
        ctx.fillStyle = ACCENT;
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
    }

    if (levelUpTimer > 0) {
        const alpha = Math.min(1, levelUpTimer);
        ctx.globalAlpha = alpha * 0.9;
        ctx.fillStyle = ACCENT;
        ctx.font = "800 48px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.shadowColor = ACCENT;
        ctx.shadowBlur = 30;
        ctx.fillText("LEVEL " + level, W / 2, H / 2);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }

    if (state === "paused") {
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = "#0a0c12";
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
        ctx.fillStyle = ACCENT;
        ctx.font = "800 36px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.shadowColor = ACCENT;
        ctx.shadowBlur = 24;
        ctx.fillText("PAUSED", W / 2, H / 2 - 20);
        ctx.font = "600 14px 'JetBrains Mono', monospace";
        ctx.fillStyle = WHITE;
        ctx.fillText("Press ESC or SPACE to resume", W / 2, H / 2 + 28);
        ctx.shadowBlur = 0;
    }

    ctx.restore();
}

function loop(time) {
    const dt = Math.min(0.05, (time - lastTime) / 1000);
    lastTime = time;
    update(dt);
    draw(dt, time);
    requestAnimationFrame(loop);
}

document.addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    if (e.key === "Escape" && state === "playing") {
        setState("paused");
        return;
    }
    if (state === "paused") {
        if (e.key === "Escape" || e.key === " ") setState("playing");