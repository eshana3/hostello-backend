const SYNONYMS: Record<string, string[]> = {
  phone: ["mobile", "smartphone", "cell", "handset"],
  mobile: ["phone", "smartphone", "cell"],
  laptop: ["notebook", "computer", "pc", "macbook"],
  computer: ["laptop", "pc", "desktop"],
  shoes: ["footwear", "sneakers", "boots", "sandals"],
  book: ["textbook", "novel", "guide", "notes"],
  bag: ["backpack", "handbag", "sack", "pouch"],
  watch: ["smartwatch", "timepiece", "wristwatch"],
  earphone: ["headphone", "earbud", "airpods", "headset"],
  cycle: ["bicycle", "bike"],
  fridge: ["refrigerator", "cooler"],
  ac: ["air conditioner", "airconditioner", "cooler"],
};

const stem = (word: string): string =>
  word.replace(/ing$/, "").replace(/ies$/, "y").replace(/es$/, "").replace(/s$/, "");

export const expandSearchQuery = (query: string): string => {
  const tokens = query.toLowerCase().trim().split(/\s+/);
  const expanded = new Set<string>();

  for (const token of tokens) {
    const stemmed = stem(token);
    expanded.add(token);
    expanded.add(stemmed);

    const synonyms = SYNONYMS[token] || SYNONYMS[stemmed] || [];
    for (const syn of synonyms) expanded.add(syn);
  }

  return Array.from(expanded).join(" ");
};