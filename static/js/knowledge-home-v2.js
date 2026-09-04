const CAT_POSES = {
  "/images/brain-cat.jpg": [
    { x: 613.3, y: 313.4, r: 21.5 },
    { x: 698.0, y: 326.0, r: 26.0 },
  ],
  "/images/cat-pose-1.jpg": [
    { x: 582.3, y: 247.1, r: 24.2 },
    { x: 667.2, y: 202.5, r: 23.8 },
  ],
  "/images/cat-pose-2.jpg": [
    { x: 446.0, y: 186.4, r: 24.0 },
    { x: 540.0, y: 210.4, r: 26.8 },
  ],
  "/images/cat-pose-3.jpg": [
    { x: 591.2, y: 154.1, r: 17.8 },
    { x: 664.0, y: 157.0, r: 20.8 },
  ],
  "/images/cat-pose-4.jpg": [
    { x: 722.3, y: 483.1, r: 28.5 },
    { x: 837.6, y: 475.3, r: 23.8 },
  ],
  "/images/cat-pose-5.jpg": [
    { x: 178.0, y: 501.0, r: 22.5 },
    { x: 245.9, y: 460.7, r: 17.8 },
  ],
};
const CAT_IMAGE_WIDTH = 1100;

const pickCat = () => {
  const image = document.getElementById("kh-cat-img");
  if (!image || image.dataset.catPicked === "true") return;

  image.dataset.catPicked = "true";
  const poses = Object.keys(CAT_POSES);
  let last = null;
  try {
    last = localStorage.getItem("kh-cat-pose");
  } catch {
    /* Storage is unavailable in this browser context. */
  }

  let pick = poses[Math.floor(Math.random() * poses.length)];
  if (pick === last) pick = poses[(poses.indexOf(pick) + 1) % poses.length];
  if (pick !== image.getAttribute("src")) image.src = pick;
  try {
    localStorage.setItem("kh-cat-pose", pick);
  } catch {
    /* Storage is unavailable in this browser context. */
  }
};

const mountCatLife = () => {
  const figure = document.getElementById("kh-cat-fig");
  const image = document.getElementById("kh-cat-img");
  const canvas = document.getElementById("kh-cat-canvas");
  if (!figure || !image || !canvas || figure.dataset.catLife === "true") return;

  const context = canvas.getContext("2d");
  if (!context) return;
  figure.dataset.catLife = "true";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let lastMouse = 0;
  let frame = 0;
  let gaze = { horizontal: 0, vertical: 0 };

  const drawEyes = (horizontal, vertical) => {
    gaze = { horizontal, vertical };
    if (!image.complete || !image.naturalWidth) return;
    const rect = image.getBoundingClientRect();
    if (rect.width === 0) return;

    const pixelRatio = window.devicePixelRatio || 1;
    const canvasWidth = Math.round(rect.width * pixelRatio);
    const canvasHeight = Math.round(rect.height * pixelRatio);
    if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
    }
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, rect.width, rect.height);

    const eyes = CAT_POSES[image.getAttribute("src")];
    if (!eyes) return;
    const scale = rect.width / CAT_IMAGE_WIDTH;
    for (const eye of eyes) {
      const eyeX = eye.x * scale;
      const eyeY = eye.y * scale;
      const eyeRadius = eye.r * scale;
      const amplitude = eyeRadius * 0.3;
      context.save();
      context.beginPath();
      context.arc(eyeX, eyeY, eyeRadius * 0.92, 0, Math.PI * 2);
      context.clip();
      context.drawImage(
        image,
        horizontal * amplitude,
        vertical * amplitude,
        rect.width,
        rect.height,
      );
      context.restore();
    }
  };

  // 眨眼：用眼睛上方的毛盖住眼睛，再画一道细细的眼缝
  const drawLids = () => {
    if (!image.complete || !image.naturalWidth) return;
    const rect = image.getBoundingClientRect();
    if (rect.width === 0) return;
    const eyes = CAT_POSES[image.getAttribute("src")];
    if (!eyes) return;
    const scale = rect.width / CAT_IMAGE_WIDTH;
    for (const eye of eyes) {
      const eyeX = eye.x * scale;
      const eyeY = eye.y * scale;
      const eyeRadius = eye.r * scale;
      context.save();
      context.beginPath();
      context.arc(eyeX, eyeY, eyeRadius * 0.92, 0, Math.PI * 2);
      context.clip();
      context.drawImage(image, 0, eyeRadius * 1.6, rect.width, rect.height);
      context.beginPath();
      context.arc(
        eyeX,
        eyeY - eyeRadius * 0.15,
        eyeRadius * 0.78,
        Math.PI * 0.12,
        Math.PI * 0.88,
      );
      context.lineWidth = Math.max(1, eyeRadius * 0.11);
      context.lineCap = "round";
      context.strokeStyle = "rgba(70, 58, 48, 0.6)";
      context.stroke();
      context.restore();
    }
  };

  const blink = () => {
    if (reduceMotion.matches || document.hidden) return;
    drawLids();
    window.setTimeout(() => drawEyes(gaze.horizontal, gaze.vertical), 120);
  };

  const scheduleBlink = () => {
    window.setTimeout(
      () => {
        blink();
        if (Math.random() < 0.25) window.setTimeout(blink, 280);
        scheduleBlink();
      },
      2600 + Math.random() * 3800,
    );
  };

  const lookAt = (clientX, clientY) => {
    const rect = figure.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height * 0.35;
    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    const length = Math.hypot(deltaX, deltaY) || 1;
    const strength = Math.min(1, length / 240);
    drawEyes((deltaX / length) * strength, (deltaY / length) * strength);

    const horizontal = Math.max(-1, Math.min(1, deltaX / (rect.width * 0.9)));
    const vertical = Math.max(-1, Math.min(1, deltaY / (rect.height * 0.9)));
    figure.style.transform = `rotate(${(horizontal * 1.1).toFixed(2)}deg) translate(${(horizontal * 7).toFixed(1)}px, ${(vertical * 5).toFixed(1)}px)`;
  };

  const onMove = (event) => {
    if (reduceMotion.matches) return;
    lastMouse = Date.now();
    if (frame) return;
    frame = window.requestAnimationFrame(() => {
      frame = 0;
      lookAt(event.clientX, event.clientY);
    });
  };

  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseleave", () => {
    figure.style.transform = "";
    drawEyes(0, 0);
  });
  image.addEventListener("load", () => drawEyes(0, 0));
  if (image.complete) drawEyes(0, 0);
  scheduleBlink();

  window.setInterval(() => {
    if (reduceMotion.matches || Date.now() - lastMouse < 5000) return;
    const angle = Math.random() * Math.PI * 2;
    const amplitude = 0.6 + Math.random() * 0.4;
    drawEyes(Math.cos(angle) * amplitude, Math.sin(angle) * amplitude * 0.6);
    window.setTimeout(() => {
      if (Date.now() - lastMouse >= 5000) drawEyes(0, 0);
    }, 900);
  }, 4200);
};

