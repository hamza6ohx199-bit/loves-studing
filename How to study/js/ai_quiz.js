/* StudyQuest RPG - AI Quiz, Schedule, Summary & Tutor Engine */

class AIQuizEngine {
  constructor() {
    this.currentSchedule = [];
    this.currentExamQuestions = [];
    this.currentExamIndex = 0;
    this.userExamAnswers = {};
  }

  // --- Sub-Tab Switcher ---
  switchSubTab(tabName) {
    const subTabs = document.querySelectorAll('.ai-sub-tab');
    const subViews = document.querySelectorAll('.ai-sub-view');

    subTabs.forEach(tab => tab.classList.remove('active'));
    subViews.forEach(view => view.classList.remove('active'));

    const activeBtn = document.querySelector(`.ai-sub-tab[data-aitab="${tabName}"]`);
    const activeView = document.getElementById(`ai-view-${tabName}`);

    if (activeBtn) activeBtn.classList.add('active');
    if (activeView) activeView.classList.add('active');
    
    window.soundEngine.playClick();
  }

  // --- 1. Schedule Generator (مولد الجداول) ---
  async generateStudySchedule() {
    const topics = document.getElementById('ai-sched-topics').value.trim();
    const days = parseInt(document.getElementById('ai-sched-days').value) || 7;
    const hours = parseInt(document.getElementById('ai-sched-hours').value) || 3;
    const statusEl = document.getElementById('ai-sched-status');
    const resultBox = document.getElementById('ai-sched-result');

    if (!topics || topics.length < 3) {
      window.showToast('⚠️ يرجى أدخال أسماء المواد أو المفاهيم المراد جدولتها!');
      return;
    }

    if (statusEl) statusEl.innerHTML = '⏳ جاري توليد الجدول الدراسي المخصص باستخدام Gemini AI...';
    window.soundEngine.playClick();

    try {
      const schedule = await window.geminiService.generateSchedule(topics, days, hours);
      this.currentSchedule = schedule;

      if (statusEl) statusEl.innerHTML = '✅ تم إنشاء الجدول الدراسي بنجاح!';
      this.renderScheduleResult(schedule);
      window.soundEngine.playVictory();
    } catch (err) {
      if (statusEl) statusEl.innerHTML = `⚠️ حدث خطأ أثناء التوليد: ${err.message}`;
      window.showToast('⚠️ يتعذر الاتصال بالذكاء الاصطناعي حالياً.');
    }
  }

  renderScheduleResult(schedule) {
    const container = document.getElementById('ai-sched-list');
    const actionsBox = document.getElementById('ai-sched-actions');
    if (!container) return;

    container.innerHTML = '';
    if (!schedule || schedule.length === 0) {
      container.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text-muted);">لم يتم إنشاء مهام في الجدول.</div>';
      return;
    }

    const subjectIcons = {
      science: '🧬 علوم / فيزياء',
      math: '📐 رياضيات',
      history: '🏛️ تاريخ',
      lang: '💬 لغات'
    };

    schedule.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'glass-card schedule-item-card';
      card.style.margin = '10px 0';
      card.style.padding = '14px';
      card.style.borderRight = '4px solid var(--primary-purple)';
      
