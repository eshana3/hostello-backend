import Product from "../../models/Product";

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to",
  "for", "of", "with", "by", "from", "is", "are", "was", "be",
  "this", "that", "it", "as", "good", "nice", "best", "new", "old",
  "my", "i", "sell", "selling", "sale", "buy", "available",
]);

const normalizeTitle = (title: string): string[] => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
};

const similarity = (a: string[], b: string[]): number => {
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = [...setA].filter((x) => setB.has(x));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.length / union.size;
};

export interface IDuplicateResult {
  isDuplicate: boolean;
  similarProductId?: string;
  similarityScore?: number;
  reason?: string;
}

export const detectDuplicate = async (
  title: string,
  sellerId: string,
  hostelId: string
): Promise<IDuplicateResult> => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentProducts = await Product.find({
      seller: sellerId,
      hostel: hostelId,
      createdAt: { $gte: oneDayAgo },
      status: { $ne: "removed" },
    }).select("title _id").lean();

    const newTokens = normalizeTitle(title);

    for (const product of recentProducts) {
      const existingTokens = normalizeTitle(product.title);
      const score = similarity(newTokens, existingTokens);

      if (score >= 0.7) {
        return {
          isDuplicate: true,
          similarProductId: product._id.toString(),
          similarityScore: Math.round(score * 100),
          reason: `Very similar to your recent listing "${product.title}" (${Math.round(score * 100)}% match)`,
        };
      }
    }

    return { isDuplicate: false };
  } catch {
    return { isDuplicate: false };
  }
};