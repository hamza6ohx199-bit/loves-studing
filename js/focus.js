/* StudyQuest RPG - Focus Dungeon & Pomodoro Timer Engine */

class FocusEngine {
  constructor() {
    this.totalSeconds = 25 * 60;
    this.remainingSeconds = 25 * 60;
    this.timerId = null;
    this.isRunning = false;
    this.mode = 'focus'; // focus, shortBreak, longBreak
  }

  init() {
    this.updateDisplay();
    this.bindEvents();
  }

  bindEvents() {
    const startBtn = document.getElementById('timer-start-btn');
    const pauseBtn = document.getElementById('timer-pause-btn');
    const resetBtn = document.getElementById('timer-reset-btn');
    const focusModeBtn = document.getElementById('btn-mode-focus');
    const shortBreakBtn = document.getElementById('btn-mode-short');
    const longBreakBtn = document.getElementById('btn-mode-long');

    if (startBtn) startBtn.addEventListener('click', () => this.start());
    if (pauseBtn) pauseBtn.addEventListener('click', () => this.pause());
    if (resetBtn) resetBtn.addEventListener('click', () => this.reset());

    if (focusModeBtn) focusModeBtn.addEventListener('click', () => this.setMode('focus', 25));
    if (shortBreakBtn) shortBreakBtn.addEventListener('click', () => this.setMode('shortBreak', 5));
    if (longBreakBtn) longBreakBtn.addEventListener('click', () => this.setMode('longBreak', 15));
  }

  setMode(mode, minutes) {
    this.pause();
    this.mode = mode;
    this.totalSeconds = minutes * 60;
    this.remainingSeconds = this.totalSeconds;
    this.updateDisplay();

    // Toggle active mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    const currentBtn = document.getElementById(`btn-mode-${mode === 'focus' ? 'focus' : mode === 'shortBreak' ? 'short' : 'long'}`);
    if (currentBtn) currentBtn.classList.add('active');

    const modeTag = document.getElementById('timer-mode-tag');
    if (modeTag) {
      modeTag.innerText = mode === 'focus' ? 'Focus Dungeon' : 'Rest Sanctuary';
    }
  }

  start() {
    if (this.isRunning) return;
    window.soundEngine.playClick();
    this.isRunning = true;
    
    document.getElementById('timer-start-btn').style.display = 'none';
    document.getElementById('timer-pause-btn').style.display = 'inline-flex';

    this.timerId = setInterval(() => {
      this.remainingSeconds--;
      this.updateDisplay();

      if (this.remainingSeconds <= 0) {
        this.completeSession();
      }
    }, 1000);
  }

  pause() {
    if (!this.isRunning) return;
    window.soundEngine.playClick();
    this.isRunning = false;
    clearInterval(this.timerId);

    document.getElementById('timer-start-btn').style.display = 'inline-flex';
    document.getElementById('timer-pause-btn').style.display = 'none';
  }

  reset() {
    this.pause();
    this.remainingSeconds = this.totalSeconds;
    this.updateDisplay();
  }

  completeSession() {
    this.pause();
    window.soundEngine.playVictory();

    if (this.mode === 'focus') {
      const minutesSpent = Math.floor(this.totalSeconds / 60);
      const xpEarned = minutesSpent * 5;
      const goldEarned = minutesSpent * 2;

      window.gamifyEngine.addXP(xpEarned, `${minutesSpent}m Focus Complete`);
      window.gamifyEngine.addGold(goldEarned);
    } else {
      window.showToast('Rest completed! Ready for the next quest?');
    }

    this.reset();
  }

  updateDisplay() {
    const minutes = Math.floor(this.remainingSeconds / 60);
    const seconds = this.remainingSeconds % 60;
    const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    const displayEl = document.getElementById('timer-val-display');
    if (displayEl) displayEl.innerText = formatted;

    // SVG Circle Dash Offset calculation (Radius = 120, Circumference ≈ 753.98)
    const circleEl = document.getElementById('timer-progress-circle');
    if (circleEl) {
      const progressRatio = this.remainingSeconds / this.totalSeconds;
      const dashOffset = 753 * (1 - progressRatio);
      circleEl.style.strokeDashoffset = dashOffset;
    }
  }
}

window.focusEngine = new FocusEngine();
