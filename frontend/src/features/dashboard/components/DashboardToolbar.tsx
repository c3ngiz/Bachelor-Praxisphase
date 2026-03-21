import CreateButton from "./toolbar/CreateButton";
import SortSelect from "./toolbar/SortSelect";
import FilterDropdown from "./toolbar/FilterDropdown";
import ViewToggle from "./toolbar/ViewToggle";
import SearchBar from "./toolbar/SearchBar";

type Props = {
  onCreate: () => void;
};

export default function DashboardToolbar({ onCreate }: Props) {
  return (
    <div className="flex items-center gap-4">

      {/* LEFT */}
      <CreateButton onCreate={onCreate} />

      {/* CENTER */}
      <div className="flex flex-1 justify-center">
        <div className="w-full max-w-xl">
          <SearchBar />
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-2">
        <SortSelect />
        <FilterDropdown />
        <ViewToggle />
      </div>
    </div>
  );
}