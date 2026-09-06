---
title: "NativePopover: observe open state on a real element"
summary: "Own markup and reverse toggle synchronization while reusing the native observer."
section: "UI / Overlays"
kind: "deep-dive"
order: 283
---

`NativePopover.ref` is the smallest bridge from `{ open: boolean }` to the browser Popover API. Use it when an existing semantic element needs native top-layer visibility and you own the rest of the interaction. It does not set `popover`, assign a role, position content, or listen for browser state changes.

Prerequisites: [Popover](/explore/ui-popover) for the complete Typed family and [Dom refs](/explore/ui-dom#refs) for scoped element integration. The [MDN Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API) explains native auto/manual behavior; selecting a mode belongs to the element's markup.

## Keep an auto popover synchronized

Pass a stable, page-unique ID for the target relationship. This application uses native auto dismissal and declarative targeting. The toggle handler records the browser's final state; the external button also demonstrates opening through Typed state.

```ts
import { RefSubject } from "@typed/fx";
import { EventHandler, html } from "@typed/template";
import { component } from "@typed/ui/Component";
import * as Dom from "@typed/ui/Dom";
import * as NativePopover from "@typed/ui/NativePopover";

const ExportHelp = component(function* (id: string) {
  const state = yield* RefSubject.make({ open: false });
  const readToggle = EventHandler.make((event: Event) => {
    const open = Dom.toggleState(event) === "open";
    return RefSubject.set(state, { open });
  });
  return html`
    <button type="button" popovertarget=${id}>Export help</button>
    <button type="button" onclick=${RefSubject.set(state, { open: true })}>Show help</button>
    <aside id=${id} popover="auto" aria-label="Export help"
      ref=${NativePopover.ref(state)} ontoggle=${readToggle}>
      <p>CSV includes the currently visible rows and columns.</p>
      <button type="button" popovertarget=${id} popovertargetaction="hide">Close</button>
    </aside>
  `;
});
```

The observer checks `element.matches(":popover-open")` before calling `showPopover()` or `hidePopover()`. This makes repeated equal desired states harmless at the native boundary. It does not deduce whether the user intended to dismiss; `ontoggle` supplies that reverse direction. If you omit it, outside dismissal can leave state true and a later state emission can show the surface again.

## Choose the smaller primitive deliberately

Unlike the compound `Popover`, this example can select `popover="auto"` because it owns the host. Auto dismissal is supplied by the browser, not by the ref. The standard family fixes `manual` as an internal prop, so attempting to override that through `props` is not the same extension point.

A ref callback accepts an `HTMLElement` and returns `Effect<void, E, R | Scope>`. State observation runs in a scoped fiber. Closing that Scope stops future synchronization but does not promise to call `hidePopover` on externally owned elements. The observer is browser-only; it contributes no serialized hydration state or SSR attributes. For hydration, compose exactly one hydrated state owner with the observer via `Dom.composeRefs`.

## Debug the native boundary

An initially open state waits for the host to connect before invoking `showPopover()`. A later
closed state or Scope teardown cancels that pending wait, so a removed or deliberately closed
surface cannot open merely because it is attached later. This follows the same scoped connection
policy as NativeDialog; hidden documents may defer the check until animation frames resume.
A missing `popover` attribute can still make the native call invalid. Missing `showPopover` indicates that the environment does not supply the API; this primitive does not polyfill it. Exceptions in native methods are defects, while state failures retain their original typed E. Test against real toggle events, including an outside click for auto mode and repeated open/close cycles.

The content still needs an appropriate role or semantic element, a readable name, focus visibility, and layout. A top-layer surface does not establish a menu keyboard model or modal inertness. Continue with [Hovercard](/explore/ui-hovercard) when pointer/focus transfer must keep interactive content available. API: [NativePopover.ref](/reference/modules/%40typed%2Fui%2FNativePopover).
