import type {
  HTMLAttributes,
  ReactNode,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";

import { cn } from "@/shared/lib/ui/cn";

type TableRootProps = TableHTMLAttributes<HTMLTableElement> & {
  children: ReactNode;
};

type TableSectionProps = HTMLAttributes<HTMLTableSectionElement> & {
  children: ReactNode;
};

type TableRowProps = HTMLAttributes<HTMLTableRowElement> & {
  children: ReactNode;
  selected?: boolean;
};

type TableCellProps = TdHTMLAttributes<HTMLTableCellElement> & {
  children?: ReactNode;
};

type TableHeadProps = ThHTMLAttributes<HTMLTableCellElement> & {
  children?: ReactNode;
};

function TableRoot({ children, className, ...props }: TableRootProps) {
  return (
    <table className={cn("w-full text-sm", className)} {...props}>
      {children}
    </table>
  );
}

function Header({ children, className, ...props }: TableSectionProps) {
  return (
    <thead
      className={cn(
        "border-b border-(--border)/60 bg-(--bg-subtle) text-left text-(--fg-muted)",
        className,
      )}
      {...props}
    >
      {children}
    </thead>
  );
}

function Body({ children, className, ...props }: TableSectionProps) {
  return (
    <tbody className={cn("divide-y divide-(--border)/55", className)} {...props}>
      {children}
    </tbody>
  );
}

function Row({ children, className, selected = false, ...props }: TableRowProps) {
  return (
    <tr
      className={cn(
        "transition-colors hover:bg-(--bg-subtle)",
        selected && "bg-[rgba(73,67,190,0.10)]",
        className,
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

function Head({ children, className, ...props }: TableHeadProps) {
  return (
    <th className={cn("px-4 py-3 font-semibold", className)} {...props}>
      {children}
    </th>
  );
}

function Cell({ children, className, ...props }: TableCellProps) {
  return (
    <td className={cn("px-4 py-3", className)} {...props}>
      {children}
    </td>
  );
}

const Table = Object.assign(TableRoot, {
  Root: TableRoot,
  Header,
  Body,
  Row,
  Head,
  Cell,
});

export default Table;
