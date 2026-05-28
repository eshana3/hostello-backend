const SPAM_KEYWORDS = [
  "buy now", "limited offer", "act now", "urgent", "guaranteed",
  "100% free", "free gift", "click here", "winner", "you have won",
  "claim now", "earn money", "work from home", "make money fast",
  "whatsapp", "call me", "contact me at", "pay first", "advance payment",
];

export interface ISpamResult {
  isSpam: boolean;
  reasons: string[];
  score: number;
}

export const detectSpam = (title: string, description: string): ISpamResult => {
  const text = `${title} ${description}`.toLowerCase();
  const reasons: string[] = [];
  let score = 0;

  // Check spam keywords
  for (const kw of SPAM_KEYWORDS) {
    if (text.includes(kw)) {
      reasons.push(`Contains spam phrase: "${kw}"`);
      score += 2;
    }
  }

  // All caps check
  const words = title.split(" ");
  const capsWords = words.filter((w) => w.length > 3 && w === w.toUpperCase());
  if (capsWords.length > 2) {
    reasons.push("Excessive ALL CAPS usage");
    score += 2;
  }

  // Excessive exclamation marks
  const exclamations = (text.match(/!/g) || []).length;
  if (exclamations > 3) {
    reasons.push(`Excessive exclamation marks (${exclamations})`);
    score += 1;
  }

  // Suspicious URLs
  const urlPattern = /https?:\/\/|www\.|\.com|\.net|\.org|bit\.ly|tinyurl/gi;
  if (urlPattern.test(text)) {
    reasons.push("Contains suspicious URL or link");
    score += 3;
  }

  // Repeated words
  const wordList = text.split(/\s+/);
  const wordCount: Record<string, number> = {};
  for (const w of wordList) {
    if (w.length > 3) wordCount[w] = (wordCount[w] || 0) + 1;
  }
  const repeated = Object.entries(wordCount).filter(([, c]) => c > 4);
  if (repeated.length > 0) {
    reasons.push(`Repeated keywords: ${repeated.map(([w]) => w).join(", ")}`);
    score += 1;
  }

  return { isSpam: score >= 3, reasons, score };
};