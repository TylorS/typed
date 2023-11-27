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
  - [isBrowser](#isbrowser)
  - [isServer](#isserver)
  - [isStatic](#isstatic)
  - [isTest](#istest)

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
  readonly browser: "browser"
  readonly server: "server"
  readonly static: "static"
  readonly test: "test"
}
```

Added in v1.0.0

## Environment (type alias)

**Signature**

```ts
export type Environment = "browser" | "server" | "static" | "test"
```

Added in v1.0.0

## isBrowser

**Signature**

```ts
export declare const isBrowser: Effect.Effect<CurrentEnvironment, never, boolean>
```

Added in v1.0.0

## isServer

**Signature**

```ts
export declare const isServer: Effect.Effect<CurrentEnvironment, never, boolean>
```

Added in v1.0.0

## isStatic

**Signature**

```ts
export declare const isStatic: Effect.Effect<CurrentEnvironment, never, boolean>
```

Added in v1.0.0

## isTest

**Signature**

```ts
export declare const isTest: Effect.Effect<CurrentEnvironment, never, boolean>
```

Added in v1.0.0
