---
title: "Button: actions with native activation"
summary: "Choose button types, connect Effect handlers, and preserve browser activation through styling and custom hosts."
section: "UI / Forms"
kind: "guide"
order: 230
---

A button asks the application to do something: recalculate a preview, save a form, or open a dialog. Start with [component construction](/explore/building-ui-components) and [native event handlers](/explore/native-events-with-effect). The important design decision is the action and its focus destination; the visual treatment comes afterward.

`Button` renders a real `<button>`. Its `ButtonOptions` requires `content`, accepts reactive `type` and `disabled`, and accepts an `onclick` handler through the shared DOM boundary. The default type is `"button"`, so placing an action inside a form does not unexpectedly submit it. There is no internal click action or application state to configure.

## Make the action visible in state

This preview counter is a complete renderable component. Activation updates a subject; the same subject supplies the displayed count. Nothing starts until the component runs under the renderer described in [Mounting DOM output](/explore/mounting-dom-output).

```ts
import { RefSubject } from "@typed/fx";
import { html } from "@typed/template";
import { Button } from "@typed/ui/Button";
import { component } from "@typed/ui/Component";

export const PreviewCounter = component(function* () {
  const previews = yield* RefSubject.make(0);
  return html`<section>
    ${Button({
      content: "Recalculate preview",
      props: { class: "preview-action" },
      onclick: RefSubject.update(previews, (count) => count + 1),
    })}
    <p role="status">Preview calculations: ${previews}</p>
  </section>`;
});
```

The handler is an Effect, not a manually launched promise. Its required services and failures remain part of the renderable type. An actual calculation belongs in that handler or a service it calls; the counter here deliberately demonstrates activation rather than pretending to perform work.

## Distinguish activation from submission

The [APG button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/) describes Space and Enter activation and context-dependent focus after an action. The native host supplies keyboard activation; do not add a second keydown handler that also invokes the action. That commonly produces two operations for one key press.

Use `type: "submit"` for submission and put validation and the request on the form's submit boundary. Use `type: "reset"` only when resetting the surrounding form is intentional; [Form](/explore/ui-form) coordinates native reset with Typed state. `disabled` uses the native disabled property. `aria-disabled` alone describes unavailability but does not implement the same interaction suppression.

A toggle command needs an explicit state model and `aria-pressed`; Button does not infer that state from repeated clicks. An on/off preference may be better represented by [Switch](/explore/ui-switch). A destination belongs to [Link](/explore/ui-link), even if the design gives it a filled button appearance.

## Style the host without replacing its contract

Use `props.class` and design tokens for foreground, background, border, and focus ring. Keep a visible `:focus-visible` treatment and distinguish disabled state through more than opacity alone. Content is the default accessible name; an icon-only button needs a meaningful `aria-label` or [VisuallyHidden](/explore/ui-visually-hidden) content.

The second argument can render a custom host with `html`, spreading the supplied props and rendering the supplied content. Keeping a `<button>` preserves native behavior. Replacing it with a `<div>` makes keyboard handling, focusability, disabled behavior, and form participation your responsibility; spreading props alone cannot restore those browser contracts.

When an action fails to fire, inspect the rendered type/disabled state and the handler's Effect error channel before adding event listeners. When it fires twice, check for both keydown and click execution or a submit handler combined with a submitting button's request handler. See the [Button API](/reference/modules/%40typed%2Fui%2FButton) for `Button`, `ButtonOptions`, and `ButtonType`.
