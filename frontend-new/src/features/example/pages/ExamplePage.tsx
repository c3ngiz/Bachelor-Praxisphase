import { SharedComponentsExample } from '../../../shared/components';

/** Showcases the shared component library in one place. */
export function ExamplePage(): JSX.Element {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">Component Examples</h1>
        <p className="mt-2 text-sm text-slate-600">
          A reference page for the shared React, TypeScript, and Tailwind component system.
        </p>
      </div>

      <SharedComponentsExample />
    </section>
  );
}
