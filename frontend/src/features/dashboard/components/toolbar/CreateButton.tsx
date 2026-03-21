import { Button } from "@/shared/components/ui";
import { Plus } from "lucide-react";

type Props = {
  onCreate: () => void;
};

export default function CreateButton({ onCreate }: Props) {
  return (
    <Button onClick={onCreate} className="flex items-center gap-2">
      <Plus size={16} />
      New
    </Button>
  );
}