---
title: Form.ts
nav_order: 3
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
    - [Context (type alias)](#context-type-alias)
    - [Error (type alias)](#error-type-alias)
    - [Input (type alias)](#input-type-alias)
    - [Output (type alias)](#output-type-alias)
  - [FormEntriesFromIO (type alias)](#formentriesfromio-type-alias)
  - [FormFromIO (type alias)](#formfromio-type-alias)
  - [FormTypeId](#formtypeid)
  - [FormTypeId (type alias)](#formtypeid-type-alias)
  - [MakeForm (type alias)](#makeform-type-alias)
  - [MakeInputForm (type alias)](#makeinputform-type-alias)
  - [derive](#derive)
  - [deriveInput](#deriveinput)

---

# utils

## DerivedFromIO (type alias)

**Signature**

```ts
export type DerivedFromIO<
  R,
  R2,
  E,
  I extends Readonly<Record<PropertyKey, any>>,
  O extends Readonly<Record<keyof I, any>>
> = Form.Derived<
  R,
  R2,
  {
    readonly [K in keyof I]-?: FormEntry.FormEntry<never, E, I[K], O[K]>
  }
>
```

Added in v1.18.0

## Form

**Signature**

```ts
export declare function Form<Entries extends Form.AnyEntries>(entries: Entries): Form<Form.Context<Entries>, Entries>
```

Added in v1.18.0

## Form (interface)

**Signature**

```ts
export interface Form<out R, in out Entries extends Form.AnyEntries>
  extends Form.Base<
    R | Form.Context<Entries>,
    Form.Error<Entries>,
    Form.Input<Entries>,
    Form.Output<Entries>,
    Entries
  > {}
```

Added in v1.18.0

## Form (namespace)

Added in v1.18.0

### Base (interface)

**Signature**

```ts
export interface Base<out R, out E, in out I, in out O, in out Entries extends Form.AnyEntries>
  extends Versioned.Versioned<R, never, R | Scope.Scope, E | ParseError, I, R, E | ParseError, I> {
  readonly [FormTypeId]: FormTypeId

  readonly entries: Entries

  readonly schema: S.Schema<O, I, R>

  readonly get: <K extends keyof Entries>(key: K) => Entries[K]

  readonly decoded: RefSubject.Computed<R, E | ParseError, O>
}
```

Added in v1.18.0

### Derived (interface)

**Signature**

```ts
export interface Derived<R, R2, Entries extends AnyEntries> extends Form<R, Entries> {
  readonly persist: Effect.Effect<Output<Entries>, Error<Entries>, R2>
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
  | FormEntry.FormEntry<any, any, any, any>
  | FormEntry.FormEntry<any, never, any, any>
  | FormEntry.FormEntry<any, any, never, any>
  | FormEntry.FormEntry<any, never, never, any>
  | Base<any, any, any, any, any>
  | Base<any, never, any, any, any>
  | Base<any, any, never, any, any>
  | Base<any, never, never, any, any>
```

Added in v1.18.0

### Context (type alias)

**Signature**

```ts
export type Context<T> = [T] extends [FormEntry.FormEntry<infer R, infer _E, infer _I, infer _>]
  ? R
  : [T] extends [Base<infer _R, infer _E, infer _I, infer _O, infer _Entries>]
    ? _R | Context<_Entries[keyof _Entries]>
    : never
```

Added in v1.20.0

### Error (type alias)

**Signature**

```ts
export type Error<T> = [T] extends [FormEntry.FormEntry<infer _R, infer E, infer _I, infer _>]
  ? E
  : [T] extends [Base<infer _R, infer _E, infer _I, infer _O, infer _Entries>]
    ? _E
    : never
```

Added in v1.18.0

### Input (type alias)

**Signature**

```ts
export type Input<T> = [T] extends [FormEntry.FormEntry<infer _R, infer _E, infer I, infer _>]
  ? I
  : T extends Form<infer _R, infer Entries>
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
export type Output<T> = [T] extends [FormEntry.FormEntry<infer _R, infer _E, infer _I, infer O>]
  ? O
  : T extends Form<infer _R, infer Entries>
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
    ? Form<never, [FormEntriesFromIO<E, I[K], O[K]>] extends [infer R] ? { readonly [K in keyof R]: R[K] } : never>
    : FormEntry.FormEntry<never, E, I[K], O[K]>
}
```

Added in v1.18.0

## FormFromIO (type alias)

**Signature**

```ts
export type FormFromIO<R, E, I extends AnyObject, O extends AnyObjectWithKeys<keyof I>> = Form<
  R,
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
export type MakeForm<R0, I extends AnyObject, O extends AnyObjectWithKeys<keyof I>> = {
  <R, E>(
    fx: RefSubject.RefSubject<R, E, O>
  ): Effect.Effect<
    [DerivedFromIO<R, never, E, I, O>] extends [Form.Derived<infer R, never, infer R2>]
      ? Form.Derived<R, never, R2>
      : never,
    never,
    R | Scope.Scope
  >

  <R, E>(
    fx: Fx<R, E, O> | Effect.Effect<O, E, R>
  ): Effect.Effect<
    [FormFromIO<R0, E, I, O>] extends [Form<infer R1, infer R2>] ? Form<R1, R2> : never,
    never,
    R | Scope.Scope
  >
}
```

Added in v1.18.0

## MakeInputForm (type alias)

**Signature**

```ts
export type MakeInputForm<R0, I extends AnyObject, O extends AnyObjectWithKeys<keyof I>> = {
  <R, E>(
    fx: RefSubject.RefSubject<R, E, I>
  ): Effect.Effect<
    [DerivedFromIO<R0 | R, never, E, I, O>] extends [Form.Derived<infer R, infer _, infer R2>]
      ? Form.Derived<R, _, R2>
      : never,
    never,
    R | Scope.Scope
  >

  <R, E>(
    fx: Fx<R, E, I> | Effect.Effect<I, E, R>
  ): Effect.Effect<
    [FormFromIO<R0, E, I, O>] extends [Form<infer R1, infer R2>] ? Form<R1, R2> : never,
    never,
    R | Scope.Scope
  >
}
```

Added in v1.20.0

## derive

**Signature**

```ts
export declare function derive<
  R0,
  I extends Partial<Readonly<Record<PropertyKey, any>>>,
  O extends Partial<{ readonly [K in keyof I]: any }>
>(schema: S.Schema<O, I, R0>): MakeForm<R0, I, O>
```

Added in v1.20.0

## deriveInput

**Signature**

```ts
export declare function deriveInput<
  R0,
  I extends Partial<Readonly<Record<PropertyKey, any>>>,
  O extends Partial<AnyObjectWithKeys<keyof I>>
>(schema: S.Schema<O, I, R0>): MakeInputForm<R0, I, O>
```

Added in v1.18.0
