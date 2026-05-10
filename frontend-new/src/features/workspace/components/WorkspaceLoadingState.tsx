import { Table } from '../../../shared/components';

/** Renders skeleton rows while workspace items load. */
export function WorkspaceLoadingState(): JSX.Element {
  return (
    <Table.Wrapper aria-label="Loading workspace items">
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head>Name</Table.Head>
            <Table.Head>Type</Table.Head>
            <Table.Head>Owner</Table.Head>
            <Table.Head>Modified</Table.Head>
            <Table.Head>Sharing</Table.Head>
            <Table.Head>Permission</Table.Head>
            <Table.Head className="w-16">
              <span className="sr-only">Actions</span>
            </Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {Array.from({ length: 5 }, (_item, index) => (
            <Table.Row key={index}>
              {Array.from({ length: 7 }, (_cell, cellIndex) => (
                <Table.Cell key={cellIndex}>
                  <span
                    className={[
                      'block h-4 animate-pulse rounded bg-slate-200',
                      cellIndex === 0 ? 'w-48' : 'w-24',
                    ].join(' ')}
                  />
                </Table.Cell>
              ))}
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Table.Wrapper>
  );
}
