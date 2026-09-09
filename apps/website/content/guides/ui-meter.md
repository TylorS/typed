---
title: "Meter: communicate a measurement in a known range"
summary: "Reference bounded measurements: units, limits, thresholds, and the difference from progress or input."
section: "UI / Foundations"
kind: "reference"
order: 210
---

<span id="put-scale-and-units-where-people-can-read-them"></span>
<span id="thresholds-describe-meaning-not-validation"></span>
<span id="style-informational-state-without-hiding-the-measurement"></span>

`Meter` reports a known-range measurement such as storage use. It is neither editable input nor operation progress. Give the range a readable label and unit; `min`, `max`, `low`, `high`, and `optimum` describe that measurement.

```ts
import * as Meter from "@typed/ui/Meter";

export const StorageUsage = Meter.makeState({ value: 64 });
```

Use [Slider](/explore/ui-slider) for editing and the [Meter API](/reference/modules/%40typed%2Fui%2FMeter) for options.
