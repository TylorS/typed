---
title: "Group: make related controls understandable together"
summary: "Name a semantic group explicitly without inventing fieldset behavior or implicit label relationships."
section: "UI / Foundations"
kind: "guide"
order: 213
---

Controls often need a shared context: the buttons individually say “Reset rotation” and “Reset scale,” while the group explains that they affect the preview. `Group` adds a named semantic group around related content. It does not choose a selection policy, keyboard model, or validation boundary.

The module provides two renderers. `Group` accepts required content plus optional `label` and `labelledBy`. `Label` renders a span with content. Their naming relationship is explicit: merely placing a Label next to a Group does not connect them.

## Let visible text name the group

```ts
import { RefSubject } from "@typed/fx";
import { html } from "@typed/template";
import { Button } from "@typed/ui/Button";
import { component } from "@typed/ui/Component";
import * as Group from "@typed/ui/Group";

export const PreviewActions = component(function* (labelId: string) {
  const rotation = yield* RefSubject.make(45);
  const scale = yield* RefSubject.make(150);
  return html`<section>
    <p>Rotation: ${rotation} degrees. Scale: ${scale}%.</p>
    ${Group.Label({
      content: "Preview controls",
      props: { id: labelId, class: "control-group-label" },
    })}
    ${Group.Group({
      labelledBy: labelId,
      props: { class: "preview-actions" },
      content: [
        Button({ content: "Reset rotation", onclick: RefSubject.set(rotation, 0) }),
        Button({ content: "Reset scale", onclick: RefSubject.set(scale, 100) }),
      ],
    })}
  </section>`;
});
```

The two commands reset independent parts of the preview state, and the readout makes each result visible. The label ID is passed explicitly to `labelledBy`, producing `aria-labelledby` on the group's div. Pass a stable, distinct label ID to each `PreviewActions` instance. When no visible label is appropriate, `label` supplies `aria-label`; avoid supplying conflicting names through both routes.

## Match grouping strength to the task

[MDN's group-role reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/group_role) describes a collection of related elements that is not a page landmark. Group is structural semantics, not its own interactive APG pattern. It does not make its children behave like a toolbar, radio group, or listbox.

The default div does not implement native fieldset disabled behavior or a legend. Use actual `fieldset`/`legend` markup when those browser form semantics are what you need. Use [RadioGroup](/explore/ui-radio-group) when controls answer one mutually exclusive question; use the toolbar primitive for a composed toolbar keyboard policy. Group never registers children or creates roving tabindex.

The group also does not name each child. “Preview controls” plus an unnamed icon button is still an unnamed button. Preserve distinct labels on the actual controls. For instructions associated with a specific input, use a description relationship to that input rather than relying solely on group context.

## Visual grouping should match semantic grouping

Style the wrapper through `props.class`: spacing, borders, and background can make related controls visually apparent. Do not add a group merely to obtain a flexbox container; a plain div works when there is no semantic relationship to communicate. Conversely, if the interface visually bundles controls under a title, make the relationship available beyond color and proximity.

A label span has no default heading semantics. If it introduces a real section in the page hierarchy, use [Heading](/explore/ui-heading) and reference that heading's ID instead. If it only names a small cluster of controls, a plain Group.Label avoids adding noise to heading navigation.

When the group is unnamed, inspect the referenced element's ID and rendered text. When keyboard movement is absent, check whether you actually chose a composite widget or just Group. Custom hosts must preserve role and labeling attributes, but adding those attributes does not manufacture native form grouping behavior. The [Group API](/reference/modules/%40typed%2Fui%2FGroup) contains `GroupOptions`, `LabelOptions`, `Group`, and `Label`; [Form](/explore/ui-form) covers schema-bound groups and controls.
