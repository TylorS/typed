---
title: "Alert: urgent messages without moving focus"
summary: "Use assertive live-region semantics deliberately and distinguish announcements from interactive recovery."
section: "UI / Foundations"
kind: "guide"
order: 211
---

An alert tells someone about an important change without taking them away from their current task. A failed operation or a newly discovered blocking error may qualify. A routine preview refresh usually does not. `Alert` supplies `role="alert"` on a div; the application chooses when a message changes and what recovery it offers.

The [APG alert pattern](https://www.w3.org/WAI/ARIA/apg/patterns/alert/) describes brief important messages that do not move keyboard focus. It also warns that alerts already present before page load may not be announced. A permanently visible paragraph with an alert role is not a reliable substitute for a timed announcement flow.

## Keep the region mounted and update its text

```ts
import { RefSubject } from "@typed/fx";
import { html } from "@typed/template";
import { Alert } from "@typed/ui/Alert";
import { Button } from "@typed/ui/Button";
import { component } from "@typed/ui/Component";

export const AlertPreview = component(function* () {
  const message = yield* RefSubject.make("");
  return html`<section>
    <p>Preview the message shown when an upload fails.</p>
    ${Button({
      content: "Preview upload failure",
      onclick: RefSubject.set(message, "Upload failed. Your file is still available; try again."),
    })}
    ${Alert({ content: message, props: { class: "upload-alert" } })}
  </section>`;
});
```

This is an explicit announcement preview, not an upload implementation. The initial empty region exists before the button changes its content. In a real upload component, the request's error handling would set the message. Repeatedly assigning the same string may not create a new DOM change or announcement; an alert is not an announcement queue.

## State and focus belong to different boundaries

`AlertOptions` requires renderable `content`; props, refs, events, and host overrides use the shared DOM contract. Alert has no `makeState`, dismissal timer, focus trap, queue, or retry operation. Its renderable content may come from a RefSubject, Effect, or Fx, with subscriptions tied to the rendering Scope.

For a retry action, keep a properly named [Button](/explore/ui-button) in a predictable place near the message. An alert does not require users to acknowledge it. If the interaction must stop and ask for a decision, use an appropriate dialog primitive and its focus lifecycle rather than adding tabindex and focusing the alert.

Use a less interruptive status region for routine saved/loading/completed feedback. In forms, an inline error needs a durable relationship from the input as well as an announcement. [Form](/explore/ui-form) adds error IDs, `aria-invalid`, and `aria-describedby`; a free-standing Alert does not locate a field or create those relationships.

## Make the recovery readable and persistent

Use a concise description of what failed, whether the user's work remains, and what they can do next. Avoid automatically clearing an error after a short timeout: some readers will not have finished. Decorative warning icons should be hidden from assistive technology when their meaning is already in the text. Theme the border/background/text with sufficient contrast and keep the message understandable without color.

Custom hosts must preserve the role and render the content. Avoid nested live regions or an alert wrapped in another assertive region; repeated announcements can be more disruptive than silence. Do not use `display: none` to maintain an apparently mounted announcement region while making it unavailable to accessibility APIs.

Debug with both DOM inspection and an actual screen reader: verify when content changes, whether the region existed beforehand, and whether focus stays where the user was working. Type checking cannot establish announcement timing across assistive technologies. See the [Alert API](/reference/modules/%40typed%2Fui%2FAlert), [VisuallyHidden](/explore/ui-visually-hidden), and [Form](/explore/ui-form).
