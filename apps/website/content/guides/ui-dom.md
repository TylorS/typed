---
title: "Dom: preserve behavior when authoring a host"
summary: "Keep props, event cancellation, and refs attached to the element that owns the interaction."
section: "UI / Foundations"
kind: "deep-dive"
order: 295
---

A styled wrapper should not accidentally remove a button's keyboard behavior, a dialog's native synchronization, or an item's registration. `@typed/ui/Dom` is the shared contract that keeps these concerns attached to the real element while allowing caller props and custom renderers.

Prerequisites: [Component](/explore/ui-component), [template bindings](/explore/template-element-bindings), and [mounting DOM output](/explore/mounting-dom-output). Applications normally use a UI family's host argument. Library authors use these helpers when implementing a new public host.

<span id="types"></span>

## Put the complete props on the host element

A custom host receives composed props and content. Return rendered host output using `html`, and spread all props on the element that owns the interaction.

```ts
import { Effect } from "effect";
import { html } from "@typed/template";
import * as Button from "@typed/ui/Button";

const PublishButton = Button.Button(
  {
    content: "Publish report",
    props: { class: "action-primary", "data-command": "publish" },
    onclick: Effect.log("Publish requested"),
  },
  (props, content) => html`<button ...${props}><span class="action-label">${content}</span></button>`,
);
```

The outer button receives all semantics, events, and refs. The span is only presentation. Moving the spread to the span would move behavior away from the interactive element even though the visual result could look identical.

## Props

`Dom/Props.mergeProps(user, internal)` gives internal ordinary props precedence, chains event handlers, and composes refs. It is not object-spread-last-wins for everything. Internally disabled activation suppresses user click handlers for the recognized disabled markers; a native family supplies the rest of its disabled behavior.

`renderHost` first merges `options.props` with top-level forwarded events/ref, then merges internal props. `forwardHostProps` forwards only events and ref from the options object; arbitrary top-level component inputs are not leaked as HTML attributes. Put class, data attributes, and ordinary host attributes inside `props`.

`makeInternalPropsHelpers(options).property(key, fallback)` uses the fallback for null or undefined. False, zero, and empty string remain intentional values. A named component option such as `tabIndex` should control an internal tabindex rather than a competing raw prop.

## Events

`Dom/Events.chainEvent(user, internal)` composes real EventHandlers or Effects. The user handler runs before the internal Effect, and a prevented default skips the internal behavior. Each handler retains its own once and AbortSignal state; capture/passive options are merged, with non-passive behavior required when prevention is requested. The result combines both E and R channels.

```ts
import { Effect } from "effect";
import { EventHandler, html } from "@typed/template";
import * as Dom from "@typed/ui/Dom";

const inspectAndSave = Dom.chainEvent(
  EventHandler.make((event: MouseEvent) => {
    const button = Dom.currentTarget<HTMLButtonElement>(event);

    if (button.dataset["locked"] === "true") event.preventDefault();

    return Effect.log(`Attempted ${button.textContent}`);
  }),
  Effect.log("Accepted save"),
);

const save = html`<button type="button" data-locked="false" onclick=${inspectAndSave}>Save</button>`;
```

`currentTarget` throws when read outside event handling. Capture the needed target/value before asynchronous boundaries. Cancel the browser default synchronously; preventing after an awaited network request is too late for the browser even if a later internal Effect can still be skipped.

## Refs

`Dom/Refs.composeRefs(first, second)` runs the first ref before the second and combines their error/service requirements. Ref results that are Effects, Streams, or Fx are executed/drained; ordinary return values are ignored. A long-running first ref can therefore block the second: fork ongoing observation into the scoped lifetime when that is the intended behavior.

```ts
import { Effect } from "effect";
import { html } from "@typed/template";
import * as Dom from "@typed/ui/Dom";

const recordMount = (element: HTMLButtonElement) =>
  Effect.log(`Mounted ${element.id}`);
const recordLabel = (element: HTMLButtonElement) =>
  Effect.log(`Label: ${element.textContent}`);

const ref = Dom.composeRefs(recordMount, recordLabel);

const save = html`<button id="save" type="button" ref=${ref}>Save</button>`;
```

The mount message is logged before the label message. For resource integration, acquire the resource with a finalizer in the ref's Scope; returning a plain cleanup function is not the same contract as a React callback ref.

Only one hydration ref may own an element. Composing two owners throws a TypeError, including when they are hidden inside earlier compositions. The composed ref retains the single owner's hydration protocol; wrapping a hydrated ref in an ordinary callback can lose that protocol. See [template refs](/explore/template-references-and-element-access) for element access and [NativeDetails](/explore/ui-native-details) for a scoped native-state observer.

## Render

When implementing a new family, use `Dom/Render.renderHost<Element>()` to apply the same prop and host rules. Supply caller options, an optional host override, internal props, content, and the default renderer:

```ts
import { html } from "@typed/template";
import * as Dom from "@typed/ui/Dom";

const summary = Dom.renderHost<HTMLDivElement>()(
  { props: { class: "summary" } },
  undefined,
  () => ({ role: "note" as const }),
  "Exports include only visible columns.",
  (props, content) => html`<div ...${props}>${content}</div>`,
);
```

Prop construction and host invocation happen synchronously when this helper is called. Keep acquisition inside Effects or refs; merely returning an Fx does not retroactively defer arbitrary JavaScript side effects performed while constructing it. Renderer execution owns the DOM bindings and cleanup.

## Check contract preservation at the element

When a custom host breaks, inspect the real element first: its tag, complete spread, internal attributes, listener target, ref, and hydration marker. Then inspect ordering: did a user handler prevent default, or did an earlier ref never complete? Test the observable behavior—activation, native state, focus, and cleanup—not only class names.

Read the exact APIs in [Dom/Types](/reference/modules/%40typed%2Fui%2FDom%2FTypes), [Dom/Events](/reference/modules/%40typed%2Fui%2FDom%2FEvents), [Dom/Props](/reference/modules/%40typed%2Fui%2FDom%2FProps), [Dom/Refs](/reference/modules/%40typed%2Fui%2FDom%2FRefs), and [Dom/Render](/reference/modules/%40typed%2Fui%2FDom%2FRender).
