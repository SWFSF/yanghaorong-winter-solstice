"use strict";

const BLESSINGS = [
  {
    id: "winter-peace",
    label: "冬安",
    lines: ["愿这一年的疲惫", "在热汤升起的那刻慢慢散去", "冬至安好", "记得好好吃饭"],
    signature: "冬夜很长，记得慢慢走 · 致杨皓蓉",
  },
  {
    id: "good-sleep",
    label: "好眠",
    lines: ["今夜最长", "也最适合把没做完的事先放下", "愿你关灯以后", "心里没有未落的雪"],
    signature: "今夜好好休息 · 致杨皓蓉",
  },
  {
    id: "leave-a-light",
    label: "留灯",
    lines: ["今年的冬天", "不必事事圆满", "愿你有热汤，有好眠", "也有一盏为你留的灯"],
    signature: "总有一盏灯，为你亮着 · 致杨皓蓉",
  },
  {
    id: "ease",
    label: "从容",
    lines: ["日子不必每天都用力", "允许自己慢一点、散一点", "在冬天里", "把心养得柔软"],
    signature: "慢一点，也很好 · 致杨皓蓉",
  },
  {
    id: "reunion",
    label: "相见",
    lines: ["愿你想念的人都在附近", "想说的话都有回应", "哪怕隔着很远", "也总有一盏灯替你留着"],
    signature: "想见的人，总会相见 · 致杨皓蓉",
  },
  {
    id: "journey",
    label: "远行",
    lines: ["愿你往后的路", "偶尔有风，却没有真正的寒", "想见的人能见到", "想做的事有回音"],
    signature: "去想去的地方 · 致杨皓蓉",
  },
  {
    id: "spring",
    label: "来春",
    lines: ["过了今夜", "白天会一寸一寸长回来", "愿你等的事有进展", "盼的春天不迟到"],
    signature: "春天正在回来的路上 · 致杨皓蓉",
  },
  {
    id: "always-safe",
    label: "常安",
    lines: ["最后不祝你万事胜意", "只愿你在漫长岁月里", "常有热饭、好梦", "和可以回去的地方"],
    signature: "冬至安好，愿你常安 · 致杨皓蓉",
  },
];

const CHINESE_NUMERALS = ["零", "一", "二", "三", "四", "五", "六", "七", "八"];
const PENTATONIC_NOTES = [261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25];
const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)");
const INTRO_DURATION = 15000;
const TITLE_START = 500;
const TITLE_STEP = 420;
const SUBTITLE_START = 5200;
const SUBTITLE_STEP = 170;
const INTRO_FROST_START = 2200;
const INTRO_FROST_PEAK = 6800;
const INTRO_FREEZE_START = 8200;
const INTRO_FREEZE_END = 12200;
const WIPE_DECAY_SECONDS = 4.5;

const elements = {
  atmosphere: document.querySelector("#atmosphere"),
  frostVeil: document.querySelector("#frostVeil"),
  frost: document.querySelector("#frost"),
  warmHaze: document.querySelector(".warm-haze"),
  iceCurtain: document.querySelector("#iceCurtain"),
  referenceAudio: document.querySelector("#referenceAudio"),
  stage: document.querySelector("#stage"),
  gateView: document.querySelector("#gateView"),
  introView: document.querySelector("#introView"),
  introTitle: document.querySelector("#introTitle"),
  introChars: [...document.querySelectorAll(".intro-title .char")],
  introSubtitleChars: [...document.querySelectorAll(".intro-subtitle span")],
  introWipeHint: document.querySelector("#introWipeHint"),
  skipIntroButton: document.querySelector("#skipIntroButton"),
  mapView: document.querySelector("#mapView"),
  letterView: document.querySelector("#letterView"),
  openButton: document.querySelector("#openButton"),
  soundToggle: document.querySelector("#soundToggle"),
  soundLabel: document.querySelector("#soundLabel"),
  nameSeal: document.querySelector("#nameSeal"),
  mapTitleTop: document.querySelector("#mapTitleTop"),
  mapTitleBottom: document.querySelector("#mapTitleBottom"),
  mapPrompt: document.querySelector("#mapPrompt"),
  progress: document.querySelector("#progress"),
  mapFooter: document.querySelector("#mapFooter"),
  completionActions: document.querySelector("#completionActions"),
  flakes: [...document.querySelectorAll("[data-blessing]")],
  letterFolio: document.querySelector("#letterFolio"),
  letterLines: document.querySelector("#letterLines"),
  letterQuote: document.querySelector("#letterQuote"),
  letterSignature: document.querySelector("#letterSignature"),
  previousButton: document.querySelector("#previousButton"),
  backButton: document.querySelector("#backButton"),
  nextButton: document.querySelector("#nextButton"),
  replayButton: document.querySelector("#replayButton"),
  refrostButton: document.querySelector("#refrostButton"),
  announcer: document.querySelector("#announcer"),
};

