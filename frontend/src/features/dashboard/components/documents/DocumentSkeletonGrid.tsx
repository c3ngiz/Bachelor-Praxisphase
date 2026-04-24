import { Card, Skeleton } from "@/shared/components/ui";

/**
 * DocumentSkeletonGrid component.
 */
export default function DocumentSkeletonGrid() {
    const items = Array.from({ length: 8 });

    return (
        <div
            className="
      grid
      grid-cols-1
      sm:grid-cols-2
      md:grid-cols-3
      lg:grid-cols-4
      gap-5
      px-6
      py-6
    "
        >
            {items.map((_, i) => (
                <Card key={i} hoverable={false} className="gap-3">
                    <Skeleton.Text className="w-3/4" />

                    <div className="space-y-2">
                        <Skeleton.Text className="h-3" />
                        <Skeleton.Text className="h-3 w-5/6" />
                        <Skeleton.Text className="h-3 w-2/3" />
                    </div>

                    <div className="space-y-1 pt-2">
                        <Skeleton.Text className="h-3 w-1/2" />
                        <Skeleton.Text className="h-3 w-2/3" />
                    </div>

                    <div className="flex gap-2 pt-2">
                        <Skeleton.Block className="flex-1" />
                        <Skeleton.Block className="w-16" />
                    </div>
                </Card>
            ))}
        </div>
    );
}
