/* Smart Quiz - Fixed version with fallback storage and enhanced features */

// Storage system with fallback
const createStorage = () => {
  try {
    // Test localStorage availability
    localStorage.setItem("test", "test");
    localStorage.removeItem("test");
    return localStorage;
  } catch (e) {
    // Fallback to memory storage
    console.warn("localStorage not available, using memory storage");
    return {
      data: {},
      setItem: function (key, value) {
        this.data[key] = value;
      },
      getItem: function (key) {
        return this.data[key] || null;
      },
      removeItem: function (key) {
        delete this.data[key];
      },
    };
  }
};

const storage = createStorage();

const LS = {
  USER: "quiz.username",
  STATE: "quiz.state",
  BOARD: "quiz.leaderboard",
  DARK: "quiz.dark",
  CUSTOM: "quiz.custom",
  SETTINGS: "quiz.settings",
};

// UI elements
const navUser = document.getElementById("navUser");
const usernameLabel = document.getElementById("usernameLabel");
const logoutBtn = document.getElementById("logoutBtn");
const darkToggle = document.getElementById("darkToggle");

const settings = document.getElementById("settings");
const startBtn = document.getElementById("startBtn");
const resumeBtn = document.getElementById("resumeBtn");
const openBoardBtn = document.getElementById("openBoardBtn");

const categorySel = document.getElementById("category");
const difficultySel = document.getElementById("difficulty");
const numQSel = document.getElementById("numQ");
const timePerQInput = document.getElementById("timePerQ");
const negativeSel = document.getElementById("negative");

const builderQ = document.getElementById("cQ");
const builderA = document.getElementById("cA");
const builderB = document.getElementById("cB");
const builderC = document.getElementById("cC");
const builderD = document.getElementById("cD");
const builderCorrect = document.getElementById("cCorrect");
const addCustomBtn = document.getElementById("addCustomBtn");
const customList = document.getElementById("customList");

const quizArea = document.getElementById("quizArea");
const qCounter = document.getElementById("qCounter");
const timerBadge = document.getElementById("timerBadge");
const scoreDisplay = document.getElementById("scoreDisplay");
const progBar = document.getElementById("progBar");
const qText = document.getElementById("qText");
const qCategory = document.getElementById("qCategory");
const qDifficulty = document.getElementById("qDifficulty");
const opts = document.getElementById("opts");
const nextQBtn = document.getElementById("nextQBtn");
const prevBtn = document.getElementById("prevBtn");
const quitBtn = document.getElementById("quitBtn");

const resultArea = document.getElementById("resultArea");
const resName = document.getElementById("resName");
const resScore = document.getElementById("resScore");
const resCorrect = document.getElementById("resCorrect");
const resWrong = document.getElementById("resWrong");
const totalTime = document.getElementById("totalTime");
const finalScoreDisplay = document.getElementById("finalScoreDisplay");
const reviewList = document.getElementById("reviewList");
const shareWA = document.getElementById("shareWA");
const shareTW = document.getElementById("shareTW");
const playAgainBtn = document.getElementById("playAgainBtn");

const boardArea = document.getElementById("boardArea");
const boardList = document.getElementById("boardList");
const clearBoardBtn = document.getElementById("clearBoard");
const backFromBoard = document.getElementById("backFromBoard");

// State
let state = {
  user: null,
  settings: {},
  questions: [],
  idx: 0,
  score: 0,
  correct: 0,
  wrong: 0,
  answersLog: [],
  timeLeft: 0,
  startedAt: null,
  finished: false,
};

let timerInt = null;

// ---------- Utilities ----------
const saveLS = (k, v) => {
  try {
    storage.setItem(k, JSON.stringify(v));
  } catch (e) {
    console.warn("Storage failed:", e);
  }
};