const state = {
  view: "gate",
  currentBlessing: 0,
  read: new Set(),
  gateRevealed: false,
  introStartedAt: 0,
  introFinished: false,
  introSkippable: false,
  transitioning: false,
  frostDragDistance: 0,
  pointerDown: false,
  lastPointer: null,
  soundEnabled: true,
  chimeSupported: "AudioContext" in window || "webkitAudioContext" in window,
  backgroundMusicFailed: false,
  parallaxX: 0,
  parallaxY: 0,
  targetParallaxX: 0,
  targetParallaxY: 0,
};

const atmosphereContext = elements.atmosphere.getContext("2d", { alpha: false });
const frostVeilContext = elements.frostVeil.getContext("2d");
const frostContext = elements.frost.getContext("2d");
const backdropCanvas = document.createElement("canvas");
const backdropContext = backdropCanvas.getContext("2d", { alpha: false });
const frostBaseCanvas = document.createElement("canvas");
const frostBaseContext = frostBaseCanvas.getContext("2d");
const wipeMaskCanvas = document.createElement("canvas");
const wipeMaskContext = wipeMaskCanvas.getContext("2d");
let audioContext = null;
let width = 0;
let height = 0;
let dpr = 1;
let stars = [];
let snowflakes = [];
let frostSeed = 20261222;
let frostGridWidth = 0;
let frostGridHeight = 0;
let wipeGrid = null;
let wipeImageData = null;
let wipeDirty = false;
let audioFadeFrame = 0;
let animationFrame = 0;
let lastFrame = 0;
let isDocumentVisible = !document.hidden;

