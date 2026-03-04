import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  title?: string;
};

export default function PageContainer({
  children,
  title,
}: Props) {
  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {title && (
        <h1 className="text-2xl font-bold mb-6">
          {title}
        </h1>
      )}

      <div className="flex flex-col gap-4">
        {children}
      </div>
    </div>
  );
}