---
title: RenderContext.ts
nav_order: 15
parent: "@typed/template"
---

## RenderContext overview

The context in which templates are rendered within

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [Environment](#environment)
  - [Environment (type alias)](#environment-type-alias)
  - [RenderContext](#rendercontext)
  - [RenderContext (interface)](#rendercontext-interface)
  - [RenderContextOptions (type alias)](#rendercontextoptions-type-alias)
  - [RenderQueue (interface)](#renderqueue-interface)
  - [browser](#browser)
  - [getRenderCache](#getrendercache)
  - [getTemplateCache](#gettemplatecache)
  - [make](#make)
  - [server](#server)
  - [static](#static)

---

# utils

## Environment

**Signature**

```ts
export declare const Environment: { readonly server: 'server'; readonly browser: 'browser'; readonly static: 'static' }
```

Added in v1.0.0

## Environment (type alias)

**Signature**

```ts
export type Environment = RenderContext['environment']
```

Added in v1.0.0

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
   * The current environment.
   */
  readonly environment: 'server' | 'browser' | 'static'

  /**
   * Whether or not the current render is for a bot.
   */
  readonly isBot: boolean

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
  readonly environment: RenderContext['environment']
  readonly scope: Scope.Scope
  readonly isBot?: RenderContext['isBot']
}
```

Added in v1.0.0

## RenderQueue (interface)

**Signature**

```ts
export interface RenderQueue {
  readonly add: (part: Part | SparsePart, task: () => void) => Effect.Effect<Scope.Scope, never, void>
}
```

Added in v1.0.0

## browser

**Signature**

```ts
export declare const browser: Layer.Layer<never, never, RenderContext>
```

Added in v1.0.0

## getRenderCache

**Signature**

```ts
export declare function getRenderCache<T>(renderCache: RenderContext['renderCache'], key: object): Option.Option<T>
```

Added in v1.0.0

## getTemplateCache

**Signature**

```ts
export declare function getTemplateCache(
  templateCache: RenderContext['templateCache'],
  key: TemplateStringsArray
): Option.Option<Entry>
```

Added in v1.0.0

## make

**Signature**

```ts
export declare function make({ environment, isBot = false, scope, ...options }: RenderContextOptions): RenderContext
```

Added in v1.0.0

## server

**Signature**

```ts
export declare const server: (isBot?: boolean) => Layer.Layer<never, never, RenderContext>
```

Added in v1.0.0

## static

**Signature**

```ts
export declare const static: (isBot?: boolean | undefined) => Layer.Layer<never, never, RenderContext>
```

Added in v1.0.0