function seededRandom(seed) {
  return function random() {
    let value = (seed |= 0);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function setupCanvas(canvas, context) {
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function createScene() {
  const random = seededRandom(640434);
  const starCount = Math.max(90, Math.min(230, Math.round((width * height) / 3600)));
  const snowCount = Math.max(32, Math.min(140, Math.round((width * height) / 6100)));

  stars = Array.from({ length: starCount }, () => ({
    x: random() * width,
    y: random() * height,
    radius: random() * random() * 1.35 + 0.2,
    opacity: 0.16 + random() * 0.55,
    phase: random() * Math.PI * 2,
    depth: 0.2 + random() * 0.8,
  }));

  snowflakes = Array.from({ length: snowCount }, () => {
    const depth = random();
    return {
      x: random() * width,
      y: random() * height,
      radius: 0.8 + Math.pow(depth, 1.55) * 3.7,
      speed: 7 + depth * 31,
      drift: 4 + random() * 15,
      phase: random() * Math.PI * 2,
      opacity: 0.28 + depth * 0.5,
    };
  });
}

function drawBackdrop() {
  backdropContext.clearRect(0, 0, width, height);

  let gradient = backdropContext.createRadialGradient(
    width * 0.73,
    height * 0.2,
    0,
    width * 0.7,
    height * 0.24,
    Math.max(width, height) * 0.76,
  );
  gradient.addColorStop(0, "#17384b");
  gradient.addColorStop(0.34, "#091a27");
  gradient.addColorStop(1, "#040912");
  backdropContext.fillStyle = gradient;
  backdropContext.fillRect(0, 0, width, height);

  gradient = backdropContext.createRadialGradient(
    width * 0.7,
    height * 0.18,
    0,
    width * 0.7,
    height * 0.18,
    Math.max(88, width * 0.28),
  );
  gradient.addColorStop(0, "rgba(209, 236, 248, 0.18)");
  gradient.addColorStop(1, "rgba(209, 236, 248, 0)");
  backdropContext.fillStyle = gradient;
  backdropContext.fillRect(0, 0, width, height);

  gradient = backdropContext.createRadialGradient(
    width * 0.7,
    height * 0.66,
    0,
    width * 0.7,
    height * 0.66,
    Math.max(width, height) * 0.62,
  );
  gradient.addColorStop(0, "rgba(229, 157, 82, 0.2)");
  gradient.addColorStop(0.38, "rgba(157, 88, 40, 0.07)");
  gradient.addColorStop(1, "rgba(157, 88, 40, 0)");
  backdropContext.fillStyle = gradient;
  backdropContext.fillRect(0, 0, width, height);
}

function paintBackdrop() {
  atmosphereContext.drawImage(backdropCanvas, 0, 0, width, height);
}

function drawStars(time) {
  for (const star of stars) {
    const twinkle = REDUCED_MOTION.matches
      ? 1
      : 0.74 + Math.sin(time * 0.0013 + star.phase) * 0.26;
    atmosphereContext.globalAlpha = star.opacity * twinkle;
    atmosphereContext.fillStyle = "#e6f4fb";
    atmosphereContext.beginPath();
    atmosphereContext.arc(
      star.x + state.parallaxX * star.depth,
      star.y + state.parallaxY * star.depth,
      star.radius,
      0,
      Math.PI * 2,
    );
    atmosphereContext.fill();
  }
  atmosphereContext.globalAlpha = 1;
}

function drawSnowflake(context, x, y, radius, opacity, rotation = 0) {
  context.save();
  context.translate(x, y);
  context.rotate(rotation);
  context.strokeStyle = `rgba(224, 242, 250, ${opacity})`;
  context.lineWidth = radius > 2.1 ? 0.8 : 0.6;
  context.beginPath();
  for (let branch = 0; branch < 6; branch += 1) {
    const angle = (branch * Math.PI) / 3;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    context.moveTo(0, 0);
    context.lineTo(cos * radius, sin * radius);
    if (radius > 2.2) {
      for (const position of [0.48, 0.74]) {
        const baseX = cos * radius * position;
        const baseY = sin * radius * position;
        const twig = radius * (position < 0.5 ? 0.32 : 0.2);
        for (const direction of [-1, 1]) {
          const twigAngle = angle + direction * (Math.PI / 3);
          context.moveTo(baseX, baseY);
          context.lineTo(baseX + Math.cos(twigAngle) * twig, baseY + Math.sin(twigAngle) * twig);
        }
      }
    }
  }
  context.stroke();
  context.restore();
}

function drawSnow(time, delta) {
  for (const flake of snowflakes) {
    if (!REDUCED_MOTION.matches) {
      flake.y += flake.speed * delta;
      if (flake.y > height + 7) {
        flake.y = -7;
        flake.x = Math.random() * width;
      }
    }
    const x =
      flake.x +
      Math.sin(time * 0.0007 + flake.phase) * flake.drift +
      state.parallaxX * (flake.radius / 3);
    const y = flake.y + state.parallaxY * (flake.radius / 3);
    if (flake.radius > 1.6) {
      drawSnowflake(
        atmosphereContext,
        x,
        y,
        flake.radius * 1.25,
        flake.opacity,
        REDUCED_MOTION.matches ? 0 : time * 0.00018 + flake.phase,
      );
    } else {
      atmosphereContext.globalAlpha = flake.opacity;
      atmosphereContext.fillStyle = "#eef8fc";
      atmosphereContext.beginPath();
      atmosphereContext.arc(x, y, flake.radius, 0, Math.PI * 2);
      atmosphereContext.fill();
    }
  }
  atmosphereContext.globalAlpha = 1;
}

function drawIceFrond(context, x, y, angle, length, depth, random) {
  const segments = Math.max(3, Math.floor(length / 8));
  let currentX = x;
  let currentY = y;
  const points = [];

  context.beginPath();
  context.moveTo(currentX, currentY);
  for (let index = 0; index < segments; index += 1) {
    angle += (random() - 0.5) * 0.25;
    currentX += Math.cos(angle) * 8;
    currentY += Math.sin(angle) * 8;
    context.lineTo(currentX, currentY);
    points.push([currentX, currentY, angle]);
  }
  context.lineWidth = 0.5;
  context.strokeStyle = "rgba(226, 245, 252, 0.27)";
  context.stroke();

  if (depth > 0) {
    for (let index = 2; index < points.length; index += 2) {
      const point = points[index];
      const branchLength = length * (0.27 - (index / segments) * 0.1);
      if (branchLength > 4) {
        drawIceFrond(context, point[0], point[1], point[2] + 1.02, branchLength, depth - 1, random);
        drawIceFrond(context, point[0], point[1], point[2] - 1.02, branchLength, depth - 1, random);
      }
    }
  }
}

function drawFrost() {
  const random = seededRandom(frostSeed);
  const context = frostBaseContext;
  context.clearRect(0, 0, width, height);
  context.lineCap = "round";
  context.lineJoin = "round";
  context.fillStyle = "rgba(208, 234, 246, 0.1)";
  context.fillRect(0, 0, width, height);

  let gradient = context.createLinearGradient(0, 0, width * 0.22, 0);
  gradient.addColorStop(0, "rgba(205, 233, 245, 0.34)");
  gradient.addColorStop(0.54, "rgba(205, 233, 245, 0.08)");
  gradient.addColorStop(1, "rgba(205, 233, 245, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  gradient = context.createLinearGradient(width, 0, width * 0.78, 0);
  gradient.addColorStop(0, "rgba(205, 233, 245, 0.34)");
  gradient.addColorStop(0.54, "rgba(205, 233, 245, 0.08)");
  gradient.addColorStop(1, "rgba(205, 233, 245, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  gradient = context.createLinearGradient(0, 0, 0, height * 0.17);
  gradient.addColorStop(0, "rgba(224, 243, 250, 0.22)");
  gradient.addColorStop(1, "rgba(224, 243, 250, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  gradient = context.createLinearGradient(0, height, 0, height * 0.8);
  gradient.addColorStop(0, "rgba(224, 243, 250, 0.27)");
  gradient.addColorStop(1, "rgba(224, 243, 250, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  for (let index = 0; index < 16; index += 1) {
    const side = index % 4;
    const along = random();
    let x;
    let y;
    if (side === 0) {
      x = along * width;
      y = 1;
    } else if (side === 1) {
      x = along * width;
      y = height - 1;
    } else if (side === 2) {
      x = 1;
      y = along * height;
    } else {
      x = width - 1;
      y = along * height;
    }
    const baseAngles = [Math.PI / 2, -Math.PI / 2, 0, Math.PI];
    drawIceFrond(
      context,
      x,
      y,
      baseAngles[side] + (random() - 0.5) * 1.1,
      34 + random() * 74,
      1,
      random,
    );
  }

  context.globalAlpha = 0.42;
  for (let index = 0; index < 24; index += 1) {
    drawIceFrond(
      context,
      random() * width,
      random() * height,
      random() * Math.PI * 2,
      12 + random() * 24,
      0,
      random,
    );
  }
  context.globalAlpha = 1;

  context.strokeStyle = "rgba(230, 247, 252, 0.22)";
  context.lineWidth = 0.55;
  for (let index = 0; index < 52; index += 1) {
    const x = random() * width;
    const y = random() * height;
    const radius = 0.5 + random() * 1.5;
    context.beginPath();
    for (let branch = 0; branch < 3; branch += 1) {
      const angle = (branch * Math.PI) / 3;
      context.moveTo(x - Math.cos(angle) * radius, y - Math.sin(angle) * radius);
      context.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
    }
    context.stroke();
  }
}

function drawFrostVeil() {
  frostVeilContext.clearRect(0, 0, width, height);

  let gradient = frostVeilContext.createRadialGradient(
    width * 0.5,
    height * 0.46,
    Math.min(width, height) * 0.16,
    width * 0.5,
    height * 0.46,
    Math.max(width, height) * 0.78,
  );
  gradient.addColorStop(0, "rgba(204, 232, 245, 0)");
  gradient.addColorStop(0.7, "rgba(204, 232, 245, 0.06)");
  gradient.addColorStop(1, "rgba(226, 243, 250, 0.43)");
  frostVeilContext.fillStyle = gradient;
  frostVeilContext.fillRect(0, 0, width, height);

  gradient = frostVeilContext.createLinearGradient(0, 0, width * 0.24, 0);
  gradient.addColorStop(0, "rgba(235, 249, 253, 0.2)");
  gradient.addColorStop(1, "rgba(235, 249, 253, 0)");
  frostVeilContext.fillStyle = gradient;
  frostVeilContext.fillRect(0, 0, width, height);

  gradient = frostVeilContext.createLinearGradient(width, 0, width * 0.76, 0);
  gradient.addColorStop(0, "rgba(235, 249, 253, 0.2)");
  gradient.addColorStop(1, "rgba(235, 249, 253, 0)");
  frostVeilContext.fillStyle = gradient;
  frostVeilContext.fillRect(0, 0, width, height);
}

function setupWipeGrid() {
  frostGridWidth = Math.ceil(width / 6) + 1;
  frostGridHeight = Math.ceil(height / 6) + 1;
  wipeGrid = new Float32Array(frostGridWidth * frostGridHeight);
  wipeMaskCanvas.width = frostGridWidth;
  wipeMaskCanvas.height = frostGridHeight;
  wipeImageData = wipeMaskContext.createImageData(frostGridWidth, frostGridHeight);
  wipeDirty = false;
}

function paintFrost() {
  frostContext.clearRect(0, 0, width, height);
  frostContext.drawImage(frostBaseCanvas, 0, 0, width, height);
  if (!wipeGrid || !wipeDirty) {
    return;
  }

  const pixels = wipeImageData.data;
  for (let index = 0; index < wipeGrid.length; index += 1) {
    const alpha = Math.round(wipeGrid[index] * 255);
    const offset = index * 4;
    pixels[offset] = 255;
    pixels[offset + 1] = 255;
    pixels[offset + 2] = 255;
    pixels[offset + 3] = alpha;
  }
  wipeMaskContext.putImageData(wipeImageData, 0, 0);

  frostContext.save();
  frostContext.globalCompositeOperation = "destination-out";
  frostContext.imageSmoothingEnabled = true;
  frostContext.drawImage(
    wipeMaskCanvas,
    0,
    0,
    frostGridWidth,
    frostGridHeight,
    0,
    0,
    width,
    height,
  );
  frostContext.restore();
}

function drawWipe(x, y) {
  if (!wipeGrid) {
    return;
  }
  const radius = 36;
  const centerX = x / 6;
  const centerY = y / 6;
  const radiusInCells = radius / 6;
  const minX = Math.max(0, Math.floor(centerX - radiusInCells));
  const maxX = Math.min(frostGridWidth - 1, Math.ceil(centerX + radiusInCells));
  const minY = Math.max(0, Math.floor(centerY - radiusInCells));
  const maxY = Math.min(frostGridHeight - 1, Math.ceil(centerY + radiusInCells));

  for (let row = minY; row <= maxY; row += 1) {
    for (let column = minX; column <= maxX; column += 1) {
      const distance = Math.hypot(column - centerX, row - centerY) / radiusInCells;
      if (distance < 1) {
        const index = row * frostGridWidth + column;
        wipeGrid[index] = Math.max(wipeGrid[index], 1 - distance * distance * 0.58);
      }
    }
  }
  wipeDirty = true;
  paintFrost();
}

function updateWipeDecay(delta) {
  if (!wipeGrid || !wipeDirty) {
    return;
  }

  let hasVisibleWipe = false;
  const decrease = delta / WIPE_DECAY_SECONDS;
  for (let index = 0; index < wipeGrid.length; index += 1) {
    if (wipeGrid[index] > 0) {
      wipeGrid[index] = Math.max(0, wipeGrid[index] - decrease);
      if (wipeGrid[index] > 0.01) {
        hasVisibleWipe = true;
      }
    }
  }
  paintFrost();
  if (!hasVisibleWipe) {
    wipeDirty = false;
  }
}

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  setupCanvas(elements.atmosphere, atmosphereContext);
  setupCanvas(elements.frostVeil, frostVeilContext);
  setupCanvas(elements.frost, frostContext);
  setupCanvas(backdropCanvas, backdropContext);
  setupCanvas(frostBaseCanvas, frostBaseContext);
  setupCanvas(wipeMaskCanvas, wipeMaskContext);
  setupWipeGrid();
  createScene();
  drawBackdrop();
  paintBackdrop();
  drawStars(0);
  drawSnow(0, 0);
  drawFrostVeil();
  drawFrost();
  paintFrost();
  if (state.view === "gate") {
    elements.frost.style.opacity = "1";
    elements.frostVeil.style.opacity = "0.12";
  }
}

function renderFrame(time) {
  const delta = Math.min(0.05, (time - (lastFrame || time)) / 1000);
  lastFrame = time;
  const parallaxEase = Math.min(1, delta * 3.8);
  state.parallaxX += (state.targetParallaxX - state.parallaxX) * parallaxEase;
  state.parallaxY += (state.targetParallaxY - state.parallaxY) * parallaxEase;
  paintBackdrop();
  drawStars(time);
  drawSnow(time, delta);
  updateIntro(time);
  updateWipeDecay(delta);
  if (isDocumentVisible && !REDUCED_MOTION.matches) {
    animationFrame = requestAnimationFrame(renderFrame);
  }
}

function ensureAnimation() {
  cancelAnimationFrame(animationFrame);
  lastFrame = 0;
  if (isDocumentVisible && REDUCED_MOTION.matches) {
    renderFrame(performance.now());
  } else if (isDocumentVisible) {
    animationFrame = requestAnimationFrame(renderFrame);
  }
}

function setView(view) {
  state.view = view;
  document.body.dataset.view = view;
  elements.gateView.hidden = view !== "gate";
  elements.introView.hidden = view !== "intro";
  elements.mapView.hidden = !["constellation", "complete"].includes(view);
  elements.letterView.hidden = view !== "letter";
  elements.soundToggle.hidden = view === "gate";

  if (["constellation", "letter", "complete"].includes(view)) {
    elements.frost.style.opacity = "0.72";
    elements.frostVeil.style.opacity = "0.16";
  } else if (view === "gate") {
    elements.frost.style.opacity = "1";
    elements.frostVeil.style.opacity = "0.12";
  }
}

function fadeReferenceAudio(targetVolume, duration = 900) {
  const audio = elements.referenceAudio;
  cancelAnimationFrame(audioFadeFrame);
  const startVolume = audio.volume;
  const startedAt = performance.now();

  function step(now) {
    const progress = Math.max(0, Math.min(1, (now - startedAt) / duration));
    const eased = 1 - Math.pow(1 - progress, 3);
    audio.volume = startVolume + (targetVolume - startVolume) * eased;
    if (progress < 1) {
      audioFadeFrame = requestAnimationFrame(step);
    }
  }
  audioFadeFrame = requestAnimationFrame(step);
}

function startReferenceAudio() {
  if (!state.soundEnabled || state.backgroundMusicFailed) {
    return;
  }
  const audio = elements.referenceAudio;
  if (!audio.paused) {
    fadeReferenceAudio(0.45, 500);
    return;
  }
  audio.volume = 0;
  const playAttempt = audio.play();
  if (playAttempt && typeof playAttempt.then === "function") {
    playAttempt
      .then(() => fadeReferenceAudio(0.45, 1200))
      .catch(() => {});
  } else {
    fadeReferenceAudio(0.45, 1200);
  }
}

function startIntroduction() {
  if (state.gateRevealed) {
    return;
  }

  state.gateRevealed = true;
  state.introFinished = false;
  state.introSkippable = false;
  state.introStartedAt = performance.now();
  elements.gateView.classList.add("is-leaving");
  startReferenceAudio();
  chime(4);
  announce("冬夜正在为你结霜。轻触可以跳过动画。");

  if (REDUCED_MOTION.matches) {
    finishIntro(true);
    return;
  }

  window.setTimeout(() => {
    if (!state.introFinished && state.gateRevealed) {
      setView("intro");
    }
  }, 380);
}

function finishIntro(skipped = false) {
  if (state.introFinished) {
    return;
  }
  state.introFinished = true;
  state.introSkippable = false;
  elements.gateView.classList.remove("is-leaving");
  elements.introView.classList.remove("is-skippable", "is-warm", "is-frozen");
  elements.introWipeHint.classList.remove("is-visible");
  setView("constellation");
  elements.frost.style.opacity = "0.72";
  elements.frostVeil.style.opacity = "0.16";
  elements.warmHaze.style.opacity = "1";
  elements.mapView.classList.add("is-entered");
  updateMap();
  announce(
    skipped
      ? "已经跳过开场。轻触一枚雪光，阅读冬至祝福。"
      : "冬窗已经擦亮。轻触一枚雪光，阅读冬至祝福。",
  );
  window.setTimeout(() => {
    document.querySelector("#mapTitle").focus({ preventScroll: true });
  }, REDUCED_MOTION.matches ? 0 : 320);
}

function updateIntro(time) {
  if (state.view !== "intro" || state.introFinished) {
    return;
  }

  const elapsed = time - state.introStartedAt;
  elements.introChars.forEach((character, index) => {
    if (elapsed >= TITLE_START + index * TITLE_STEP) {
      character.classList.add("is-written");
    }
  });
  elements.introSubtitleChars.forEach((character, index) => {
    if (elapsed >= SUBTITLE_START + index * SUBTITLE_STEP) {
      character.classList.add("is-written");
    }
  });

  if (elapsed >= 1200 && !state.introSkippable) {
    state.introSkippable = true;
    elements.introView.classList.add("is-skippable");
  }
  if (elapsed >= 7800) {
    elements.introTitle.classList.add("is-frozen");
    elements.introView.classList.add("is-frozen");
  }
  if (elapsed >= INTRO_FREEZE_END) {
    elements.introView.classList.add("is-warm");
    elements.introWipeHint.classList.add("is-visible");
  }

  let veilOpacity = 0.12;
  let frostOpacity = 0.86;
  if (elapsed < INTRO_FROST_START) {
    veilOpacity = 0.12;
    frostOpacity = 0.86;
  } else if (elapsed < INTRO_FROST_PEAK) {
    const progress = (elapsed - INTRO_FROST_START) / (INTRO_FROST_PEAK - INTRO_FROST_START);
    veilOpacity = 0.12 + progress * 0.43;
    frostOpacity = 0.86 + progress * 0.12;
  } else if (elapsed < INTRO_FREEZE_END) {
    const progress = (elapsed - INTRO_FROST_PEAK) / (INTRO_FREEZE_END - INTRO_FROST_PEAK);
    veilOpacity = 0.55 + progress * 0.32;
    frostOpacity = 0.98 + progress * 0.02;
  } else {
    const progress = Math.min(1, (elapsed - INTRO_FREEZE_END) / (INTRO_DURATION - INTRO_FREEZE_END));
    veilOpacity = 0.87 - progress * 0.45;
    frostOpacity = 1 - progress * 0.25;
  }

  elements.frostVeil.style.opacity = veilOpacity.toFixed(3);
  elements.frost.style.opacity = frostOpacity.toFixed(3);
  elements.warmHaze.style.opacity = `${0.74 + Math.min(1, elapsed / INTRO_FREEZE_END) * 0.26}`;

  if (elapsed >= INTRO_DURATION) {
    finishIntro(false);
  }
}

function chime(index = 0) {
  if (!state.soundEnabled || !state.chimeSupported) {
    return;
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    state.chimeSupported = false;
    return;
  }

  try {
    audioContext ||= new AudioContextClass();
    if (audioContext.state === "suspended") {
      audioContext.resume().catch(() => {});
    }

    const now = audioContext.currentTime;
    const master = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2400, now);
    filter.Q.setValueAtTime(0.7, now);
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.032, now + 0.018);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 1.15);
    master.connect(filter);
    filter.connect(audioContext.destination);

    const baseFrequency = PENTATONIC_NOTES[index % PENTATONIC_NOTES.length];
    [1, 2.01].forEach((ratio, oscillatorIndex) => {
      const oscillator = audioContext.createOscillator();
      const voiceGain = audioContext.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(baseFrequency * ratio, now);
      voiceGain.gain.setValueAtTime(oscillatorIndex === 0 ? 1 : 0.18, now);
      oscillator.connect(voiceGain);
      voiceGain.connect(master);
      oscillator.start(now);
      oscillator.stop(now + 1.2);
    });
  } catch {
    state.chimeSupported = false;
  }
}

function announce(message) {
  elements.announcer.textContent = "";
  window.setTimeout(() => {
    elements.announcer.textContent = message;
  }, 20);
}

function updateMap() {
  const count = state.read.size;
  elements.progress.textContent = `已拾 ${CHINESE_NUMERALS[count]} 封 · 共 八 封`;

  for (const flake of elements.flakes) {
    const blessingIndex = Number(flake.dataset.blessing);
    const blessing = BLESSINGS[blessingIndex];
    const isRead = state.read.has(blessing.id);
    flake.classList.toggle("is-read", isRead);
    flake.setAttribute(
      "aria-label",
      `${isRead ? "回看" : "打开"}第${CHINESE_NUMERALS[blessingIndex + 1]}封冬笺：${blessing.label}`,
    );
  }

  if (count === 0) {
    elements.mapFooter.textContent = "在窗上擦一擦 · 霜会慢慢回来";
  } else if (count < BLESSINGS.length) {
    elements.mapFooter.textContent = `已亮 ${CHINESE_NUMERALS[count]} 封 · 轻轻回看`;
  } else {
    elements.mapFooter.textContent = "八封冬笺，皆已为你点亮";
  }

  const isComplete = count === BLESSINGS.length;
  elements.mapView.classList.toggle("is-complete", isComplete);
  elements.completionActions.hidden = !isComplete;
  elements.nameSeal.textContent = isComplete ? "冬 至 · 二〇二六" : "致 杨 皓 蓉";
  elements.mapTitleTop.textContent = isComplete ? "八封冬笺" : "长夜有尽";
  elements.mapTitleBottom.textContent = isComplete ? "皆已点亮" : "愿你有光";
  elements.mapPrompt.textContent = isComplete
    ? "所有雪光，都落在了这一夜"
    : "轻触一枚雪光，拆一封冬笺";
}

function renderBlessingContent(index) {
  state.currentBlessing = (index + BLESSINGS.length) % BLESSINGS.length;
  const blessing = BLESSINGS[state.currentBlessing];
  elements.letterFolio.textContent = `第 ${CHINESE_NUMERALS[state.currentBlessing + 1]} 封 · ${blessing.label.split("").join(" ")}`;
  elements.letterLines.innerHTML = blessing.lines.map((line) => `<span>${line}</span>`).join("");
  elements.letterSignature.textContent = blessing.signature;
}

function burstIce(x, y) {
  if (REDUCED_MOTION.matches) {
    return;
  }

  for (let index = 0; index < 18; index += 1) {
    const particle = document.createElement("span");
    const angle = (index / 18) * Math.PI * 2 + Math.random() * 0.3;
    const distance = 28 + Math.random() * 68;
    const size = 2 + Math.random() * 3.5;
    particle.className = "ice-particle";
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    particle.style.setProperty("--size", `${size}px`);
    particle.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
    particle.style.setProperty("--dy", `${Math.sin(angle) * distance + 12}px`);
    particle.style.animationDelay = `${index * 7}ms`;
    document.body.append(particle);
    particle.addEventListener("animationend", () => particle.remove(), { once: true });
  }
}

function runCurtainTransition(callback, reverse = false) {
  if (state.transitioning) {
    return;
  }

  if (REDUCED_MOTION.matches) {
    callback();
    return;
  }

  state.transitioning = true;
  elements.iceCurtain.classList.toggle("is-reverse", reverse);
  elements.iceCurtain.classList.remove("is-clearing");
  void elements.iceCurtain.offsetWidth;
  elements.iceCurtain.classList.add("is-covering");

  window.setTimeout(() => {
    callback();
    elements.iceCurtain.classList.remove("is-covering");
    elements.iceCurtain.classList.add("is-clearing");
    state.transitioning = false;
    window.setTimeout(() => {
      elements.iceCurtain.classList.remove("is-clearing", "is-reverse");
    }, 840);
  }, 400);
}

function showMap(reverse = true) {
  runCurtainTransition(() => {
    const isComplete = state.read.size === BLESSINGS.length;
    setView(isComplete ? "complete" : "constellation");
    updateMap();
    window.setTimeout(() => {
      document.querySelector("#mapTitle").focus({ preventScroll: true });
    }, 80);
  }, reverse);
}

function showBlessing(index, origin = null, reverse = false) {
  if (state.transitioning) {
    return;
  }

  if (origin) {
    burstIce(origin.x, origin.y);
  }

  runCurtainTransition(() => {
    const normalizedIndex = (index + BLESSINGS.length) % BLESSINGS.length;
    const blessing = BLESSINGS[normalizedIndex];
    state.read.add(blessing.id);
    renderBlessingContent(normalizedIndex);
    setView("letter");
    updateMap();
    chime(state.currentBlessing);
    announce(`第${CHINESE_NUMERALS[state.currentBlessing + 1]}封冬笺，${blessing.label}。${blessing.lines.join("，")}`);

    requestAnimationFrame(() => {
      elements.letterQuote.focus({ preventScroll: true });
    });
  }, reverse);
}

function centerOf(element) {
  const rect = element.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function resetExperience() {
  state.view = "gate";
  state.currentBlessing = 0;
  state.read.clear();
  state.gateRevealed = false;
  state.introStartedAt = 0;
  state.introFinished = false;
  state.introSkippable = false;
  state.transitioning = false;
  state.frostDragDistance = 0;
  state.pointerDown = false;
  state.lastPointer = null;
  frostSeed += 37;
  cancelAnimationFrame(audioFadeFrame);
  elements.referenceAudio.pause();
  try {
    elements.referenceAudio.currentTime = 0;
  } catch {
    // 媒体尚未载入时无需处理。
  }
  elements.gateView.classList.remove("is-leaving");
  elements.introView.classList.remove("is-skippable", "is-warm", "is-frozen");
  elements.introTitle.classList.remove("is-frozen");
  elements.introWipeHint.classList.remove("is-visible");
  elements.introChars.forEach((character) => character.classList.remove("is-written"));
  elements.introSubtitleChars.forEach((character) => character.classList.remove("is-written"));
  elements.mapView.classList.remove("is-entered", "is-complete");
  elements.iceCurtain.classList.remove("is-covering", "is-clearing", "is-reverse");
  document.querySelectorAll(".ice-particle").forEach((particle) => particle.remove());
  setView("gate");
  updateMap();
  drawFrost();
  drawFrostVeil();
  setupWipeGrid();
  paintFrost();
  elements.frost.style.opacity = "1";
  elements.frostVeil.style.opacity = "0.12";
  elements.warmHaze.style.opacity = "1";
  window.scrollTo(0, 0);
  elements.openButton.focus({ preventScroll: true });
  announce("冬夜重新覆霜。");
}

function pointIsInteractive(target) {
  return target instanceof Element && Boolean(target.closest("button, a, [role='button']"));
}

function onPointerDown(event) {
  if (
    !["constellation", "letter", "complete"].includes(state.view) ||
    state.transitioning ||
    pointIsInteractive(event.target)
  ) {
    return;
  }
  state.pointerDown = true;
  state.lastPointer = { x: event.clientX, y: event.clientY };
  state.frostDragDistance = 0;
  drawWipe(event.clientX, event.clientY);
}

function onPointerMove(event) {
  const normalizedX = event.clientX / Math.max(1, width) - 0.5;
  const normalizedY = event.clientY / Math.max(1, height) - 0.5;
  state.targetParallaxX = normalizedX * -14;
  state.targetParallaxY = normalizedY * -8;

  if (!state.pointerDown || !["constellation", "letter", "complete"].includes(state.view)) {
    return;
  }

  const previous = state.lastPointer;
  const distance = Math.hypot(event.clientX - previous.x, event.clientY - previous.y);
  state.frostDragDistance += distance;
  const steps = Math.max(1, Math.ceil(distance / 8));
  for (let step = 1; step <= steps; step += 1) {
    const ratio = step / steps;
    drawWipe(
      previous.x + (event.clientX - previous.x) * ratio,
      previous.y + (event.clientY - previous.y) * ratio,
    );
  }
  state.lastPointer = { x: event.clientX, y: event.clientY };
}

function onPointerUp() {
  state.pointerDown = false;
  state.lastPointer = null;
}

function toggleSound() {
  state.soundEnabled = !state.soundEnabled;
  elements.soundToggle.setAttribute("aria-pressed", String(state.soundEnabled));
  elements.soundLabel.textContent = state.soundEnabled ? "声音 开" : "声音 关";
  if (state.soundEnabled) {
    if (state.gateRevealed) {
      startReferenceAudio();
    }
    chime(6);
  } else {
    fadeReferenceAudio(0, 240);
    window.setTimeout(() => {
      if (!state.soundEnabled) {
        elements.referenceAudio.pause();
      }
    }, 260);
  }
}

function attachEvents() {
  elements.openButton.addEventListener("click", startIntroduction);
  elements.soundToggle.addEventListener("click", toggleSound);
  elements.flakes.forEach((flake) => {
    flake.addEventListener("click", (event) => {
      const origin = event.detail > 0 ? { x: event.clientX, y: event.clientY } : centerOf(flake);
      showBlessing(Number(flake.dataset.blessing), origin);
    });
  });
  elements.previousButton.addEventListener("click", () => {
    showBlessing(state.currentBlessing - 1, centerOf(elements.previousButton), true);
  });
  elements.nextButton.addEventListener("click", () => {
    showBlessing(state.currentBlessing + 1, centerOf(elements.nextButton), false);
  });
  elements.backButton.addEventListener("click", () => showMap(true));
  elements.replayButton.addEventListener("click", () => {
    showBlessing(0, centerOf(elements.replayButton), false);
  });
  elements.refrostButton.addEventListener("click", resetExperience);
  elements.skipIntroButton.addEventListener("click", () => finishIntro(true));
  elements.introView.addEventListener("click", (event) => {
    if (
      state.view === "intro" &&
      state.introSkippable &&
      !pointIsInteractive(event.target)
    ) {
      finishIntro(true);
    }
  });
  elements.referenceAudio.addEventListener("error", () => {
    state.backgroundMusicFailed = true;
  });
  elements.referenceAudio.addEventListener("canplay", () => {
    if (state.gateRevealed && state.soundEnabled && state.view !== "gate") {
      startReferenceAudio();
    }
  });

  window.addEventListener("resize", resize);
  window.addEventListener("pointerdown", onPointerDown, { passive: true });
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerup", onPointerUp, { passive: true });
  window.addEventListener("pointercancel", onPointerUp, { passive: true });
  window.addEventListener("blur", onPointerUp);

  document.addEventListener("visibilitychange", () => {
    isDocumentVisible = !document.hidden;
    if (isDocumentVisible) {
      ensureAnimation();
    } else {
      cancelAnimationFrame(animationFrame);
    }
  });

  REDUCED_MOTION.addEventListener("change", () => {
    ensureAnimation();
  });
}

function initialize() {
  resize();
  attachEvents();
  updateMap();
  setView("gate");
  ensureAnimation();
}

initialize();
