/* StudyQuest RPG - Boss Battle & Flashcard Engine */

class CardsEngine {
  constructor() {
    this.defaultDecks = [
      {
        id: 'deck_1',
        title: 'Science & Physics (العلوم والفيزياء)',
        subject: 'science',
        cards: [
          { q: 'ما هي سرعة الضوء في الفراغ؟', a: 'حوالي 300,000 كم/ثانية (3 × 10^8 م/ث)' },
          { q: 'ما هو القانون الأول لنيوتن للحركة؟', a: 'يظل الجسم الساكن ساكناً والمتحرك متحركاً بصرعة ثابته ما لم تؤثر عليه قوة خارجية' },
          { q: 'ما هو الرمز الكيميائي للماء؟', a: 'H2O' },
          { q: 'ما هي وحدة قياس القوة في النظام الدولي؟', a: 'النيوتن (Newton)' }
        ]
      },
      {
        id: 'deck_2',
        title: 'Mathematics & Algebra (الرياضيات)',
        subject: 'math',
        cards: [
          { q: 'ما هو الجذر التربيعي للعدد 144؟', a: '12' },
          { q: 'ما هي نظرية فيثاغورس المثلث قائم الزاوية؟', a: 'a² + b² = c² (مربع الوتر يساوي مجموع مربعي الضلعين)' },
          { q: 'ما هو مجموع زوايا المثلث الداخلية؟', a: '180 درجة' }
        ]
      }
    ];

    this.decks = this.loadDecks();
    this.activeDeckId = 'deck_1';
    this.currentCardIdx = 0;
    
    // Boss Stats
    this.bosses = [
      { name: 'شبث المماطلة (Distraction Spectre)', hp: 100, maxHp: 100, sprite: '👻', xpReward: 150, goldReward: 100 },
      { name: 'تنين التشتت العظيم (Procrastination Dragon)', hp: 250, maxHp: 250, sprite: '🐉', xpReward: 350, goldReward: 250 },
      { name: 'سيد الامتحانات (Exam Overlord)', hp: 500, maxHp: 500, sprite: '👾', xpReward: 800, goldReward: 600 }
    ];
    
    this.currentBossIdx = 0;
    this.playerHp = 100;
    this.playerMaxHp = 100;
  }

