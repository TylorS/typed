---
title: "Authoring Typed templates"
summary: "Build a reusable search field by separating its fixed markup, live values, native events, and component lifetime."
section: "Template authoring"
kind: "concept"
order: 2
---

A search field has several kinds of change. Someone types, the application records the query, the
input displays that query, and an output describes what is being searched. Its label and surrounding
structure usually stay put. Typed lets you describe those stable elements once and connect changing
values to the particular browser fields they affect.

Read [Render your first template](/explore/render-your-first-template) first if you have not yet
mounted a view. This article develops the view itself; mounting belongs to the application that owns
its lifetime. By the end, the field will be a reusable component with a real input event and a live
state source.

## Begin with the HTML you want the browser to have

Start with an ordinary labeled input. The label, input type, name, and explanatory text are authored
structure. Only the heading changes between uses:

```ts
import { html } from "@typed/template";

const heading = "Search saved articles";

export const search = html`<section>
  <h2>${heading}</h2>
  <label>
    Search terms
    <input type="search" name="query" />
  </label>
  <p>Search article titles and descriptions.</p>
</section>`;
```

The `${heading}` interpolation is data in a text position. If a heading contains `<` or `&`, it
remains text; it does not become additional authored markup. Do not assemble an HTML string from
user data and expect it to behave like a nested template.

Calling `html` returns a lazy Fx that describes rendered output. It has not created the section,
subscribed to anything, or looked for a document. A [`RenderTemplate` service](/reference/modules/%40typed%2Ftemplate%2FRenderTemplate) interprets that
program later: the DOM implementation creates browser nodes, while the HTML implementation
serializes a response. This distinction is what lets the view stay separate from its destination.

## Choose where the changing value lives

Typing changes the input's **current value property**. It does not continuously rewrite the input's
`value` attribute. Consequently, a field controlled by application state needs `.value=${query}`.
An `input` event must also write the browser's edit back into that state; a property binding alone
is only one direction.

Here is the complete loop:

```ts
import { Fx, RefSubject } from "@typed/fx";
import { html } from "@typed/template";
import * as EventHandler from "@typed/template/EventHandler";

export const Search = Fx.gen(function* () {
  const query = yield* RefSubject.make("");
  const readQuery = EventHandler.make((event: Event) =>
    RefSubject.set(query, (event.currentTarget as HTMLInputElement).value),
  );

  return html`<section>
    <h2>Search saved articles</h2>
    <label>
      Search terms
      <input type="search" name="query" .value=${query} oninput=${readQuery} />
    </label>
    <output>Current query: ${query}</output>
  </section>`;
});
```

`RefSubject` supplies a current value and subsequent changes. The generator creates it when its
lazy program runs. The returned template subscribes to it in two places: the input property and
the output's text position. When someone types `scope`, the event reads the native property,
`RefSubject.set` publishes `scope`, and those two retained parts receive it.

The section and input remain the same elements. The generator is setup for this running view; it
is not called again for each keystroke. This matters for selection, focus, listeners, and resources
that belong to the field's lifetime.

The callback receives the element on which the handler was registered as `currentTarget`. Choosing
`target` instead would ask which descendant originated the event. Those coincide for this input,
but need not coincide for a button containing an icon. [Native events with Effect](/explore/native-events-with-effect)
develops that distinction and the lifetime of handler work.

## Make the state boundary match the reusable component

The first `Search` owns its query. That is convenient in isolation, but a page that loads results
also needs that state. Move creation to the page and pass the subject to the field. The field still
owns its markup and event binding; it no longer decides where the query is stored.

```ts
import { Fx, RefSubject } from "@typed/fx";
import { html } from "@typed/template";
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

export const SearchPage = Fx.gen(function* () {
  const query = yield* RefSubject.make("");
  return html`<main>
    <h1>Saved articles</h1>
    ${SearchField(query)}
    <output>Current query: ${query}</output>
  </main>`;
});
```

The field needs no yielded setup, so a direct template function is sufficient. The parent uses
`Fx.gen` to yield state creation and return an Fx template. Neither adds a wrapper element around
the child's label. The running Effect scope owns the state and subscriptions; constructing either
value starts no fiber. [Mounting DOM output](/explore/mounting-dom-output) supplies that lifetime.

Use `component` when the view needs its own child Scope, or setup can return other Renderable forms
such as an array of templates. It forks the parent's Scope and provides that child to both setup
and returned output. `Fx.gen` is enough when setup returns an Fx such as `html`; plain `html` is
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

Before adding either, read [What a template can render](/explore/renderable-normalization). It
explains how a returned value, Effect, stream, array, or nested view becomes output and keeps its
error and service requirements visible. You can then choose the producer your UI needs without
changing the native structure that already works.
