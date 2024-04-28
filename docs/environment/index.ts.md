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
  - [CurrentEnvironment (interface)](#currentenvironment-interface)
  - [Environment](#environment)
  - [Environment (type alias)](#environment-type-alias)
  - [Environment (namespace)](#environment-namespace)
    - [Value (type alias)](#value-type-alias)
  - [EnvironmentValue (type alias)](#environmentvalue-type-alias)
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

## CurrentEnvironment (interface)

**Signature**

```ts
export interface CurrentEnvironment extends Context.Tag.Identifier<typeof CurrentEnvironment> {}
```

Added in v1.0.0

## Environment

**Signature**

```ts
export declare const Environment: {
  dom: EnvironmentValue<"dom">
  server: EnvironmentValue<"server">
  serviceWorker: EnvironmentValue<"serviceWorker">
  static: EnvironmentValue<"static">
  webWorker: EnvironmentValue<"webWorker">
}
```

Added in v1.0.0

## Environment (type alias)

**Signature**

```ts
export type Environment = Environment.Value | `test:${Environment.Value}`
```

Added in v1.0.0

## Environment (namespace)

Added in v1.0.0

### Value (type alias)

**Signature**

```ts
export type Value = "dom" | "server" | "serviceWorker" | "static" | "webWorker"
```

Added in v1.0.0

## EnvironmentValue (type alias)

**Signature**

```ts
export type EnvironmentValue<T extends Environment.Value> = T & {
  readonly test: `test:${T}`
}
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
