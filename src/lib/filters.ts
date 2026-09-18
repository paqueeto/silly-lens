export type FilterCategory = "looks" | "animals" | "fruits" | "veggies" | "foods";

export type LookId =
  | "natural"
  | "sunshine"
  | "mint"
  | "comic"
  | "glow"
  | "ink"
  | "warm"
  | "frog";

export type OverlayId =
  | "none"
  | "kitty"
  | "puppy"
  | "bunny"
  | "frog"
  | "fox"
  | "unicorn"
  | "banana"
  | "strawberry"
  | "watermelon"
  | "avocado"
  | "carrot"
  | "broccoli"
  | "tomato"
  | "pizza"
  | "taco"
  | "icecream"
  | "donut"
  | "crown";

export type FilterDef = {
  id: string;
  name: string;
  category: FilterCategory;
  look: LookId;
  overlay: OverlayId;
  blurb: string;
};

export const CATEGORIES: { id: FilterCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "looks", label: "Looks" },
  { id: "animals", label: "Animals" },
  { id: "fruits", label: "Fruits" },
  { id: "veggies", label: "Veggies" },
  { id: "foods", label: "Foods" },
];

export const FILTERS: FilterDef[] = [
  { id: "natural", name: "Natural", category: "looks", look: "natural", overlay: "none", blurb: "Just you" },
  { id: "sunshine", name: "Sunshine", category: "looks", look: "sunshine", overlay: "none", blurb: "Warm glow" },
  { id: "mint", name: "Mint", category: "looks", look: "mint", overlay: "none", blurb: "Cool pop" },
  { id: "comic", name: "Comic", category: "looks", look: "comic", overlay: "none", blurb: "Bold ink" },
  { id: "glow", name: "Glow", category: "looks", look: "glow", overlay: "none", blurb: "Soft light" },
  { id: "ink", name: "Ink", category: "looks", look: "ink", overlay: "none", blurb: "Studio B&W" },
  { id: "kitty", name: "Kitty", category: "animals", look: "warm", overlay: "kitty", blurb: "Ears + whiskers" },
  { id: "puppy", name: "Puppy", category: "animals", look: "warm", overlay: "puppy", blurb: "Floppy ears" },
  { id: "bunny", name: "Bunny", category: "animals", look: "natural", overlay: "bunny", blurb: "Tall ears" },
  { id: "frog", name: "Frog", category: "animals", look: "frog", overlay: "frog", blurb: "Big eyes" },
  { id: "fox", name: "Fox", category: "animals", look: "sunshine", overlay: "fox", blurb: "Pointy ears" },
  { id: "unicorn", name: "Unicorn", category: "animals", look: "glow", overlay: "unicorn", blurb: "Magic horn" },
  { id: "banana", name: "Banana", category: "fruits", look: "sunshine", overlay: "banana", blurb: "Peel hat" },
  { id: "strawberry", name: "Berry", category: "fruits", look: "warm", overlay: "strawberry", blurb: "Seed smile" },
  { id: "watermelon", name: "Melon", category: "fruits", look: "mint", overlay: "watermelon", blurb: "Slice hat" },
  { id: "avocado", name: "Avo", category: "fruits", look: "mint", overlay: "avocado", blurb: "Pit pal" },
  { id: "carrot", name: "Carrot", category: "veggies", look: "sunshine", overlay: "carrot", blurb: "Crunch hat" },
  { id: "broccoli", name: "Broccoli", category: "veggies", look: "mint", overlay: "broccoli", blurb: "Floret hair" },
  { id: "tomato", name: "Tomato", category: "veggies", look: "warm", overlay: "tomato", blurb: "Garden hat" },
  { id: "pizza", name: "Pizza", category: "foods", look: "sunshine", overlay: "pizza", blurb: "Slice crown" },
  { id: "taco", name: "Taco", category: "foods", look: "sunshine", overlay: "taco", blurb: "Tuesday hat" },
  { id: "icecream", name: "Scoop", category: "foods", look: "glow", overlay: "icecream", blurb: "Cherry on top" },
  { id: "donut", name: "Donut", category: "foods", look: "warm", overlay: "donut", blurb: "Face hole" },
  { id: "crown", name: "Crown", category: "fruits", look: "glow", overlay: "crown", blurb: "Bloom band" },
];

export const FILTER_BY_ID: Record<string, FilterDef> = Object.fromEntries(
  FILTERS.map((filter) => [filter.id, filter]),
);

export const DEFAULT_FILTER = FILTERS[0]!;
