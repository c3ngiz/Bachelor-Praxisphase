import { Badge } from './Badge';
import { Button } from './Button';
import { Card } from './Card';
import { Checkbox } from './Checkbox';
import { Divider } from './Divider';
import { Dropdown } from './Dropdown';
import { Modal } from './Modal';
import { Table } from './Table';

export function SharedComponentsExample(): JSX.Element {
  return (
    <div className="space-y-8 p-6">
      <Card.Root hoverable>
        <Card.Header>
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Shared components</h2>
            <p className="mt-1 text-sm text-slate-500">Composable primitives for application screens.</p>
          </div>
          <Badge variant="success">Ready</Badge>
        </Card.Header>

        <Card.Content className="space-y-6">
          <section className="space-y-3" aria-labelledby="button-examples">
            <h3 id="button-examples" className="text-sm font-semibold text-slate-950">
              Buttons
            </h3>
            <div className="flex flex-wrap gap-2">
              <Button size="sm">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive" size="lg">
                Destructive
              </Button>
            </div>
          </section>

          <Divider />

          <section className="space-y-3" aria-labelledby="badge-examples">
            <h3 id="badge-examples" className="text-sm font-semibold text-slate-950">
              Badges
            </h3>
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="destructive">Destructive</Badge>
            </div>
          </section>

          <Divider />

          <Checkbox
            label="Enable notifications"
            description="Send updates when documents change."
            defaultChecked
          />

          <Divider />

          <div className="flex flex-wrap gap-2">
            <Dropdown.Root>
              <Dropdown.Trigger>
                <Button variant="secondary">Open menu</Button>
              </Dropdown.Trigger>
              <Dropdown.Content align="start">
                <Dropdown.Item>View details</Dropdown.Item>
                <Dropdown.Item>Duplicate</Dropdown.Item>
                <Dropdown.Item className="text-red-600 focus:bg-red-50">Delete</Dropdown.Item>
              </Dropdown.Content>
            </Dropdown.Root>

            <Modal.Root>
              <Modal.Trigger>
                <Button>Open modal</Button>
              </Modal.Trigger>
              <Modal.Content>
                <Modal.Header>
                  <div>
                    <Modal.Title>Confirm action</Modal.Title>
                    <Modal.Description>This modal traps focus and closes with Escape.</Modal.Description>
                  </div>
                  <Modal.Close aria-label="Close">Close</Modal.Close>
                </Modal.Header>
                <Modal.Body>
                  <p className="m-0 text-sm leading-6 text-slate-600">
                    Use compound parts to compose custom modal layouts without a prop-heavy API.
                  </p>
                </Modal.Body>
                <Modal.Footer>
                  <Modal.Close>Cancel</Modal.Close>
                  <Modal.Close className="bg-slate-950 text-white hover:bg-slate-800 hover:text-white">
                    Confirm
                  </Modal.Close>
                </Modal.Footer>
              </Modal.Content>
            </Modal.Root>
          </div>
        </Card.Content>
      </Card.Root>

      <Table.Wrapper>
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.Head>Name</Table.Head>
              <Table.Head>Status</Table.Head>
              <Table.Head className="text-right">Updated</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            <Table.Row>
              <Table.Cell>Project brief</Table.Cell>
              <Table.Cell>
                <Badge variant="success">Published</Badge>
              </Table.Cell>
              <Table.Cell className="text-right">Today</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>Research notes</Table.Cell>
              <Table.Cell>
                <Badge variant="warning">Draft</Badge>
              </Table.Cell>
              <Table.Cell className="text-right">Yesterday</Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table.Root>
      </Table.Wrapper>
    </div>
  );
}
