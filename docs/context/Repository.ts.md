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

- [utils](#utils)
  - [Repository (type alias)](#repository-type-alias)
  - [RepositoryFns (type alias)](#repositoryfns-type-alias)
  - [RepositoryImplement (type alias)](#repositoryimplement-type-alias)
  - [repository](#repository)

---

# utils

## Repository (type alias)

A Repository is a collection of Context.Fns that can be implemented
and utilized in a single place.

**Signature**

```ts
export type Repository<Fns extends AnyFns> = RepositoryFns<Fns> &
  TaggedStruct<Fns> &
  RepositoryImplement<Fns> & {
    readonly functions: Fns
  }
```

Added in v1.0.0

## RepositoryFns (type alias)

Constructs a record of methods from a collection of Fns.

**Signature**

```ts
export type RepositoryFns<Fns extends AnyFns> = {
  readonly [K in keyof Fns]: Fns[K]['apply']
}
```

Added in v1.0.0

## RepositoryImplement (type alias)

A Repository can be implemented with a collection of Fns.

**Signature**

```ts
export type RepositoryImplement<Fns extends AnyFns> = {
  readonly implement: <Impls extends { readonly [K in keyof Fns]: EffectFn.Extendable<Fn.FnOf<Fns[K]>> }>(
    implementations: Impls
  ) => Layer.Layer<EffectFn.Context<Impls[keyof Impls]>, never, Fn.Identifier<Fns[keyof Fns]>>
}
```

Added in v1.0.0

## repository

Create a Repository from a collection of Fns.

**Signature**

```ts
export declare function repository<Fns extends AnyFns>(input: Fns): Repository<Fns>
```

Added in v1.0.0
