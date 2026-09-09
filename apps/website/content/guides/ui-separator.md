---
title: "Separator: a division without an interaction"
summary: "Reference static semantic separation, orientation, and the boundary with a draggable splitter."
section: "UI / Foundations"
kind: "reference"
order: 214
---

<span id="separate-two-groups-of-information"></span>
<span id="orientation-is-information-not-layout"></span>
<span id="make-the-boundary-useful-in-every-theme"></span>

`Separator` marks a static boundary and defaults to horizontal. It has no value, focus, or drag interaction.

```ts
import { Separator } from "@typed/ui/Separator";

export const SectionBreak = Separator({ orientation: "vertical" });
```

Use [WindowSplitter](/explore/ui-window-splitter) when the boundary changes layout. See the [Separator API](/reference/modules/%40typed%2Fui%2FSeparator).
