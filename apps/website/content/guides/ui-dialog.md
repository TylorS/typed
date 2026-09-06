---
title: "Dialog: a named task with a native lifecycle"
summary: "Separate opening, cancel requests, accepted actions, and native modal behavior."
section: "UI / Overlays"
kind: "deep-dive"
order: 280
---

A confirmation dialog has at least three outcomes: the person cancels, the application accepts the action, or the action fails and needs recovery. A single close button cannot represent all three. `Dialog` supplies the native dialog lifecycle; your application decides what an accepted action means.

Start with [component construction](/explore/ui-component) and [overlay selection](/explore/overlays-disclosure-and-transient-ui). The parts share one hydrated `{ open }` state. `Content` renders a real `<dialog>`, and its ref uses `showModal()` by default. The browser owns modal top-layer placement and inertness. `modal: false` chooses `show()` and permits interaction elsewhere; changing a role or CSS does not make a non-modal surface modal. See [MDN dialog](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog).

## Build an archive confirmation

Supply the real archive Effect and a stable, page-unique instance ID. Its service requirements remain in the returned view. A recoverable rejection appears in the dialog; success closes it.

```ts
import { Data, Effect } from "effect";
import { RefSubject } from "@typed/fx";
import { html } from "@typed/template";
import { component } from "@typed/ui/Component";
import * as Button from "@typed/ui/Button";
import * as Dialog from "@typed/ui/Dialog";

class ArchiveRejected extends Data.TaggedError("ArchiveRejected")<{
  readonly message: string;
}> {}

const ArchiveProject = component(function* <R>(id: string, archive: Effect.Effect<void, ArchiveRejected, R>) {
  const state = yield* Dialog.makeState();
  const busy = yield* RefSubject.make(false);
  const message = yield* RefSubject.make("");
  const confirm = Effect.acquireUseRelease(
    // Protect the busy claim and its release from interruption.
    RefSubject.modify(busy, (running) => [!running, true] as const),
    (acquired) => acquired
      ? Effect.gen(function* () {
          yield* RefSubject.set(message, "Archiving…");
          yield* archive;
          yield* RefSubject.set(message, "Archived.");
          yield* Dialog.close(state);
        }).pipe(
          Effect.catchTag("ArchiveRejected", (error) => RefSubject.set(message, error.message)),
          Effect.asVoid,
        )
      : Effect.void,
    // A competing click must not release the active operation's claim.
    (acquired) => acquired ? RefSubject.set(busy, false) : Effect.void,
  );
  return [
    Dialog.Trigger({ state, content: "Archive project" }),
    Dialog.Content({
      state,
      labelledBy: `${id}-title`,
      content: html`
        <h2 id=${`${id}-title`}>Archive project</h2>
        <p>You can restore this project later.</p>
        <p role="status">${message}</p>
        ${Dialog.RequestClose({ state, content: "Close dialog" })}
        ${Button.Button({ content: "Archive", disabled: busy, onclick: confirm })}
      `,
    }),
  ];
});
```

Closing this dialog dismisses the view; it does not cancel an archive already underway. Reopening shows its current status. The handler belongs to the mounted component Scope, so removing that component interrupts the work. If archiving must survive navigation, let an application service own that operation.

`RequestClose` invokes the registered element's native `requestClose()` when available. Its fallback dispatches a cancelable `cancel` event and closes only when accepted. With no mounted `Content`, the request does nothing. In contrast, `close` sets state false without asking permission; `Close` and its alias `Dismiss` provide that direct path. `Dialog.Dialog` aliases `Content`.

## Choose one command path

Omitting `controls`, as above, installs the state-driven click behavior. Supplying `controls` emits native `commandfor` plus `show-modal`, `close`, or `request-close`, and deliberately removes that fallback. Match the value to `Content.id` and verify command support in your target browsers. An unsupported command does not automatically fall back. The native opening command is specifically `show-modal`; use the state path for a non-modal dialog.

`Content` requires exactly one of `label` or `labelledBy`. `Heading` and `Description` are conveniences for visible naming/description content; stable IDs connect them through `labelledBy` and `describedBy`. Names must remain meaningful even when content updates. Keep a visible dismissal control and inspect initial focus, Tab traversal, Escape, and focus return against the [APG modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).

## Diagnose lifecycle disagreements

If the dialog is visible but `state.open` is false, inspect `cancel`, `close`, and `toggle` handlers and the composed ref on the actual `<dialog>`. A custom host must forward all of them. A prevented user `cancel` handler vetoes the internal close handler; cancel browser behavior synchronously, before asynchronous work. If opening does nothing, distinguish an unsupported command from an unmounted content ref. If opening throws, inspect connection and native open state rather than adding another boolean.

The component's inferred Fx carries yielded state/schema requirements and the errors/services of returned content and handlers. Rendering owns event work and native observation by Scope; removing the component stops that observation and unregisters its dialog handle. Keeping an accepted operation alive after route removal is a service-lifetime decision, not a reason to leak the render Scope.

Continue to [NativeDialog](/explore/ui-native-dialog) to see the smaller synchronization layer, or [Dom contracts](/explore/ui-dom) before overriding a host. API: [Dialog](/reference/modules/%40typed%2Fui%2FDialog).
