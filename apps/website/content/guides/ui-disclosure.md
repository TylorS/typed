---
title: "Disclosure: reveal content without leaving the page"
summary: "Compose native details and summary with hydrated state and predictable structure."
section: "UI / Overlays"
kind: "deep-dive"
order: 284
---

Use a disclosure for optional material that belongs where it appears: shipping explanations, advanced settings, or a long answer. Its content expands in normal document flow. There is no top layer, focus trap, or click-outside lifecycle to manage.

Prerequisites: [component construction](/explore/ui-component) and [RefSubject state](/explore/composing-refsubject-state). `Disclosure.Content` renders `<details>`; `Disclosure.Button` renders `<summary>`, despite the public part's name. Their relationship comes from DOM nesting, not a shared trigger-state argument.

## Reveal delivery conditions

```ts
import { RefSubject } from "@typed/fx";
import { html } from "@typed/template";
import { component } from "@typed/ui/Component";
import * as Button from "@typed/ui/Button";
import * as Disclosure from "@typed/ui/Disclosure";

const DeliveryConditions = component(function* () {
  const state = yield* Disclosure.makeState();
  const actionLabel = RefSubject.map(state, ({ open }) => open ? "Hide conditions" : "Show conditions");
  const toggle = RefSubject.update(state, ({ open }) => ({ open: !open }));
  return html`
    <section aria-label="Delivery information">
      ${Disclosure.Content({
        state,
        content: [
          Disclosure.Button({ content: "Delivery conditions" }),
          html`<p>Orders placed after 17:00 ship the next business day.</p>
            <p>Tracking becomes available after the first carrier scan.</p>`,
        ],
      })}
      ${Button.Button({ content: actionLabel, onclick: toggle })}
    </section>
  `;
});
```

Keep the summary first inside details. The native summary remains the normal disclosure control; the external button illustrates a second application transition into the same state. You normally need only the summary. Its text should name the hidden material rather than an ambiguous “More”. See [MDN details](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details) for native structure and toggle behavior.

## Let the browser perform the interaction

Activating summary changes `details.open`. `Content` handles the native `toggle` event by reading `currentTarget.open`; its `NativeDetails.ref` sends application state changes back to that property. These two directions keep native interaction and application intent synchronized without replacing summary activation with a click handler.

`Button` needs only `content` and optional host props. It does not accept state, add a role-based button model, or implement keyboard events on an arbitrary replacement element. A custom host must therefore remain a functioning summary in details. The [APG disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/) describes the expected reveal/hide interaction; the native elements provide its browser semantics here.

## Control state without duplicating visibility

`makeState({ open })` establishes the hydrated snapshot, defaulting to closed. `setOpen` is the public transition; `Disclosure.Disclosure` aliases `Content`. Do not separately bind CSS display and native open state, as those can disagree about whether the content is available. Hiding details content does not unmount its Typed subtree or suspend its Effects: if expensive work should stop while closed, express that separately in the render composition.

The state owner contributes Scope and schema requirements. Dynamic children, props, and host results retain E and R in the returned Fx. Rendering owns toggle listeners and the observer; the caller's state Scope owns the RefSubject. Moving the observer into an application-global Scope would keep work alive after the disclosure disappears.

## Diagnose a broken disclosure

If summary does not toggle, inspect nesting, replaced hosts, canceled click defaults, and whether a custom ref/handler displaced the internal one. If native open changes but the external label does not, verify the same state reaches `Content` and that `ontoggle` is forwarded. Test keyboard activation, native open, state open, and visible content together; a state-only test cannot prove summary semantics.

Continue to [NativeDetails](/explore/ui-native-details) for existing markup or [Popover](/explore/ui-popover) when content should leave normal flow. API: [Disclosure](/reference/modules/%40typed%2Fui%2FDisclosure).
