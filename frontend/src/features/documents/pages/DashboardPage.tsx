import { useState } from "react";

import PageContainer from "@/shared/components/layout/PageContainer";
import Button from "@/shared/components/ui/Button";
import Modal from "@/shared/components/ui/Modal";
import Input from "@/shared/components/ui/Input";

import DocumentList from "../components/DocumentList";
import { useDocuments } from "../hooks/useDocuments";

export default function DashboardPage() {
  const { documents, loading } = useDocuments();

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");

  function handleCreateDocument() {
    console.log("Create document:", title);
    setTitle("");
    setOpen(false);
  }

  return (
    <>
      <PageContainer title="Dashboard">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-(--fg)">Your Documents</h2>
          <Button onClick={() => setOpen(true)}>New Document</Button>
        </div>

        {loading ? (
          <div className="text-(--fg-muted)">Loading documents...</div>
        ) : (
          <DocumentList documents={documents} />
        )}
      </PageContainer>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Create Document">
        <Input
          label="Document Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter a title..."
        />

        <div className="flex justify-end">
          <Button onClick={handleCreateDocument} disabled={!title.trim()}>
            Create
          </Button>
        </div>
      </Modal>
    </>
  );
}