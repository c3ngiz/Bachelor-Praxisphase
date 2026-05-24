import {
  forwardRef,
  type HTMLAttributes,
  type TableHTMLAttributes,
  type TdHTMLAttributes,
  type ThHTMLAttributes,
} from 'react';

import { cn } from '../../utils';

/**
 * Props for the table element.
 */
export type TableRootProps = TableHTMLAttributes<HTMLTableElement>;

/**
 * Props for the scroll wrapper around wide tables.
 */
export type TableWrapperProps = HTMLAttributes<HTMLDivElement>;

/**
 * Props shared by table header and body sections.
 */
export type TableSectionProps = HTMLAttributes<HTMLTableSectionElement>;

/**
 * Props for table rows, including selected-row styling.
 */
export type TableRowProps = HTMLAttributes<HTMLTableRowElement> & {
  selected?: boolean;
};

/**
 * Props for table header cells.
 */
export type TableHeadProps = ThHTMLAttributes<HTMLTableCellElement>;

/**
 * Props for table body cells.
 */
export type TableCellProps = TdHTMLAttributes<HTMLTableCellElement>;

const TableWrapper = forwardRef<HTMLDivElement, TableWrapperProps>(function TableWrapper(
  { className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn('w-full overflow-x-auto rounded-lg border border-slate-200 bg-white', className)}
      {...props}
    />
  );
});

const TableRoot = forwardRef<HTMLTableElement, TableRootProps>(function TableRoot(
  { className, ...props },
  ref,
) {
  return <table ref={ref} className={cn('w-full caption-bottom text-sm', className)} {...props} />;
});

const TableHeader = forwardRef<HTMLTableSectionElement, TableSectionProps>(function TableHeader(
  { className, ...props },
  ref,
) {
  return <thead ref={ref} className={cn('bg-slate-50 text-left text-slate-600', className)} {...props} />;
});

const TableBody = forwardRef<HTMLTableSectionElement, TableSectionProps>(function TableBody(
  { className, ...props },
  ref,
) {
  return <tbody ref={ref} className={cn('divide-y divide-slate-200', className)} {...props} />;
});

const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(function TableRow(
  { className, selected = false, ...props },
  ref,
) {
  return (
    <tr
      ref={ref}
      className={cn(
        'border-b border-slate-200 transition-colors last:border-b-0 hover:bg-slate-50',
        selected && 'bg-slate-100',
        className,
      )}
      {...props}
    />
  );
});

const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(function TableHead(
  { className, ...props },
  ref,
) {
  return (
    <th
      ref={ref}
      className={cn('h-11 whitespace-nowrap px-4 text-left align-middle text-xs font-semibold uppercase tracking-wide', className)}
      {...props}
    />
  );
});

const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(function TableCell(
  { className, ...props },
  ref,
) {
  return <td ref={ref} className={cn('px-4 py-3 align-middle text-slate-700', className)} {...props} />;
});

/**
 * Compound table component with wrapper, section, row, and cell primitives.
 */
export const Table = Object.assign(TableRoot, {
  Root: TableRoot,
  Wrapper: TableWrapper,
  Header: TableHeader,
  Body: TableBody,
  Row: TableRow,
  Head: TableHead,
  Cell: TableCell,
});

/**
 * Default export for consumers that prefer default compound-component imports.
 */
export default Table;
