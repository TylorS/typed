---
title: "Overlays, disclosure, and transient UI"
summary: "Develop a report's explanation, legend, and archive decision with distinct native visibility and dismissal contracts."
section: "UI / Overlays"
kind: "guide"
order: 279
---

A report screen needs three kinds of extra content: an explanation of its calculation, a compact
legend, and an archive confirmation. Treating all three as the same open/closed panel would conceal
the decisions that matter: whether opening moves the document, whether other controls remain usable,
where focus goes, and whether closing means an action succeeded.

Read [choosing UI components](/explore/choosing-ui-components) first. This lesson builds those three
pieces around one report. The dedicated family lessons continue into the native event and focus
contracts rather than repeating the same introduction.

## Begin with content that belongs in the document

The calculation explanation belongs directly below the total it explains. Native details keeps it
there, lets the browser handle activation, and needs no application state:

```ts
import { html } from "@typed/template";

const calculation = html`
  <details>
    <summary>How revenue is calculated</summary>
    <p>Revenue includes paid invoices and subtracts refunds issued during this period.</p>
  </details>
`;
```

Opening this explanation moves later content down. It does not cover controls or pull the person
into a separate task. Use [Disclosure](/explore/ui-disclosure) when other application parts must
observe or request its open state. That family still renders details/summary; its added value is
synchronization, not replacing the native interaction. See [MDN details](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details).

## Move a short legend into the top layer

The legend should not reflow the report. A manual popover supplies native top-layer visibility while
leaving the rest of the page available. The application supplies a visible dismissal control because
manual popovers do not receive automatic outside-click dismissal.

```ts
import { html } from "@typed/template";
import { component } from "@typed/ui/Component";
import * as Button from "@typed/ui/Button";
import * as Popover from "@typed/ui/Popover";

const RevenueLegend = component(function* (id: string) {
  const state = yield* Popover.makeState();
  return [
    Popover.Trigger({ state, content: "Chart legend" }),
    Popover.Content({
      state,
      content: html`
        <section aria-labelledby=${`${id}-title`}>
          <h2 id=${`${id}-title`}>Revenue legend</h2>
          <p>Green means recognized revenue. Gray means forecast revenue.</p>
          ${Button.Button({ content: "Close legend", onclick: Popover.setOpen(state, false) })}
        </section>
      `,
    }),
  ];
});
```

The trigger's click changes state. The content ref observes that state and calls the native show/hide
methods. Native toggle events travel in the opposite direction, keeping application state aware of
the browser. These are two directions of one synchronization loop, not two separately authoritative
booleans.

Typed uses `popover="manual"` here. Escape handling is local to the trigger and content; it is not
a document-wide dismissal listener. The browser's top layer also does not choose placement beside
the trigger. Supply layout appropriate to the report and test scrolling, zoom, and narrow screens.
[Popover](/explore/ui-popover) covers these decisions; [MDN Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API)
explains the underlying manual/auto distinction.

## Give a decision its own task boundary

Archiving is different from reading a legend. The person must understand the action, either accept
or cancel, and recover if the operation fails. Native modal dialog behavior makes the underlying
report inert while this decision is active. Its application state still must distinguish successful
archiving from cancellation.

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

