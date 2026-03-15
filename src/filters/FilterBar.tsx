// src/filters/FilterBar.tsx
import "./filterBar.css";

import { devReset } from "../dev/devReset";
import { runProtocolTests } from "../test/protocol/runProtocolTests";

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

  const handleDevReset = () => {
    console.clear();
    console.log("DEV RESET");
    devReset();
  };

  const handleProtocolTests = () => {
    console.clear();
    console.log("RUNNING PROTOCOL TESTS");
    runProtocolTests();
  };

  return (
    <div className="filter-rail-shell">
      <div className="filter-rail">

        <div className="filter-date">{today}</div>

        <div className="filter-brand">PreDEX</div>

        <div className="filter-actions">

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

          {process.env.NODE_ENV === "development" && (
            <>
              <button
                className="filter-button"
                onClick={handleDevReset}
              >
                Dev Reset
              </button>

              <button
                className="filter-button"
                onClick={handleProtocolTests}
              >
                Protocol Tests
              </button>
            </>
          )}

        </div>

      </div>
    </div>
  );
}