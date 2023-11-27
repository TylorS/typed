---
title: Form.ts
nav_order: 4
parent: "@typed/fx"
---

## Form overview

Added in v1.18.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [DerivedFromIO (type alias)](#derivedfromio-type-alias)
  - [Form](#form)
  - [Form (interface)](#form-interface)
  - [Form (namespace)](#form-namespace)
    - [Base (interface)](#base-interface)
    - [Derived (interface)](#derived-interface)
    - [AnyEntries (type alias)](#anyentries-type-alias)
    - [AnyEntry (type alias)](#anyentry-type-alias)
    - [Error (type alias)](#error-type-alias)
    - [Input (type alias)](#input-type-alias)
    - [Output (type alias)](#output-type-alias)
  - [FormEntriesFromIO (type alias)](#formentriesfromio-type-alias)
  - [FormFromIO (type alias)](#formfromio-type-alias)
  - [FormTypeId](#formtypeid)
  - [FormTypeId (type alias)](#formtypeid-type-alias)
  - [MakeForm (type alias)](#makeform-type-alias)
  - [make](#make)

---

# utils

## DerivedFromIO (type alias)

**Signature**

```ts
export type DerivedFromIO<
  R,
  E,
  I extends Readonly<Record<PropertyKey, any>>,
  O extends Readonly<Record<keyof I, any>>
> = Form.Derived<
  R,
  {
    readonly [K in keyof I]-?: FormEntry.FormEntry<E, I[K], O[K]>
  }
>
```

Added in v1.18.0

## Form

**Signature**

```ts
export declare function Form<Entries extends Form.AnyEntries>(entries: Entries): Form<Entries>
```

Added in v1.18.0

## Form (interface)

**Signature**

```ts
export interface Form<Entries extends Form.AnyEntries>
  extends Form.Base<Form.Error<Entries[keyof Entries]>, Form.Input<Entries>, Form.Output<Entries>, Entries> {}
```

Added in v1.18.0

## Form (namespace)

Added in v1.18.0

### Base (interface)

**Signature**

```ts
export interface Base<E, I, O, Entries extends Form.AnyEntries>
  extends Versioned.Versioned<never, never, never, E | ParseError, I, never, E | ParseError, I> {
  readonly [FormTypeId]: FormTypeId

  readonly entries: Entries

  readonly schema: S.Schema<I, O>

  readonly get: <K extends keyof Entries>(key: K) => Entries[K]

  readonly decoded: Computed<never, E | ParseError, O>
}
```

Added in v1.18.0

### Derived (interface)

**Signature**

```ts
export interface Derived<R, Entries extends AnyEntries> extends Form<Entries> {
  readonly persist: Effect.Effect<R, Error<Entries>, Output<Entries>>
}
```

Added in v1.18.0

### AnyEntries (type alias)

**Signature**

```ts
export type AnyEntries = Readonly<Record<PropertyKey, AnyEntry>>
```

Added in v1.18.0

### AnyEntry (type alias)

**Signature**

```ts
export type AnyEntry =
  | FormEntry.FormEntry<any, any, any>
  | FormEntry.FormEntry<never, any, any>
  | FormEntry.FormEntry<any, never, any>
  | FormEntry.FormEntry<never, never, any>
  | Base<any, any, any, any>
```

Added in v1.18.0

### Error (type alias)

**Signature**

```ts
export type Error<T> = [T] extends [FormEntry.FormEntry<infer E, infer _I, infer _>]
  ? E
  : [T] extends [Base<infer _E, infer _I, infer _O, infer _Entries>]
    ? _E
    : never
```

Added in v1.18.0

### Input (type alias)

**Signature**

```ts
export type Input<T> = [T] extends [FormEntry.FormEntry<infer _E, infer I, infer _>]
  ? I
  : T extends Form<infer Entries>
    ? {
        readonly [K in keyof Entries]: Input<Entries[K]>
      }
    : T extends AnyEntries
      ? {
          readonly [K in keyof T]: Input<T[K]>
        }
      : never
```

Added in v1.18.0

### Output (type alias)

**Signature**

```ts
export type Output<T> = [T] extends [FormEntry.FormEntry<infer _E, infer _I, infer O>]
  ? O
  : T extends Form<infer Entries>
    ? {
        readonly [K in keyof Entries]: Output<Entries[K]>
      }
    : T extends AnyEntries
      ? {
          readonly [K in keyof T]: Output<T[K]>
        }
      : never
```

Added in v1.18.0

## FormEntriesFromIO (type alias)

**Signature**

```ts
export type FormEntriesFromIO<E, I extends AnyObject, O extends AnyObjectWithKeys<keyof I>> = {
  readonly [K in keyof I]-?: [I[K], O[K]] extends [AnyObject, AnyObjectWithKeys<keyof I[K]>]
    ? Form<[FormEntriesFromIO<E, I[K], O[K]>] extends [infer R] ? { readonly [K in keyof R]: R[K] } : never>
    : FormEntry.FormEntry<E, I[K], O[K]>
}
```

Added in v1.18.0

## FormFromIO (type alias)

**Signature**

```ts
export type FormFromIO<E, I extends AnyObject, O extends AnyObjectWithKeys<keyof I>> = Form<
  [FormEntriesFromIO<E, I, O>] extends [infer R] ? { readonly [K in keyof R]: R[K] } : never
>
```

Added in v1.18.0

## FormTypeId

**Signature**

```ts
export declare const FormTypeId: typeof FormTypeId
```

Added in v1.18.0

## FormTypeId (type alias)

**Signature**

```ts
export type FormTypeId = typeof FormTypeId
```

Added in v1.18.0

## MakeForm (type alias)

**Signature**

```ts
export type MakeForm<I extends AnyObject, O extends AnyObjectWithKeys<keyof I>> = {
  <R, E>(
    fx: RefSubject<R, E, O>
  ): Effect.Effect<
    R | Scope.Scope,
    never,
    [DerivedFromIO<R, E, I, O>] extends [Form.Derived<infer R, infer R2>] ? Form.Derived<R, R2> : never
  >

  <R, E>(
    fx: Fx<R, E, O>
  ): Effect.Effect<R | Scope.Scope, never, [FormFromIO<E, I, O>] extends [Form<infer R>] ? Form<R> : never>

  <R, E>(
    effect: Effect.Effect<R, E, O>
  ): Effect.Effect<R, never, [FormFromIO<E, I, O>] extends [Form<infer R>] ? Form<R> : never>
}
```

Added in v1.18.0

## make

**Signature**

```ts
export declare function make<
  I extends Partial<Readonly<Record<PropertyKey, any>>>,
  O extends Partial<AnyObjectWithKeys<keyof I>>
>(schema: S.Schema<I, O>): MakeForm<I, O>
```

Added in v1.18.0
