# Dashboard Feature Guidelines

This feature follows a modular dashboard architecture with explicit component naming.

## Component Naming Convention

Use PascalCase file names and apply a role suffix when the responsibility is clear.

- Page: `DashboardPage`
- Layout: `DashboardLayout`
- Section: `DashboardDocumentsSection`, `DashboardHighlightsSections`
- Card: `DocumentCard`, `CreateDocumentCard`
- Row/Table: `DocumentRow`, `DocumentsTable`
- Modal: `CreateDocumentModal`, `RenameDocumentModal`, `DeleteConfirmationModal`
- Toolbar/Dropdown/Button: `MultiSelectToolbar`, `FilterDropdown`, `SortDropdown`, `ViewDropdown`, `CreateButton`
- Empty/Skeleton/Preview: `DocumentsEmptyState`, `DocumentSkeletonGrid`, `DocumentCardPreview`

## Hook Naming Convention

Hooks use the `use` prefix and describe one domain concern.

- `useDashboardDocumentActions`
- `useDashboardModalState`
- `useDashboardSectionDocuments`
- `useDocumentSelection`

## Module Boundaries

- `pages/`: thin route-level coordinators.
- `components/sections/`: section composition blocks used by pages.
- `components/`: reusable dashboard UI elements.
- `hooks/`: isolated dashboard behavior and state orchestration.
- `store/dashboardViewStore.ts`: search, sort, filters and view mode.
- `store/dashboardSelectionStore.ts`: selection state for multi-select flows.

## JSDoc Standard

Each dashboard component and hook has minimal JSDoc:

- One sentence that explains purpose.
- Add side-effect notes only when behavior is non-obvious.
