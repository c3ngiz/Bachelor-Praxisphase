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
                <div
                    key={i}
                    className="
            animate-pulse
            rounded-xl
            border border-(--border)
            bg-(--bg-elevated)
            p-4
            flex flex-col
            gap-3
          "
                >
                    {/* title */}
                    <div className="h-4 w-3/4 rounded bg-(--border)" />

                    {/* preview */}
                    <div className="space-y-2">
                        <div className="h-3 w-full rounded bg-(--border)" />
                        <div className="h-3 w-5/6 rounded bg-(--border)" />
                        <div className="h-3 w-2/3 rounded bg-(--border)" />
                    </div>

                    {/* metadata */}
                    <div className="space-y-1 pt-2">
                        <div className="h-3 w-1/2 rounded bg-(--border)" />
                        <div className="h-3 w-2/3 rounded bg-(--border)" />
                    </div>

                    {/* controls */}
                    <div className="flex gap-2 pt-2">
                        <div className="h-8 flex-1 rounded bg-(--border)" />
                        <div className="h-8 w-16 rounded bg-(--border)" />
                    </div>
                </div>
            ))}
        </div>
    );
}