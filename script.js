document.addEventListener("DOMContentLoaded", () => {
  // --- DOM Elements ---
  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("score");
  const timeLeftEl = document.getElementById("time-left");
  const playAgainBtn = document.getElementById("play-again-btn");
  const submitCommentBtn = document.getElementById("submit-comment-btn");
  const commentInput = document.getElementById("comment-input");
  const soundToggle = document.getElementById("sound-toggle");
  const darkModeToggle = document.getElementById("dark-mode-toggle");
  const authModal = document.getElementById("auth-modal");
  const gameOverModal = document.getElementById("game-over-modal");
  const menuModal = document.getElementById("menu-modal");
  const finalScoreEl = document.getElementById("final-score");
  const modeSelectBtns = document.querySelectorAll(".mode-select");
  const closeBtns = document.querySelectorAll(".close-btn");
  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const showSignupLink = document.getElementById("show-signup");
  const showLoginLink = document.getElementById("show-login");
  const playAsGuestLink = document.getElementById("play-as-guest");
  const loginForm = document.getElementById("login-form");
  const signupForm = document.getElementById("signup-form");
  const loginUsernameInput = document.getElementById("login-username");
  const loginPasswordInput = document.getElementById("login-password");
  const signupUsernameInput = document.getElementById("signup-username");
  const signupPasswordInput = document.getElementById("signup-password");
  const userInfoDiv = document.getElementById("user-info");
  const guestInfoDiv = document.getElementById("guest-info");
  const usernameDisplay = document.getElementById("username-display");
  const mobileControls = document.querySelectorAll(".control-btn");

  // --- Game Constants & Variables ---
  const gridSize = 20;
  let canvasSize = 500;
  let snake, food, direction, score, gameLoop;
  let gameActive = false;
  let gameMode = "classic"; // 'classic', 'time-attack', 'survival'
  let speed = 150; // Initial speed in ms
  const speedIncrement = 0.98; // Factor to multiply speed by
  let timeLeft = 60;
  let timerInterval;
  let highScores = JSON.parse(localStorage.getItem("snakeHighScores")) || [];
  let comments = JSON.parse(localStorage.getItem("snakeComments")) || [];
  let currentUser = null; // Stores current logged-in user or null for guest
  let users = JSON.parse(localStorage.getItem("snakeUsers")) || {};
  let eatenFood = false;

  // --- Audio ---
  const sounds = {
    eat: new Audio("https://www.soundjay.com/button/button-3.wav"),
    gameOver: new Audio("https://www.soundjay.com/misc/fail-buzzer-01.wav"),
  };
  let soundEnabled = true;

  // --- Responsive Canvas ---
  function resizeCanvas() {
    const containerWidth = document.getElementById("game-board").clientWidth;
    canvasSize = Math.floor(containerWidth / gridSize) * gridSize;
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    if (gameActive) {
      draw();
    }
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  // --- Game Logic ---
  function initGame() {
    snake = [{ x: 10, y: 10 }];
    direction = { x: 0, y: 0 };
    score = 0;
    speed = 150;
    eatenFood = false;
    scoreEl.textContent = "Score: " + score;
    placeFood();
    gameActive = true;

    if (gameMode === "time-attack") {
      timeLeftEl.style.display = "block";
      timeLeft = 60;
      timeLeftEl.textContent = "Time: " + timeLeft;
      if (timerInterval) clearInterval(timerInterval);
      timerInterval = setInterval(() => {
        timeLeft--;
        timeLeftEl.textContent = "Time: " + timeLeft;
        if (timeLeft <= 0) {
          endGame();
        }
      }, 1000);
    } else {
      timeLeftEl.style.display = "none";
      clearInterval(timerInterval);
    }

    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(gameTick, speed);
  }

  function gameTick() {
    if (!gameActive) return;

    moveSnake();
    if (checkCollision()) {
      endGame();
      return;
    }

    if (checkEatFood()) {
      score++;
      scoreEl.textContent = "Score: " + score;
      eatenFood = true;
      placeFood();
      if (soundEnabled) sounds.eat.play();
      if (gameMode === "classic") {
        speed *= speedIncrement;
        clearInterval(gameLoop);
        gameLoop = setInterval(gameTick, speed);
      }
    }
    draw();
  }

  function moveSnake() {
    const head = {
      x: snake[0].x + direction.x,
      y: snake[0].y + direction.y,
    };
    snake.unshift(head);
    if (!eatenFood) {
      snake.pop();
    } else {
      eatenFood = false;
    }
  }

  function checkCollision() {
    const head = snake[0];
    if (
      head.x < 0 ||
      head.x >= canvasSize / gridSize ||
      head.y < 0 ||
      head.y >= canvasSize / gridSize
    ) {
      return true;
    }
    for (let i = 1; i < snake.length; i++) {
      if (snake[i].x === head.x && snake[i].y === head.y) {
        return true;
      }
    }
    return false;
  }

  function checkEatFood() {
    const head = snake[0];
    if (head.x === food.x && head.y === food.y) {
      return true;
    }
    return false;
  }

  function placeFood() {
    food = {
      x: Math.floor(Math.random() * (canvasSize / gridSize)),
      y: Math.floor(Math.random() * (canvasSize / gridSize)),
    };
    for (const segment of snake) {
      if (segment.x === food.x && segment.y === food.y) {
        placeFood();
        return;
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue(
      "--grid-color"
    );
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.fillRect(x, 0, 1, canvas.height);
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.fillRect(0, y, canvas.width, 1);
    }

    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue(
      "--food-color"
    );
    ctx.beginPath();
    ctx.arc(
      food.x * gridSize + gridSize / 2,
      food.y * gridSize + gridSize / 2,
      gridSize / 2,
      0,
      2 * Math.PI
    );
    ctx.fill();

    snake.forEach((segment, index) => {
      if (index === 0) {
        ctx.fillStyle = getComputedStyle(
          document.documentElement
        ).getPropertyValue("--snake-head-color");
      } else {
        ctx.fillStyle = getComputedStyle(
          document.documentElement
        ).getPropertyValue("--snake-body-color");
      }
      ctx.fillRect(
        segment.x * gridSize,
        segment.y * gridSize,
        gridSize,
        gridSize
      );
    });
  }

  function endGame() {
    gameActive = false;
    clearInterval(gameLoop);
    clearInterval(timerInterval);
    if (soundEnabled) sounds.gameOver.play();
    finalScoreEl.textContent = score;
    gameOverModal.style.display = "flex";
    saveHighScore(score);
    updateComments();
  }

  // --- Input Handling ---
  document.addEventListener("keydown", (e) => {
    if (!gameActive) {
      if (e.key === "Enter") {
        initGame();
      }
      return;
    }
    switch (e.key) {
      case "ArrowUp":
        if (direction.y !== 1) direction = { x: 0, y: -1 };
        break;
      case "ArrowDown":
        if (direction.y !== -1) direction = { x: 0, y: 1 };
        break;
      case "ArrowLeft":
        if (direction.x !== 1) direction = { x: -1, y: 0 };
        break;
      case "ArrowRight":
        if (direction.x !== -1) direction = { x: 1, y: 0 };
        break;
    }
  });

  // Mobile touch controls
  let touchStartX, touchStartY;
  canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  });

  canvas.addEventListener("touchend", (e) => {
    if (!touchStartX || !touchStartY) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;

    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal swipe
      if (dx > 0 && direction.x !== -1) {
        direction = { x: 1, y: 0 };
      } else if (dx < 0 && direction.x !== 1) {
        direction = { x: -1, y: 0 };
      }
    } else {
      // Vertical swipe
      if (dy > 0 && direction.y !== -1) {
        direction = { x: 0, y: 1 };
      } else if (dy < 0 && direction.y !== 1) {
        direction = { x: 0, y: -1 };
      }
    }
    touchStartX = null;
    touchStartY = null;
  });

  // Mobile button controls
  mobileControls.forEach((btn) => {
    btn.addEventListener("click", () => {
      const dir = btn.dataset.direction;
      switch (dir) {
        case "up":
          if (direction.y !== 1) direction = { x: 0, y: -1 };
          break;
        case "down":
          if (direction.y !== -1) direction = { x: 0, y: 1 };
          break;
        case "left":
          if (direction.x !== 1) direction = { x: -1, y: 0 };
          break;
        case "right":
          if (direction.x !== -1) direction = { x: 1, y: 0 };
          break;
      }
    });
  });

  // --- Event Listeners ---
  playAgainBtn.addEventListener("click", () => {
    gameOverModal.style.display = "none";
    initGame();
  });

  submitCommentBtn.addEventListener("click", () => {
    const text = commentInput.value.trim();
    if (text) {
      const username = currentUser ? currentUser.username : "Guest";
      comments.push({ username, text });
      localStorage.setItem("snakeComments", JSON.stringify(comments));
      commentInput.value = "";
      updateComments();
    }
  });

  soundToggle.addEventListener("change", () => {
    soundEnabled = soundToggle.checked;
  });

  darkModeToggle.addEventListener("change", () => {
    document.body.classList.toggle("dark-mode", darkModeToggle.checked);
  });

  modeSelectBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      gameMode = e.target.dataset.mode;
      menuModal.style.display = "none";
      initGame();
    });
  });

  closeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      btn.closest(".modal").style.display = "none";
    });
  });

  // --- Modals and Auth ---
  loginBtn.addEventListener("click", () => {
    authModal.style.display = "flex";
  });

  showSignupLink.addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("login-section").style.display = "none";
    document.getElementById("signup-section").style.display = "block";
  });

  showLoginLink.addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("login-section").style.display = "block";
    document.getElementById("signup-section").style.display = "none";
  });

  playAsGuestLink.addEventListener("click", (e) => {
    e.preventDefault();
    authModal.style.display = "none";
    currentUser = null;
    updateUserUI();
    menuModal.style.display = "flex";
  });

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = loginUsernameInput.value;
    const password = loginPasswordInput.value;
    if (users[username] && users[username].password === password) {
      currentUser = { username };
      authModal.style.display = "none";
      updateUserUI();
      menuModal.style.display = "flex";
    } else {
      alert("Invalid username or password");
    }
  });

  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = signupUsernameInput.value;
    const password = signupPasswordInput.value;
    if (users[username]) {
      alert("Username already exists");
    } else {
      users[username] = { password };
      localStorage.setItem("snakeUsers", JSON.stringify(users));
      currentUser = { username };
      authModal.style.display = "none";
      updateUserUI();
      menuModal.style.display = "flex";
    }
  });

  logoutBtn.addEventListener("click", () => {
    currentUser = null;
    updateUserUI();
    menuModal.style.display = "flex";
  });

  function updateUserUI() {
    if (currentUser) {
      userInfoDiv.style.display = "block";
      guestInfoDiv.style.display = "none";
      usernameDisplay.textContent = currentUser.username;
    } else {
      userInfoDiv.style.display = "none";
      guestInfoDiv.style.display = "block";
    }
  }

  // --- Leaderboard and Comments ---
  function saveHighScore(score) {
    const username = currentUser ? currentUser.username : "Guest";
    highScores.push({ username, score, mode: gameMode });
    highScores.sort((a, b) => b.score - a.score);
    highScores = highScores.slice(0, 10);
    localStorage.setItem("snakeHighScores", JSON.stringify(highScores));
    updateLeaderboard();
  }

  function updateLeaderboard() {
    const list = document.getElementById("leaderboard-list");
    list.innerHTML = "";
    if (highScores.length === 0) {
      list.innerHTML = "<li>No scores yet. Be the first!</li>";
      return;
    }
    highScores.forEach((score) => {
      const li = document.createElement("li");
      li.innerHTML = `<span>${score.username} (${score.mode})</span><strong>${score.score}</strong>`;
      list.appendChild(li);
    });
  }

  function updateComments() {
    const list = document.getElementById("comments-list");
    list.innerHTML = "";
    if (comments.length === 0) {
      list.innerHTML = '<div class="comment">No comments yet.</div>';
      return;
    }
    comments.forEach((comment) => {
      const div = document.createElement("div");
      div.classList.add("comment");
      div.innerHTML = `<span class="username">${comment.username}:</span> ${comment.text}`;
      list.appendChild(div);
    });
  }

  updateLeaderboard();
  updateUserUI();
  menuModal.style.display = "flex";
});
