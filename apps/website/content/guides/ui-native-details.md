---
title: "NativeDetails: connect details.open to application state"
summary: "Use a one-way ref with an explicit browser-to-state toggle path."
section: "UI / Overlays"
kind: "deep-dive"
order: 285
---

`NativeDetails.ref` observes any RefSubject value containing `open: boolean` and writes `HTMLDetailsElement.open` when it differs. It is useful when an application already owns its details markup or needs extra state fields. Prefer [Disclosure](/explore/ui-disclosure) when its standard compound parts fit; that family already supplies the reverse toggle handler and hydration ref.

Read [Dom refs](/explore/ui-dom#refs) before introducing the lower-level bridge. The native [details element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details) keeps its normal summary activation and document-flow behavior.

## Synchronize a shipping explanation

```ts
import { RefSubject } from "@typed/fx";
import { EventHandler, html } from "@typed/template";
import { component } from "@typed/ui/Component";
import * as Dom from "@typed/ui/Dom";
import * as NativeDetails from "@typed/ui/NativeDetails";

const ShippingExplanation = component(function* () {
  const state = yield* RefSubject.make({ open: false, topic: "Shipping estimates" });
  const readToggle = EventHandler.make((event: Event) => {
    const open = Dom.currentTarget<HTMLDetailsElement>(event).open;
    return RefSubject.update(state, (current) => ({ ...current, open }));
  });
  const show = RefSubject.update(state, (current) => ({ ...current, open: true }));
  return html`
    <button type="button" onclick=${show}>Explain shipping estimate</button>
    <details ref=${NativeDetails.ref(state)} ontoggle=${readToggle}>
      <summary>${RefSubject.map(state, (current) => current.topic)}</summary>
      <p>The delivery window starts when the carrier receives your package.</p>
    </details>
  `;
});
```

The external button requests open state; the ref updates the native property. Activating summary changes that property independently; `ontoggle` sends the native value back. The extra `topic` field is preserved by both updates and ignored by the native observer. There is no independent React-like controlled/uncontrolled switch: there are simply two explicit update directions.

## Understand what the ref owns

Calling `ref(state)` creates a callback. Running that callback forks observation into the current Effect Scope. It does not install events, create markup, or take ownership of the externally supplied state. Its type preserves `E` and `R` from the RefSubject and adds `Scope`. A native property failure is a defect from synchronous DOM work, not an expected state error.

Scope closure interrupts the observer. It does not promise to reset `element.open`; if the element is externally owned and remains in the page, it retains its last native state. If the template owns the element, renderer teardown handles its removal. Keep these lifetimes separate when integrating with another DOM owner.

## Hydration and event timing

The example uses plain `RefSubject.make`, so it does not encode an SSR snapshot. An application using hydrated state must compose that one hydration owner with `NativeDetails.ref`; merely passing hydrated state to the observer does not attach its serialization protocol to the host. [Disclosure](/explore/ui-disclosure) already performs this composition.

Read `currentTarget.open` during the handler, before yielding to asynchronous work. Toggle events describe the browser's resulting state and may coalesce rapid changes; do not count them as a complete history of every user action. If analytics needs activation intent, record that separately from visibility synchronization.

Test native summary activation, external open requests, repeated equal state, and removal followed by later state updates. If state reopens a user-closed element, the reverse `ontoggle` path is absent or attached to the wrong host. If the whole page shifts when opening, that is ordinary in-flow details layout; use [Popover](/explore/ui-popover) for a different presentation contract.

API: [NativeDetails.ref](/reference/modules/%40typed%2Fui%2FNativeDetails). Next: [Dom composition](/explore/ui-dom) for refs that retain hydration and cleanup.
