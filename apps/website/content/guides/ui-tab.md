---
title: "Tab: the Tabs compatibility entry point"
summary: "Use the singular Tab import as an alias for Tabs; activation, panels, and limitations are documented there."
section: "UI / Collections"
kind: "reference"
order: 245
---

<span id="give-every-instance-a-namespace"></span>
<span id="a-tab-is-not-a-standalone-toggle"></span>
<span id="preserve-the-host-boundary-when-styling"></span>

`@typed/ui/Tab` re-exports `@typed/ui/Tabs`. It has no separate state machine or interaction contract.

```ts
import * as Tab from "@typed/ui/Tab";

export const createTabState = Tab.makeState;
```

Use [Tabs](/explore/ui-tabs) for manual versus automatic activation, stable tab/panel identities, hidden mounted panels, and repeated instances. Keep every instance's IDs unique and stable across server rendering and hydration. The [Tab API](/reference/modules/%40typed%2Fui%2FTab) remains the reference for the singular import path.
