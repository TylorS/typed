---
title: "Link: navigation that still behaves like a link"
summary: "Reference intercepted navigation clicks, browser-owned anchors, and scheme policy."
section: "UI / Forms"
kind: "reference"
order: 231
---

<span id="render-destinations-with-useful-names"></span>
<span id="the-click-classifier-is-part-of-the-api"></span>
<span id="diagnose-routing-and-presentation-separately"></span>

`Link` keeps a native anchor and routes only eligible same-window navigation clicks through `Navigation`. Modified clicks, downloads, targets, and browser-owned navigation retain anchor behavior.

```ts
import { Link } from "@typed/ui/Link";

export const AccountLink = Link({ href: "/account/profile", content: "Edit profile" });
```

Choose a plain anchor when no router integration is required, and keep scheme policy in the application. [Link API](/reference/modules/%40typed%2Fui%2FLink).
