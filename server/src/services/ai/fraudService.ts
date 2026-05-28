const CATEGORY_AVERAGES: Record<string, number> = {
  Electronics: 15000,
  Clothes: 800,
  Snacks: 150,
  Accessories: 500,
  Books: 300,
  "Daily essentials": 200,
};

export interface IFraudResult {
  isFraudulent: boolean;
  reason?: string;
  expectedRange?: { min: number; max: number };
}

export const detectFraud = (
  price: number,
  category: string
): IFraudResult => {
  const avg = CATEGORY_AVERAGES[category] || 1000;
  const min = avg * 0.1;
  const max = avg * 10;

  if (price > max) {
    return {
      isFraudulent: true,
      reason: `Price ₹${price} is unusually high for ${category} (expected max ₹${max})`,
      expectedRange: { min: Math.round(min), max: Math.round(max) },
    };
  }

  if (price < min && price > 0) {
    return {
      isFraudulent: true,
      reason: `Price ₹${price} is suspiciously low for ${category} (expected min ₹${min})`,
      expectedRange: { min: Math.round(min), max: Math.round(max) },
    };
  }

  return { isFraudulent: false, expectedRange: { min: Math.round(min), max: Math.round(max) } };
};

export const getAveragePrice = (category: string): number => {
  return CATEGORY_AVERAGES[category] || 1000;
};