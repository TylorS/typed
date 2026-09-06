---
title: "Link: navigation that still behaves like a link"
summary: "Understand which clicks enter Typed Navigation and which remain browser-owned anchor behavior."
section: "UI / Forms"
kind: "guide"
order: 231
---

Links expose destinations. People inspect their URL, copy them, open new tabs, and navigate with Enter. `Link` keeps a native anchor and only intercepts the subset of clicks eligible for Typed navigation. Read [Navigation as an Effect service](/explore/navigation-as-an-effect-service) before using it inside an application router.

`LinkOptions` requires `href` and `content`, with an optional `replace` history policy. Shared host props carry attributes such as `target`, `rel`, and `download`. The returned Fx requires `Navigation`, the template renderer, and Scope; navigation failures remain in its error channel. A plain anchor is sufficient when you want no router integration.

## Render destinations with useful names

```ts
import { html } from "@typed/template";
import { Link } from "@typed/ui/Link";

export const AccountLinks = html`<nav aria-label="Account">
    ${Link({ href: "/account/profile", content: "Edit profile" })}
    ${Link({
      href: "/account/security",
      content: "Security settings",
      replace: false,
    })}
    ${Link({
      href: "https://www.w3.org/WAI/",
      content: "Accessibility resources (opens in a new tab)",
      props: { target: "_blank", rel: "noopener" },
    })}
  </nav>`;
```

Provide the application's existing Navigation layer at the mounting boundary. Creating a separate history service per link would split navigation ownership. The example uses root-relative application paths: an application deployed beneath a base path must construct destinations that include its routing base.

## The click classifier is part of the API

In the current implementation, modified clicks, non-primary clicks, a non-`_self` target, and anchors with `download` remain native. Same-origin HTTP(S) destinations reached by an ordinary primary click are canceled synchronously and forwarded to `navigation.navigate`. `replace: true` replaces the current history entry; the default pushes an entry. That distinction affects the Back button and should follow the user's workflow rather than a visual preference.

External HTTP(S), `mailto:`, and `tel:` destinations retain browser behavior. The implementation allows those schemes and neutralizes other schemes to `about:blank`; do not assume a `blob:` download or a custom protocol will survive this component. A consumer click handler runs first, and synchronous `preventDefault()` prevents the internal navigation decision. Delaying cancellation until after asynchronous work is too late for a native default action.

The [APG link pattern](https://www.w3.org/WAI/ARIA/apg/patterns/link/) recommends native anchors because a role cannot supply link behavior. Typed does not add button-style Space activation. It also does not choose a route's post-navigation focus target: title, landmark, and focus policy belong to the application router and destination view.

## Diagnose routing and presentation separately

Use descriptive content and visible focus styling. Underlining makes inline destinations easier to recognize without relying on color alone. A selected navigation item can receive `aria-current` through props when the route actually matches; `Link` does not calculate active-route state itself. Avoid nested buttons or another anchor in the content.

If a link reloads the page, inspect origin, target, download, and modifier keys before blaming navigation. If it is inert, inspect its rendered href, a consumer handler's cancellation, and whether the Navigation service was provided. If Back skips a page, check `replace` and redirect policy. Custom hosts must preserve an anchor, the sanitized href, and the composed click handler.

Continue with [Button](/explore/ui-button) for commands and the [Link API](/reference/modules/%40typed%2Fui%2FLink) for the inferred option/error/service contract.
