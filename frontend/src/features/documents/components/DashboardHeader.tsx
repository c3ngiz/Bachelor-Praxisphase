import Button from "@/shared/components/ui/Button"
import Input from "@/shared/components/ui/Input"

type Props = {
  onCreate: () => void
  search: string
  onSearchChange: (value: string) => void
  view: "grid" | "list"
  setView: (view: "grid" | "list") => void
}

export default function DashboardHeader({
  onCreate,
  search,
  onSearchChange,
  view,
  setView,
}: Props) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

      <div className="flex w-full max-w-md">
        <Input
          placeholder="Search documents..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={view === "grid" ? "primary" : "secondary"}
          onClick={() => setView("grid")}
        >
          Grid
        </Button>

        <Button
          variant={view === "list" ? "primary" : "secondary"}
          onClick={() => setView("list")}
        >
          List
        </Button>

        <Button onClick={onCreate}>
          New Document
        </Button>
      </div>

    </div>
  )
}