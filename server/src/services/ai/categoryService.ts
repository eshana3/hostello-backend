const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Electronics: ["phone","mobile","laptop","computer","tablet","charger","cable","earphone","headphone","speaker","camera","battery","keyboard","mouse","monitor","tv","wifi","powerbank","pendrive","usb","led","fan","watch","gaming","bluetooth","adapter"],
  Clothes: ["shirt","tshirt","jeans","pant","dress","jacket","hoodie","sweater","kurta","saree","shoes","sandal","cap","belt","wallet","bag","suit","coat","uniform","scarf","wear","outfit","cloth"],
  Snacks: ["snack","food","biscuit","cookie","chocolate","chips","noodles","maggi","rice","tea","coffee","juice","drink","instant","eat","sweet","spicy","protein","bar","oats","cereal"],
  Accessories: ["cover","case","pouch","stand","holder","tempered","screen","protector","sticker","pen","pencil","notebook","diary","bottle","mug","backpack","spectacle","glasses","umbrella","torch","keychain","mirror","comb"],
  Books: ["book","novel","textbook","notes","guide","study","exam","ncert","jee","neet","gate","magazine","journal","comic","fiction","science","math","physics","chemistry","biology","engineering","edition","paperback","read"],
  "Daily essentials": ["soap","shampoo","toothpaste","toothbrush","detergent","sanitizer","tissue","towel","bedsheet","pillow","blanket","plate","bowl","spoon","glass","cup","bucket","cleaning","broom","bulb","curtain","daily","grocery","hygiene"],
};

const stem = (word: string): string =>
  word.replace(/ing$/, "").replace(/ies$/, "y").replace(/es$/, "").replace(/s$/, "");

const tokenize = (text: string): string[] =>
  text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 1).map(stem);

export const suggestCategory = (
  title: string,
  description: string
): { category: string; confidence: number; scores: Record<string, number> } => {
  const text = `${title} ${title} ${description}`;
  const tokens = tokenize(text);
  const scores: Record<string, number> = {};

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    const stemmedKeywords = keywords.map(stem);
    for (const token of tokens) {
      if (stemmedKeywords.includes(token)) score += 1;
      for (const kw of keywords) {
        if (kw.length > 4 && text.toLowerCase().includes(kw)) score += 0.5;
      }
    }
    scores[category] = Math.round(score * 10) / 10;
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const topCategory = sorted[0][0];
  const topScore = sorted[0][1];
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const confidence = totalScore > 0 ? Math.round((topScore / totalScore) * 100) : 0;

  return { category: topScore > 0 ? topCategory : "Daily essentials", confidence, scores };
};