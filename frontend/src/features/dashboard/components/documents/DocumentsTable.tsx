import { Card, Table } from "@/shared/components/ui";
import type { Document } from "@/features/documents";
import DocumentRow from "./DocumentRow";

type Props = {
    documents: Document[];

    onOpen?: (id: string) => void;
    onRename?: (id: string) => void;
    onDelete?: (id: string) => void;
};

/**
 * DocumentsTable component.
 */
export default function DocumentsTable({
    documents,
    onOpen,
    onRename,
    onDelete,
}: Props) {
    return (
        <div className="w-full">
            <Card
                padding="none"
                hoverable={false}
                className="overflow-hidden bg-white/82 shadow-[0_14px_38px_rgba(68,71,95,0.10)]"
            >
                <Table>
                    <Table.Header>
                        <Table.Row>
                            <Table.Head className="w-10" />
                            <Table.Head>Title</Table.Head>
                            <Table.Head>Author</Table.Head>
                            <Table.Head>Created</Table.Head>
                            <Table.Head>Updated</Table.Head>
                            <Table.Head className="w-48">Actions</Table.Head>
                        </Table.Row>
                    </Table.Header>

                    <Table.Body>
                        {documents.map((doc) => (
                            <DocumentRow
                                key={doc.id}
                                document={doc}
                                onOpen={onOpen}
                                onRename={onRename}
                                onDelete={onDelete}
                            />
                        ))}
                    </Table.Body>
                </Table>
            </Card>
        </div>
    );
}
