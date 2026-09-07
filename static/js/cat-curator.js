// 猫馆长：眼珠跟随鼠标；露出爪子的姿态会整只朝鼠标探身。
// 由 astro/src/components/CatCurator.astro 引用。

const lives = [];
let frame = 0;
let pointer = null;
let lastPointerAt = 0;

const lerp = (a, b, t) => a + (b - a) * t;

function drawBase(life, offsetX = 0, offsetY = 0) {
  const { context, image, geometry, size } = life;
  const { crop } = geometry;
  // 平移用「挪动取景框」实现，边缘永远有图，不会露白
  context.drawImage(
    image,
    crop.x + offsetX,
    crop.y + offsetY,
    crop.size,
    crop.size,
    0,
    0,
    size,
    size,
  );
}

function render(life, time) {
  const { context, canvas, geometry, size } = life;
  const pixelRatio = window.devicePixelRatio || 1;
  const pixels = Math.round(size * pixelRatio);
  if (canvas.width !== pixels || canvas.height !== pixels) {
    canvas.width = pixels;
    canvas.height = pixels;
  }
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, size, size);

  const scale = size / geometry.crop.size;
  const reach = geometry.reach;
  const [leanX, leanY, effort] = life.lean;
  // 取景框朝鼠标反方向挪，猫看起来就朝鼠标凑过去
  const panX = reach ? -leanX * reach.pan : 0;
  const panY = reach ? -leanY * reach.pan : 0;

  context.save();
  if (reach) {
    // 略微放大一点，倾斜时圆框边缘不会露出底下的静态图
    context.translate(size / 2, size / 2);
    context.scale(1.07, 1.07);
    context.translate(-size / 2, -size / 2);
  }
  if (reach && effort > 0.001) {
    // 绕身体底部微微倾斜；圆形取景内接于画布，旋转后仍被完全覆盖
    const pivotX = (reach.pivot[0] - geometry.crop.x) * scale;
    const pivotY = (reach.pivot[1] - geometry.crop.y) * scale;
    const wobble = effort > 0.8 ? Math.sin(time / 260) * 0.12 * effort : 0;
    const tilt = ((leanX * reach.tilt * effort + wobble) * Math.PI) / 180;
    context.translate(pivotX, pivotY);
    context.rotate(tilt);
    context.translate(-pivotX, -pivotY);
  }
  drawBase(life, panX, panY);

  // 眼珠：在已经探身的画面上再单独错开一点
  for (const eye of geometry.eyes) {
    const x = (eye.x - geometry.crop.x) * scale - panX * scale;
    const y = (eye.y - geometry.crop.y) * scale - panY * scale;
    const radius = eye.r * scale;
    const amplitude = eye.r * 0.3;
    context.save();
    context.beginPath();
    context.arc(x, y, radius * 0.92, 0, Math.PI * 2);
    context.clip();
    drawBase(
      life,
      panX - life.gaze[0] * amplitude,
      panY - life.gaze[1] * amplitude,
    );
    context.restore();
  }
  context.restore();
}

function aim(life) {
  const rect = life.portrait.getBoundingClientRect();
  if (rect.width === 0) return;
  if (!pointer) {
    life.targetGaze = [0, 0];
    life.targetLean = [0, 0, 0];
    return;
  }
  const dx = pointer[0] - (rect.left + rect.width / 2);
  const dy = pointer[1] - (rect.top + rect.height / 2);
  const distance = Math.hypot(dx, dy) || 1;
  const dirX = dx / distance;
  const dirY = dy / distance;
  life.targetGaze = [
    dirX * Math.min(1, distance / 220),
    dirY * Math.min(1, distance / 220),
  ];
  // 鼠标越近，探身越用力；离得远就收回
  const effort = Math.max(
    0,
    Math.min(1, 1 - (distance - rect.width * 0.55) / 240),
  );
  life.targetLean = [dirX * effort, dirY * effort, effort];
}

function settled(life) {
  const close = (a, b, epsilon) => Math.abs(a - b) < epsilon;
  return (
    close(life.gaze[0], life.targetGaze[0], 0.002) &&
    close(life.gaze[1], life.targetGaze[1], 0.002) &&
    close(life.lean[0], life.targetLean[0], 0.002) &&
    close(life.lean[1], life.targetLean[1], 0.002) &&
    close(life.lean[2], life.targetLean[2], 0.002) &&
    life.lean[2] < 0.8
  );
}

function tick(time) {
  frame = 0;
  let busy = false;
  for (const life of lives) {
    aim(life);
    life.gaze = [
      lerp(life.gaze[0], life.targetGaze[0], 0.18),
      lerp(life.gaze[1], life.targetGaze[1], 0.18),
    ];
    life.lean = [
      lerp(life.lean[0], life.targetLean[0], 0.14),
      lerp(life.lean[1], life.targetLean[1], 0.14),
      lerp(life.lean[2], life.targetLean[2], 0.14),
    ];
    render(life, time);
    if (!settled(life)) busy = true;
  }
  if (busy) frame = window.requestAnimationFrame(tick);
}

function wake() {
  if (!frame) frame = window.requestAnimationFrame(tick);
}

function mount(portrait) {
  if (portrait.dataset.catLife === "true") return;
  const image = portrait.querySelector("img");
  const canvas = portrait.querySelector("canvas");
  const raw = portrait.dataset.catPortrait;
  if (!image || !canvas || !raw) return;
  const context = canvas.getContext("2d");
  if (!context) return;
  portrait.dataset.catLife = "true";
  const life = {
    portrait,
    image,
    canvas,
    context,
    geometry: JSON.parse(raw),
    gaze: [0, 0],
    targetGaze: [0, 0],
    lean: [0, 0, 0],
    targetLean: [0, 0, 0],
    size: portrait.getBoundingClientRect().width,
  };
  const ready = () => {
    life.size = portrait.getBoundingClientRect().width;
    if (!image.naturalWidth || life.size === 0) return;
    render(life, performance.now());
    canvas.hidden = false;
    if (!lives.includes(life)) lives.push(life);
  };
  if (image.complete) ready();
  else image.addEventListener("load", ready, { once: true });
  new ResizeObserver(() => {
    life.size = portrait.getBoundingClientRect().width;
    if (lives.includes(life)) render(life, performance.now());
  }).observe(portrait);
}

function init() {
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!fine || reduce) return;
  lives.length = 0;
  document.querySelectorAll("[data-cat-portrait]").forEach(mount);
}

document.addEventListener("mousemove", (event) => {
  pointer = [event.clientX, event.clientY];
  lastPointerAt = performance.now();
  if (lives.length) wake();
});
document.addEventListener("mouseleave", () => {
  pointer = null;
  if (lives.length) wake();
});
document.addEventListener(
  "scroll",
  () => {
    // 滚动后猫的位置变了，鼠标没动也要重新瞄一次
    if (pointer && lives.length && performance.now() - lastPointerAt < 4000)
      wake();
  },
  { passive: true },
);
document.addEventListener("astro:page-load", init);
