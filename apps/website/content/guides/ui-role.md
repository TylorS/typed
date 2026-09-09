---
title: "Role: semantic output without invented behavior"
summary: "Reference an explicit role host while preserving native interactions and naming."
section: "UI / Foundations"
kind: "reference"
order: 294
---

<span id="group-an-order-summary"></span>
<span id="understand-the-deliberately-small-contract"></span>
<span id="do-not-confuse-semantic-state-with-application-state"></span>
<span id="order-summary-title"></span>

`Role` renders a `div` with a caller-selected role. Prefer native markup when it expresses the same structure; a role does not add focus, keyboard handling, or a state machine.

```ts
import * as Role from "@typed/ui/Role";

export const Summary = Role.Role({ role: "group", content: "Order summary" });
```

Supply the role's required name and behavior in the assembled feature. [Role API](/reference/modules/%40typed%2Fui%2FRole).
