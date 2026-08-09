/* StudyQuest RPG - Gemini 1.5 Flash AI Engine Service */

class GeminiService {
  constructor() {
    this.apiKey = localStorage.getItem('studyquest_gemini_api_key') || '';
    this.modelName = 'gemini-1.5-flash';
  }

  setApiKey(key) {
    this.apiKey = key.trim();
    if (this.apiKey) {
      localStorage.setItem('studyquest_gemini_api_key', this.apiKey);
    } else {
      localStorage.removeItem('studyquest_gemini_api_key');
    }
  }

  getApiKey() {
    return this.apiKey;
  }

  isConfigured() {
    return Boolean(this.apiKey && this.apiKey.length > 5);
  }

  async callGeminiAPI(prompt, systemInstruction = '') {
    if (!this.isConfigured()) {
      throw new Error('NO_API_KEY');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`;
    
    const contents = [];
    if (systemInstruction) {
      contents.push({
        role: 'user',
        parts: [{ text: `[Instructions]: ${systemInstruction}` }]
      });
    }
    contents.push({
      role: 'user',
      parts: [{ text: prompt }]
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `HTTP ${response.status} error from Gemini API`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('لم يتم استلام رد صحيح من Gemini API');
    return text;
  }

  // 1. Generate Study Schedule (جداول المذاكرة)
  async generateSchedule(topics, days = 7, hoursPerDay = 3) {
    const systemPrompt = `أنت مساعد تعليمي خبير ومصمم جداول دراسية ذكي لطلاب المدارس والجامعات.
يجب أن ترجع النتيجة بصيغة JSON فقط، دون أي مقدمات أو علامات markdown غير متوافقة.
الصيغة المطلوبة:
[
  {
    "day": "اليوم 1",
    "title": "عنوان المهمة أو الدرس",
    "subject": "science" أو "math" أو "history" أو "lang",
    "estimatedMinutes": 45,
    "difficulty": "easy" أو "medium" أو "hard",
    "description": "وصف مختصر للمهمة وكيفية مذاكرتها"
  }
]`;

    const userPrompt = `أنشئ جدول مذاكرة منظم لمدة ${days} أيام بمعدل ${hoursPerDay} ساعات يومياً.
المواضيع والمواد المطلوب مذاكرتها:
"${topics}"
اجعل المهام مجزأة وممتعة ومناسبة لنظام المكافآت والألعاب RPG.`;

    if (!this.isConfigured()) {
      return this.fallbackSchedule(topics, days, hoursPerDay);
    }

    try {
      const rawText = await this.callGeminiAPI(userPrompt, systemPrompt);
      const jsonMatch = rawText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(rawText);
    } catch (err) {
      console.warn('Gemini API call failed, using smart fallback schedule:', err.message);
      return this.fallbackSchedule(topics, days, hoursPerDay);
    }
  }

  // 2. Generate Lesson Summary (التلخيصات الذكية)
  async generateSummary(lessonText, depth = 'detailed') {
    const systemPrompt = `أنت معلم ذكي ومحترف في تلخيص الدروس وصياغة المذكرات الدراسية.
قم بتلخيص النص التالي بأسلوب منظم، باللغة العربية، وبصياغة جذابة وسهلة الحفظ.
قسم التلخيص إلى:
1. 🎯 العنوان الرئيسي والفكرة العامة
2. 📌 النقاط الرئيسية والفوائد المفتاحية
3. 💡 الشرح المبسط والمفاهيم الهامة
4. 🧠 أسئلة مراجعة سريعة مع إجاباتها`;

    const userPrompt = `مستوى التلخيص المطلوب: ${depth}
النص المراد تلخيصه:
"${lessonText}"`;

    if (!this.isConfigured()) {
      return this.fallbackSummary(lessonText);
    }

    try {
      return await this.callGeminiAPI(userPrompt, systemPrompt);
    } catch (err) {
      console.warn('Gemini API call failed, using smart fallback summary:', err.message);
      return this.fallbackSummary(lessonText);
    }
  }

  // 3. Generate Exams & Quizzes (الامتحانات والأسئلة)
  async generateExam(topicsOrText, count = 5, type = 'mcq', difficulty = 'medium') {
    const systemPrompt = `أنت مصمم اختبارات واستاذ في وضع الامتحانات المدرسية والأكاديمية.
قم بتوليد اختبار تفاعلي بصيغة JSON فقط متوافقة مع البرمجة.
صيغة JSON المطلوب إرجاعها:
[
  {
    "q": "السؤال هنا؟",
    "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],
    "a": "الخيار الصحيح بالضبط",
    "explanation": "شرح مختصر ومبسط لسبب صحة هذه الإجابة"
  }
]
ملاحظة: إذا كان نوع السؤال 'flashcard' أو 'true_false'، اجعل options يحتوي الخيارات المناسبة أو مصفوفة من خيارين.`;

    const userPrompt = `قم بتوليد ${count} أسئلة اختبار من نوع (${type}) بمستوى صعوبة (${difficulty}).
الموضوع أو النص المطلوب الأسئلة منه:
"${topicsOrText}"`;

    if (!this.isConfigured()) {
      return this.fallbackExam(topicsOrText, count, type);
    }

    try {
      const rawText = await this.callGeminiAPI(userPrompt, systemPrompt);
      const jsonMatch = rawText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(rawText);
    } catch (err) {
      console.warn('Gemini API call failed, using fallback exam:', err.message);
      return this.fallbackExam(topicsOrText, count, type);
    }
  }

  // 4. Explain Difficult Question / Concept (المعلم الشارح للأسئلة)
  async explainQuestion(questionText, context = '') {
    const systemPrompt = `أنت معلم ذكي ومحفز شخصي (AI Tutor) يساعد الطلاب على فهم الأسئلة الصعبة والمفاهيم المعقدة.
قم بشرح السؤال أو المسألة التالية خطوة بخطوة باللغة العربية بطريقة ممتعة ومبسطة جداً:
- وضح الفكرة الأساسية من السؤال.
- اشرح طريقة الحل أو الإجابة خطوة بخطوة.
- أعطِ الطالب نصيحة أو حيلة سريعة لتذكر هذا المفهوم في الامتحان.`;

    const userPrompt = `السؤال أو المفهوم الصعب: "${questionText}"
${context ? `السياق أو النص المرتبط: "${context}"` : ''}`;

    if (!this.isConfigured()) {
      return this.fallbackExplanation(questionText);
    }

    try {
      return await this.callGeminiAPI(userPrompt, systemPrompt);
    } catch (err) {
      console.warn('Gemini API call failed, using fallback explanation:', err.message);
      return this.fallbackExplanation(questionText);
    }
  }

  // --- Smart Fallback Helpers ---
  fallbackSchedule(topics, days, hours) {
    const subjects = ['science', 'math', 'lang', 'history'];
    const sampleTopics = topics ? topics.split(/[,،\n]/).filter(t => t.trim()) : ['مراجعة الوحدة الأولى', 'حل تمارين وشيتات', 'حفظ المفردات والقوانين'];
    const schedule = [];

    for (let i = 1; i <= days; i++) {
      const topic = sampleTopics[(i - 1) % sampleTopics.length] || `جلسة مذاكرة وتدريب مكثف ${i}`;
      const subj = subjects[(i - 1) % subjects.length];
      schedule.push({
        day: `اليوم ${i}`,
        title: `مذاكرة وتطبيق: ${topic.trim()}`,
        subject: subj,
        estimatedMinutes: Math.min(120, hours * 30),
        difficulty: i % 3 === 0 ? 'hard' : (i % 2 === 0 ? 'medium' : 'easy'),
        description: `جلسة مذاكرة لـ ${topic.trim()} تتضمن فهم القوانين وحل التمارين وتلخيص النقاط المهمة.`
      });
    }
    return schedule;
  }

  fallbackSummary(text) {
    const snippet = text.slice(0, 150);
    return `### 🎯 العنوان والملخص العام
يتناول النص موضوعاً هاماً يتعلق بـ: **${snippet}...**

---

### 📌 النقاط والمفاهيم الرئيسية
- **المفهوم الأول:** الفكرة المحورية تعتمد على الفهم العميق والتطبيق العملي للمعلومات.
- **المفهوم الثاني:** ربط المفاهيم بالأمثلة الواقعية يسهل تثبيت المعلومة في الذاكرة طويلة المدى.
- **المفهوم الثالث:** المراجعة الدورية واختبار النفس بأسئلة سريعة تضمن استيعاب التفاصيل.

---

### 💡 الشرح التوضيحي المبسط
عند دراسة هذا الفصل، يجب التركيز على التعاريف الأساسية والقوانين الرئيسية. حاول دائماً تلخيص السطور الطويلة في كلمات مفتاحية بسيطة.

---

### 🧠 أسئلة مراجعة سريعة
1. **سؤال:** ما هي الفكرة الأساسية في هذا الموضوع؟
   - **الإجابة:** الفكرة تكمن في تطبيق القواعد الأساسية والاستفادة منها في حل المشكلات.
2. **سؤال:** كيف يمكنك الاستفادة من هذه المعلومات في الاختبار؟
   - **الإجابة:** عبر التركيز على المفاهيم الأكثر تكراراً والحل المباشر عليها.`;
  }

  fallbackExam(topicsOrText, count, type) {
    const cleanTopic = topicsOrText.slice(0, 50) || 'المادة الدراسية';
    const exam = [];

    for (let i = 1; i <= count; i++) {
      if (type === 'mcq') {
        exam.push({
          q: `سؤال ${i}: ما هي الحقيقة الرئيسية المتعلقة بـ (${cleanTopic})؟`,
          options: [
            'الخيار الصحيح المدعوم بالدليل العلمي والقوانين',
            'افتراض غير صحيح ويتناقض مع المفاهيم',
            'حالة خاصة لا تطبق في جميع الظروف',
            'معلومة مغلوطة وغير متوافقة'
          ],
          a: 'الخيار الصحيح المدعوم بالدليل العلمي والقوانين',
          explanation: `هذه الإجابة هي الصحيحة لأنها تتوافق مباشرة مع القوانين الأساسية لـ ${cleanTopic}.`
        });
      } else if (type === 'true_false') {
        exam.push({
          q: `سؤال ${i}: تزداد كفاءة الاستيعاب عند ربط موضوع (${cleanTopic}) بالتطبيقات العملية.`,
          options: ['صح ✔️', 'خطأ ✖️'],
          a: 'صح ✔️',
          explanation: 'التطبيقات العملية تزيد الاستيعاب وتثبت المفاهيم في الذهن.'
        });
      } else {
        exam.push({
          q: `ما هي النقطة الجوهرية في موضوع: ${cleanTopic}؟`,
          options: [],
          a: `الفهم العميق للقواعد الأساسية وحل الأسئلة عليها.`,
          explanation: `الفهم المباشر والقواعد تعتبر الركيزة الأساسية لهذا الدرس.`
        });
      }
    }
    return exam;
  }

  fallbackExplanation(questionText) {
    return `### 💡 الشرح المبسط للسؤال (AI Tutor)

**السؤال المطلوب:**
> "${questionText}"

---

### 🔍 1. الفكرة الأساسية من السؤال:
هذا السؤال يختبر مدى فهمك للمفاهيم الجوهرية وكيفية ربطها بالإجابة الدقيقة. الهدف منه هو تأكيد فهمك للسبب والنتيجة.

---

### 📝 2. خطوات الحل خطوة بخطوة:
1. **الخطوة الأولى:** حدد المعطيات أو المفاتيح الأساسية الواردة في نص السؤال.
2. **الخطوة الثانية:** استرجع القانون أو القاعدة المرتبطة بهذه المعطيات.
3. **الخطوة الثالثة:** طبق القاعدة مباشرة لتصل للإجابة الصحيحة بدون تشتت.

---

### 🚀 3. نصيحة سريعة للامتحان:
تذكر دائماً أن تقرأ السؤال بتمعن وتحدد الكلمة المفتاحية (مثل: علل، اذكر، أحسب) قبل البدء في الكتابة أو اختيار الإجابة!`;
  }
}

window.geminiService = new GeminiService();
