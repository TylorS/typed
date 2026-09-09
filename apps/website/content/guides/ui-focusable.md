---
title: "Focusable: an explicit keyboard entry point"
summary: "Reference deliberate tab stops: zero versus minus one, and the element that actually receives focus."
section: "UI / Foundations"
kind: "reference"
order: 291
---

<span id="make-a-scrollable-report-reachable"></span>
<span id="focusable-is-a-property-not-behavior"></span>
<span id="preserve-the-host-boundary"></span>
<span id="shipments-title"></span>

`Focusable` makes its host a keyboard entry point. `tabIndex: 0` enters normal tab order; `-1` permits programmatic focus without adding a stop. It does not install an interaction pattern.

```ts
import * as Focusable from "@typed/ui/Focusable";

export const ReportRegion = Focusable.Focusable({ tabIndex: 0, role: "region", content: "Report" });
```

Put the props on the element that receives focus. For roving keyboard movement, use [Composite](/explore/ui-composite). [Focusable API](/reference/modules/%40typed%2Fui%2FFocusable).
