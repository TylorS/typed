---
title: "Attributes, properties, and boolean state"
summary: "Choose the exact browser field a scalar interpolation owns, including sparse attributes and boolean presence."
section: "Template bindings"
kind: "deep-dive"
order: 1
---

A search input can have `value="scope"` in its HTML while its visible text says `events`. That is
normal: the attribute describes markup, while the property is the live edit buffer. A disabled
button adds another distinction—its boolean attribute is true by being present, even if its text
is `"false"`.

After [authoring a template](/explore/authoring-typed-templates), learn these three browser contracts
before choosing a binding. The syntax tells Typed which exact field should receive future values.

## Use attributes for serialized metadata

An ordinary `name=${value}` part sets one attribute. Non-nullish values become strings; `null` and
`undefined` remove the attribute. `false` becomes `"false"`, which is useful for an ARIA state but
is not a removal signal.

```ts
import { html } from "@typed/template";

const description: string | null = "Search titles and descriptions";

export const field = html`<input
  type="search"
  aria-label="Search saved articles"
  title=${description}
/>`;
```

If `description` is a live producer instead of this snapshot, its emissions update the same attribute.
No input replacement is needed. Choose this form for metadata such as `aria-*`, `id`, `role`, `href`,
and `title` when that attribute is the surface you mean.

A sparse expression such as `title="Search: ${description}"` is different. It joins literal and
dynamic segments; a nullish segment becomes empty text but does not remove the whole attribute.
Use a full attribute part when absence itself is meaningful.

## Use properties for current browser state

A leading dot means direct assignment to the element object. It does not stringify the value and
does not treat nullish values as an instruction to remove an attribute.

```ts
import { RefSubject } from "@typed/fx";
import { component } from "@typed/ui/Component";
import { html } from "@typed/template";
import * as EventHandler from "@typed/template/EventHandler";

export const QueryField = component(function* () {
  const query = yield* RefSubject.make("scope");
  const readQuery = EventHandler.make((event: Event) =>
    RefSubject.set(query, (event.currentTarget as HTMLInputElement).value),
  );
  return html`<label>
    Search saved articles
    <input type="search" value="scope" .value=${query} oninput=${readQuery} />
  </label>`;
});
```

The attribute provides initial serialized text. `.value` makes application state the writer of the
current property, and `oninput` records user edits back into that state. The browser's
[value property documentation](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/value)
describes the live value you read here.

This does not create a generic two-way binding: the event and state update are explicit. If the
application later assigns a different value, it is intentionally replacing the current edit buffer.
Selection policy, validation, and request timing remain application decisions.

DOM-only fields such as `.indeterminate` also belong to properties. Server HTML has no generic
representation for property assignments; an initial `.value` alone does not serialize `value=`.
Use an authored attribute where the initial response needs one, and let client setup apply the
property when it starts.

## Use boolean parts when presence means true

`?disabled=${value}` toggles the attribute according to JavaScript truthiness:

```ts
import { RefSubject } from "@typed/fx";
import { component } from "@typed/ui/Component";
import { html } from "@typed/template";

export const SaveControl = component(function* () {
  const readOnly = yield* RefSubject.make(false);
  return html`<button type="button" ?disabled=${readOnly}>Save search</button>`;
});
```

`false`, `null`, `undefined`, `0`, and an empty string remove the attribute. A nonempty string,
including `"false"`, adds it. Pass a boolean when that is your domain meaning rather than relying
on an accidental string conversion.

Do not use the boolean form for `aria-expanded`: assistive technology needs an attribute string
representing true or false, not a presence-only HTML boolean. `aria-expanded=${expanded}` and
`?disabled=${disabled}` intentionally use different forms.

## Inspect the field that the binding actually owns

| Binding | Inspect | Clearing behavior |
| --- | --- | --- |
| `title=${value}` | `getAttribute("title")` | nullish removes the attribute |
| `title="Search: ${value}"` | the complete joined attribute | nullish segment becomes empty text |
| `.value=${value}` | `input.value` | assigns the supplied value directly |
| `?disabled=${value}` | `hasAttribute("disabled")` | falsy removes presence |

When DevTools shows a surprising result, compare the attribute and property instead of assuming
the renderer missed a state change. A mutation observer for attributes cannot prove that a property
wasn't written. When the input object itself changes, inspect a parent switch or changing key;
one scalar binding does not require that replacement.

These parts retain their exact targets after setup. A later write is direct relative to the
surrounding tree; serialization and browser work can still depend on the value. Record-shaped
bindings have additional local work, described in [Spread props and data records](/explore/template-spreads-data).
For the full event-to-mutation debugging path, continue with
[DOM scalar parts and attributes](/explore/dom-parts-and-attributes).
