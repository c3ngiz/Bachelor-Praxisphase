import { Card, Grid, Skeleton } from "@/shared/components/ui";

/**
 * DocumentSkeletonGrid component.
 */
export default function DocumentSkeletonGrid() {
    const items = Array.from({ length: 8 });

    return (
        <Grid>
            {items.map((_, i) => (
                <Card
                    key={i}
                    hoverable={false}
                    padding="none"
                    className="overflow-hidden bg-white/70"
                >
                    <div className="aspect-[3/4] bg-(--bg-subtle) p-4">
                        <Skeleton.Block className="mx-auto h-full w-[84%]" />
                    </div>

                    <div className="space-y-3 p-4">
                        <Skeleton.Text className="w-3/4" />
                        <Skeleton.Text className="h-3 w-5/6" />
                        <div className="flex gap-2 pt-2">
                            <Skeleton.Block className="h-6 w-16" />
                            <Skeleton.Text className="h-3 flex-1" />
                        </div>
                    </div>
                </Card>
            ))}
        </Grid>
    );
}
