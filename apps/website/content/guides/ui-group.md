---
title: "Group: make related controls understandable together"
summary: "Reference explicit group naming and the distinction between Group and a native fieldset."
section: "UI / Foundations"
kind: "reference"
order: 213
---

<span id="let-visible-text-name-the-group"></span>
<span id="match-grouping-strength-to-the-task"></span>
<span id="visual-grouping-should-match-semantic-grouping"></span>

`Group` supplies a semantic group; connect its name explicitly with `label` or `labelledBy`. Use a native `fieldset` and `legend` when controls form one browser form group.

```ts
import * as Group from "@typed/ui/Group";

export const PreviewControls = Group.Group({ label: "Preview controls", content: "…" });
```

Grouping does not choose child names or validation behavior. [Group API](/reference/modules/%40typed%2Fui%2FGroup).
