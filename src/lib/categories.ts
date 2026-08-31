export type CategoryId =
  | "movies"
  | "comedy"
  | "concerts"
  | "workshops"
  | "conferences"
  | "theatre"
  | "sports"
  | "food"
  | "art"
  | "nightlife"
  | "kids"
  | "other";

export type Category = {
  id: CategoryId;
  label: string;
  emoji: string;
  /** CSS gradient used for card banners / detail hero for this category */
  gradient: string;
};

export const CATEGORIES: Category[] = [
  { id: "movies", label: "Movies", emoji: "🎬", gradient: "linear-gradient(135deg,#7f1d1d,#450a0a)" },
  { id: "comedy", label: "Standup Comedy", emoji: "🎤", gradient: "linear-gradient(135deg,#9a1130,#3f0713)" },
  { id: "concerts", label: "Concerts & Music", emoji: "🎵", gradient: "linear-gradient(135deg,#831843,#4a0519)" },
  { id: "workshops", label: "Workshops", emoji: "🛠️", gradient: "linear-gradient(135deg,#7c2d12,#431407)" },
  { id: "conferences", label: "Conferences", emoji: "🎯", gradient: "linear-gradient(135deg,#78350f,#422006)" },
  { id: "theatre", label: "Theatre & Plays", emoji: "🎭", gradient: "linear-gradient(135deg,#6b1530,#2c0714)" },
  { id: "sports", label: "Sports", emoji: "🏏", gradient: "linear-gradient(135deg,#7f1d1d,#1c0a0a)" },
  { id: "food", label: "Food & Drink", emoji: "🍷", gradient: "linear-gradient(135deg,#881337,#3b0519)" },
  { id: "art", label: "Art & Exhibitions", emoji: "🖼️", gradient: "linear-gradient(135deg,#701a2f,#33091a)" },
  { id: "nightlife", label: "Nightlife & Parties", emoji: "🌃", gradient: "linear-gradient(135deg,#5b0e23,#1f0510)" },
  { id: "kids", label: "Kids & Family", emoji: "🎈", gradient: "linear-gradient(135deg,#9f1239,#450a1e)" },
  { id: "other", label: "Other", emoji: "🎟️", gradient: "linear-gradient(135deg,#7a1330,#2b0712)" },
];

export const CATEGORY_MAP: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
);

export function getCategory(id: string | null | undefined): Category {
  return (id && CATEGORY_MAP[id]) || CATEGORY_MAP.other;
}

export function formatPrice(priceCents: number): string {
  if (!priceCents || priceCents <= 0) return "Free";
  const rupees = priceCents / 100;
  return `₹${rupees.toLocaleString("en-IN", {
    minimumFractionDigits: rupees % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}
