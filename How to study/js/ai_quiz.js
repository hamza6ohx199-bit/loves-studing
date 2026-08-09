/* StudyQuest RPG - AI Quiz & Flashcard Generator Engine */

class AIQuizEngine {
  constructor() {}

  generateFromText(text, count = 3) {
    if (!text || text.trim().length < 10) {
      window.showToast('⚠️ يرجى أدخال نص درس كافٍ (أكثر من 10 حروف)!');
      return;
    }

    const cleanText = text.trim();
    const sentences = cleanText.split(/[.!\n؟?]+/).filter(s => s.trim().length > 8);

    if (sentences.length === 0) {
      window.showToast('⚠️ لم يتم العثور على جمل كافية لإنشاء أسئلة.');
      return;
    }

    const generatedCards = [];
    const maxItems = Math.min(count, sentences.length);

    for (let i = 0; i < maxItems; i++) {
      const sentence = sentences[i].trim();
      const words = sentence.split(/\s+/);
      
      if (words.length >= 3) {
        // Pick a key word to hide as question
        const keywordIndex = Math.floor(words.length / 2);
        const targetWord = words[keywordIndex];
        const questionText = sentence.replace(targetWord, ' ( ..... ) ');

        generatedCards.push({
          q: `اكمل ما يلي من النص: "${questionText}"`,
          a: targetWord
        });
      } else {
        generatedCards.push({
          q: `ما هي النقطة الرئيسية في الفكرة التالية: "${sentence}"؟`,
          a: sentence
        });
      }
    }

    if (generatedCards.length > 0) {
      const activeDeck = window.cardsEngine.getCurrentDeck();
      if (activeDeck) {
        activeDeck.cards.push(...generatedCards);
        window.cardsEngine.saveDecks();
        window.cardsEngine.renderBattleStage();
        window.soundEngine.playLevelUp();
        window.showToast(`🤖 تم توليد ${generatedCards.length} أسئلة بنجاح وإضافتها إلى ${activeDeck.title}! ⚔️`);
      }
    }
  }
}

window.aiQuizEngine = new AIQuizEngine();
