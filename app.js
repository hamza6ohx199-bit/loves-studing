/* StudyQuest RPG - Main Application Bootstrap & i18n Controller */

const i18n = {
  lang: 'ar',
  translations: {
    ar: {
      app_title: 'StudyQuest - مُغامرة المذاكرة',
      world_map: '🗺️ خريطة العالم',
      focus_dungeon: '⏱️ كهف التركيز',
      boss_arena: '⚔️ معركة الوحوش',
      quest_log: '📜 سجل المهام',
      skill_tree: '🔮 شجرة المهارات',
      analytics: '📊 الإحصائيات',
      level: 'المستوى',
      gold: 'الذهب',
      streak: 'سلسلة الالتزام',
      companion_speech: 'مرحباً بك يا بطل! جاهز للمذاكرة والارتقاء بالمستوى اليوم؟ 🚀',
      start_focus: '🚀 ابدأ التركيز',
      pause_focus: '⏸️ إيقاف مؤقت',
      reset_focus: '🔄 إعادة ضبط',
      reveal_answer: '🔍 كشف الإجابة السحرية',
      attack_strike: '⚔️ هجوم! (إجابة صحيحة)',
      attack_miss: '🛡️ خطأ (هجوم مضاد)',
      add_quest: '➕ إضافة مهمة جديدة',
      skill_unlocked: 'تم فتح المهارة بنجاح! 🎉',
      not_enough_gold: 'ليس لديك ذهب كافٍ! 🪙'
    },
    en: {
      app_title: 'StudyQuest RPG',
      world_map: '🗺️ World Map',
      focus_dungeon: '⏱️ Focus Dungeon',
      boss_arena: '⚔️ Boss Arena',
      quest_log: '📜 Quest Log',
      skill_tree: '🔮 Skill Tree',
      analytics: '📊 Analytics',
      level: 'Level',
      gold: 'Gold',
      streak: 'Streak',
      companion_speech: 'Welcome Hero! Ready to study & level up today? 🚀',
      start_focus: '🚀 Start Focus',
      pause_focus: '⏸️ Pause',
      reset_focus: '🔄 Reset',
      reveal_answer: '🔍 Reveal Spell Answer',
      attack_strike: '⚔️ Strike! (Correct)',
      attack_miss: '🛡️ Missed (Counter Attack)',
      add_quest: '➕ Add New Quest',
      skill_unlocked: 'Skill Unlocked Successfully! 🎉',
      not_enough_gold: 'Not enough Gold! 🪙'
    }
  },
  t(key) {
    return this.translations[this.lang][key] || key;
  },
  toggleLang() {
    this.lang = this.lang === 'ar' ? 'en' : 'ar';
    document.documentElement.dir = this.lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = this.lang;
    this.updateDOMTexts();
  },
  updateDOMTexts() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) el.innerText = this.t(key);
    });
  }
};

window.i18n = i18n;

window.showToast = function(message) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerText = message;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
};

// Global App Initialization
document.addEventListener('DOMContentLoaded', () => {
  // Tab Routing
  const tabs = document.querySelectorAll('.nav-tab');
  const views = document.querySelectorAll('.tab-view');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      window.soundEngine.playClick();
      tabs.forEach(t => t.classList.remove('active'));
      views.forEach(v => v.classList.remove('active'));

      tab.classList.add('active');
      const viewId = `view-${tab.dataset.tab}`;
      const targetView = document.getElementById(viewId);
      if (targetView) targetView.classList.add('active');

      if (tab.dataset.tab === 'analytics') {
        window.analyticsEngine.renderCharts();
      }
    });
  });

  // Language Toggle
  const langBtn = document.getElementById('lang-toggle-btn');
  if (langBtn) {
    langBtn.addEventListener('click', () => {
      window.soundEngine.playClick();
      i18n.toggleLang();
      langBtn.innerText = i18n.lang === 'ar' ? 'EN 🌐' : 'عربي 🌐';
    });
  }

  // Soundscape Mixers Volume Controls
  ['rain', 'binaural', 'space'].forEach(track => {
    const slider = document.getElementById(`slider-${track}`);
    if (slider) {
      slider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        window.soundEngine.setAmbientVolume(track, val);
      });
    }
  });

  // New Quest Form Handler
  const addQuestBtn = document.getElementById('add-quest-btn');
  if (addQuestBtn) {
    addQuestBtn.addEventListener('click', () => {
      const input = document.getElementById('new-quest-input');
      const select = document.getElementById('new-quest-subject');
      if (input && input.value.trim()) {
        window.tasksEngine.addTask(input.value.trim(), select.value);
        input.value = '';
      }
    });
  }

  // Level Up Modal Close
  const modalCloseBtn = document.getElementById('modal-close-btn');
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', () => {
      window.soundEngine.playClick();
      document.getElementById('level-up-modal').classList.remove('active');
    });
  }

  // Initial render calls
  window.gamifyEngine.renderHUD();
  window.focusEngine.init();
  window.cardsEngine.renderBattleStage();
  window.tasksEngine.renderTaskList();
});
