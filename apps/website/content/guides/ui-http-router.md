---
title: "HttpRouter: Typed route registration reference"
summary: "Use the canonical Effect HTTP integration recipe for setup; this page records the UI adapter's public overloads."
section: "UI / Foundations"
kind: "reference"
order: 297
---

<span id="register-a-report-page"></span>
<span id="keep-per-request-context-per-request"></span>
<span id="choose-buffering-or-streaming"></span>
<span id="distinguish-route-errors-from-domain-errors"></span>
<span id="verify-the-request-boundary"></span>

Follow [Integrating a matcher with Effect HTTP](/explore/integrating-matcher-with-effect-http) for server setup, request context, errors, and buffered or streaming rendering. It is the canonical worked recipe.

```ts
import { handleHttpServerError, ssrForHttp, streamingSsrForHttp } from "@typed/ui/HttpRouter";

export { handleHttpServerError, ssrForHttp, streamingSsrForHttp };
```

`@typed/ui/HttpRouter` supplies `handleHttpServerError`, `ssrForHttp`, and `streamingSsrForHttp`. The render helpers accept either `helper(router, matcher)` or `helper(matcher)(router)`. Registration is GET-only; Typed still decodes and selects route candidates, while request-local services remain request-local. See the [HttpRouter API](/reference/modules/%40typed%2Fui%2FHttpRouter) for overloads.
