import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { Button } from './Button';
import { Card } from './Card';
import { Checkbox } from './Checkbox';
import { Divider } from './Divider';
import { Dropdown } from './Dropdown';
import { Field } from './Field';
import { Input } from './Input';
import { Modal } from './Modal';
import { RadioGroup } from './RadioGroup';
import { Select } from './Select';
import { Table } from './Table';
import { Textarea } from './Textarea';

export function SharedComponentsExample(): JSX.Element {
  return (
    <div className="space-y-8 p-6">
      <Card.Root hoverable>
        <Card.Header>
          <div className="flex items-center gap-3">
            <Avatar fallback="SC" alt="Shared components" />
            <div>
            <h2 className="text-lg font-semibold text-slate-950">Shared components</h2>
            <p className="mt-1 text-sm text-slate-500">Composable primitives for application screens.</p>
            </div>
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

          <section className="grid gap-4 md:grid-cols-2" aria-labelledby="form-examples">
            <h3 id="form-examples" className="text-sm font-semibold text-slate-950 md:col-span-2">
              Form controls
            </h3>
            <Input
              label="Project name"
              name="projectName"
              placeholder="Bachelor thesis"
              description="Use a clear, recognizable name."
            />
            <Select
              label="Status"
              name="status"
              defaultValue=""
              placeholder="Select a status"
              options={[
                { label: 'Draft', value: 'draft' },
                { label: 'In review', value: 'review' },
                { label: 'Published', value: 'published' },
              ]}
            />
            <Textarea
              className="md:col-span-2"
              label="Summary"
              name="summary"
              placeholder="Write a short summary..."
            />
            <RadioGroup.Root
              className="md:col-span-2"
              label="Visibility"
              name="visibility"
              description="Choose who can access this item."
            >
              <RadioGroup.Inline>
                <RadioGroup.Item value="private" label="Private" description="Only you" defaultChecked />
                <RadioGroup.Item value="team" label="Team" description="Workspace members" />
              </RadioGroup.Inline>
            </RadioGroup.Root>
            <Field.Root className="md:col-span-2" id="custom-field" error="This custom field shows an error.">
              <Field.Label>Custom composition</Field.Label>
              <Field.Control>
                <input className="h-10 rounded-lg border border-red-500 px-3 text-sm" />
              </Field.Control>
              <Field.Error />
            </Field.Root>
          </section>

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
