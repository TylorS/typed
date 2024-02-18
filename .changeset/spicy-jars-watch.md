---
"@typed/storybook": minor
"@typed/template": minor
"@typed/router": minor
"@typed/fx": patch
"@typed/ui": minor
---

Add support in @typed/ui/Platform for converting RouteMatcher to @effect/platform's HttpServer.router.Router.

This also required changing the signature's of `@typed/template`'s `render`/`hydrate`/`renderToHtml` signatures to not exclude `RenderTemplate`
from its context. This necessitated adding `renderLayer`, `hydrateLayer`, and `serverLayer`/`staticLayer` to be able to provide `RenderTemplate` in
a standalone context, and also better supports re-using the `RenderContext` between different requests during SSR.

Since the recommended way to create a long-lived application, such as a UI application, in Effect is with `Layer.launch`, `renderToLayer` and `hydrateToLayer`
have been added as APIs for quickly setting up a render with the appropriate resources. See `examples/counter` or `examples/todomvc` for examples of this.
