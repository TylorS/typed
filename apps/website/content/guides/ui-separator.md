---
title: "Separator: a division without an interaction"
summary: "Choose semantic separation, orientation, and styling without implying a draggable splitter."
section: "UI / Foundations"
kind: "guide"
order: 214
---

A separator communicates a boundary between related areas. It has no action and no selection state. `Separator` renders a div with `role="separator"` and an orientation, leaving its visual dimensions and color to your styles. A decorative line that does not express a meaningful boundary can remain CSS on its surrounding container.

The only primitive-specific option is `orientation`, a renderable `"horizontal" | "vertical"` that defaults to horizontal. Shared host props supply class, ID, and other metadata. The renderer returns an empty host, so there is no required content or state constructor.

## Separate two groups of information

```ts
import { html } from "@typed/template";
import { Heading } from "@typed/ui/Heading";
import { Separator } from "@typed/ui/Separator";

export const AccountSummary = html`<section>
    ${Heading({ level: 2, content: "Account summary" })}
    <p>Personal account</p>
    ${Separator({ props: { class: "summary-divider" } })}
    <p>Next renewal: September 30</p>
  </section>`;
```

Give `.summary-divider` a visible border or background and suitable spacing in your stylesheet. The ARIA role does not draw a line. An ordinary `<hr>` is also appropriate for a native thematic break when its semantics and host styling meet the requirement.

## Orientation is information, not layout

A vertical divider should use `orientation: "vertical"` and vertical styling. The implementation reflects `aria-orientation`; it does not rotate the element, assign a height, or change flex/grid alignment. If a responsive layout turns columns into rows, coordinate the visual rule and orientation instead of leaving them contradictory.

[MDN's separator-role reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/separator_role) distinguishes non-focusable structural separators from focusable adjustable separators. This primitive implements the non-interactive case. It does not expose a value, respond to arrows, resize panes, or manage pointer dragging.

The APG window-splitter pattern belongs to a different interaction. Use the WindowSplitter primitive when users resize adjacent panes. Adding `tabindex="0"` to Separator would advertise a keyboard stop without supplying a meaningful action. A line's appearance alone is not enough to justify a splitter role contract.

## Make the boundary useful in every theme

Use theme tokens for border color and spacing and check that the boundary remains visible against both adjacent backgrounds. Do not rely on a one-pixel translucent line as the only distinction between critical sections; whitespace and headings often provide a clearer grouping. Conversely, a list with a divider after every item may create semantic noise when a list structure already expresses the relationships.

Keep decorative flourishes outside the semantic host if they would complicate its accessible contents. The role is meant to mark a division, not label a new section; use [Heading](/explore/ui-heading) or [Group](/explore/ui-group) when the user needs a named region or collection.

If a divider is invisible, inspect its box dimensions and CSS rather than its orientation attribute. If it enters the Tab order, inspect consumer props or the custom host. If the accessible structure is too verbose, check whether a plain CSS border would communicate the same visual detail without extra semantics. A custom host must retain role and orientation if it is still meant to be this primitive.

See the [Separator API](/reference/modules/%40typed%2Fui%2FSeparator) for `SeparatorOptions` and the constructor, and the [WindowSplitter API](/reference/modules/%40typed%2Fui%2FWindowSplitter) for adjustable pane boundaries.
