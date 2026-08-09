/* StudyQuest RPG - Virtual Visa & Parent Cashout System */

class RewardsEngine {
  constructor() {
    this.conversionRate = 10; // 10 Gold = $1 Virtual Cash
    this.studentPin = localStorage.getItem('studyquest_student_pin') || '1234';
    this.parentPin = localStorage.getItem('studyquest_parent_pin') || '0000';
    this.transactions = this.loadTransactions();
  }

  loadTransactions() {
    const saved = localStorage.getItem('studyquest_transactions');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [];
  }

  saveTransactions() {
    localStorage.setItem('studyquest_transactions', JSON.stringify(this.transactions));
  }

  setPins(studentPin, parentPin) {
    this.studentPin = studentPin;
    this.parentPin = parentPin;
    localStorage.setItem('studyquest_student_pin', studentPin);
    localStorage.setItem('studyquest_parent_pin', parentPin);
    window.showToast('🔒 تم تحديث الأرقام السرية بنجاح!');
  }

  processWithdrawal(goldAmount, sPinInput, pPinInput) {
    const currentGold = window.gamifyEngine.gold;
    const numGold = parseInt(goldAmount, 10);

    if (isNaN(numGold) || numGold <= 0) {
      window.showToast('⚠️ يرجى إدخال مبلغ صحيح من الذهب!');
      return false;
    }

    if (numGold > currentGold) {
      window.showToast('❌ رصيدك من الذهب لا يكفي لعملية السحب!');
      return false;
    }

    if (sPinInput !== this.studentPin) {
      window.showToast('❌ الرقم السري الخاص بالطالب غير صحيح!');
      return false;
    }

    if (pPinInput !== this.parentPin) {
      window.showToast('❌ الرقم السري الخاص بولي الأمر غير صحيح!');
      return false;
    }

    // Process successful cashout
    const cashValue = (numGold / this.conversionRate).toFixed(2);
    window.gamifyEngine.gold -= numGold;
    window.gamifyEngine.saveState();
    window.gamifyEngine.renderHUD();

    const newTx = {
      id: `tx_${Date.now()}`,
      date: new Date().toLocaleDateString('ar-EG'),
      gold: numGold,
      cash: cashValue,
      status: 'تم السحب والموافقة بنجاح 🟢'
    };

    this.transactions.unshift(newTx);
    this.saveTransactions();
    this.renderVisaCard();

    window.soundEngine.playLevelUp();
    window.showToast(`🎉 تم سحب $${cashValue} بنجاح إلى الفيزا الوهمية!`);
    return true;
  }

  renderVisaCard() {
    const gold = window.gamifyEngine.gold;
    const cash = (gold / this.conversionRate).toFixed(2);
    
    const balanceEl = document.getElementById('visa-cash-balance');
    const goldEl = document.getElementById('visa-gold-balance');
    const historyList = document.getElementById('visa-tx-history');

    if (balanceEl) balanceEl.innerText = `$${cash}`;
    if (goldEl) goldEl.innerText = `${gold} Gold`;

    if (historyList) {
      historyList.innerHTML = '';
      if (this.transactions.length === 0) {
        historyList.innerHTML = '<div style="text-align:center; padding:10px; color:var(--text-muted); font-size:12px;">لا توجد عمليات سحب سابقة</div>';
        return;
      }
      this.transactions.slice(0, 5).forEach(tx => {
        const item = document.createElement('div');
        item.style.cssText = 'display:flex; justify-content:space-between; font-size:12px; padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.06);';
        item.innerHTML = `
          <span>📅 ${tx.date}</span>
          <span style="color:var(--accent-gold);">🪙 ${tx.gold} ($${tx.cash})</span>
        `;
        historyList.appendChild(item);
      });
    }
  }
}

window.rewardsEngine = new RewardsEngine();
