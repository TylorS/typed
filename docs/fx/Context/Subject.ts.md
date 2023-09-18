---
title: Context/Subject.ts
nav_order: 6
parent: "@typed/fx"
---

## Subject overview

A Contextual wrapper around a Subject

Added in v1.18.0

---

<h2 class="text-delta">Table of contents</h2>

- [constructors](#constructors)
  - [Subject](#subject)
- [models](#models)
  - [Subject (interface)](#subject-interface)

---

# constructors

## Subject

Construct a contextual Subject

**Signature**

```ts
export declare function Subject<E, A>()
```

Added in v1.18.0

# models

## Subject (interface)

A Contextual wrapper around a Subject

**Signature**

```ts
export interface Subject<I, E, A> extends Fx<I, E, A>, Sink.WithContext<I, E, A> {
  readonly tag: Context.Tagged<I, S.Subject<never, E, A>>

  readonly interrupt: Effect.Effect<I, never, void>

  readonly provide: (
    replay?: number
  ) => <R2, E2, B>(effect: Effect.Effect<R2, E2, B>) => Effect.Effect<Exclude<R2, I>, E2, B>

  readonly provideFx: (replay?: number) => <R2, E2, B>(effect: Fx<R2, E2, B>) => Fx<Exclude<R2, I>, E2, B>

  readonly make: (replay?: number) => Layer.Layer<never, never, I>
}
```

Added in v1.18.0
