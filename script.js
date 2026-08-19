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