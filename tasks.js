/* StudyQuest RPG - Quest Log & Task Manager */

class TasksEngine {
  constructor() {
    this.defaultTasks = [
      { id: 'task_1', title: 'مذاكرة درس الفيزياء: الحركة والقوانين', subject: 'science', xp: 100, gold: 50, completed: false },
      { id: 'task_2', title: 'حل 15 مسألة في الرياضيات والتمارين', subject: 'math', xp: 150, gold: 80, completed: false },
      { id: 'task_3', title: 'مراجعة مفردات اللغة الإنجليزية', subject: 'lang', xp: 80, gold: 40, completed: false }
    ];

    this.tasks = this.loadTasks();
  }

  loadTasks() {
    const saved = localStorage.getItem('studyquest_tasks');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return this.defaultTasks; }
    }
    return this.defaultTasks;
  }

  saveTasks() {
    localStorage.setItem('studyquest_tasks', JSON.stringify(this.tasks));
    this.renderTaskList();
  }

  addTask(title, subject, difficulty = 'medium') {
    let xp = 100;
    let gold = 50;
    if (difficulty === 'easy') { xp = 50; gold = 25; }
    else if (difficulty === 'hard') { xp = 200; gold = 100; }

    const newTask = {
      id: `task_${Date.now()}`,
      title,
      subject,
      xp,
      gold,
      completed: false
    };

    this.tasks.push(newTask);
    this.saveTasks();
    window.showToast('📜 New Quest Added to your Log!');
  }

  toggleTask(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;

    task.completed = !task.completed;
    if (task.completed) {
      window.soundEngine.playVictory();
      window.gamifyEngine.addXP(task.xp, 'Quest Complete');
      window.gamifyEngine.addGold(task.gold);
    }
    this.saveTasks();
  }

  deleteTask(taskId) {
    this.tasks = this.tasks.filter(t => t.id !== taskId);
    this.saveTasks();
  }

  renderTaskList() {
    const listEl = document.getElementById('quest-task-list');
    if (!listEl) return;

    listEl.innerHTML = '';

    if (this.tasks.length === 0) {
      listEl.innerHTML = '<div style="text-align:center; padding:30px; color:var(--text-muted);">No Quests active! Add one above ⚔️</div>';
      return;
    }

    this.tasks.forEach(task => {
      const item = document.createElement('div');
      item.className = `task-item ${task.completed ? 'completed' : ''}`;
      
      const tagClass = `tag-${task.subject}`;
      
      item.innerHTML = `
        <div class="task-left">
          <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} onchange="window.tasksEngine.toggleTask('${task.id}')">
          <div>
            <div class="task-title">${task.title}</div>
            <span class="task-tag ${tagClass}">${task.subject}</span>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:12px;">
          <div class="task-reward">+${task.xp} XP | 🪙 ${task.gold}</div>
          <button style="background:none; border:none; color:var(--accent-ruby); cursor:pointer; font-size:16px;" onclick="window.tasksEngine.deleteTask('${task.id}')">🗑️</button>
        </div>
      `;
      listEl.appendChild(item);
    });
  }
}

window.tasksEngine = new TasksEngine();