const loadLS = (k, fallback = null) => {
  try {
    const s = storage.getItem(k);
    if (s === null) return fallback;
    try {
      return JSON.parse(s);
    } catch {
      return s; // if not JSON, return as string
    }
  } catch (e) {
    console.warn("Loading failed:", e);
    return fallback;
  }
};

const removeLS = (k) => {
  try {
    storage.removeItem(k);
  } catch (e) {
    console.warn("Remove failed:", e);
  }
};

const decodeHTML = (h) => {
  const t = document.createElement("textarea");
  t.innerHTML = h;
  return t.value;
};

const shuffle = (a) => {
  const arr = [...a]; // Create a copy to avoid mutating original
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// ---------- Section Display Functions ----------
const showSettings = () => {
  hideAllSections();
  if (settings) settings.classList.remove("d-none");
};

const showQuiz = () => {
  hideAllSections();
  if (quizArea) {
    quizArea.classList.remove("d-none");
    quizArea.classList.add("fade-in");
  }
};

const showResults = () => {
  hideAllSections();
  if (resultArea) {
    resultArea.classList.remove("d-none");
    resultArea.classList.add("fade-in");
  }
};

const showBoard = () => {
  hideAllSections();
  if (boardArea) {
    boardArea.classList.remove("d-none");
    boardArea.classList.add("fade-in");
  }
  renderLeaderboard();
};

const hideAllSections = () => {
  const sections = [settings, quizArea, resultArea, boardArea];
  sections.forEach((section) => {
    if (section) {
      section.classList.add("d-none");
      section.classList.remove("fade-in");
    }
  });
};

// ---------- Init / Dark Mode / User ----------
function applyDark(saved) {
  document.body.classList.toggle("dark", !!saved);
  if (darkToggle) darkToggle.checked = !!saved;
}

function initUser() {
  const u = loadLS(LS.USER, null);
  if (!u) {
    // Redirect to login page
    window.location.href = "index.html";
    return false;
  }
  state.user = u;
  if (navUser) navUser.textContent = u;
  if (usernameLabel) usernameLabel.textContent = u;
  return true;
}

// Dark mode toggle
if (darkToggle) {
  darkToggle.addEventListener("change", () => {
    const isDark = darkToggle.checked;
    applyDark(isDark);
    saveLS(LS.DARK, isDark);
  });
}

// Logout functionality
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    if (confirm("Logout? This will clear your session data.")) {
      removeLS(LS.USER);
      removeLS(LS.STATE);
      window.location.href = "index.html";
    }
  });
}

// ---------- Custom Quiz Builder ----------
function renderCustomList() {
  const list = loadLS(LS.CUSTOM, []);
  if (!customList) return;
  customList.innerHTML = "";
  if (list.length === 0) {
    customList.innerHTML =
      '<li class="list-group-item small text-muted text-center">No custom questions added yet.</li>';
    return;
  }
  list.forEach((q, i) => {
    const li = document.createElement("li");
    li.className =
      "list-group-item d-flex justify-content-between align-items-start";
    li.innerHTML = `
      <div>
        <strong>Q${i + 1}:</strong> ${q.question.substring(0, 80)}${
      q.question.length > 80 ? "..." : ""
    }
        <br><small class="text-muted">Correct: ${q.correct}</small>
      </div>
      <button class="btn btn-sm btn-outline-danger" title="Delete Question">
        <i class="bi bi-trash"></i>
      </button>
    `;
    li.querySelector("button").addEventListener("click", () => {
      if (confirm("Delete this question?")) {
        list.splice(i, 1);
        saveLS(LS.CUSTOM, list);
        renderCustomList();
      }
    });
    customList.appendChild(li);
  });
}

