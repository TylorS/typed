---
title: index.ts
nav_order: 9
parent: "@typed/fx"
---

## index overview

Fx<R, E, A> is a representation of an `Effect`-ful workflow that exists over
the time dimension. It operates within a context `R`, can fail with an `E`,
and succeed with an `A`.

Any `Fx`, shorthand for "Effects", can emit 0 or more errors or events over an
indefinite period of time. This is in contrast to `Effect` which can only
produce exactly 1 error or event.

Added in v1.18.0

---

<h2 class="text-delta">Table of contents</h2>

- [exports](#exports)
  - [From "./Computed"](#from-computed)
  - [From "./Filtered"](#from-filtered)
  - [From "./Fx"](#from-fx)
  - [From "./RefArray"](#from-refarray)
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

**Signature**

```ts
export * as Computed from "./Computed"
```

Added in v1.18.0

## From "./Filtered"

[Filtered documentation](https://tylors.github.io/typed/fx/Filtered.ts.html)

**Signature**

```ts
export * as Filtered from "./Filtered"
```

Added in v1.18.0

## From "./Fx"

[Fx documentation](https://tylors.github.io/typed/fx/Fx.ts.html)

**Signature**

```ts
export * from "./Fx"
```

Added in v1.18.0

## From "./RefArray"

[RefArray documentation](https://tylors.github.io/typed/fx/RefArray.ts.html)

**Signature**

```ts
export * as RefArray from "./RefArray"
```

Added in v1.18.0

## From "./RefSubject"

[RefSubject documentation](https://tylors.github.io/typed/fx/RefSubject.ts.html)

**Signature**

```ts
export * as RefSubject from "./RefSubject"
```

Added in v1.18.0

## From "./Sink"

[Sink documentation](https://tylors.github.io/typed/fx/Sink.ts.html)

**Signature**

```ts
export * as Sink from "./Sink"
```

Added in v1.18.0

## From "./Subject"

[Subject documentation](https://tylors.github.io/typed/fx/Subject.ts.html)

**Signature**

```ts
export * as Subject from "./Subject"
```

Added in v1.18.0

## From "./TypeId"

[TypeId documentation](https://tylors.github.io/typed/fx/TypeId.ts.html)

**Signature**

```ts
export * from "./TypeId"
```

Added in v1.18.0

## From "./Typeclass"

[Typeclass documentation](https://tylors.github.io/typed/fx/Typeclass.ts.html)

**Signature**

```ts
export * as Typeclass from "./Typeclass"
```

Added in v1.18.0
