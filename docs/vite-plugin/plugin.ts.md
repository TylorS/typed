---
title: plugin.ts
nav_order: 2
parent: "@typed/vite-plugin"
---

## plugin overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [TypedPluginOptions (interface)](#typedpluginoptions-interface)
  - [makeTypedPlugin](#maketypedplugin)

---

# utils

## TypedPluginOptions (interface)

**Signature**

```ts
export interface TypedPluginOptions {
  readonly clientEntries?: Record<string, string>
  readonly clientOutputDirectory?: string

  readonly serverEntry?: string
  readonly serverOutputDirectory?: string

  readonly rootDir?: string
  readonly tsconfig?: string
}
```

Added in v1.0.0

## makeTypedPlugin

**Signature**

```ts
export declare function makeTypedPlugin(pluginOptions: TypedPluginOptions): Array<PluginOption>
```

Added in v1.0.0
