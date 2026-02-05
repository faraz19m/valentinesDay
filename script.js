(function () {
  "use strict";

  // --- Customization: feedback messages when she tries "No" (cycle through) ---
  var feedbackMessages = [
    "Camille… come on 😇",
    "Nope, that button is shy 🙈",
    "Think of the dessert 🍰",
    "I'll plan something cute, promise 💕",
    "Ok but… yes is right there 😍",
    "You're really making me beg 😭"
  ];

  // Yes button text progression (more persuasive over time)
  var yesButtonTexts = ["Yes 💖", "Yes!! 💖", "Yesss 😍", "OK YES 💘"];

  var ESCAPE_LIMIT = 12;
  var FOCUS_MOVE_DELAY_MS = 400;
  var SAFE_MARGIN = 16; // min gap between No and card/Yes
  var REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var card = document.getElementById("card");
  var feedbackEl = document.getElementById("feedback");
  var buttonsWrap = document.getElementById("buttonsWrap");
  var btnYes = document.getElementById("btnYes");
  var btnNo = document.getElementById("btnNo");
  var onlyYesEl = document.getElementById("onlyYes");
  var successEl = document.getElementById("success");
  var heartsContainer = document.getElementById("hearts");
  var confettiCanvas = document.getElementById("confetti");

  var escapeCount = 0;
  var noMoved = false;

  function getRect(el) {
    return el.getBoundingClientRect();
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function clamp(val, minVal, maxVal) {
    return Math.max(minVal, Math.min(maxVal, val));
  }

  /** Check if two rects overlap with given margin. */
  function overlaps(a, b, margin) {
    return (
      a.left - margin < b.right &&
      a.right + margin > b.left &&
      a.top - margin < b.bottom &&
      a.bottom + margin > b.top
    );
  }

  /** Pick a random position for the No button so it stays on-screen and doesn't overlap card or Yes. */
  function getRandomSafePosition() {
    var noRect = btnNo.getBoundingClientRect();
    var noW = noRect.width;
    var noH = noRect.height;
    var cardRect = getRect(card);
    var yesRect = getRect(btnYes);
    var maxX = window.innerWidth - noW;
    var maxY = window.innerHeight - noH;
    var cardWithMargin = {
      left: cardRect.left - SAFE_MARGIN,
      right: cardRect.right + SAFE_MARGIN,
      top: cardRect.top - SAFE_MARGIN,
      bottom: cardRect.bottom + SAFE_MARGIN
    };
    var yesWithMargin = {
      left: yesRect.left - SAFE_MARGIN,
      right: yesRect.right + SAFE_MARGIN,
      top: yesRect.top - SAFE_MARGIN,
      bottom: yesRect.bottom + SAFE_MARGIN
    };

    var attempts = 0;
    var maxAttempts = 50;
    while (attempts < maxAttempts) {
      var x = randomInt(0, Math.max(0, maxX));
      var y = randomInt(0, Math.max(0, maxY));
      var noAt = {
        left: x,
        right: x + noW,
        top: y,
        bottom: y + noH
      };
      if (!overlaps(noAt, cardWithMargin, 0) && !overlaps(noAt, yesWithMargin, 0)) {
        return { x: x, y: y };
      }
      attempts++;
    }
    // Fallback: push to corner if no luck
    var x = maxX < cardRect.left ? 0 : window.innerWidth - noW - SAFE_MARGIN;
    var y = maxY < cardRect.top ? 0 : window.innerHeight - noH - SAFE_MARGIN;
    return { x: clamp(x, 0, maxX), y: clamp(y, 0, maxY) };
  }

  function moveNoButton() {
    if (escapeCount >= ESCAPE_LIMIT) return;
    if (!noMoved) {
      noMoved = true;
      buttonsWrap.classList.add("card__buttons--no-absolute");
    }
    var pos = getRandomSafePosition();
    btnNo.style.left = pos.x + "px";
    btnNo.style.top = pos.y + "px";
    btnNo.style.right = "auto";
    btnNo.style.bottom = "auto";
  }

  function onNoEscape() {
    if (escapeCount >= ESCAPE_LIMIT) return;
    escapeCount++;

    moveNoButton();

    var msgIndex = (escapeCount - 1) % feedbackMessages.length;
    feedbackEl.textContent = feedbackMessages[msgIndex];

    var yesTextIndex = Math.min(escapeCount - 1, yesButtonTexts.length - 1);
    btnYes.textContent = yesButtonTexts[yesTextIndex];

    var scale = 1 + escapeCount * 0.06;
    if (REDUCED_MOTION) scale = Math.min(scale, 1.15);
    btnYes.style.transform = "scale(" + scale + ")";

    if (escapeCount >= ESCAPE_LIMIT) {
      btnNo.hidden = true;
      onlyYesEl.hidden = false;
      feedbackEl.textContent = "";
    }
  }

  function handleNoHoverOrTouch(e) {
    if (e.type === "touchstart") e.preventDefault();
    onNoEscape();
  }

  function handleNoFocus() {
    setTimeout(function () {
      if (document.activeElement === btnNo) onNoEscape();
    }, FOCUS_MOVE_DELAY_MS);
  }

  btnNo.addEventListener("mouseenter", handleNoHoverOrTouch);
  btnNo.addEventListener("touchstart", handleNoHoverOrTouch, { passive: false });
  btnNo.addEventListener("focus", handleNoFocus);

  btnYes.addEventListener("click", function () {
    btnYes.setAttribute("disabled", "disabled");
    if (btnNo && !btnNo.hidden) btnNo.setAttribute("disabled", "disabled");
    card.setAttribute("aria-hidden", "true");
    successEl.hidden = false;
    successEl.setAttribute("aria-hidden", "false");

    if (!REDUCED_MOTION) {
      runConfetti();
      addFloatingHearts();
    }
  });

  function runConfetti() {
    var canvas = confettiCanvas;
    var ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    var colors = ["#ff6b8a", "#ff9ebb", "#ffc2d4", "#e84d6f", "#c93d5c", "#fff"];
    var pieces = [];
    var pieceCount = 80;

    for (var i = 0; i < pieceCount; i++) {
      pieces.push({
        x: Math.random() * canvas.width,
        y: canvas.height,
        vx: (Math.random() - 0.5) * 6,
        vy: -Math.random() * 12 - 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
        spin: (Math.random() - 0.5) * 10
      });
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      var allDone = true;
      for (var j = 0; j < pieces.length; j++) {
        var p = pieces[j];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.3;
        p.rotation += p.spin;
        if (p.y < canvas.height + 20) allDone = false;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
      if (!allDone) requestAnimationFrame(draw);
    }
    draw();
  }

  function addFloatingHearts() {
    var symbols = ["💕", "💖", "💗", "💘", "💝"];
    for (var i = 0; i < 8; i++) {
      var span = document.createElement("span");
      span.className = "heart-float";
      span.textContent = symbols[i % symbols.length];
      span.style.left = Math.random() * 100 + "%";
      span.style.top = Math.random() * 100 + "%";
      span.style.animationDelay = Math.random() * 2 + "s";
      heartsContainer.appendChild(span);
    }
  }
})();
