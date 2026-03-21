import { Select } from "@/shared/components/ui";
import { useDashboardStore } from "../../store/dashboardStore";

export default function SortSelect() {
  const sortBy = useDashboardStore((s) => s.sortBy);
  const setSortBy = useDashboardStore((s) => s.setSortBy);

  return (
    <div className="min-w-44">
      <Select
        value={sortBy}
        onChange={(e) =>
          setSortBy(e.target.value as "updated" | "created" | "title")
        }
        options={[
          { value: "updated", label: "Last updated" },
          { value: "created", label: "Created" },
          { value: "title", label: "Title" },
        ]}
      />
    </div>
  );
}