/* StudyQuest RPG - Analytics & Heatmap Renderer */

class AnalyticsEngine {
  constructor() {
    this.studyHistory = this.loadHistory();
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
    
    // Set canvas dimensions
    canvas.width = canvas.parentElement.clientWidth - 40 || 600;
    canvas.height = 240;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;

    ctx.clearRect(0, 0, width, height);

    const history = this.studyHistory;
    const maxVal = Math.max(...history.map(h => h.minutes), 90);
    const barWidth = Math.floor((width - padding * 2) / history.length) - 16;

    history.forEach((item, idx) => {
      const x = padding + idx * (barWidth + 16);
      const barHeight = Math.floor((item.minutes / maxVal) * (height - padding * 2));
      const y = height - padding - barHeight;

      // Draw Bar Gradient
      const gradient = ctx.createLinearGradient(0, y, 0, height - padding);
      gradient.addColorStop(0, '#9333ea');
      gradient.addColorStop(1, '#06b6d4');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, [8, 8, 0, 0]);
      ctx.fill();

      // Value label on top
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${item.minutes}m`, x + barWidth / 2, y - 8);

      // Day Name below
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(item.dayName, x + barWidth / 2, height - 12);
    });
  }
}

window.analyticsEngine = new AnalyticsEngine();
