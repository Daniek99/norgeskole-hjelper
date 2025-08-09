// Simple browser TTS utilities using Web Speech API
export const speak = (text: string, lang = "no-NO") => {
  if (!("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.95;
  utterance.pitch = 1.0;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
};

export const stopSpeak = () => {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
};
