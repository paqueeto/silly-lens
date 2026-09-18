import { CATEGORIES, FILTERS, type FilterCategory, type FilterDef } from "@/lib/filters";
import { cn } from "@/lib/utils";
import { FilterGlyph } from "./filter-glyph";

type Props = {
  activeId: string;
  category: FilterCategory | "all";
  onCategory: (id: FilterCategory | "all") => void;
  onSelect: (filter: FilterDef) => void;
};

export function FilterRail({ activeId, category, onCategory, onSelect }: Props) {
  const visible = category === "all" ? FILTERS : FILTERS.filter((f) => f.category === category);

  return (
    <div className="flex flex-col gap-2">
      <div className="scrollbar-none flex gap-1 overflow-x-auto px-1">
        {CATEGORIES.map((item) => {
          const selected = item.id === category;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onCategory(item.id)}
              className={cn(
                "h-8 shrink-0 rounded-full px-3 text-xs font-medium transition-colors duration-150",
                selected ? "bg-ink text-bg" : "bg-surface text-ink-soft hover:text-ink",
              )}
              aria-pressed={selected}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <div className="scrollbar-none flex gap-1 overflow-x-auto px-1">
        {visible.map((filter) => {
          const selected = filter.id === activeId;
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => onSelect(filter)}
              className={cn(
                "flex w-14 shrink-0 flex-col items-center gap-1 rounded-2xl p-1 transition-colors duration-150",
                selected ? "bg-surface" : "hover:bg-surface/80",
              )}
              aria-pressed={selected}
              aria-label={`${filter.name} filter, ${filter.blurb}`}
            >
              <span
                className={cn(
                  "size-10 overflow-hidden rounded-full transition-[box-shadow,transform] duration-150",
                  selected
                    ? "shadow-[0_0_0_2px_var(--color-bg),0_0_0_4px_var(--color-primary)]"
                    : "shadow-[0_0_0_1px_rgb(26_23_20/0.08)]",
                )}
              >
                <FilterGlyph filter={filter} />
              </span>
              <span className="text-[10px] font-medium text-ink">{filter.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
