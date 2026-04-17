type FilterBarProps = {
  filters: string[];
};

export function FilterBar({ filters }: FilterBarProps) {
  return (
    <div className="tm-filter-bar">
      {filters.map((filter, index) => (
        <button
          className={`tm-filter-pill ${index === 0 ? "tm-filter-pill-active" : ""}`}
          key={filter}
          type="button"
        >
          {filter}
        </button>
      ))}
    </div>
  );
}
