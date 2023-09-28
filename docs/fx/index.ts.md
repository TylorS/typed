---
title: index.ts
nav_order: 12
parent: "@typed/fx"
---

## index overview

Fx<R, E, A> is a representation of an `Effect`-ful workflow that exists over
the time dimension. It operates within a context `R`, can fail with an `E`,
and succeed with an `A`.

Any `Fx`, shorthand for "Effects", can emit 0 or more errors or events over an
indefinite period of time. This is in contrast to `Effect` which can only
produce exactly 1 error or event.

It is defined as a super-type of `Effect`, `Stream`, and `Cause`. This
allows for all operators that accept an `Fx` to also capable of
accepting an `Effect`, `Stream`, or `Cause`. An Effect or Cause represents a single
event or error, while a Stream represents a series of events or errors that will
be pulled from the producer as soon as possible.

Added in v1.18.0

---

<h2 class="text-delta">Table of contents</h2>

- [exports](#exports)
  - [From "./Computed"](#from-computed)
  - [From "./Filtered"](#from-filtered)
  - [From "./Fx"](#from-fx)
  - [From "./RefArray"](#from-refarray)
  - [From "./RefRemoteData"](#from-refremotedata)
  - [From "./RefSubject"](#from-refsubject)
  - [From "./Sink"](#from-sink)
  - [From "./Subject"](#from-subject)
  - [From "./TypeId"](#from-typeid)
  - [From "./Typeclass"](#from-typeclass)

---

# exports

## From "./Computed"

Fx<R, E, A> is a representation of an `Effect`-ful workflow that exists over
the time dimension. It operates within a context `R`, can fail with an `E`,
and succeed with an `A`.

Any `Fx`, shorthand for "Effects", can emit 0 or more errors or events over an
indefinite period of time. This is in contrast to `Effect` which can only
produce exactly 1 error or event.

It is defined as a super-type of `Effect`, `Stream`, and `Cause`. This
allows for all operators that accept an `Fx` to also capable of
accepting an `Effect`, `Stream`, or `Cause`. An Effect or Cause represents a single
event or error, while a Stream represents a series of events or errors that will
be pulled from the producer as soon as possible.

**Signature**

```ts
export * from './Computed'
```

Added in v1.18.0

## From "./Filtered"

Filtered docs: https://tylors.github.io/typed-fp/fx/Filtered.ts.html

**Signature**

```ts
export * from './Filtered'
```

Added in v1.18.0

## From "./Fx"

Fx docs: https://tylors.github.io/typed-fp/fx/Fx.ts.html

**Signature**

```ts
export * from './Fx'
```

Added in v1.18.0

## From "./RefArray"

RefArray docs: https://tylors.github.io/typed-fp/fx/RefArray.ts.html

**Signature**

```ts
export * from './RefArray'
```

Added in v1.18.0

## From "./RefRemoteData"

RefRemoteData docs: https://tylors.github.io/typed-fp/fx/RefRemoteData.ts.html

**Signature**

```ts
export * from './RefRemoteData'
```

Added in v1.18.0

## From "./RefSubject"

RefSubject docs: https://tylors.github.io/typed-fp/fx/RefSubject.ts.html

**Signature**

```ts
export * from './RefSubject'
```

Added in v1.18.0

## From "./Sink"

Sink docs: https://tylors.github.io/typed-fp/fx/Sink.ts.html

**Signature**

```ts
export * from './Sink'
```

Added in v1.18.0

## From "./Subject"

Subject docs: https://tylors.github.io/typed-fp/fx/Subject.ts.html

**Signature**

```ts
export * from './Subject'
```

Added in v1.18.0

## From "./TypeId"

TypeId docs: https://tylors.github.io/typed-fp/fx/TypeId.ts.html

**Signature**

```ts
export * from './TypeId'
```

Added in v1.18.0

## From "./Typeclass"

Typeclass docs: https://tylors.github.io/typed-fp/fx/Typeclass.ts.html

**Signature**

```ts
export * from './Typeclass'
```

Added in v1.18.0
