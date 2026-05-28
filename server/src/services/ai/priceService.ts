const PRICE_RANGES: Record<string, { new: [number, number, number]; used: [number, number, number] }> = {
  Electronics:        { new: [500, 80000, 15000], used: [200, 50000, 8000]  },
  Clothes:            { new: [200, 5000,  800],   used: [50,  2000,  400]   },
  Snacks:             { new: [10,  1000,  150],   used: [10,  500,   100]   },
  Accessories:        { new: [50,  3000,  500],   used: [20,  1500,  250]   },
  Books:              { new: [50,  2000,  300],   used: [20,  1000,  150]   },
  "Daily essentials": { new: [20,  2000,  200],   used: [10,  1000,  100]   },
};

export interface IPriceSuggestion {
  suggestedPrice: number;
  range: { min: number; max: number };
  condition: string;
  category: string;
}

export const suggestPrice = (category: string, condition: "new" | "used"): IPriceSuggestion => {
  const range = PRICE_RANGES[category] || PRICE_RANGES["Daily essentials"];
  const [min, max, avg] = range[condition] || range["used"];
  return { suggestedPrice: avg, range: { min, max }, condition, category };
};

export const getAveragePrice = (category: string): number => {
  const range = PRICE_RANGES[category];
  if (!range) return 1000;
  return range["used"][2];
};