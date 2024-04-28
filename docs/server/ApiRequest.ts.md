---
title: ApiRequest.ts
nav_order: 4
parent: "@typed/server"
---

## ApiRequest overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [exports](#exports)
  - [From "effect-http/ApiRequest"](#from-effect-httpapirequest)
- [utils](#utils)
  - [setRoute](#setroute)

---

# exports

## From "effect-http/ApiRequest"

Re-exports all named exports from the "effect-http/ApiRequest" module.

**Signature**

```ts
export * from "effect-http/ApiRequest"
```

Added in v1.0.0

# utils

## setRoute

**Signature**

```ts
export declare const setRoute: <I extends MatchInput.Any>(
  route: I
) => <B, _, Q, H, R1>(
  endpoint: ApiRequest.ApiRequest<B, _, Q, H, R1>
) => ApiRequest.ApiRequest<
  B,
  Schema.Type<Route.Schema<MatchInput.Route<I>>>,
  Q,
  H,
  R1 | Schema.Context<Route.Schema<MatchInput.Route<I>>>
>
```

Added in v1.0.0
