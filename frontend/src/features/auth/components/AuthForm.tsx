import type { ReactNode } from "react"

type Props = {
  title: string
  children: ReactNode
}

export default function AuthForm({ title, children }: Props) {
  return (
    <section className="w-full rounded-xl border border-(--border) bg-(--bg-elevated) p-8 shadow-sm">
      <h1 className="mb-6 text-center text-2xl font-semibold text-(--fg)">{title}</h1>

      <div className="flex flex-col gap-4">{children}</div>
    </section>
  )
}