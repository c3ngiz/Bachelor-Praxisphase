import { useState } from "react"

import PageContainer from "@/shared/components/layout/PageContainer"
import Button from "@/shared/components/ui/Button"
import Modal from "@/shared/components/ui/Modal"
import Input from "@/shared/components/ui/Input"

import DashboardHeader from "../components/DashboardHeader"
import RecentDocuments from "../components/RecentDocuments"
import DocumentsGrid from "../components/DocumentsGrid"
import DocumentsTable from "../components/DocumentsTable"
import DocumentSkeleton from "../components/DocumentSkeleton"
import DocumentsEmptyState from "../components/DocumentsEmptyState"

import { useDocuments } from "../hooks/useDocuments"

export default function DashboardPage() {
  const { documents, loading } = useDocuments()

  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [search, setSearch] = useState("")
  const [view, setView] = useState<"grid" | "list">("grid")

  function handleCreateDocument() {
    console.log("Create document:", title)

    setTitle("")
    setOpen(false)
  }

  const filtered = documents.filter((doc) =>
    doc.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <PageContainer title="Dashboard">

        <DashboardHeader
          onCreate={() => setOpen(true)}
          search={search}
          onSearchChange={setSearch}
          view={view}
          setView={setView}
        />

        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <DocumentSkeleton />
            <DocumentSkeleton />
            <DocumentSkeleton />
          </div>
        ) : (
          <>
            <section className="space-y-5">
              <h2 className="text-lg font-semibold text-(--fg)">
                Recent Documents
              </h2>

              <RecentDocuments documents={documents} />
            </section>

            <section className="space-y-5">
              <h2 className="text-lg font-semibold text-(--fg)">
                All Documents
              </h2>

              {filtered.length === 0 ? (
                <DocumentsEmptyState onCreate={() => setOpen(true)} />
              ) : view === "grid" ? (
                <DocumentsGrid documents={filtered} />
              ) : (
                <DocumentsTable documents={filtered} />
              )}
            </section>
          </>
        )}

      </PageContainer>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Create Document"
      >
        <Input
          label="Document Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="flex justify-end gap-2">

          <Button
            variant="secondary"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>

          <Button
            onClick={handleCreateDocument}
            disabled={!title.trim()}
          >
            Create
          </Button>

        </div>
      </Modal>
    </>
  )
}