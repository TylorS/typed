---
title: "Heading: document hierarchy independent of visual size"
summary: "Reference contextual heading levels and the default role-based host."
section: "UI / Foundations"
kind: "reference"
order: 212
---

<span id="pass-context-into-the-component"></span>
<span id="a-role-supplies-semantics-not-document-policy"></span>
<span id="make-typography-independent-and-inspectable"></span>

Use `Heading` when a reusable component receives its structural level from context. Its default host is a `div` with `role="heading"` and `aria-level`; use a native `h1`–`h6` when the level is fixed.

```ts
import { Heading } from "@typed/ui/Heading";

export const AccountHeading = Heading({ level: 2, content: "Account security" });
```

Typography does not determine hierarchy. See the [Heading API](/reference/modules/%40typed%2Fui%2FHeading).
