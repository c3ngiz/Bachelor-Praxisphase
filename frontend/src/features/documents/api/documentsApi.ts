import type { Document } from "../types";

const mockDocuments: Document[] = [
  {
    id: "1",
    title: "Project Proposal",
    content: "",
    updatedAt: "2026-03-01",
  },
  {
    id: "2",
    title: "Meeting Notes",
    content: "",
    updatedAt: "2026-03-02",
  },
  {
    id: "3",
    title: "Research Draft",
    content: "",
    updatedAt: "2026-03-03",
  },
];

export async function fetchDocuments(): Promise<Document[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return mockDocuments;
}
