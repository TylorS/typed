---
title: "NativeDialog: synchronize an existing dialog"
summary: "Connect open state to show, showModal, and close without adopting compound parts."
section: "UI / Overlays"
kind: "deep-dive"
order: 281
---

Use `NativeDialog.ref` when your own markup already contains a real `<dialog>` and you need state-driven visibility. It is the one-way state-to-element bridge used by [Dialog](/explore/ui-dialog). It does not create a trigger, supply an accessible name, listen for cancellation, or register the element for `Dialog.requestClose`.

Prerequisites: [refs and DOM lifetime](/explore/ui-dom#refs) and [RefSubject state](/explore/composing-refsubject-state). The input may be any RefSubject whose value includes `open: boolean`; additional fields remain yours. Hydrated state is optional for this primitive, while the compound Dialog family requires it.

## Integrate an application-owned dialog

Pass a stable, page-unique ID. This example wires the reverse direction explicitly. Browser dismissal and application updates converge on the same state.

```ts
import { RefSubject } from "@typed/fx";
import { EventHandler, html } from "@typed/template";
import { component } from "@typed/ui/Component";
import * as Dom from "@typed/ui/Dom";
import * as NativeDialog from "@typed/ui/NativeDialog";

const KeyboardHelp = component(function* (id: string) {
  const state = yield* RefSubject.make({ open: false });
  const setOpen = (open: boolean) => RefSubject.set(state, { open });
  const readNative = EventHandler.make((event: Event) => {
    const element = Dom.currentTarget<HTMLDialogElement>(event);
    return setOpen(element.open);
  });
  return html`
    <button type="button" onclick=${setOpen(true)}>Keyboard shortcuts</button>
    <dialog aria-labelledby=${`${id}-title`}
      ref=${NativeDialog.ref(state)}
      onclose=${readNative} ontoggle=${readNative}>
      <h2 id=${`${id}-title`}>Keyboard shortcuts</h2>
      <p>Use Tab to move between page controls.</p>
      <button type="button" autofocus onclick=${setOpen(false)}>Done</button>
    </dialog>
  `;
});
```

The ref starts a scoped observer. On each value it checks `element.open`: true state calls `showModal()` only when closed; false state calls `close()` only when open. Pass `{ modal: false }` to choose `show()`. There is no attribute-only emulation. An already open non-modal element is not upgraded to modal merely because the option now says modal; the observer exits early when `element.open` is already true.

Native modal dialogs make the surrounding page inert. A literal `open` attribute instead opens a non-modal dialog, which is why binding that attribute is not an equivalent implementation. The distinction and native focus behavior are documented in [MDN dialog](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog).

## Account for the missing half

Without `onclose` or another reverse synchronization path, Escape can close the element while state still says open. Subsequent state emissions may reopen it. The example reads current native state for both events: a queued close from an earlier opening must not close a dialog that has already reopened. If you need vetoable cancellation, attach a real cancel handler that calls `preventDefault()` during dispatch; an asynchronous confirmation cannot retroactively cancel the browser event.

The callback returns `Effect<void, E, R | Scope>`, retaining the input state's errors and services. Its fiber belongs to the ref's Scope. Scope closure stops observation; the primitive does not itself close the element or remove externally owned markup. DOM method exceptions are defects from `Effect.sync`, not a new typed domain-error case.

Test state-to-native opening, native-to-state closing, and teardown independently. In a DOM mock, missing `showModal` is a platform limitation; use a real browser to test modal focus. Modal opening waits for a detached host to connect; a newer closed state or Scope teardown cancels that wait. Avoid two observers competing over the same element.

For reusable triggers, naming constraints, hydration refs, and close requests, return to [Dialog](/explore/ui-dialog). API: [NativeDialog.ref](/reference/modules/%40typed%2Fui%2FNativeDialog).