if (addCustomBtn) {
  addCustomBtn.addEventListener("click", () => {
    const q = builderQ.value.trim();
    const A = builderA.value.trim();
    const B = builderB.value.trim();
    const C = builderC.value.trim();
    const D = builderD.value.trim();
    const correctIdx = parseInt(builderCorrect.value, 10);
    if (!q || !A || !B || !C || !D) {
      alert("Please fill in the question and all four options");
      return;
    }
    const list = loadLS(LS.CUSTOM, []);
    const opts = [A, B, C, D];
    list.push({
      question: q,
      options: opts,
      correct: opts[correctIdx],
      dateAdded: new Date().toLocaleString(),
    });
    saveLS(LS.CUSTOM, list); // Clear form
    builderQ.value =
      builderA.value =
      builderB.value =
      builderC.value =
      builderD.value =
        "";
    builderCorrect.value = "0";
    renderCustomList(); // Show success feedback
    const btn = addCustomBtn;
    const originalText = btn.innerHTML;
    btn.innerHTML =
      '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Adding...';
    btn.classList.add("btn-success");
    btn.classList.remove("btn-outline-primary");
    btn.disabled = true;
    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.classList.remove("btn-success");
      btn.classList.add("btn-outline-primary");
      btn.disabled = false;
    }, 2000);
  });
}

// ---------- Resume Detection ----------
function checkResume() {
  const s = loadLS(LS.STATE, null);
  if (s && !s.finished && s.questions && s.questions.length > 0) {
    if (resumeBtn) resumeBtn.classList.remove("d-none");
  } else {
    if (resumeBtn) resumeBtn.classList.add("d-none");
  }
}

// ---------- Event Listeners ----------
if (startBtn) startBtn.addEventListener("click", startQuizFlow);
if (resumeBtn) resumeBtn.addEventListener("click", resumeQuizFlow);
if (openBoardBtn) openBoardBtn.addEventListener("click", showBoard);

