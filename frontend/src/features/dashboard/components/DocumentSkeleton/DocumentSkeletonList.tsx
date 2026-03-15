export default function DocumentSkeletonList() {
    const rows = Array.from({ length: 6 });

    return (
        <div className="px-6 py-6">
            <div className="overflow-hidden rounded-xl border border-(--border) bg-(--bg-elevated)">
                <table className="w-full">
                    <tbody>
                        {rows.map((_, i) => (
                            <tr key={i} className="animate-pulse border-b border-(--border)">
                                <td className="px-4 py-4">
                                    <div className="h-4 w-4 rounded bg-(--border)" />
                                </td>

                                <td className="px-4 py-4">
                                    <div className="h-4 w-48 rounded bg-(--border)" />
                                </td>

                                <td className="px-4 py-4">
                                    <div className="h-4 w-24 rounded bg-(--border)" />
                                </td>

                                <td className="px-4 py-4">
                                    <div className="h-4 w-20 rounded bg-(--border)" />
                                </td>

                                <td className="px-4 py-4">
                                    <div className="h-4 w-20 rounded bg-(--border)" />
                                </td>

                                <td className="px-4 py-4">
                                    <div className="flex gap-2">
                                        <div className="h-7 w-16 rounded bg-(--border)" />
                                        <div className="h-7 w-16 rounded bg-(--border)" />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}