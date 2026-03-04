// src/filters/FilterBar.tsx
import "./filterBar.css";

type Props = {
  onCreate?: () => void;
  onOpenFilters?: () => void;
};

export default function FilterBar({
  onCreate,
  onOpenFilters,
}: Props) {
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="filter-rail-shell">
      <div className="filter-rail">
        <div className="filter-left">{today}</div>

        <div className="filter-center">
          <span className="filter-slogan">
            Remove the sportsbooks. Predict your future.
          </span>
        </div>

        <div className="filter-right">
          <button
            className="create-button"
            onClick={onCreate}
          >
            + Create
          </button>

          <button
            className="filter-button"
            onClick={onOpenFilters}
          >
            Filters
          </button>
        </div>
      </div>
    </div>
  );
}