// ---------- Start Quiz Flow ----------
async function startQuizFlow() {
  // Show loading state
  const originalText = startBtn.innerHTML;
  if (startBtn) {
    startBtn.innerHTML = '<span class="spinner"></span> Loading Questions...';
    startBtn.disabled = true;
  }

  try {
    const category = categorySel?.value || "";
    const difficulty = difficultySel?.value || "";
    const num = parseInt(numQSel?.value || "10", 10);
    const tPerQ = Math.max(5, parseInt(timePerQInput?.value || "15", 10));
    const neg = parseFloat(negativeSel?.value || "0");

    state.settings = { category, difficulty, num, tPerQ, neg }; // Check for custom questions first

    const customQs = loadLS(LS.CUSTOM, []);
    if (category === "" && customQs && customQs.length >= num) {
      // Use custom questions
      state.questions = shuffle(
        customQs.map((q) => ({
          question: q.question,
          correct_answer: q.correct,
          incorrect_answers: q.options.filter((o) => o !== q.correct),
          category: "Custom",
          difficulty: "custom",
        }))
      ).slice(0, num);
    } else {
      // Fetch from Open Trivia API
      const params = new URLSearchParams();
      params.set("amount", num);
      params.set("type", "multiple");
      if (category) params.set("category", category);
      if (difficulty) params.set("difficulty", difficulty);
      const url = `https://opentdb.com/api.php?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Failed to fetch questions from server");
      }
      const data = await res.json();
      if (!data.results || data.results.length === 0) {
        throw new Error(
          "No questions found for your selection. Please try different settings."
        );
      }
      state.questions = data.results.map((q) => ({
        question: decodeHTML(q.question),
        correct_answer: decodeHTML(q.correct_answer),
        incorrect_answers: q.incorrect_answers.map(decodeHTML),
        category: decodeHTML(q.category),
        difficulty: q.difficulty,
      }));
    } // Reset quiz state

    state.idx = 0;
    state.score = 0;
    state.correct = 0;
    state.wrong = 0;
    state.answersLog = [];
    state.timeLeft = state.settings.tPerQ;
    state.startedAt = Date.now();
    state.finished = false;
    saveLS(LS.STATE, state);
    saveLS(LS.SETTINGS, state.settings);

    showQuiz();
    showQuestion();
    checkResume();
  } catch (error) {
    console.error("Quiz start error:", error);
    alert(
      error.message ||
        "Failed to start quiz. Please check your internet connection and try again."
    );
  } finally {
    // Restore button state
    if (startBtn) {
      startBtn.innerHTML = originalText;
      startBtn.disabled = false;
    }
  }
}

function resumeQuizFlow() {
  const saved = loadLS(LS.STATE, null);
  if (
    !saved ||
    saved.finished ||
    !saved.questions ||
    saved.questions.length === 0
  ) {
    alert("No valid quiz state found to resume.");
    checkResume();
    return;
  } // Restore state
  Object.assign(state, saved);
  state.settings = state.settings || loadLS(LS.SETTINGS, {});
  showQuiz();
  showQuestion();
}

// ---------- Show Question ----------
function showQuestion() {
  if (
    !state.questions ||
    state.questions.length === 0 ||
    state.idx >= state.questions.length
  ) {
    alert("No questions available or invalid question index.");
    return;
  }

  clearInterval(timerInt);
  const q = state.questions[state.idx]; // Create all options and shuffle them
  const allOptions = [q.correct_answer, ...q.incorrect_answers];
  const shuffledOptions = shuffle(allOptions); // Update UI elements

  if (qCounter)
    qCounter.textContent = `Question ${state.idx + 1} of ${
      state.questions.length
    }`;
  if (progBar)
    progBar.style.width = `${Math.round(
      ((state.idx + 1) / state.questions.length) * 100
    )}%`;
  if (qText) qText.textContent = q.question; // Update category and difficulty
  if (qCategory) qCategory.textContent = q.category || "General";
  if (qDifficulty) {
    qDifficulty.textContent = (q.difficulty || "medium").toUpperCase();
    qDifficulty.className = `badge ms-2 ${
      q.difficulty === "easy"
        ? "bg-success"
        : q.difficulty === "hard"
        ? "bg-danger"
        : "bg-warning"
    }`;
  } // Update score display
  if (scoreDisplay) {
    scoreDisplay.textContent = `Score: ${Number(state.score.toFixed(1))}`;
  } // Create option buttons

  if (opts) {
    opts.innerHTML = "";
    shuffledOptions.forEach((opt) => {
      const btn = document.createElement("button");
      btn.className = "btn btn-outline-secondary option-btn";
      btn.textContent = opt;
      btn.addEventListener("click", () =>
        selectAnswer(btn, opt, q.correct_answer)
      );
      opts.appendChild(btn);
    });
  } // Check if question was already answered

  const prevAns = state.answersLog[state.idx];
  if (prevAns && prevAns.selected && opts) {
    Array.from(opts.children).forEach((btn) => {
      btn.disabled = true;
      if (btn.textContent === prevAns.selected) {
        btn.classList.remove("btn-outline-secondary");
        btn.classList.add(
          prevAns.isCorrect ? "option-correct" : "option-wrong"
        );
      }
      if (btn.textContent === prevAns.correct && !prevAns.isCorrect) {
        btn.classList.remove("btn-outline-secondary");
        btn.classList.add("option-correct");
      }
    });
    if (nextQBtn) {
      nextQBtn.disabled = false;
      nextQBtn.innerHTML =
        state.idx === state.questions.length - 1
          ? 'Finish Quiz <i class="bi bi-flag-checkered"></i>'
          : 'Next Question <i class="bi bi-arrow-right"></i>';
    }
  } else {
    if (nextQBtn) {
      nextQBtn.disabled = true;
      nextQBtn.innerHTML = 'Select Answer <i class="bi bi-arrow-right"></i>';
    }
    if (opts) {
      Array.from(opts.children).forEach((b) => (b.disabled = false));
    }
  } // Show/hide previous button

  if (prevBtn) prevBtn.classList.toggle("d-none", state.idx === 0); // Start timer
  state.timeLeft = state.settings.tPerQ || 15;
  updateTimer();
  timerInt = setInterval(() => {
    state.timeLeft--;
    updateTimer();
    if (state.timeLeft <= 0) {
      clearInterval(timerInt);
      handleTimeOut(q);
    }
  }, 1000);
}

function updateTimer() {
  if (!timerBadge) return;
  timerBadge.textContent = `${state.timeLeft}s`; // Add warning animation when time is running low
  if (state.timeLeft <= 5) {
    timerBadge.classList.add("timer-warning");
  } else {
    timerBadge.classList.remove("timer-warning");
    timerBadge.className = "badge bg-danger";
  }
}

// ---------- Answer Selection ----------
function selectAnswer(btn, selected, correct) {
  if (!btn || btn.disabled) return;
  clearInterval(timerInt);
  const buttons = opts ? Array.from(opts.children) : [];
  buttons.forEach((b) => (b.disabled = true));

  const isCorrect = selected === correct;
  const timeTaken = (state.settings.tPerQ || 15) - state.timeLeft; // Visual feedback
  btn.classList.remove("btn-outline-secondary");
  if (isCorrect) {
    btn.classList.add("option-correct");
    state.score += 1;
    state.correct += 1;
  } else {
    btn.classList.add("option-wrong"); // Highlight correct answer
    buttons.forEach((b) => {
      if (b.textContent === correct) {
        b.classList.remove("btn-outline-secondary");
        b.classList.add("option-correct");
      }
    });
    state.score += state.settings.neg || 0;
    state.wrong += 1;
  } // Record answer

  state.answersLog[state.idx] = {
    q: state.questions[state.idx].question,
    options: buttons.map((b) => b.textContent),
    correct: correct,
    selected: selected,
    isCorrect: isCorrect,
    timeTaken: timeTaken,
    category: state.questions[state.idx].category || "",
  }; // Update score display

  if (scoreDisplay) {
    scoreDisplay.textContent = `Score: ${Number(state.score.toFixed(1))}`;
  }

  if (nextQBtn) {
    nextQBtn.disabled = false;
    nextQBtn.innerHTML =
      state.idx === state.questions.length - 1
        ? 'Finish Quiz <i class="bi bi-flag-checkered"></i>'
        : 'Next Question <i class="bi bi-arrow-right"></i>';
  }
  saveLS(LS.STATE, state);
}

// ---------- Timeout Handler ----------
function handleTimeOut(q) {
  const buttons = opts ? Array.from(opts.children) : [];
  buttons.forEach((b) => {
    b.disabled = true;
    if (b.textContent === q.correct_answer) {
      b.classList.remove("btn-outline-secondary");
      b.classList.add("option-correct");
    }
  });

  const timeTaken = state.settings.tPerQ || 15;
  state.answersLog[state.idx] = {
    q: q.question,
    options: buttons.map((b) => b.textContent),
    correct: q.correct_answer,
    selected: "(timed out)",
    isCorrect: false,
    timeTaken: timeTaken,
    category: q.category || "",
  };
  state.wrong += 1;
  state.score += state.settings.neg || 0; // Update score display
  if (scoreDisplay) {
    scoreDisplay.textContent = `Score: ${Number(state.score.toFixed(1))}`;
  }
  if (nextQBtn) {
    nextQBtn.disabled = false;
    nextQBtn.innerHTML =
      state.idx === state.questions.length - 1
        ? 'Finish Quiz <i class="bi bi-flag-checkered"></i>'
        : 'Next Question <i class="bi bi-arrow-right"></i>';
  }
  saveLS(LS.STATE, state);
}

// ---------- Navigation ----------
if (nextQBtn) {
  nextQBtn.addEventListener("click", () => {
    if (state.idx < state.questions.length - 1) {
      state.idx++;
      saveLS(LS.STATE, state);
      showQuestion();
    } else {
      finishQuiz();
    }
  });
}

if (prevBtn) {
  prevBtn.addEventListener("click", () => {
    if (state.idx > 0) {
      state.idx--;
      saveLS(LS.STATE, state);
      showQuestion();
    }
  });
}

if (quitBtn) {
  quitBtn.addEventListener("click", () => {
    if (
      confirm(
        "Quit this quiz? Your progress will be saved so you can resume later."
      )
    ) {
      clearInterval(timerInt);
      saveLS(LS.STATE, state);
      showSettings();
      checkResume();
    }
  });
}

// ---------- Finish Quiz ----------
function finishQuiz() {
  clearInterval(timerInt);
  state.finished = true;
  const totalTimeTaken = Math.round((Date.now() - state.startedAt) / 1000);
  saveToLeaderboard(totalTimeTaken); // Update result displays
  if (resName) resName.textContent = state.user;
  if (resScore)
    resScore.textContent = `${Number(state.score.toFixed(2))} / ${
      state.questions.length
    }`;
  if (resCorrect) resCorrect.textContent = state.correct;
  if (resWrong) resWrong.textContent = state.wrong;
  if (totalTime)
    totalTime.textContent = `${Math.floor(totalTimeTaken / 60)}m ${
      totalTimeTaken % 60
    }s`; // Final score display with percentage
  const percentage = Math.round((state.correct / state.questions.length) * 100);
  if (finalScoreDisplay) {
    finalScoreDisplay.textContent = `${Number(state.score.toFixed(1))} / ${
      state.questions.length
    } (${percentage}%)`;
  }
  renderReview();
  setupShareLinks(totalTimeTaken, percentage); // Clear in-progress state
  removeLS(LS.STATE);
  checkResume();
  showResults();
}

// ---------- Review Render ----------
function renderReview() {
  if (!reviewList) return;
  reviewList.innerHTML = "";
  state.answersLog.forEach((a, i) => {
    const id = `rev${i}`;
    const item = document.createElement("div");
    item.className = "accordion-item mb-2";
    const isCorrectIcon = a.isCorrect
      ? '<i class="bi bi-check-circle-fill text-success"></i>'
      : '<i class="bi bi-x-circle-fill text-danger"></i>';
    item.innerHTML = `
      <h2 class="accordion-header">
        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#${id}">
          ${isCorrectIcon} Q${i + 1}: ${
      a.q.length > 60 ? a.q.substring(0, 60) + "..." : a.q
    }
        </button>
      </h2>
      <div id="${id}" class="accordion-collapse collapse">
        <div class="accordion-body">
          <div class="row">
            <div class="col-md-8">
              <div><strong>Question:</strong> ${a.q}</div>
              <div class="mt-2"><strong>Correct Answer:</strong> <span class="text-success fw-bold">${
      a.correct
    }</span></div>
              <div><strong>Your Answer:</strong> <span class="${
      a.isCorrect ? "text-success" : "text-danger"
    } fw-bold">${a.selected}</span></div>
            </div>
            <div class="col-md-4">
              <div><strong>Time Taken:</strong> ${Math.round(
      a.timeTaken
    )}s</div>
              <div><strong>Category:</strong> ${a.category}</div>
              <div><strong>Result:</strong> ${
      a.isCorrect
        ? '<span class="badge bg-success"><i class="bi bi-check"></i> Correct</span>'
        : '<span class="badge bg-danger"><i class="bi bi-x"></i> Incorrect</span>'
    }</div>
            </div>
          </div>
        </div>
      </div>
    `;
    reviewList.appendChild(item);
  });
}

// ---------- Share Links ----------
function setupShareLinks(totalTimeTaken, percentage) {
  const shareText = `I just scored ${Number(state.score.toFixed(1))}/${
    state.questions.length
  } (${percentage}%) on Smart Quiz! 🎯 Completed in ${Math.floor(
    totalTimeTaken / 60
  )}m ${totalTimeTaken % 60}s. Can you beat my score?`;
  const encodedText = encodeURIComponent(shareText);
  if (shareWA) {
    shareWA.href = `https://wa.me/?text=${encodedText}`;
  }
  if (shareTW) {
    shareTW.href = `https://twitter.com/intent/tweet?text=${encodedText}`;
  }
}

