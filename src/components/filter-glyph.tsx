import type { FilterDef } from "@/lib/filters";

export function FilterGlyph({ filter }: { filter: FilterDef }) {
  const id = filter.overlay === "none" ? filter.look : filter.overlay;
  return (
    <svg viewBox="0 0 48 48" className="size-full" aria-hidden="true">
      <rect width="48" height="48" rx="24" fill={bg(id)} />
      {glyph(id)}
    </svg>
  );
}

function bg(id: string): string {
  switch (id) {
    case "natural":
      return "#efe6d7";
    case "sunshine":
      return "#f3ddb0";
    case "mint":
    case "frog":
    case "avocado":
    case "broccoli":
      return "#d5e2c8";
    case "comic":
      return "#e8d5c4";
    case "glow":
    case "unicorn":
    case "crown":
      return "#f1e4c8";
    case "ink":
      return "#d9d3cc";
    case "kitty":
    case "puppy":
    case "bunny":
    case "fox":
      return "#f0dfc6";
    case "banana":
    case "pizza":
    case "taco":
    case "carrot":
      return "#f3e0b0";
    case "strawberry":
    case "tomato":
    case "watermelon":
    case "donut":
      return "#f0d2c8";
    case "icecream":
      return "#f3ddd8";
    default:
      return "#efe6d7";
  }
}

function glyph(id: string) {
  switch (id) {
    case "natural":
      return <circle cx="24" cy="24" r="9" fill="#c4b9a8" />;
    case "sunshine":
      return (
        <>
          <circle cx="24" cy="24" r="8" fill="#e2b15a" />
          <path
            d="M24 8v4M24 36v4M8 24h4M36 24h4M12.5 12.5l2.8 2.8M32.7 32.7l2.8 2.8M12.5 35.5l2.8-2.8M32.7 15.3l2.8-2.8"
            stroke="#c48a4a"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </>
      );
    case "mint":
      return <ellipse cx="24" cy="26" rx="10" ry="12" fill="#6faf5a" />;
    case "comic":
      return (
        <path d="M14 30c4-10 16-10 20 0" fill="none" stroke="#1a1714" strokeWidth="3" strokeLinecap="round" />
      );
    case "glow":
      return <circle cx="24" cy="24" r="10" fill="#fffaf3" opacity="0.9" />;
    case "ink":
      return <circle cx="24" cy="24" r="9" fill="#1a1714" />;
    case "warm":
      return <circle cx="24" cy="24" r="9" fill="#e07a32" />;
    case "kitty":
      return (
        <>
          <path d="M14 28 10 12l10 8M34 28l4-16-10 8" fill="#f0c27a" stroke="#2a211c" strokeWidth="1.6" />
          <circle cx="24" cy="30" r="4" fill="#e07a86" />
        </>
      );
    case "puppy":
      return (
        <>
          <ellipse cx="14" cy="20" rx="6" ry="10" transform="rotate(-28 14 20)" fill="#c48a4a" />
          <ellipse cx="34" cy="20" rx="6" ry="10" transform="rotate(28 34 20)" fill="#c48a4a" />
          <ellipse cx="24" cy="30" rx="5" ry="4" fill="#3b2a22" />
        </>
      );
    case "bunny":
      return (
        <>
          <ellipse cx="18" cy="16" rx="4" ry="12" fill="#f3e6d4" stroke="#2a211c" strokeWidth="1.4" />
          <ellipse cx="30" cy="16" rx="4" ry="12" fill="#f3e6d4" stroke="#2a211c" strokeWidth="1.4" />
          <circle cx="24" cy="32" r="3.5" fill="#e07a86" />
        </>
      );
    case "frog":
      return (
        <>
          <circle cx="17" cy="20" r="7" fill="#6faf5a" />
          <circle cx="31" cy="20" r="7" fill="#6faf5a" />
          <circle cx="17" cy="20" r="3" fill="#1a1714" />
          <circle cx="31" cy="20" r="3" fill="#1a1714" />
        </>
      );
    case "fox":
      return <path d="M12 32 24 10l12 22Z" fill="#dd7a32" stroke="#2a211c" strokeWidth="1.6" />;
    case "unicorn":
      return <path d="M24 8 28 30h-8Z" fill="#f4e4c4" stroke="#c44536" strokeWidth="1.6" />;
    case "banana":
      return (
        <path
          d="M12 30c8-16 22-14 26-4"
          fill="none"
          stroke="#f2d14b"
          strokeWidth="6"
          strokeLinecap="round"
        />
      );
    case "strawberry":
      return <path d="M24 36c10-6 10-16 0-20-10 4-10 14 0 20Z" fill="#c44536" />;
    case "watermelon":
      return <path d="M10 30a14 14 0 0 1 28 0Z" fill="#c44536" stroke="#3d5340" strokeWidth="3" />;
    case "avocado":
      return (
        <>
          <ellipse cx="24" cy="24" rx="10" ry="13" fill="#3d5340" />
          <circle cx="24" cy="26" r="4" fill="#8a5a32" />
        </>
      );
    case "carrot":
      return <path d="M24 8 30 34h-12Z" fill="#e07a32" />;
    case "broccoli":
      return (
        <>
          <circle cx="24" cy="20" r="8" fill="#3d5340" />
          <rect x="22" y="26" width="4" height="10" rx="1" fill="#6f8f48" />
        </>
      );
    case "tomato":
      return <circle cx="24" cy="26" r="10" fill="#c44536" />;
    case "pizza":
      return <path d="M24 8 36 36H12Z" fill="#e2b15a" stroke="#c44536" strokeWidth="2" />;
    case "taco":
      return <path d="M10 28a14 14 0 0 1 28 0" fill="#e2b15a" stroke="#3d5340" strokeWidth="2" />;
    case "icecream":
      return (
        <>
          <circle cx="24" cy="20" r="8" fill="#e07a86" />
          <path d="M18 24h12L24 40Z" fill="#e2b15a" />
        </>
      );
    case "donut":
      return (
        <>
          <circle cx="24" cy="24" r="11" fill="#c44536" />
          <circle cx="24" cy="24" r="5" fill="#f3eee4" />
        </>
      );
    case "crown":
      return (
        <>
          <circle cx="16" cy="24" r="5" fill="#c44536" />
          <circle cx="24" cy="20" r="5" fill="#fffaf3" />
          <circle cx="32" cy="24" r="5" fill="#f2d14b" />
        </>
      );
    default:
      return <circle cx="24" cy="24" r="8" fill="#c4b9a8" />;
  }
}
