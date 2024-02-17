---
title: RenderContext.ts
nav_order: 18
parent: "@typed/template"
---

## RenderContext overview

The context in which templates are rendered within

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [RenderContext](#rendercontext)
  - [RenderContext (interface)](#rendercontext-interface)
  - [RenderContextOptions (type alias)](#rendercontextoptions-type-alias)
  - [RenderQueue (interface)](#renderqueue-interface)
  - [dom](#dom)
  - [getRenderCache](#getrendercache)
  - [getTemplateCache](#gettemplatecache)
  - [make](#make)
  - [server](#server)
  - [static](#static)
  - [unsafeMake](#unsafemake)

---

# utils

## RenderContext

The context in which templates are rendered within

**Signature**

```ts
export declare const RenderContext: Context.Tagged<RenderContext, RenderContext>
```

Added in v1.0.0

## RenderContext (interface)

The context in which templates are rendered within

**Signature**

```ts
export interface RenderContext {
  /**
   * The current environment we are rendering within
   */
  readonly environment: Environment

  /**
   * Cache for root Node's being rendered into.
   */
  readonly renderCache: WeakMap<object, Rendered | null>

  /**
   * Cache for individual templates.
   */
  readonly templateCache: WeakMap<TemplateStringsArray, Entry>

  /**
   * Queue for work to be batched
   */
  readonly queue: RenderQueue
}
```

Added in v1.0.0

## RenderContextOptions (type alias)

**Signature**

```ts
export type RenderContextOptions = IdleRequestOptions & {
  readonly environment: Environment
  readonly scope: Scope.Scope
}
```

Added in v1.0.0

## RenderQueue (interface)

**Signature**

```ts
export interface RenderQueue {
  readonly add: (part: unknown, task: () => void) => Effect.Effect<void, never, Scope.Scope>
}
```

Added in v1.0.0

## dom

**Signature**

```ts
export declare const dom: (
  window: Window & GlobalThis,
  options?: DomServicesElementParams & { readonly skipRenderScheduling?: boolean }
) => Layer.Layer<RenderContext | CurrentEnvironment | DomServices>
```

Added in v1.0.0

## getRenderCache

**Signature**

```ts
export declare function getRenderCache<T>(renderCache: RenderContext["renderCache"], key: object): Option.Option<T>
```

Added in v1.0.0

## getTemplateCache

**Signature**

```ts
export declare function getTemplateCache(
  templateCache: RenderContext["templateCache"],
  key: TemplateStringsArray
): Option.Option<Entry>
```

Added in v1.0.0

## make

**Signature**

```ts
export declare function make({ ...options }: Omit<RenderContextOptions, "scope">, skipRenderScheduling?: boolean)
```

Added in v1.0.0

## server

**Signature**

```ts
export declare const server: Layer.Layer<RenderContext | CurrentEnvironment, never, never>
```

Added in v1.0.0

## static

**Signature**

```ts
export declare const static: Layer.Layer<RenderContext | CurrentEnvironment, never, never>
```

Added in v1.0.0

## unsafeMake

**Signature**

```ts
export declare function unsafeMake(
  { environment, scope, ...options }: RenderContextOptions,
  skipRenderScheduling?: boolean
): RenderContext
```

Added in v1.0.0
