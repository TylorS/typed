---
title: index.ts
nav_order: 1
parent: "@typed/environment"
---

## index overview

Environment is a small abstraction over providing runtime information about the environment we are running within.

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [CurrentEnvironment](#currentenvironment)
  - [CurrentEnvironment (type alias)](#currentenvironment-type-alias)
  - [Environment](#environment)
  - [Environment (type alias)](#environment-type-alias)
  - [isDom](#isdom)
  - [isServer](#isserver)
  - [isServiceWorker](#isserviceworker)
  - [isStatic](#isstatic)
  - [isTest](#istest)
  - [isWebWorker](#iswebworker)

---

# utils

## CurrentEnvironment

**Signature**

```ts
export declare const CurrentEnvironment: Context.Tagged<CurrentEnvironment, Environment>
```

Added in v1.0.0

## CurrentEnvironment (type alias)

**Signature**

```ts
export type CurrentEnvironment = Context.Tag.Identifier<typeof CurrentEnvironment>
```

Added in v1.0.0

## Environment

**Signature**

```ts
export declare const Environment: {
  readonly dom: "dom"
  readonly server: "server"
  readonly serviceWorker: "serviceWorker"
  readonly static: "static"
  readonly test: "test"
  readonly webWorker: "webWorker"
}
```

Added in v1.0.0

## Environment (type alias)

**Signature**

```ts
export type Environment = "dom" | "server" | "serviceWorker" | "static" | "test" | "webWorker"
```

Added in v1.0.0

## isDom

**Signature**

```ts
export declare const isDom: Effect.Effect<boolean, never, CurrentEnvironment>
```

Added in v1.0.0

## isServer

**Signature**

```ts
export declare const isServer: Effect.Effect<boolean, never, CurrentEnvironment>
```

Added in v1.0.0

## isServiceWorker

**Signature**

```ts
export declare const isServiceWorker: Effect.Effect<boolean, never, CurrentEnvironment>
```

Added in v1.0.0

## isStatic

**Signature**

```ts
export declare const isStatic: Effect.Effect<boolean, never, CurrentEnvironment>
```

Added in v1.0.0

## isTest

**Signature**

```ts
export declare const isTest: Effect.Effect<boolean, never, CurrentEnvironment>
```

Added in v1.0.0

## isWebWorker

**Signature**

```ts
export declare const isWebWorker: Effect.Effect<boolean, never, CurrentEnvironment>
```

Added in v1.0.0
