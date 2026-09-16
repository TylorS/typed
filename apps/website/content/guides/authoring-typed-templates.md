---
title: "Authoring Typed templates"
summary: "Extract the completed search field into reusable markup while keeping its state with the page."
section: "Template authoring"
kind: "concept"
order: 2
---

<span id="begin-with-the-html-you-want-the-browser-to-have"></span>
<span id="choose-where-the-changing-value-lives"></span>

The [first template](/explore/render-your-first-template) owns its query inside the field's view.
Extract the field so a parent page can share that query with other output. The page will own state;
the field will own its markup and input handler.

## Make the state boundary match the reusable component

```ts
import { RefSubject } from "@typed/fx";
import { component, html } from "@typed/template";
import * as EventHandler from "@typed/template/EventHandler";

const SearchField = (query: RefSubject.RefSubject<string>) => {
  const readQuery = EventHandler.make((event: Event) =>
    RefSubject.set(query, (event.currentTarget as HTMLInputElement).value),
  );

  return html`<label>
    Search terms
    <input type="search" .value=${query} oninput=${readQuery} />
  </label>`;
};

export const SearchPage = component(function* () {
  const query = yield* RefSubject.make("");

  return html`<main>
    <h1>Saved articles</h1>
    ${SearchField(query)}
    <output>Current query: ${query}</output>
  </main>`;
});
```

The field needs no yielded setup, so a direct template function is sufficient. The parent uses
`component` to yield state creation and return a template. Neither adds a wrapper element around
the child's label. The running Effect scope owns the state and subscriptions; constructing either
value starts no fiber. [Mounting DOM output](/explore/mounting-dom-output) supplies that lifetime.

For other setup and output choices, see [Component](/explore/ui-component) and
[What a template can render](/explore/renderable-normalization).

## Name the browser surface you intend to change

The same state can drive different native operations. Choose syntax by the operation, rather than
using one generic property record for everything:

| Desired change | Template form | What Typed owns |
| --- | --- | --- |
| Display the query as text | `${query}` | one text position or dynamic range |
| Set a control's current edit buffer | `.value=${query}` | the live `value` property |
| Describe expansion to assistive technology | `aria-expanded=${expanded}` | one serialized attribute |
| Enable or disable a control | `?disabled=${disabled}` | the boolean attribute's presence |
| Run work from an input event | `oninput=${handler}` | a scoped native registration |

An attribute containing `"false"` and an absent boolean attribute mean different things. See
[Attributes, properties, and boolean state](/explore/template-element-bindings) for the set and clear
rules. [Classes](/explore/dom-class-names), [data records](/explore/template-spreads-data), and
[element references](/explore/template-references-and-element-access) have dedicated binding forms.

Continue with [Handle native events with Effect](/explore/native-events-with-effect) to read browser
event data, then [Change a keyed template collection](/explore/keyed-template-collections) to preserve
item identity as a list changes.
