import type { ReactNode } from "react";

import Card from "@/shared/components/ui/Card";

type Props = {
  title: string;
  children: ReactNode;
};

export default function AuthForm({ title, children }: Props) {
  return (
    <Card className="w-full" padding="lg" shadow="sm" hoverable={false}>
      <Card.Content padding="none" className="gap-6">
        <h1 className="text-center text-2xl font-semibold text-(--fg)">{title}</h1>
        <div className="flex flex-col gap-4">{children}</div>
      </Card.Content>
    </Card>
  );
}
