---
title: "Disclosure: reveal content without leaving the page"
summary: "Reference named disclosure parts and native details synchronization."
section: "UI / Overlays"
kind: "reference"
order: 284
---

`Disclosure.Content` renders `<details>`, and `Disclosure.Button` renders its `<summary>`. Use them for optional content that expands in place. The browser handles summary activation; Typed keeps the native open state synchronized with your application.

## Reveal delivery conditions

```ts
import { html, component } from "@typed/template";
import * as Disclosure from "@typed/ui/Disclosure";

const DeliveryConditions = component(function* () {
  const state = yield* Disclosure.makeState();

  return Disclosure.Content({
    state,
    content: [
      Disclosure.Button({ content: "Delivery conditions" }),
      html`<p>Orders placed after 17:00 ship the next business day.</p>
        <p>Tracking becomes available after the first carrier scan.</p>`,
    ],
  });
});
```

Keep the summary first inside details. Its text should name the hidden material rather than an ambiguous “More”. The summary supplies the normal control; no separate button or click handler is needed. See [MDN details](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details) for native structure and toggle behavior.

## Let the browser perform the interaction

Activating summary changes `details.open`. `Content` handles the native `toggle` event by reading `currentTarget.open`; its `NativeDetails.ref` sends application state changes back to that property. These two directions keep native interaction and application intent synchronized without replacing summary activation with a click handler.

`Button` needs only `content` and optional host props. It does not accept state, add a role-based button model, or implement keyboard events on an arbitrary replacement element. A custom host must therefore remain a functioning summary in details. The [APG disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/) describes the expected reveal/hide interaction; the native elements provide its browser semantics here.

## Control state without duplicating visibility

`makeState({ open })` establishes the hydrated snapshot, defaulting to closed. If another action needs to reveal the conditions, use `Disclosure.setOpen(state, true)` with the same state. Do not separately bind CSS display and native open state, as those can disagree about whether the content is available. Hiding details content does not unmount its Typed subtree or suspend its Effects: if expensive work should stop while closed, express that separately in the render composition.

See [component construction](/explore/ui-component) for shared state and render lifetimes.

## Diagnose a broken disclosure

If summary does not toggle, inspect nesting, replaced hosts, canceled click defaults, and whether a custom ref/handler displaced the internal one. If native open changes but application state does not, verify the same state reaches `Content` and that `ontoggle` is forwarded. Test keyboard activation, native open, state open, and visible content together; a state-only test cannot prove summary semantics.

Continue to [NativeDetails](/explore/ui-native-details) for existing markup or [Popover](/explore/ui-popover) when content should leave normal flow. API: [Disclosure](/reference/modules/%40typed%2Fui%2FDisclosure).
