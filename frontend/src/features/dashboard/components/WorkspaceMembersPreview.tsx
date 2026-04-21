type WorkspaceMember = {
  id: string;
  name: string;
  initials: string;
  color: string;
};

const MEMBERS: WorkspaceMember[] = [
  { id: "u-you", name: "You", initials: "U", color: "bg-emerald-500" },
  { id: "u-alex", name: "Alex Kim", initials: "AK", color: "bg-sky-500" },
  { id: "u-maya", name: "Maya Chen", initials: "MC", color: "bg-violet-500" },
  { id: "u-liam", name: "Liam Scott", initials: "LS", color: "bg-amber-500" },
];

export default function WorkspaceMembersPreview() {
  return (
    <div className="hidden items-center gap-2 lg:flex">
      <div className="flex -space-x-2">
        {MEMBERS.slice(0, 4).map((member) => (
          <div
            key={member.id}
            title={member.name}
            className={[
              "inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-(--bg-elevated) text-[11px] font-semibold text-white",
              member.color,
            ].join(" ")}
          >
            {member.initials}
          </div>
        ))}
      </div>

      <span className="text-sm text-(--fg-muted)">
        4 teammates online
      </span>
    </div>
  );
}