---
title: "Namespace-aware platform markup"
summary: "Author SVG and MathML directly; Typed builds the native namespace transitions and attributes the platform expects."
section: "Template bindings"
kind: "deep-dive"
order: 6
---

A saved-article page may show an HTML toolbar and an SVG diagram containing its own links and labels.
The tag name `a` can occur in both places, but the nodes belong to different namespaces and expose
different native behavior. Typed preserves the insertion context of a nested template instead of
assuming every element is HTML.

Learn [ordinary template authoring](/explore/authoring-typed-templates) first. This page develops the
case where that markup crosses into SVG or MathML; no separate SVG component API is required.

## Put the namespace transition in the markup

An HTML `<svg>` enters SVG content. Its children remain SVG until an HTML integration point such as
`foreignObject`, whose child button is ordinary HTML:

```ts
import { html } from "@typed/template";

export const diagram = html`<svg viewBox="0 0 240 80" aria-label="Article relationship">
  <path d="M10 40 H230" stroke="currentColor" />
  <foreignObject x="20" y="10" width="200" height="60">
    <button type="button">Open related article</button>
  </foreignObject>
</svg>`;
```

The path needs SVG interpretation; the button needs HTML semantics. Adding a generic wrapper or
setting an arbitrary namespace attribute is not an equivalent transition. The renderer creates
nodes through namespace-aware DOM operations using the authored context.

SVG `desc` and `title` are also integration points for their child content. MathML enters at
`math`; its text integration points include `mi`, `mo`, `mn`, `ms`, and `mtext`, subject to the
platform's foreign-content rules. `annotation-xml` enters HTML for `encoding="text/html"` or
`"application/xhtml+xml"`. These are supported platform boundaries, not inferred transitions for
custom tag names.

## Reuse the same template in different receiving contexts

A plain template function needs no setup component. Its receiving parent determines what its
native link becomes:

```ts
import { html } from "@typed/template";

const link = (content: string | ReturnType<typeof html>) => html`<a href="#details">${content}</a>`;

export const toolbar = html`<nav>${link("Details")}</nav>`;
export const diagramLink = html`<svg viewBox="0 0 240 80">
  ${link(html`<text x="20" y="40">Details</text>`)}
</svg>`;
```

The toolbar's `a` is HTML; the SVG parent's `a` is SVG. Its visible label uses an SVG `text`
element: bare text inside an SVG link does not draw a label. The DOM target caches compiled fragments by
insertion namespace as well as the template identity. Reusing a fragment from the wrong context
would create a node that looks plausible in serialized HTML but has the wrong native interface.

Do not make the reusable function manually select a namespace based on who calls it. Keep that
responsibility at the renderer's insertion boundary, where the actual receiving context is known.
If an adapter returns existing DOM nodes instead, those nodes already have a namespace; Typed does
not recreate them to reinterpret it.

## Keep attribute names attached to their element's contract

Namespaced attributes and canonical casing also follow context:

```ts
import { html } from "@typed/template";

const marker = "#selected-marker";
const definition = "urn:articles:relationship";

export const markerUse = html`<svg viewBox="0 0 20 20"><use xlink:href=${marker} /></svg>`;
export const formula = html`<math>
  <semantics definitionurl=${definition}>
    <mrow><mi>x</mi><mo>+</mo><mn>1</mn></mrow>
  </semantics>
</math>`;
```

On SVG, `xlink:href` uses the XLink namespace for literal and dynamic attributes. The same spelling
on an HTML element remains an ordinary, non-namespaced attribute. SVG names such as `viewBox`,
`foreignObject`, and `linearGradient` keep their canonical case. MathML canonicalizes
`definitionurl` to `definitionURL` without applying that adjustment to HTML.

A dynamic attribute still has the scalar set/remove behavior described in
[Attributes, properties, and boolean state](/explore/template-element-bindings). Namespace changes
which native attribute is targeted; it does not turn the update into whole-tree reconciliation.

## Debug the native object rather than its spelling

When a diagram link or annotation behaves incorrectly, inspect `namespaceURI` and `localName` on
the actual node. Then inspect its parent and nearest integration point. `outerHTML` alone cannot
prove which native interface was constructed.

Test a reused template under both HTML and SVG parents. Assert namespace, native attributes, and
element identity across a scalar update. Add a server-render/parse/adopt case when diagrams arrive
in the initial response: the browser's HTML parser must produce the structure the DOM renderer will
wire. A test that only finds a text label misses a namespace cache or adoption error.

Renderer authors should continue with [The template compilation pipeline](/explore/template-compilation-pipeline)
and its public AST. Application code should keep the platform transition visible in markup and let
the renderer handle the corresponding construction context.
