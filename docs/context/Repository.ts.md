---
title: Repository.ts
nav_order: 18
parent: "@typed/context"
---

## Repository overview

A Repository is a collection of Context.Fns that can be implemented
and utilized in a single place.

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [constructors](#constructors)
  - [repository](#repository)
- [models](#models)
  - [Repository (type alias)](#repository-type-alias)
  - [RepositoryImplement (type alias)](#repositoryimplement-type-alias)

---

# constructors

## repository

Create a Repository from a collection of Fns.

**Signature**

```ts
export declare function repository<Fns extends AnyFns>(fns: Fns): Repository<Fns>
```

Added in v1.0.0

# models

## Repository (type alias)

A Repository is a collection of Context.Fns that can be implemented
and utilized in a single place.

**Signature**

```ts
export type Repository<Fns extends AnyFns> = Fns & TaggedStruct<Fns> & RepositoryImplement<Fns>
```

Added in v1.0.0

## RepositoryImplement (type alias)

A Repository can be implemented with a collection of Fns.

**Signature**

```ts
export type RepositoryImplement<Fns extends AnyFns> = {
  readonly implement: <Impls extends { readonly [K in keyof Fns]: EffectFn.Extendable<Fn.FnOf<Fns[K]>> }>(
    implementations: Impls
  ) => Layer.Layer<Fn.Identifier<Fns[keyof Fns]>, never, EffectFn.Context<Impls[keyof Impls]>>

  readonly makeLayer: <R, E, Impls extends { readonly [K in keyof Fns]: EffectFn.Extendable<Fn.FnOf<Fns[K]>> }>(
    implementations: Effect.Effect<Impls, E, R>
  ) => Layer.Layer<Fn.Identifier<Fns[keyof Fns]>, never, Exclude<EffectFn.Context<Impls[keyof Impls]>, Scope>>
}
```

Added in v1.0.0