      const subjText = subjectIcons[item.subject] || item.subject;
      
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
          <div>
            <span style="background:var(--primary-glow); color:#fff; font-size:11px; padding:2px 8px; border-radius:10px; font-weight:800;">${item.day || `يوم ${index + 1}`}</span>
            <h4 style="margin:4px 0; color:var(--accent-gold); font-size:16px;">${item.title}</h4>
            <p style="font-size:12px; color:var(--text-muted);">${item.description || ''}</p>
          </div>
          <div style="text-align:left;">
            <span class="task-tag tag-${item.subject}">${subjText}</span>
            <div style="font-size:11px; color:var(--accent-cyan); margin-top:4px;">⏱️ ${item.estimatedMinutes || 45} دقيقة</div>
          </div>
        </div>
      `;
      container.appendChild(card);
    });

    if (actionsBox) actionsBox.style.display = 'flex';
  }

  addScheduleToQuestLog() {
    if (!this.currentSchedule || this.currentSchedule.length === 0) {
      window.showToast('⚠️ لا يوجد جدول حالياً لإضافته للمهام!');
      return;
    }

    let addedCount = 0;
    this.currentSchedule.forEach(item => {
      window.tasksEngine.addTask(
        `${item.day ? item.day + ': ' : ''}${item.title}`,
        item.subject || 'science',
        item.difficulty || 'medium'
      );
      addedCount++;
    });

    window.soundEngine.playVictory();
    window.showToast(`🚀 تم إضافة ${addedCount} مهام دراسية من الجدول إلى سجل المهام (Quest Log) بنجاح!`);
  }

  // --- 2. Summary Generator (مولد التلخيصات) ---
  async generateSummary() {
    const text = document.getElementById('ai-summary-text').value.trim();
    const depth = document.getElementById('ai-summary-depth').value;
    const statusEl = document.getElementById('ai-summary-status');
    const outputEl = document.getElementById('ai-summary-output');

    if (!text || text.length < 10) {
      window.showToast('⚠️ يرجى أدخال نص الدرس أو كتاب كافٍ للتلخيص (أكثر من 10 حروف)!');
      return;
    }

    if (statusEl) statusEl.innerHTML = '⏳ جاري تلخيص النص وصياغة المفاهيم الذكية بواسطة Gemini AI...';
    window.soundEngine.playClick();

    try {
      const summaryMarkdown = await window.geminiService.generateSummary(text, depth);
      if (statusEl) statusEl.innerHTML = '✨ اكتمل التلخيص بنجاح!';
      
      if (outputEl) {
        outputEl.innerHTML = this.formatMarkdown(summaryMarkdown);
        document.getElementById('ai-summary-actions').style.display = 'flex';
      }
      window.soundEngine.playLevelUp();
    } catch (err) {
      if (statusEl) statusEl.innerHTML = `⚠️ حدث خطأ أثناء التلخيص: ${err.message}`;
      window.showToast('⚠️ يتعذر الاتصال بالذكاء الاصطناعي حالياً.');
    }
  }

  copySummary() {
    const outputEl = document.getElementById('ai-summary-output');
    if (!outputEl || !outputEl.innerText) return;
    
    navigator.clipboard.writeText(outputEl.innerText);
    window.showToast('📋 تم نسخ التلخيص بنجاح إلى الحافظة!');
  }

  // --- 3. Exams & Quizzes Generator (مولد الامتحانات) ---
  async generateExam() {
    const textOrTopic = document.getElementById('ai-exam-topic').value.trim();
    const count = parseInt(document.getElementById('ai-exam-count').value) || 5;
    const type = document.getElementById('ai-exam-type').value;
    const difficulty = document.getElementById('ai-exam-difficulty').value;
    const statusEl = document.getElementById('ai-exam-status');

    if (!textOrTopic || textOrTopic.length < 4) {
      window.showToast('⚠️ أدخل اسم المادة أو نص الدرس لتوليد الامتحان!');
      return;
    }

    if (statusEl) statusEl.innerHTML = '⏳ جاري وضع الامتحان التفاعلي والأسئلة بواسطة Gemini AI...';
    window.soundEngine.playClick();

    try {
      const questions = await window.geminiService.generateExam(textOrTopic, count, type, difficulty);
      this.currentExamQuestions = questions;

      if (statusEl) statusEl.innerHTML = `✅ تم توليد ${questions.length} أسئلة بنجاح! اختر طريقة البدء أدناه:`;
      this.renderExamPreview(questions);
      window.soundEngine.playVictory();
    } catch (err) {
      if (statusEl) statusEl.innerHTML = `⚠️ حدث خطأ أثناء توليد الامتحان: ${err.message}`;
      window.showToast('⚠️ يتعذر التوليد حالياً.');
    }
  }

  renderExamPreview(questions) {
    const previewContainer = document.getElementById('ai-exam-preview');
    const actionsBox = document.getElementById('ai-exam-actions');
    if (!previewContainer) return;

    previewContainer.innerHTML = '';
    questions.forEach((q, i) => {
      const item = document.createElement('div');
      item.className = 'glass-card';
      item.style.margin = '8px 0';
      item.style.padding = '12px';

      let optionsHTML = '';
      if (q.options && q.options.length > 0) {
        optionsHTML = `<div style="font-size:12px; color:var(--text-muted); margin-top:6px;">الخيارات: ${q.options.join(' | ')}</div>`;
      }

      item.innerHTML = `
        <div style="font-weight:700; color:var(--accent-cyan);">سؤال ${i + 1}: ${q.q}</div>
        ${optionsHTML}
        <div style="font-size:12px; color:var(--accent-emerald); margin-top:4px;">الإجابة الصحيحة: ${q.a}</div>
      `;
      previewContainer.appendChild(item);
    });

    if (actionsBox) actionsBox.style.display = 'flex';
  }

  addExamToBossDeck() {
    if (!this.currentExamQuestions || this.currentExamQuestions.length === 0) {
      window.showToast('⚠️ قم بتوليد امتحان أولاً إضافته لقتال الوحوش!');
      return;
    }

    const cards = this.currentExamQuestions.map(q => ({
      q: q.q + (q.options && q.options.length > 0 ? `\n(الخيارات: ${q.options.join(', ')})` : ''),
      a: `${q.a} ${q.explanation ? '\n(الشرح: ' + q.explanation + ')' : ''}`
    }));

    const activeDeck = window.cardsEngine.getCurrentDeck();
    if (activeDeck) {
      activeDeck.cards.push(...cards);
      window.cardsEngine.saveDecks();
      window.cardsEngine.renderBattleStage();
      window.soundEngine.playLevelUp();
      window.showToast(`⚔️ تم إضافة ${cards.length} أسئلة امتحان إلى معركة الوحوش في مجموعة (${activeDeck.title})!`);
    }
  }

  startInteractiveExamModal() {
    if (!this.currentExamQuestions || this.currentExamQuestions.length === 0) {
      window.showToast('⚠️ يرجى توليد امتحان أولاً لخوض الاختبار التفاعلي!');
      return;
    }

    this.currentExamIndex = 0;
    this.userExamAnswers = {};
    const modal = document.getElementById('interactive-exam-modal');
    if (modal) {
      modal.classList.add('active');
      this.renderInteractiveExamStep();
    }
  }

  renderInteractiveExamStep() {
    const questions = this.currentExamQuestions;
    const idx = this.currentExamIndex;
    const q = questions[idx];
    if (!q) return;

    const counterEl = document.getElementById('exam-modal-counter');
    const questionEl = document.getElementById('exam-modal-question');
    const optionsBox = document.getElementById('exam-modal-options');
    const nextBtn = document.getElementById('exam-modal-next-btn');

    if (counterEl) counterEl.innerText = `السؤال ${idx + 1} من ${questions.length}`;
    if (questionEl) questionEl.innerText = q.q;

    if (optionsBox) {
      optionsBox.innerHTML = '';
      const opts = (q.options && q.options.length > 0) ? q.options : [q.a, 'إجابة بديلة 1', 'إجابة بديلة 2'];

      opts.forEach((opt, oIdx) => {
        const btn = document.createElement('button');
        btn.className = `btn-secondary exam-option-btn ${this.userExamAnswers[idx] === opt ? 'selected' : ''}`;
        btn.style.width = '100%';
        btn.style.textAlign = 'right';
        btn.style.margin = '6px 0';
        btn.style.padding = '12px 16px';
        btn.style.borderRadius = 'var(--radius-md)';
        btn.innerText = `${oIdx + 1}. ${opt}`;

        btn.onclick = () => {
          this.userExamAnswers[idx] = opt;
          window.soundEngine.playClick();
          this.renderInteractiveExamStep();
        };

        optionsBox.appendChild(btn);
      });
    }

    if (nextBtn) {
      if (idx === questions.length - 1) {
        nextBtn.innerText = '🏁 إنهاء وتسليم الامتحان';
        nextBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
      } else {
        nextBtn.innerText = 'التالي ➡️';
        nextBtn.style.background = 'linear-gradient(135deg, var(--primary-purple), var(--accent-cyan))';
      }
    }
  }

  handleExamNextStep() {
    const questions = this.currentExamQuestions;
    if (this.currentExamIndex < questions.length - 1) {
      this.currentExamIndex++;
      this.renderInteractiveExamStep();
    } else {
      this.finishInteractiveExam();
    }
  }

  finishInteractiveExam() {
    const questions = this.currentExamQuestions;
    let correctCount = 0;
    let feedbackHTML = '';

    questions.forEach((q, i) => {
      const userAns = this.userExamAnswers[i];
      const isCorrect = userAns === q.a;
      if (isCorrect) correctCount++;

      feedbackHTML += `
        <div style="padding:10px; margin:8px 0; border-radius:var(--radius-md); background:${isCorrect ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}; border:1px solid ${isCorrect ? 'var(--accent-emerald)' : 'var(--accent-ruby)'};">
          <div style="font-weight:800;">سؤال ${i + 1}: ${q.q}</div>
          <div style="font-size:12px; margin-top:4px;">
            إجابتك: <span style="font-weight:700;">${userAns || 'لم يتم الجواب'}</span> 
            ${isCorrect ? '✅ صحيحة!' : `❌ الخيار الصحيح: <span style="color:var(--accent-emerald); font-weight:700;">${q.a}</span>`}
          </div>
          ${q.explanation ? `<div style="font-size:11px; color:var(--text-muted); margin-top:4px;">💡 الشرح: ${q.explanation}</div>` : ''}
        </div>
      `;
    });

    const scorePercent = Math.round((correctCount / questions.length) * 100);
    const xpEarned = correctCount * 40;
    const goldEarned = correctCount * 20;

    window.gamifyEngine.addXP(xpEarned, 'Exam Result');
    window.gamifyEngine.addGold(goldEarned);
    window.soundEngine.playVictory();

    const bodyEl = document.getElementById('exam-modal-body');
    if (bodyEl) {
      bodyEl.innerHTML = `
        <div style="text-align:center; padding:10px 0;">
          <div style="font-size:48px;">🏆</div>
          <h3 style="color:var(--accent-gold); font-size:24px;">نتيجة الامتحان التفاعلي</h3>
          <div style="font-size:32px; font-weight:900; color:var(--accent-cyan); margin:8px 0;">${scorePercent}%</div>
          <div style="font-size:14px; color:var(--accent-emerald);">مكافأة الإنجاز: +${xpEarned} XP | 🪙 +${goldEarned} Gold</div>
        </div>
        <hr style="border-color:var(--border-color); margin:16px 0;">
        <h4 style="color:var(--text-muted); margin-bottom:10px;">تفاصيل الشرح والتصحيح:</h4>
        <div style="max-height:240px; overflow-y:auto;">${feedbackHTML}</div>
        <button class="btn-primary" style="width:100%; margin-top:16px;" onclick="document.getElementById('interactive-exam-modal').classList.remove('active')">
          متابعة المغامرة 🚀
        </button>
      `;
    }
  }

  // --- 4. AI Tutor & Question Explainer (المعلم الشارح للأسئلة) ---
  async explainQuestion() {
    const qText = document.getElementById('ai-tutor-question').value.trim();
    const context = document.getElementById('ai-tutor-context').value.trim();
    const statusEl = document.getElementById('ai-tutor-status');
    const outputEl = document.getElementById('ai-tutor-output');

    if (!qText || qText.length < 3) {
      window.showToast('⚠️ يرجى كتابة السؤال أو المسألة التي ترغب في شرحها!');
      return;
    }

    if (statusEl) statusEl.innerHTML = '🧠 المعلم الذكي يقوم بتحليل السؤال وصياغة الشرح المبسط خطوة بخطوة...';
    window.soundEngine.playClick();

    try {
      const explanationMarkdown = await window.geminiService.explainQuestion(qText, context);
      if (statusEl) statusEl.innerHTML = '💡 اكتمل الشرح!';
      if (outputEl) {
        outputEl.innerHTML = this.formatMarkdown(explanationMarkdown);
        document.getElementById('ai-tutor-result-card').style.display = 'block';
      }
      window.soundEngine.playVictory();
    } catch (err) {
      if (statusEl) statusEl.innerHTML = `⚠️ حدث خطأ أثناء الشرح: ${err.message}`;
      window.showToast('⚠️ يتعذر الاتصال بالمعلم الذكي حالياً.');
    }
  }

  // --- 5. Gemini API Key Settings ---
  saveApiKeyFromUI() {
    const input = document.getElementById('gemini-api-key-input');
    if (!input) return;
    
    const key = input.value.trim();
    window.geminiService.setApiKey(key);
    this.updateApiKeyStatus();
    
    if (key) {
      window.showToast('🔑 تم حفظ مفتاح Gemini API Key وتفعيل الاتصال المباشر بنجاح!');
      window.soundEngine.playLevelUp();
    } else {
      window.showToast('ℹ️ تم إزالة المفتاح، يعمل التطبيق الآن على النظام الذكي الافتراضي.');
    }
  }

  updateApiKeyStatus() {
    const statusBadge = document.getElementById('gemini-key-status');
    const keyInput = document.getElementById('gemini-api-key-input');

    if (keyInput) keyInput.value = window.geminiService.getApiKey();

    if (statusBadge) {
      if (window.geminiService.isConfigured()) {
        statusBadge.innerHTML = '⚡ متصل بـ Gemini 1.5 Flash (مباشر)';
        statusBadge.style.background = 'rgba(16, 185, 129, 0.2)';
        statusBadge.style.color = 'var(--accent-emerald)';
        statusBadge.style.borderColor = 'var(--accent-emerald)';
      } else {
        statusBadge.innerHTML = '⚙️ وضع المعالجة الافتراضية (أدخل مفتاحك للسرعة القصوى)';
        statusBadge.style.background = 'rgba(245, 158, 11, 0.2)';
        statusBadge.style.color = 'var(--accent-gold)';
        statusBadge.style.borderColor = 'var(--accent-gold)';
      }
    }
  }

  // --- Simple Markdown Formatter Helper ---
  formatMarkdown(text) {
    if (!text) return '';
    return text
      .replace(/^### (.*$)/gim, '<h3 style="color:var(--accent-cyan); margin:12px 0 6px;">$1</h3>')
      .replace(/^## (.*$)/gim, '<h4 style="color:var(--accent-gold); margin:10px 0 4px;">$1</h4>')
      .replace(/^\* (.*$)/gim, '<li style="margin-right:16px;">$1</li>')
      .replace(/^- (.*$)/gim, '<li style="margin-right:16px;">$1</li>')
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--accent-gold);">$1</strong>')
      .replace(/\n\n/g, '<br><br>');
  }
}

window.aiQuizEngine = new AIQuizEngine();
