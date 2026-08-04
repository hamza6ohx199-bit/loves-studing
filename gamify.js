/* StudyQuest RPG - Gamification Engine & RPG Logic */

class GamificationEngine {
  constructor() {
    this.defaultState = {
      level: 1,
      xp: 0,
      gold: 150,
      gems: 10,
      streak: 1,
      lastStudyDate: new Date().toISOString().split('T')[0],
      companionName: 'Sparky',
      unlockedSkills: [],
      inventory: [],
      playerName: 'Hero Scholar',
      playerTitle: 'Novice Apprentice'
    };

    this.state = this.loadState();
    this.checkDailyStreak();
  }

  loadState() {
    const saved = localStorage.getItem('studyquest_rpg_state');
    if (saved) {
      try { return { ...this.defaultState, ...JSON.parse(saved) }; } 
      catch (e) { return { ...this.defaultState }; }
    }
    return { ...this.defaultState };
  }

  saveState() {
    localStorage.setItem('studyquest_rpg_state', JSON.stringify(this.state));
    this.renderHUD();
  }

  checkDailyStreak() {
    const today = new Date().toISOString().split('T')[0];
    const lastDate = this.state.lastStudyDate;
    
    if (lastDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (lastDate === yesterday) {
        // Maintained streak!
      } else {
        // Reset streak if missed more than 1 day
        const diffDays = Math.floor((new Date(today) - new Date(lastDate)) / 86400000);
        if (diffDays > 1) {
          this.state.streak = 1;
        }
      }
      this.state.lastStudyDate = today;
      this.saveState();
    }
  }

  getXPForLevel(lvl) {
    return Math.floor(100 * Math.pow(1.25, lvl - 1));
  }

  addXP(amount, reason = '') {
    // Apply skills multiplier if any
    let multiplier = 1.0;
    if (this.state.unlockedSkills.includes('focus_boost')) multiplier += 0.2;
    if (this.state.streak > 1) multiplier += Math.min(0.5, (this.state.streak - 1) * 0.05);

    const finalXP = Math.floor(amount * multiplier);
    this.state.xp += finalXP;

    let currentLvlXP = this.getXPForLevel(this.state.level);
    let leveledUp = false;

    while (this.state.xp >= currentLvlXP) {
      this.state.xp -= currentLvlXP;
      this.state.level++;
      leveledUp = true;
      currentLvlXP = this.getXPForLevel(this.state.level);
    }

    if (leveledUp) {
      this.state.gold += this.state.level * 50;
      this.state.gems += 5;
      this.updateTitle();
      window.soundEngine.playLevelUp();
      this.triggerLevelUpModal();
    }

    this.saveState();
    if (reason && window.showToast) {
      window.showToast(`+${finalXP} XP ${reason ? '(' + reason + ')' : ''}`);
    }
  }

  addGold(amount) {
    this.state.gold += amount;
    this.saveState();
  }

  updateTitle() {
    const lvl = this.state.level;
    if (lvl < 5) this.state.playerTitle = 'Novice Apprentice';
    else if (lvl < 10) this.state.playerTitle = 'Scholar Cadet';
    else if (lvl < 20) this.state.playerTitle = 'Mind Mage';
    else if (lvl < 35) this.state.playerTitle = 'Master Archon';
    else this.state.playerTitle = 'Legendary Grand Sage';
  }

  getCompanionSprite() {
    const lvl = this.state.level;
    if (lvl < 5) return '🥚';
    if (lvl < 15) return '🐣';
    if (lvl < 30) return '🦅';
    if (lvl < 50) return '🐲';
    return '🌌';
  }

  getCompanionTitle() {
    const lvl = this.state.level;
    if (lvl < 5) return 'Sparky (Egg Hatchling)';
    if (lvl < 15) return 'Arcane Spark';
    if (lvl < 30) return 'Flame Phoenix';
    if (lvl < 50) return 'Elder Arcane Dragon';
    return 'Cosmic Celestial Guardian';
  }

  buySkill(skillId, cost) {
    if (this.state.unlockedSkills.includes(skillId)) return false;
    if (this.state.gold < cost) {
      window.showToast(window.i18n ? window.i18n.t('not_enough_gold') : 'Not enough gold!');
      return false;
    }
    this.state.gold -= cost;
    this.state.unlockedSkills.push(skillId);
    this.saveState();
    window.soundEngine.playVictory();
    window.showToast(window.i18n ? window.i18n.t('skill_unlocked') : 'Skill Unlocked!');
    return true;
  }

  renderHUD() {
    const lvlEl = document.getElementById('hud-level-val');
    const xpBarEl = document.getElementById('hud-xp-fill');
    const xpTextEl = document.getElementById('hud-xp-text');
    const goldEl = document.getElementById('hud-gold-val');
    const streakEl = document.getElementById('hud-streak-val');
    const nameEl = document.getElementById('hud-player-name');
    const titleEl = document.getElementById('hud-player-title');
    const companionSpriteEl = document.getElementById('companion-sprite');
    const companionTitleEl = document.getElementById('companion-title');

    const requiredXP = this.getXPForLevel(this.state.level);
    const xpPercent = Math.min(100, Math.floor((this.state.xp / requiredXP) * 100));

    if (lvlEl) lvlEl.innerText = this.state.level;
    if (xpBarEl) xpBarEl.style.width = `${xpPercent}%`;
    if (xpTextEl) xpTextEl.innerText = `${this.state.xp} / ${requiredXP} XP`;
    if (goldEl) goldEl.innerText = this.state.gold;
    if (streakEl) streakEl.innerText = `${this.state.streak}🔥`;
    if (nameEl) nameEl.innerText = this.state.playerName;
    if (titleEl) titleEl.innerText = this.state.playerTitle;
    if (companionSpriteEl) companionSpriteEl.innerText = this.getCompanionSprite();
    if (companionTitleEl) companionTitleEl.innerText = this.getCompanionTitle();
  }

  triggerLevelUpModal() {
    const modal = document.getElementById('level-up-modal');
    const modalLvl = document.getElementById('modal-level-num');
    if (modal && modalLvl) {
      modalLvl.innerText = this.state.level;
      modal.classList.add('active');
    }
  }
}

window.gamifyEngine = new GamificationEngine();
