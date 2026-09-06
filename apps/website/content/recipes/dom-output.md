---
slug: dom-output
title: "Pass existing DOM into Typed"
summary: "Keep the nodes your renderer created. Typed places them without taking over their descendants."
---

Suppose a third-party editor already mounts into a `div`. Create that host once, acquire the editor instance in the component's Scope, and return `DomRenderEvent(host)`. Feed document changes through the editor's update API. Typed can now move the editor alongside a sidebar without translating its DOM into template instructions.

The important design choice is whether a new document should reuse the editor or replace it. Reuse preserves selection, undo history, and plugin state; replacement is appropriate when that state belongs exclusively to the previous document. A new `DomRenderEvent` wrapper around the same host still represents the same node. Creating a new host for every change represents replacement.

## What `DomRenderEvent` carries

The public `Rendered` type is a `Node | DocumentFragment | Wire`, or nested readonly arrays of those
values. `DomRenderEvent` stores the value unchanged.

```ts
import { DomRenderEvent } from "@typed/template/RenderEvent";

const host = document.createElement("div");
host.className = "code-editor";

const event = DomRenderEvent(host);

event.valueOf() === host; // true
```

Typed does not clone, serialize, or reparse DOM output. The node keeps its identity, properties, event
listeners, custom-element state, focus, and selection.

## Nodes, fragments, and wires

Use a `Node` when the foreign renderer has one host. Use a `DocumentFragment` to hand off several detached
nodes once. Native insertion empties a fragment, so use a `Wire` when a wrapper-free group must remain a
single movable value after insertion.

```ts
import { DomRenderEvent } from "@typed/template/RenderEvent";
import { persistent } from "@typed/template/Wire";

const fragment = document.createDocumentFragment();
fragment.append(
  document.createElement("header"),
  document.createElement("main"),
);

const templateIdentity = "unique-template-id-or-hash";
const content = persistent(document, templateIdentity, fragment);
const event = DomRenderEvent(content);
```

`persistent` returns the single child directly when the fragment contains one node. With several nodes it
returns a `Wire`: a transparent range bounded by comments, not an element added to the page. The second
argument identifies that template range; use a stable ID or template hash, not a component label. If the
range crosses SSR and hydration, the server and browser must use the same identity.

## Give the editor one descendant range

The adapter owns the node and its descendants. It may render, patch, or replace anything inside that host.
Typed owns only the host's position inside the surrounding dynamic part.

| Owner | May change |
| --- | --- |
| Adapter | The emitted host and everything below it |
| Typed | Where the emitted value appears inside its local range |
| Browser | Native focus, selection, form, dialog, popover, and custom-element state |

Do not let both renderers write the same descendants. A React root, editor, chart, or custom element should
receive a dedicated host; the Typed template controls the markup around it.

## Placement, replacement, and moves

On the first event, Typed inserts the represented nodes at the dynamic part. On the next event it compares
only that local node list:

- the same object in the same position is left alone;
- an absent object is removed from the local range;
- a new object is inserted;
- an existing object in a new position is moved, not recreated.

When an already-parented node moves, Typed uses `ParentNode.moveBefore` when the browser supports it and
falls back to `insertBefore`. Both paths preserve object identity. `moveBefore` additionally preserves
browser-managed state that can be reset by a remove-and-insert move.

This is local reconciliation. Typed does not walk the adapter's descendants or inspect a component tree.

## Allocate the host when its view subscribes

`DomRenderEvent` is the output value. Wrap it in the smallest producer that matches the renderer. For a host
created once per subscription, that is `Fx.sync`:

```ts
import { Fx } from "@typed/fx";
import { html } from "@typed/template";
import { DomRenderEvent } from "@typed/template/RenderEvent";

const editor = Fx.sync(() => DomRenderEvent(document.createElement("div")));

export const workspace = html`<main>${editor}</main>`;
```

For an ordinary textarea, let a template create the native element. `DomRenderEvent` is useful when adapting output that another renderer already owns; a template can express this native editor directly:

```ts
import { html } from "@typed/template";

const DraftEditor = (initial: string) => html`<textarea aria-label="Document draft">${initial}</textarea>`;

export const documentPanel = html`<section>
  <h2>Release notes</h2>
  ${DraftEditor("Describe the changes in this release.")}
</section>`;
```

The textarea's initial text seeds its native value; the browser owns subsequent editing. A retained template keeps the same element, including its selection and editing state. For a controlled editor, put the draft in a `RefSubject` and connect its value and input event as shown in [native events](/explore/native-events-with-effect).

A library editor hosted in a `div` usually has an external disposal method: acquire its instance in the component Scope and register its real shutdown operation. Its update API should apply ordinary document edits without allocating a fresh host.

Use `Fx.callback` only when the renderer actually exposes a callback subscription. The React, Svelte, Vue,
and Web Component recipes show their real mount and update APIs; this page does not invent a generic one.

## Cleanup stays with the adapter

Removing a node from Typed's range does not tell a foreign renderer to unmount. The adapter must connect the
renderer's real cleanup operation to the subscription Scope: `root.unmount()`, Svelte's `unmount`,
`app.unmount()`, an observer's `disconnect()`, or the corresponding library API.

That separation is deliberate. Typed knows where output is placed; the adapter knows what was acquired to
produce it.

## Prove the editor survives placement changes

A serialization assertion cannot prove node identity. In a browser test, retain the actual host and input references, edit a selection, reorder the surrounding Typed list, and assert that the references still match. Test both native `moveBefore` and the fallback behavior when browser-managed state matters. Identity preservation alone does not promise equivalent focus behavior on every browser; the [DOM move contract](https://developer.mozilla.org/en-US/docs/Web/API/Element/moveBefore) documents the platform distinction.

Next remove the adapter and verify its disposal callback, event listeners, and observers. If the host disappears but the editor continues processing, the bug is in the acquisition/finalization bridge. If the editor's children change unexpectedly, inspect whether a Typed template also targets that host. Start with [components](/explore/building-ui-components), then use a concrete [React](/integrate/react), [Svelte](/integrate/svelte), or [Vue](/integrate/vue) integration.

## Related APIs

- [`DomRenderEvent`](/reference/%40typed%2Ftemplate%2FRenderEvent%23DomRenderEvent)
- [`Rendered`](/reference/%40typed%2Ftemplate%2FWire%23Rendered)
- [`Wire`](/reference/%40typed%2Ftemplate%2FWire%23Wire)
- [`persistent`](/reference/%40typed%2Ftemplate%2FWire%23persistent)