const mountBroadcastTicker = () => {
  const banner = document.querySelector("[data-broadcast-banner]");
  const track = document.getElementById("kh-broadcast-track");
  if (!banner || !track || banner.dataset.tickerMounted === "true") return;

  const items = Array.from(track.querySelectorAll(".kh-broadcast-item"));
  if (items.length <= 1) return;

  banner.dataset.tickerMounted = "true";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduceMotion.matches) return;

  // 克隆第 1 项挂到末尾，实现顺滑无限向上滚动
  const firstClone = items[0].cloneNode(true);
  firstClone.setAttribute("aria-hidden", "true");
  track.appendChild(firstClone);

  const totalCount = items.length;
  let currentIndex = 0;
  let timer = null;
  let isTransitioning = false;

  const getItemHeight = () => {
    const rect = items[0].getBoundingClientRect();
    return rect.height > 0 ? rect.height : 22;
  };

  const step = () => {
    if (isTransitioning) return;
    const itemHeight = getItemHeight();
    currentIndex++;
    isTransitioning = true;
    track.style.transition = "transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)";
    track.style.transform = `translateY(-${currentIndex * itemHeight}px)`;

    if (currentIndex === totalCount) {
      window.setTimeout(() => {
        track.style.transition = "none";
        currentIndex = 0;
        track.style.transform = "translateY(0)";
        void track.offsetHeight;
        isTransitioning = false;
      }, 460);
    } else {
      window.setTimeout(() => {
        isTransitioning = false;
      }, 460);
    }
  };

  const start = () => {
    if (timer) return;
    timer = window.setInterval(step, 2000);
  };

  const stop = () => {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  };

  banner.addEventListener("mouseenter", stop);
  banner.addEventListener("mouseleave", start);
  banner.addEventListener("focusin", stop);
  banner.addEventListener("focusout", start);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stop();
    } else {
      start();
    }
  });

  start();
};

const setupKnowledgeHome = () => {
  pickCat();
  mountCatLife();
  mountBroadcastTicker();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupKnowledgeHome);
} else {
  setupKnowledgeHome();
}
document.addEventListener("astro:page-load", setupKnowledgeHome);
document.addEventListener("astro:after-swap", pickCat);