const ArchiveReport = component(function* <R>(id: string, archive: Effect.Effect<void, ArchiveRejected, R>) {
  const state = yield* Dialog.makeState();
  const busy = yield* RefSubject.make(false);
  const status = yield* RefSubject.make("");
  const confirm = Effect.acquireUseRelease(
    // Protect the busy claim and its release from interruption.
    RefSubject.modify(busy, (running) => [!running, true] as const),
    (acquired) => acquired
      ? Effect.gen(function* () {
          yield* RefSubject.set(status, "Archiving…");
          yield* archive;
          yield* RefSubject.set(status, "Archived.");
          yield* Dialog.close(state);
        }).pipe(
          Effect.catchTag("ArchiveRejected", (error) => RefSubject.set(status, error.message)),
          Effect.asVoid,
        )
      : Effect.void,
    // A competing click must not release the active operation's claim.
    (acquired) => acquired ? RefSubject.set(busy, false) : Effect.void,
  );
  return [
    Dialog.Trigger({ state, content: "Archive report" }),
    Dialog.Content({
      state,
      labelledBy: `${id}-title`,
      content: html`
        <h2 id=${`${id}-title`}>Archive this report?</h2>
        <p>You can restore it from the archive later.</p>
        <p role="status">${status}</p>
        ${Dialog.RequestClose({ state, content: "Close dialog" })}
        ${Button.Button({ content: "Archive", disabled: busy, onclick: confirm })}
      `,
    }),
  ];
});
```

Pass a stable, page-unique ID and the real archive Effect when composing this view. Its service
requirements remain in the returned view. Success calls `close`,
while a recoverable rejection updates visible status and leaves the decision available. The busy
check protects this instance from repeated activation; cross-screen serialization belongs in the
archive service.

Closing this dialog dismisses the view; it does not cancel an archive already underway. Reopening shows its current status. The handler belongs to the mounted component Scope, so removing that component interrupts the work. If archiving must survive navigation, let an application service own that operation.

`RequestClose` uses the native cancelable close-request lifecycle. `close` bypasses that request and
sets state false, which is appropriate after successful acceptance. Escape, a close button, route
removal, and successful archiving can all end visibility but are not interchangeable domain results.
[Dialog](/explore/ui-dialog) develops cancellation, command support, naming, and focus return.

## Understand what the browser owns and what it cannot decide

`Dialog.Content` uses a real dialog and calls `showModal()` by default. The browser supplies modal
inertness and native focus behavior. The author chooses a meaningful name and sensible content and
checks the resulting initial focus and exit. Use the [APG modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
when checking those user-facing expectations.

In the examples, omitted `controls` selects Typed's state-driven trigger path. With dialog controls,
a target ID instead selects native `commandfor` commands and removes the click fallback. With
popover controls it selects native `popovertarget`. These mechanisms have distinct platform support;
an ID is not merely decorative metadata. [Native dialog documentation](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog)
explains the native command and modal mechanisms.

A hidden surface's subtree is not automatically unmounted. If fetching or animation should stop
while closed, express that lifetime intentionally; do not assume CSS visibility interrupts Effects.
Conversely, render-Scope teardown stops the mounted listeners and observers. Work that must survive
navigation needs an explicitly longer-lived service owner.

## Distinguish a description from an interactive preview

Use [Tooltip](/explore/ui-tooltip) for a short description of an already named control. Its
`aria-describedby` relationship and tooltip role explain the anchor; putting a required link inside
would create an interaction that descriptive content does not support. Keep essential instructions
visible in the page.

When a preview includes a profile link, use [Hovercard](/explore/ui-hovercard) or ordinary visible
content. A hovercard allows focus transfer into a named non-modal dialog-like surface. Its default
anchor is a span: focus on a nested link does not reach the span's non-bubbling focus handler. The
family lesson shows applying anchor props directly to the actual link. This is a DOM relationship
problem, not a delay-tuning problem.

## Debug one synchronization boundary at a time

First inspect the native element: details.open, dialog.open, or `:popover-open`. Then inspect Typed
state. If they disagree after native dismissal, the reverse event path is missing. If state changes
but the native element does not, inspect the ref, connection, host tag, and platform support. Finally
check focus and positioning; matching booleans cannot prove either.

State-only tests cover `setOpen` and direct close. Browser tests cover summary activation, native
toggle, cancel prevention, modal focus, and pointer/focus transfer. `Dialog.requestClose` needs mounted
content because it consults the registered element; without one it does nothing.

When application-owned markup needs only the observer, study [NativeDetails](/explore/ui-native-details),
[NativePopover](/explore/ui-native-popover), or [NativeDialog](/explore/ui-native-dialog). Each leaves
reverse events, naming, and interaction policy to its caller. For custom hosts, [Dom](/explore/ui-dom)
shows how to retain events, refs, and the single hydration owner on the same real element.