  loadDecks() {
    const saved = localStorage.getItem('studyquest_decks');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return this.defaultDecks; }
    }
    return this.defaultDecks;
  }

  saveDecks() {
    localStorage.setItem('studyquest_decks', JSON.stringify(this.decks));
  }

  getCurrentDeck() {
    return this.decks.find(d => d.id === this.activeDeckId) || this.decks[0];
  }

  getCurrentCard() {
    const deck = this.getCurrentDeck();
    if (!deck || !deck.cards.length) return null;
    return deck.cards[this.currentCardIdx % deck.cards.length];
  }

  renderBattleStage() {
    this.renderDeckSelector();

    const deck = this.getCurrentDeck();
    const card = this.getCurrentCard();
    const boss = this.bosses[this.currentBossIdx];

    const qEl = document.getElementById('battle-question');
    const aBox = document.getElementById('battle-answer-box');
    const aEl = document.getElementById('battle-answer');
    const cardCounterEl = document.getElementById('battle-card-counter');
    const bossAvatarEl = document.getElementById('boss-avatar');
    const bossNameEl = document.getElementById('boss-name');
    const bossHpFill = document.getElementById('boss-hp-fill');
    const bossHpText = document.getElementById('boss-hp-text');

    if (deck && deck.cards.length > 0) {
      if (qEl) qEl.innerText = card ? card.q : 'لا توجد أسئلة';
      if (aEl) aEl.innerText = card ? card.a : '';
      if (cardCounterEl) cardCounterEl.innerText = `سؤال ${(this.currentCardIdx % deck.cards.length) + 1} من ${deck.cards.length}`;
    } else {
      if (qEl) qEl.innerText = '⚠️ لا توجد بطاقات في هذه المجموعة! استخدم مولد الذكاء الاصطناعي لإضافة أسئلة جديدة.';
      if (aEl) aEl.innerText = '';
      if (cardCounterEl) cardCounterEl.innerText = '0 أسئلة';
    }

    if (aBox) aBox.classList.remove('visible');

    if (bossAvatarEl) bossAvatarEl.innerText = boss.sprite;
    if (bossNameEl) bossNameEl.innerText = boss.name;

    const hpPercent = Math.max(0, Math.floor((boss.hp / boss.maxHp) * 100));
    if (bossHpFill) bossHpFill.style.width = `${hpPercent}%`;
    if (bossHpText) bossHpText.innerText = `${boss.hp} / ${boss.maxHp} HP`;
  }

  renderDeckSelector() {
    const selectEl = document.getElementById('arena-deck-select');
    if (!selectEl) return;

    selectEl.innerHTML = '';
    this.decks.forEach(deck => {
      const opt = document.createElement('option');
      opt.value = deck.id;
      opt.innerText = `${deck.title} (${deck.cards.length} أسئلة)`;
      if (deck.id === this.activeDeckId) opt.selected = true;
      selectEl.appendChild(opt);
    });
  }

  switchDeck(deckId) {
    this.activeDeckId = deckId;
    this.currentCardIdx = 0;
    this.renderBattleStage();
    window.showToast(`🎯 تم التبديل إلى مجموعة: ${this.getCurrentDeck().title}`);
  }

  revealAnswer() {
    const card = this.getCurrentCard();
    if (!card) {
      window.showToast('⚠️ لا توجد بطاقة لكشف الإجابة!');
      return;
    }
    window.soundEngine.playClick();
    const aBox = document.getElementById('battle-answer-box');
    if (aBox) aBox.classList.add('visible');
  }

  playerAttack(isCorrect) {
    const card = this.getCurrentCard();
    if (!card) {
      window.showToast('⚠️ أضف أسئلة أولاً للبدء في الهجوم!');
      return;
    }

    const boss = this.bosses[this.currentBossIdx];

    if (isCorrect) {
      window.soundEngine.playAttack();
      const dmg = 35;
      boss.hp = Math.max(0, boss.hp - dmg);
      window.showToast(`🎯 Strike! Dealt ${dmg} Damage to ${boss.name}`);
      window.gamifyEngine.addXP(20, 'Card Strike');

      if (boss.hp <= 0) {
        this.defeatBoss();
        return;
      }
    } else {
      // Check if player has Distraction Shield skill
      if (window.gamifyEngine.state.unlockedSkills.includes('distraction_shield')) {
        window.showToast('🛡️ Distraction Shield Blocked the Boss Counter-Attack!');
      } else {
        const bossDmg = 15;
        this.playerHp = Math.max(0, this.playerHp - bossDmg);
        window.showToast(`💥 Boss Counter-attacked! Took ${bossDmg} Damage`);
      }
    }

    this.nextCard();
  }

  defeatBoss() {
    const boss = this.bosses[this.currentBossIdx];
    window.soundEngine.playVictory();
    window.showToast(`🎉 BOSS DEFEATED! Earned +${boss.xpReward} XP & +${boss.goldReward} Gold!`);

    window.gamifyEngine.addXP(boss.xpReward, 'Boss Defeated');
    window.gamifyEngine.addGold(boss.goldReward);

    // Level up boss or reset HP
    boss.hp = boss.maxHp;
    this.currentBossIdx = (this.currentBossIdx + 1) % this.bosses.length;
    this.nextCard();
  }

  nextCard() {
    const deck = this.getCurrentDeck();
    if (deck && deck.cards.length) {
      this.currentCardIdx = (this.currentCardIdx + 1) % deck.cards.length;
    }
    this.renderBattleStage();
  }

  addDeck(title, subject) {
    const newDeck = {
      id: `deck_${Date.now()}`,
      title,
      subject,
      cards: []
    };
    this.decks.push(newDeck);
    this.saveDecks();
  }

  addCardToCurrentDeck(question, answer) {
    const deck = this.getCurrentDeck();
    if (deck) {
      deck.cards.push({ q: question, a: answer });
      this.saveDecks();
      this.renderBattleStage();
    }
  }
}

window.cardsEngine = new CardsEngine();
