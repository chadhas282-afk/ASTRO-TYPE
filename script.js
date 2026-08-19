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