// ---------- Leaderboard ----------
function saveToLeaderboard(totalTimeTaken) {
  const board = loadLS(LS.BOARD, []);
  const percentage = Math.round((state.correct / state.questions.length) * 100);
  board.push({
    user: state.user,
    score: Number(state.score.toFixed(2)),
    correct: state.correct,
    wrong: state.wrong,
    total: state.questions.length,
    percentage: percentage,
    timeTaken: totalTimeTaken,
    date: new Date().toLocaleString(),
    category: state.settings.category
      ? getCategoryName(state.settings.category)
      : "Mixed",
    difficulty: state.settings.difficulty || "Mixed",
  }); // Sort by score (desc), then by time taken (asc) for ties
  board.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.timeTaken - b.timeTaken;
  });
  saveLS(LS.BOARD, board.slice(0, 100)); // Keep top 100 scores
}

function getCategoryName(categoryId) {
  const categories = {
    9: "General Knowledge",
    18: "Computers",
    21: "Sports",
    23: "History",
    17: "Science & Nature",
    22: "Geography",
    24: "Politics",
    11: "Entertainment: Film",
    12: "Entertainment: Music",
  };
  return categories[categoryId] || "Mixed";
}

function renderLeaderboard() {
  if (!boardList) return;
  boardList.innerHTML = "";
  const board = loadLS(LS.BOARD, []);
  if (!board || board.length === 0) {
    boardList.innerHTML =
      '<li class="list-group-item text-muted text-center py-4"><i class="bi bi-trophy"></i> No scores yet. Complete a quiz to see your results here!</li>';
  } else {
    board.forEach((r, i) => {
      const li = document.createElement("li");
      li.className =
        "list-group-item d-flex justify-content-between align-items-center";
      li.innerHTML = `
        <div>
          <strong class="me-2">${i + 1}.</strong>
          <span>${r.user}</span>
        </div>
        <div class="text-end">
          <span class="badge bg-primary rounded-pill me-2">${r.score} pts</span>
          <small class="text-muted d-block">${r.correct}/${r.total} Qs</small>
        </div>
      `;
      boardList.appendChild(li);
    });
  }
}

