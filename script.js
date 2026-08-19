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