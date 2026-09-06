---
title: "Focusable: an explicit keyboard entry point"
summary: "Use tabindex deliberately without mistaking focusability for an interaction pattern."
section: "UI / Foundations"
kind: "deep-dive"
order: 291
---

A scrollable report region may need keyboard focus even though it is not a button or link. `Focusable` gives that host a deliberate tab stop. It does not turn ordinary content into an actionable control or provide a composite widget's arrow-key model.

Prerequisites: [semantic component selection](/explore/choosing-ui-components) and [Dom props](/explore/ui-dom#props). The default host is a `<div>`, `tabIndex` defaults to zero, and `role` is optional. An omitted role leaves an ordinary focusable div; choose semantics based on the content rather than appearance.

## Make a scrollable report reachable

```ts
import { html } from "@typed/template";
import * as Focusable from "@typed/ui/Focusable";

const ShipmentReport = Focusable.Focusable({
    role: "region",
    tabIndex: 0,
    props: {
      "aria-labelledby": "shipments-title",
      style: "max-height: 16rem; overflow: auto;",
    },
    content: html`
      <h2 id="shipments-title">Recent shipments</h2>
      <ul>
        <li>Order 401: dispatched Monday</li>
        <li>Order 402: awaiting carrier scan</li>
        <li>Order 403: preparing for dispatch</li>
      </ul>
    `,
});
```

As the list grows beyond the viewport, keyboard users can focus the region and use browser scrolling keys. Keep a visible focus indicator in the site's CSS. The region has a name that explains why it appears as a focus stop. For a short list with no independent keyboard task, normal semantic markup may need no extra tab stop at all.

## Focusable is a property, not behavior

`tabIndex: 0` participates in sequential focus in DOM order. `tabIndex: -1` supports programmatic focus without adding a Tab stop. Avoid positive values that reorder navigation independently of document order; see [MDN tabindex](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/tabindex). Supplying `role: "button"` alone would still leave activation, disabled handling, and keyboard behavior unimplemented. Choose [Button](/explore/ui-button) for an action.

The public option is camel-case `tabIndex`; internal props map it to the template `tabindex` attribute. Both role and tabIndex may be renderable values, so state can drive them. Since these are component-owned props, setting competing values inside `props` is not the intended override path. Use the named options.

## Preserve the host boundary

`Focusable` forwards ordinary props and composes events and refs through `Dom.renderHost`. A custom host receives the complete composed object and content. Apply them to the intended focus target, not a decorative wrapper. If the application plans to call `.focus()`, confirm that the ref points to that same element.

Its return type preserves E/R from renderable options and the host result, plus Scope and RenderTemplate. It allocates no independent focus state. Listener and reactive binding lifetime belongs to the mounted renderer, so changing a tabindex binding does not create a new global focus manager.

Test Tab entry, the accessible name, focus outline, keyboard scrolling when overflow exists, and normal Tab exit. If arrows unexpectedly move a selected item instead of scrolling, inspect ancestor handlers. If multiple children are all tab stops in a toolbar, you need a [Composite](/explore/ui-composite) policy rather than more Focusable hosts.

Next: [Role](/explore/ui-role) for semantic wrappers and [Composite](/explore/ui-composite) for roving or virtual focus. API: [Focusable.Focusable](/reference/modules/%40typed%2Fui%2FFocusable).