// ---------- Play again / Restart ----------
if (playAgainBtn) {
  playAgainBtn.addEventListener("click", () => {
    showSettings();
    checkResume();
  });
}

// ---------- Persistence ----------
function saveStateOnExit() {
  if (state.questions.length > 0 && !state.finished) {
    saveLS(LS.STATE, state);
  }
}
window.addEventListener("beforeunload", saveStateOnExit);

// ---------- Init main ----------
function init() {
  if (!initUser()) return; // Load user info for display
  if (navUser) navUser.textContent = state.user;
  if (usernameLabel) usernameLabel.textContent = state.user; // Apply dark mode preference
  applyDark(loadLS(LS.DARK, false)); // Check for a resumable quiz state

  checkResume(); // Render custom question list

  renderCustomList(); // Load previous settings

  const prevSettings = loadLS(LS.SETTINGS, null);
  if (prevSettings) {
    if (categorySel) categorySel.value = prevSettings.category || "";
    if (difficultySel) difficultySel.value = prevSettings.difficulty || "";
    if (numQSel) numQSel.value = prevSettings.num || "10";
    if (timePerQInput) timePerQInput.value = prevSettings.tPerQ || 15;
    if (negativeSel) negativeSel.value = prevSettings.neg || "0";
  }
}
document.addEventListener("DOMContentLoaded", init);
