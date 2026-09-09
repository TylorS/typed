---
title: "Authoring Typed templates"
summary: "Extract the completed search field into reusable markup while keeping its state with the page."
section: "Template authoring"
kind: "concept"
order: 2
---

<span id="begin-with-the-html-you-want-the-browser-to-have"></span>
<span id="choose-where-the-changing-value-lives"></span>

A search field has several kinds of change. Someone types, the application records the query, the
input displays that query, and an output describes what is being searched. Its label and surrounding
structure usually stay put. Typed lets you describe those stable elements once and connect changing
values to the particular browser fields they affect.

Read [Render your first template](/explore/render-your-first-template) first if you have not yet
mounted a view. This article develops the view itself; mounting belongs to the application that owns
its lifetime. By the end, the field will be a reusable component with a real input event and a live
state source.

## Make the state boundary match the reusable component

The first field owns its query. A page that loads results also needs that state, so move creation to
the page and pass the existing subject to the field. The field owns markup and the event binding;
the page owns state.

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

Use `component` when the view needs its own child Scope, or setup can return other Renderable forms
such as an array of templates. It forks the parent's Scope and provides that child to both setup
and returned output. `component` is for a view with setup; plain `html` is
enough when there is no yielded setup. These are composition choices, not different rendering systems.

## Name the browser surface you intend to change

The same state can drive different native operations. Choose syntax by the operation, rather than
using one generic property record for everything:

| Desired change | Template form | What Typed owns |
| --- | --- | --- |
| Display the query as text | `${query}` | one text position or dynamic range |
| Set a control's current edit buffer | `.value=${query}` | the live `value` property |
| Describe expansion to assistive technology | `aria-expanded=${expanded}` | one serialized attribute |
| Enable or disable a control | `?disabled=${disabled}` | the boolean attribute's presence |
| Contribute visual state | `class=${classes}` | this part's class tokens |
| Group related metadata | `.data=${record}` | the contributed `data-*` keys |
| Run work from an input event | `oninput=${handler}` | a scoped native registration |
| Integrate an element-based API | `ref=${callback}` | setup attached to that exact element |

An attribute containing `"false"` and an absent boolean attribute mean different things. Likewise,
`class` contributes tokens rather than replacing every class another library added. The detailed
set, clear, and cooperation rules belong in [Attributes, properties, and boolean state](/explore/template-element-bindings),
[Class contributions](/explore/dom-class-names), and [Spread props and data records](/explore/template-spreads-data).

## Decide what to connect next

The reusable field is intentionally only an editing loop. Searching a remote source adds request
ordering, pending state, and errors; those policies belong to the application producer, not the
HTML tag. A live result list adds stable item identity; it belongs in
[Change a keyed template collection](/explore/keyed-template-collections).

Continue with [Handle native events with Effect](/explore/native-events-with-effect), then add a
[keyed collection](/explore/keyed-template-collections). [What a template can render](/explore/renderable-normalization)
is optional lookup for other output shapes.
