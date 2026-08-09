/* StudyQuest RPG - Analytics & Heatmap Renderer */

class AnalyticsEngine {
  constructor() {
    this.studyHistory = this.loadHistory();
    // Handle window resize for dynamic canvas responsiveness
    window.addEventListener('resize', () => {
      if (document.getElementById('view-analytics')?.classList.contains('active')) {
        this.renderCharts();
      }
    });
  }

  loadHistory() {
    const saved = localStorage.getItem('studyquest_analytics');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return this.generateSampleHistory(); }
    }
    return this.generateSampleHistory();
  }

  generateSampleHistory() {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split('T')[0];
      days.push({
        date: dayStr,
        dayName: d.toLocaleDateString('ar-EG', { weekday: 'short' }),
        minutes: Math.floor(Math.random() * 60) + 20
      });
    }
    return days;
  }

  renderCharts() {
    const canvas = document.getElementById('analytics-chart-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions dynamically based on parent container width
    const parentWidth = canvas.parentElement.clientWidth;
    const isMobile = window.innerWidth <= 600;
    const padding = isMobile ? 20 : 40;
    
    canvas.width = Math.max(parentWidth - (isMobile ? 20 : 40), 280);
    canvas.height = isMobile ? 200 : 240;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const history = this.studyHistory;
    const maxVal = Math.max(...history.map(h => h.minutes), 90);
    const spacing = isMobile ? 6 : 16;
    const availableWidth = width - (padding * 2);
    const barWidth = Math.max(Math.floor((availableWidth - (spacing * (history.length - 1))) / history.length), 16);

    history.forEach((item, idx) => {
      const x = padding + idx * (barWidth + spacing);
      const barHeight = Math.floor((item.minutes / maxVal) * (height - padding * 2));
      const y = height - padding - barHeight;

      // Draw Bar Gradient
      const gradient = ctx.createLinearGradient(0, y, 0, height - padding);
      gradient.addColorStop(0, '#9333ea');
      gradient.addColorStop(1, '#06b6d4');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, [6, 6, 0, 0]);
      ctx.fill();

      // Value label on top
      ctx.fillStyle = '#f8fafc';
      ctx.font = isMobile ? 'bold 10px sans-serif' : 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${item.minutes}m`, x + barWidth / 2, y - 6);

      // Day Name below
      ctx.fillStyle = '#94a3b8';
      ctx.font = isMobile ? '10px sans-serif' : '12px sans-serif';
      ctx.fillText(item.dayName, x + barWidth / 2, height - 10);
    });
  }

  printDailyReport() {
    const name = window.gamifyEngine?.playerName || 'بطل المعرفة';
    const level = window.gamifyEngine?.level || 1;
    const gold = window.gamifyEngine?.gold || 0;
    const streak = window.gamifyEngine?.streak || 1;
    const todayStr = new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const tasks = window.tasksEngine?.tasks || [];
    const completedTasks = tasks.filter(t => t.completed);

    const reportWindow = window.open('', '_blank');
    if (!reportWindow) {
      window.showToast('⚠️ يرجى السماح بالنوافذ المنبثقة لطباعة التقرير!');
      return;
    }

    reportWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>تقرير الإنجاز اليومي - ${name}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 40px; color: #1e293b; background: #fff; }
          .header { border-bottom: 3px solid #9333ea; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
          .title { font-size: 26px; font-weight: bold; color: #7e22ce; }
          .date { color: #64748b; font-size: 14px; }
          .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
          .stat-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; text-align: center; }
          .stat-val { font-size: 22px; font-weight: bold; color: #0284c7; }
          .stat-lbl { font-size: 12px; color: #64748b; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #cbd5e1; padding: 12px; text-align: right; }
          th { background: #f1f5f9; color: #334155; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">🎓 تقرير الإنجاز الدراسي اليومي (StudyQuest RPG)</div>
            <div class="date">${todayStr}</div>
          </div>
          <div style="font-size: 18px; font-weight: bold;">البطل: ${name}</div>
        </div>

        <div class="stats-grid">
          <div class="stat-box">
            <div class="stat-val">${level}</div>
            <div class="stat-lbl">المستوى الحالي</div>
          </div>
          <div class="stat-box">
            <div class="stat-val">🪙 ${gold}</div>
            <div class="stat-lbl">الرصيد المكتسب</div>
          </div>
          <div class="stat-box">
            <div class="stat-val">🔥 ${streak} يوم</div>
            <div class="stat-lbl">سلسلة الالتزام</div>
          </div>
          <div class="stat-box">
            <div class="stat-val">${completedTasks.length} / ${tasks.length}</div>
            <div class="stat-lbl">المهام المنجزة اليوم</div>
          </div>
        </div>

        <h3>📜 سجل المهام والدروس اليومية:</h3>
        <table>
          <thead>
            <tr>
              <th>المهمة / الدرس</th>
              <th>المادة</th>
              <th>المكافأة المكتسبة</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            ${tasks.map(t => `
              <tr>
                <td>${t.title}</td>
                <td>${t.subject}</td>
                <td>+${t.xp} XP | 🪙 ${t.gold}</td>
                <td>${t.completed ? 'تم الإنجاز بنجاح ✅' : 'قيد الانتظار ⏳'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          تم استخراج هذا التقرير تلقائياً عبر تطبيق StudyQuest RPG للمذاكرة والتحصيل الدراسي
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    reportWindow.document.close();
  }
}

window.analyticsEngine = new AnalyticsEngine();


