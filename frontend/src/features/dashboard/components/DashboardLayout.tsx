import type { ReactNode } from "react";

import DashboardFooterStrip from "./DashboardFooterStrip";
import DashboardNavbar from "./DashboardNavbar";
import type { Document } from "../types/document.types";

type Props = {
  children: ReactNode;
  documents: Document[];
};

export default function DashboardLayout({ children, documents }: Props) {
  return (
    <div className="flex min-h-screen flex-col bg-(--bg)">
      <DashboardNavbar />

      <main className="flex-1">{children}</main>

      <div className="sticky bottom-0 z-20 px-6 pb-4">
        <div className="mx-auto w-full max-w-7xl">
          <DashboardFooterStrip documents={documents} />
        </div>
      </div>
    </div>
  );
}