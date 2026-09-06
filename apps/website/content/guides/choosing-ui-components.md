---
title: "Choosing Typed UI components"
summary: "Develop a report screen by assigning each interaction to the browser, a Typed family, or application state."
section: "UI"
kind: "guide"
order: 4.1
---

Imagine a report screen with a date range, an explanation of its calculations, a refresh action,
and an archive confirmation. Every piece could be drawn as a rectangle. That tells you very little
about which component to use. The useful questions are what the person is doing, what must remain
available to keyboard users, and who owns the resulting state.

This lesson starts with ordinary markup and introduces a Typed abstraction only when a concrete
requirement needs it. Read [your first template](/explore/render-your-first-template) first;
[building UI components](/explore/building-ui-components) continues into reusable application APIs.

## Let document content stay document content

A report title, calculation explanation, and link to another page need no component constructor or
state allocation. The browser already knows how to expose a heading, follow a link, and toggle
native details. Write the document directly:

```ts
import { html } from "@typed/template";

const reportIntroduction = html`
  <header>
    <h1>Quarterly revenue</h1>
    <p>Recognized revenue for the selected period.</p>
    <a href="/reports/methodology">Read the reporting methodology</a>
  </header>
  <details>
    <summary>How these totals are calculated</summary>
    <p>Refunds reduce revenue in the period in which they are issued.</p>
  </details>
`;
```

There is no reason to allocate a RefSubject simply because the details element has an open state.
That state can remain entirely native until another part of the application needs to read or change
it. Nor does repeating a few HTML elements automatically justify a generator: a plain function
returning `html` is enough for parameterized markup without Effectful setup.

The native [details element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details)
keeps the explanation in document flow. That is a product decision: opening it moves later content
rather than covering the report. If the explanation needs to stay available while the user reads,
this behavior may be preferable to any floating surface.

## Add state where two parts must agree

Now suppose the report footer should say whether the calculation explanation is expanded, and an
error message elsewhere should be able to reveal it. A native element alone no longer expresses the
whole relationship. `Disclosure` connects browser state and Typed state while retaining details
and summary semantics.

```ts
import { RefSubject } from "@typed/fx";
import { html } from "@typed/template";
import { component } from "@typed/ui/Component";
import * as Disclosure from "@typed/ui/Disclosure";

const ReportExplanation = component(function* () {
  const state = yield* Disclosure.makeState();
  const availability = RefSubject.map(state, ({ open }) =>
    open ? "Calculation details are expanded above." : "Expand calculation details for an explanation.");
  return html`
    ${Disclosure.Content({
      state,
      content: [
        Disclosure.Button({ content: "How these totals are calculated" }),
        html`<p>Refunds reduce revenue in their issue period.</p>`,
      ],
    })}
    <p>${availability}</p>
  `;
});
```

The generator now earns its place: it acquires state for this rendered instance. The family sends
native toggle events into that state and state updates back into the element. The footer derives
its text from the same source. A second application boolean would create a synchronization problem
instead of solving one. [Disclosure](/explore/ui-disclosure) develops that contract fully.

## Separate actions, values, and destinations

Refreshing the report is an action. Selecting its date range changes a value. Opening a saved report
navigates to a destination. They may share styling, but their browser behavior should differ.

| Person's intent | Start with | Consequence for the application |
| --- | --- | --- |
| Refresh the current report | Native button or [Button](/explore/ui-button) | Supply an Effect; decide busy and failure behavior. |
| Move to another report URL | Anchor or [Link](/explore/ui-link) | Preserve link navigation and browser affordances. |
| Choose one value | Native select, [Select](/explore/ui-select), or [RadioGroup](/explore/ui-radio-group) | Own selected data and its form representation. |
| Search a large set by typing | [Combobox](/explore/ui-combobox) | Coordinate query text, active match, and committed selection. |
| Invoke one of several commands | [Menu](/explore/ui-menu) | Provide command effects and menu keyboard behavior. |

A command menu is therefore a poor date-range field: its selected-looking row does not establish
form submission or persistent value ownership. Conversely, a Select whose options perform unrelated
actions disguises commands as data. For submitted values, start with [Form](/explore/ui-form) so
validation and transport belong to the same design as the visible controls.

## Keep the screen policy outside the primitive

A refresh button needs a label, native activation, and disabled behavior. Whether refreshing replaces
a cache, reports a recoverable error, or continues after leaving the page belongs to the application.
This direct composition needs no generator because the caller has already supplied the work:

```ts
import { Effect } from "effect";
import { html } from "@typed/template";
import * as Button from "@typed/ui/Button";

const reportActions = <E, R>(refresh: Effect.Effect<void, E, R>) => html`
  <nav aria-label="Report navigation"><a href="/reports">All reports</a></nav>
  ${Button.Button({ content: "Refresh report", onclick: refresh })}
`;
const actions = reportActions(Effect.log("Refresh requested"));
```

When the action needs local busy/error state, introduce a component and acquire that state there.
[Building UI components](/explore/building-ui-components) shows the complete progression. Let the
result retain the action's error and service requirements; do not hide missing services with casts
or turn every failure into a generic successful message.

## Choose a larger interaction only when the task needs it

Archiving asks the user to make a decision in a separate task; a modal [Dialog](/explore/ui-dialog)
can give that task focus and make the report inert while it is open. A chart legend merely supplements
the report; a [Popover](/explore/ui-popover) can show it without claiming modal behavior. A short
button description belongs in a [Tooltip](/explore/ui-tooltip); a preview with a profile link needs
[Hovercard](/explore/ui-hovercard) or ordinary visible content.

Use [the overlay lesson](/explore/overlays-disclosure-and-transient-ui) to work through these
consequences. The [APG patterns](https://www.w3.org/WAI/ARIA/apg/patterns/) are a reference for
interaction expectations, not a menu of roles to sprinkle over unrelated markup.

## Recognize when you are authoring a new family

Changing colors or rearranging public parts does not require a new behavior primitive. Use `props`
for styling and a family's host argument when its real semantic element needs custom presentation.
Forward the complete props object so refs, events, and state attributes remain attached.

Reach for [Dom](/explore/ui-dom), [Collection](/explore/ui-collection), and
[Composite](/explore/ui-composite) when no existing family implements a reusable interaction you
actually need. At that point you own the state machine, focus behavior, relationships, disabled and
removal policies, and browser evidence. A role and an arrow-key handler alone are not a finished
family.

Validate the decision at the user boundary: Can a keyboard user reach and leave the report actions?
Does a field submit the chosen value? Does cancellation avoid archiving? Does the explanation remain
readable after zooming? These checks reveal a wrong abstraction sooner than inspecting whether every
screen fragment has a component name.
