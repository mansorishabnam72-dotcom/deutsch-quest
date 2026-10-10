/* Content-agnostic game rules. Questions are supplied by JSON data. */
(() => {
  function normalizeAnswer(s) {
    return String(s || "").trim().toLocaleLowerCase("de-DE")
      .replace(/[.!?،,;:]/g, "").replace(/\s+/g, " ");
  }
  function isTextAnswerCorrect(input, accepted) {
    const value = normalizeAnswer(input);
    return (accepted || []).some(a => normalizeAnswer(a) === value);
  }
  function gradeQuestion(question, answer) {
    if (question.type === "speaking" || question.type === "freeText") {
      return { correct: String(answer || "").trim().length >= (question.minLength || 12), selfEvaluated: true };
    }
    if (question.type === "text") return { correct: isTextAnswerCorrect(answer, question.accepted), selfEvaluated: false };
    return { correct: String(answer) === String(question.correct), selfEvaluated: false };
  }
  function addMistake(state, question) {
    const id = question.id;
    const current = state.mistakes[id] || { count: 0, correctAfter: 0, prompt: question.prompt, answer: question.explanation || "" };
    current.count += 1; current.correctAfter = 0;
    current.prompt = question.prompt;
    current.answer = question.explanation || current.answer;
    state.mistakes[id] = current;
  }
  function resolveMistake(state, question) {
    const item = state.mistakes[question.id];
    if (!item) return;
    item.correctAfter = (item.correctAfter || 0) + 1;
    if (item.correctAfter >= 2) delete state.mistakes[question.id];
  }
  function awardCorrect(state, combo) {
    const xp = 10 + Math.min(Math.max(combo - 1, 0), 5) * 2;
    state.xp += xp; state.coins += 3;
    state.streakBest = Math.max(state.streakBest || 0, combo);
    return { xp, coins: 3 };
  }
  function finishStage(state, stageId, score, total) {
    const previous = state.bestScores[stageId] || 0;
    state.bestScores[stageId] = Math.max(previous, score);
    if (!state.completedStages.includes(stageId)) state.completedStages.push(stageId);
    state.unlockedStage = Math.max(state.unlockedStage || 1, Math.min(25, stageId + 1));
    state.sessions = (state.sessions || 0) + 1;
    state.lastPlayed = new Date().toISOString();
    if (score >= Math.ceil(total * 0.8) && !state.badges.includes("first-clear")) state.badges.push("first-clear");
    if ((state.streakBest || 0) >= 5 && !state.badges.includes("combo-5")) state.badges.push("combo-5");
    return { score, total, percent: total ? Math.round(score / total * 100) : 0 };
  }
  window.DQEngine = { gradeQuestion, addMistake, resolveMistake, awardCorrect, finishStage, normalizeAnswer };
})();