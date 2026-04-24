import { Card, Skeleton } from "@/shared/components/ui";

/**
 * DocumentSkeletonList component.
 */
export default function DocumentSkeletonList() {
    const rows = Array.from({ length: 6 });

    return (
        <div className="px-6 py-6">
            <Card padding="none" hoverable={false} className="overflow-hidden">
                <table className="w-full">
                    <tbody>
                        {rows.map((_, i) => (
                            <tr key={i} className="animate-pulse border-b border-(--border)">
                                <td className="px-4 py-4">
                                    <Skeleton className="h-4 w-4" />
                                </td>

                                <td className="px-4 py-4">
                                    <Skeleton.Text className="w-48" />
                                </td>

                                <td className="px-4 py-4">
                                    <Skeleton.Text className="w-24" />
                                </td>

                                <td className="px-4 py-4">
                                    <Skeleton.Text className="w-20" />
                                </td>

                                <td className="px-4 py-4">
                                    <Skeleton.Text className="w-20" />
                                </td>

                                <td className="px-4 py-4">
                                    <div className="flex gap-2">
                                        <Skeleton.Block className="h-7 w-16" />
                                        <Skeleton.Block className="h-7 w-16" />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </div>
    );
}
