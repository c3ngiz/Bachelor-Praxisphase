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

      <main className="relative z-10 flex-1">{children}</main>

      <div className="relative z-0 mx-auto w-full max-w-7xl pb-6">
        <DashboardFooterStrip documents={documents} />
      </div>
    </div>
  );
}