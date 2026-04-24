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
- `useDashboardSelectionState`

## Module Boundaries

- `pages/`: thin route-level coordinators.
- `components/layout/`: navbar, layout shell, workspace and user chrome.
- `components/sections/`: page-level section composition blocks.
- `components/documents/`: document cards, rows, lists, and document-specific UI.
- `components/toolbar/`: search/sort/filter/view and selection toolbar controls.
- `components/modals/`: create/rename/delete dialog components.
- `components/index.ts`: optional barrel export for dashboard component domains.
- `hooks/`: isolated dashboard behavior and state orchestration.
- `store/dashboardViewStore.ts`: search, sort, filters and view mode.
- `store/dashboardSelectionStore.ts`: selection state for multi-select flows.

## JSDoc Standard

Each dashboard component and hook has minimal JSDoc:

- One sentence that explains purpose.
- Add side-effect notes only when behavior is non-obvious.
