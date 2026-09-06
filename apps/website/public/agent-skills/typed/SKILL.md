---
name: typed
description: Find current Typed APIs and compose Effect-based applications, libraries, and cooperative UI.
---

# Typed

Start with the [documentation index](https://tylors.github.io/typed/llms.txt).
The site is static. Read Markdown and JSON artifacts directly; there is no live documentation API or MCP service.

1. Read [Fx](https://tylors.github.io/typed/explore/fx-push-reactivity.md) for producer-driven work and [RefSubject](https://tylors.github.io/typed/explore/refsubject-renderer-independent-state.md) for readable, observable state.
2. Find relevant packages and declarations in the [reference manifest](https://tylors.github.io/typed/docs-manifest.json). Each declaration includes its HTML, Markdown, and JSON paths. Use the [search index](https://tylors.github.io/typed/search-index.json) to locate names and topics.
3. Check the exact public signature and example before writing code. Use the [complete authored guides](https://tylors.github.io/typed/llms-full.txt) and [complete reference](https://tylors.github.io/typed/docs/reference/llms-full.txt) when broader context is needed.
4. Choose an existing [integration recipe](https://tylors.github.io/typed/integrate.md) for Astro, other frameworks, existing DOM values, or HTML output. Preserve the renderer's ownership and keep cleanup with the owner that acquired the resource.
5. Test state transitions independently of rendering, then verify identity, owned ranges, Scope cleanup, and browser behavior at the rendering boundary.

The code uses [Effect v4](https://effect.website/docs/v4/). Preserve the value, error, and service channels. Generate identifiers when creating entities and retain them across rendering and hydration.
