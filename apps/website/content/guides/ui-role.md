---
title: "Role: semantic output without invented behavior"
summary: "Use an explicit role while preserving naming, structure, and native interactions."
section: "UI / Foundations"
kind: "deep-dive"
order: 294
---

`Role` renders a div with an explicit role and caller-provided content. It is a small semantic host, useful when markup needs a role without a specialized Typed family. It does not add focus, keyboard activation, selection, live updates, or a state machine.

Read [choosing UI components](/explore/choosing-ui-components) and [Dom types](/explore/ui-dom#types) first. Prefer native semantics when they express the same thing. A role is a promise to assistive technology; the application must actually deliver any interaction that role implies.

## Group an order summary

This example uses a non-interactive grouping role. The heading supplies its name, and each action remains a native button rather than giving the wrapper artificial activation behavior.

```ts
import { Effect } from "effect";
import { html } from "@typed/template";
import * as Button from "@typed/ui/Button";
import * as Role from "@typed/ui/Role";

const OrderSummary = (reviewOrder: Effect.Effect<void>) => Role.Role({
    role: "group",
    props: { "aria-labelledby": "order-summary-title", class: "order-summary" },
    content: html`
      <h2 id="order-summary-title">Order summary</h2>
      <p>Three items, ready for review.</p>
      ${Button.Button({ content: "Review order", onclick: reviewOrder })}
    `,
});
const orderSummary = OrderSummary(Effect.void);
```

For this exact role, [Group](/explore/ui-group) may be the clearer semantic family. `Role` becomes useful when authoring another well-understood semantic wrapper and there is no family to own it. Keeping an example simple avoids teaching a clickable div as a replacement for a native button.

## Understand the deliberately small contract

The required `role` option can be a static or reactive string, null, or undefined. It is forwarded as the internal role prop; `content` accepts any supported renderable. Ordinary attributes, names, classes, event handlers, and refs travel through the shared Dom contract. A caller can supply a host override, but that host must preserve the composed role and any required structural relationships.

The type permits arbitrary role strings; it is not a full ARIA validator. It does not verify that a region is named, that a tree has treeitems, or that a menu implements arrows and Escape. Reach for the matching public family when such behavior exists. The [APG keyboard guidance](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/) explains why custom widgets need explicit focus and key behavior.

## Do not confuse semantic state with application state

Role does not allocate a RefSubject. If you provide a reactive role, the renderer observes it for the mounted Scope, but changing that role does not migrate keyboard behavior to a different pattern. Usually a stable role and reactive content/state attributes are easier to reason about.

The Fx carries E/R from props, children, event Effects, and the custom host, plus Scope and RenderTemplate. A role string itself requires no services and owns no resources. An Effectful child can still fail; the wrapper does not catch that failure merely because it looks like a presentation component.

Test the resulting accessibility tree and visible structure rather than only checking that a `role` attribute exists. If a screen reader announces an unexpected widget, inspect inherited/native semantics and the role value. If keyboard activation is missing, adding tabindex supplies focusability only: use [Button](/explore/ui-button), [Focusable](/explore/ui-focusable), or an established composite as appropriate.

Continue to [Dom](/explore/ui-dom) when building a reusable semantic host. API: [Role.Role](/reference/modules/%40typed%2Fui%2FRole).
