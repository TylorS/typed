---
title: "Heading: document hierarchy independent of visual size"
summary: "Use explicit heading levels while keeping outline semantics and design-system typography separate."
section: "UI / Foundations"
kind: "guide"
order: 212
---

A heading lets readers understand and navigate the page structure. Its semantic level describes nesting; its visual size reflects design. Those are separate decisions. `Heading` is useful when a reusable design-system component needs a contextual level without choosing a native tag statically. If the level is fixed in your template, an ordinary `<h2>` may be simpler.

The default host is a div with `role="heading"` and `aria-level`, not an h1–h6 element. `HeadingOptions.content` is required; `level` accepts a renderable number and defaults to one. `Level` and `HeadingLevel` are aliases for the same constructor, not additional heading systems.

## Pass context into the component

```ts
import { html } from "@typed/template";
import { Heading } from "@typed/ui/Heading";

export function AccountSection(titleId: string, level: 2 | 3) {
  return html`<section aria-labelledby=${titleId}>
    ${Heading({
      level,
      content: "Account security",
      props: { id: titleId, class: "section-title" },
    })}
    <p>Review the devices and credentials that can access this account.</p>
  </section>`;
}

export const AccountPage = html`<main>
    <h1>Account settings</h1>
    ${AccountSection("account-section-title", 2)}
  </main>`;
```

The caller selects the hierarchy; the child selects its visual class. A plain function is sufficient for the parameterized section because it acquires no state or services; `AccountPage` is a template Fx value. The caller supplies a stable title ID for each instance, preserving the naming relationship across rendering and hydration.

## A role supplies semantics, not document policy

There is no heading keyboard handler, focus management, or automatic nesting service. Headings are navigated through reading and assistive-technology commands rather than ordinary Tab order. The surrounding section's `aria-labelledby` points to visible text; Heading does not create or attach that relationship for you.

[MDN's heading-role reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/heading_role) explains `role="heading"` with `aria-level` and recommends native headings when possible. This is structural ARIA, not a separate interactive APG widget pattern. Passing `level: 4` does not cause surrounding headings to be rebalanced, and the implementation does not validate a useful level range.

Keep levels predictable: begin with the page's main heading, then use subheadings to expose real subdivisions. A component reused in a sidebar and a main article may need different levels. Do not set all card headings to level one because the default happens to be one, and do not change hierarchy to obtain a font size.

## Make typography independent and inspectable

Use `props.class` for font size, weight, spacing, and theme color. Because the default host is a div, global `h2` selectors do not style it; target your class or intentional role selectors. Native heading margins also do not appear automatically. This is often the source of a component that has correct semantic output but unexpected spacing.

Keep the text visible and descriptive. An icon or number can accompany it, but a heading made only from a decorative glyph does not explain a section. If an action belongs beside a heading, place a separately named button next to it rather than turning the heading into a click target.

Review the rendered accessibility tree or a screen reader's heading list to verify level and name. Inspect duplicate IDs when a section is announced with the wrong title. If a custom host switches to an h2 while supplied props still say `aria-level="3"`, resolve that mismatch rather than relying on readers to infer intent. See the [Heading API](/reference/modules/%40typed%2Fui%2FHeading), [Group](/explore/ui-group), and [Separator](/explore/ui-separator) for related structural primitives.
