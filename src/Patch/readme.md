# @fp/Patch

Provides helpers for connecting patching APIs, like a virtual-dom, to [@fp/Shared](../Shared/readme.md) for patching at arbitrary leaf-nodes in your tree of namespaces registered for patching through `getRenderRef()`. There are currently 2 variants, one the provided immediate patches, and another that provides patching using `requestIdleCallback` (abstracted through `@fp/dom`).
