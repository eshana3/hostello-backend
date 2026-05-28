export interface User {
  id: string;
  mobile: string;
  name?: string;
  avatar?: string;
  hostelId?: string;
  hostelName?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: "new" | "like_new" | "good" | "fair" | "poor";
  images: string[];
  sellerId: string;
  sellerName?: string;
  hostelId: string;
  hostelName?: string;
  createdAt: string;
  ai?: {
    suggestedCategory?: string;
    warnings?: string[];
    flags?: { potentialDuplicate?: boolean };
  };
}

export type Category =
  | "Electronics"
  | "Clothes"
  | "Books"
  | "Furniture"
  | "Sports"
  | "Stationery"
  | "Food"
  | "Appliances"
  | "Vehicles"
  | "Other";

export type Condition = "new" | "like_new" | "good" | "fair" | "poor";

export interface ApiError {
  message: string;
  status?: number;
}
