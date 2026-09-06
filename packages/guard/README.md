# @typed/guard

> **Beta:** This package is in beta; APIs may change between beta releases. Review the
> [repository releases](https://github.com/TylorS/typed/releases) before upgrading.

`@typed/guard` provides **Effect-based guards**: functions that take an input and produce `Effect<Option<O>, E, R>`. Guards can be composed with `pipe`, `map`, `filter`, `bind`, and integrated with Effect Schema (`fromSchemaDecode` / `fromSchemaEncode`, `decode` / `encode`). Use them for validation, parsing, and route matching when you want a composable “maybe this input becomes this output” with effects.

## Dependencies

- `effect`

## Outcome model

A guard returns `Effect.Effect<Option.Option<O>, E, R>`. Its three outcomes are distinct:

- `Some(output)` means the input matched and produced `output`.
- `None` means the input did not match. It is a successful Effect, so recovery combinators do not run.
- An Effect failure means evaluation failed in the typed `E` channel. Defects and interruption remain in the Effect cause.

Guard combinators preserve this distinction. Sequential composition stops on `None`, propagates failures, and runs the next guard only for `Some`.

## API overview

- **Type:** `Guard<I, O, E, R>` — `(input: I) => Effect.Effect<Option.Option<O>, E, R>`; `GuardInput` = Guard | AsGuard.
- **Composition:** `getGuard`, `pipe` (chain guards), `map`, `mapEffect`, `filter`, `filterMap`, `tap`.
- **Building:** `liftPredicate` (from predicate); `any(guards)` for tagged unions.
- **Schema:** `fromSchemaDecode(schema)`, `fromSchemaEncode(schema)`; `decode(guard, schema)`, `encode(guard, schema)`.
- **Effects:** `provide`, `provideService`, `provideServiceEffect`; `catchAll`, `catchTag`, `catchCause`.
- **Struct helpers:** `addTag`, `bindTo`, `bind`, `let`.

## API Reference

### Types

- **`Guard<I, O, E, R>`** — Core guard type: `(input: I) => Effect.Effect<Option.Option<O>, E, R>`.
- **`Guard.Input<T>`**, **`Guard.Output<T>`**, **`Guard.Error<T>`**, **`Guard.Services<T>`** — Type-level extractors for a guard or `AsGuard` type.
- **`AsGuard<I, O, E, R>`** — Interface with `asGuard(): Guard<I, O, E, R>` for types that can be used as guards.
- **`GuardInput<I, O, E, R>`** — Union `Guard<I, O, E, R> | AsGuard<I, O, E, R>`; accepted wherever a guard is expected.
- **`AnyInput<GS>`**, **`AnyOutput<GS>`** — Input and output types for `any(guards)`; `AnyOutput<GS>` is a tagged union `{ _tag: K; value: Guard.Output<GS[K]> }`.

### Core

- **`getGuard(guard)`** — Normalizes a `GuardInput` to a `Guard`. Functions are always used directly. An `AsGuard` object must have an own callable `asGuard` property, and `asGuard()` must return a function; invalid adapters throw `TypeError` during normalization.

Class adapters must define `asGuard` as an own arrow field, such as `readonly asGuard = () => guard`. A prototype method is not a runtime adapter; use an own arrow field or a plain `{ asGuard: () => guard }` wrapper.

### Composition

- **`pipe(input, output)`** — Chains two guards; the second runs on the first’s output when the first succeeds. Signature: `(input, output) => Guard<I, B, E | E2, R | R2>`.
- **`map(guard, f)`** — Maps the guard’s output with a pure function. Dual (data-first / data-last).
- **`mapEffect(guard, f)`** — Maps the guard’s output with an Effect. Dual.
- **`filter(guard, predicate)`** — Keeps only outputs that satisfy the predicate (type refinement or boolean). Dual.
- **`filterMap(guard, f)`** — Transforms output to `Option<B>`; `None` means no match. Dual.
- **`tap(guard, f)`** — Runs a side effect (or Effect) on the output and passes the original output through. Dual.

### Building

- **`liftPredicate(predicate)`** — Builds a guard from a predicate. With a refinement `(a: A) => a is B`, output is narrowed to `B`; otherwise `Guard<A, A>`.

The predicate is deferred until the returned Effect runs. If it throws, the exception is an Effect defect rather than a typed error. Use an effectful `Guard` when failure belongs in the `E` channel.

```ts
liftPredicate<A, B extends A>(predicate: (a: A) => a is B): Guard<A, B>;
liftPredicate<A>(predicate: (a: A) => boolean): Guard<A, A>;
```

- **`any(guards)`** — Takes an object of named guards and returns a guard whose input is the intersection of all guard inputs and whose output is the tagged union `{ _tag: key; value: output }`. Tries each guard in order and returns the first match.

`any` snapshots own enumerable string and symbol keys when it is called. Inherited and non-enumerable properties are ignored. ECMAScript own-key order applies: integer-index strings in ascending order, other strings in insertion order, then symbols in insertion order. Candidate Effects run sequentially and evaluation stops after the first `Some`.

### Schema

- **`fromSchemaDecode(schema)`** — Builds a guard from an Effect Schema: input is the schema’s encoded type, output is the schema’s type. Uses `Schema.decodeEffect`.
- **`fromSchemaEncode(schema)`** — Builds a guard from an Effect Schema: input is the schema’s type, output is the encoded type. Uses `Schema.encodeEffect`.
- **`decode(guard, schema)`** — Composes the guard with schema decoding (pipe with `fromSchemaDecode(schema)`). Dual.
- **`encode(guard, schema)`** — Composes the guard with schema encoding (pipe with `fromSchemaEncode(schema)`). Dual.

### Effect integration

- **`provide(guard, provided)`** — Provides a `Context` or `Layer` to the guard’s environment.
- **`provideService(guard, tag, service)`** — Provides a single service to the guard’s environment.
- **`provideServiceEffect(guard, tag, effect)`** — Provides a service via an Effect to the guard’s environment.
- **`catchAll(guard, f)`** — Recovers from any error by running `f` and treating its result as a successful match. Alias: **`catch`**.
- **`catchTag(guard, tag, f)`** — Recovers from a specific tagged error.
- **`catchCause(guard, f)`** — Recovers from the full `Cause` of the guard’s failure.

### Struct helpers

- **`addTag(guard, value)`** — Adds a readonly `_tag` property to an object output that does not already have one. Dual.
- **`bindTo(guard, key)`** — Wraps any guard output in an object under the given key: `{ [key]: O }`. Dual. Use this to enter the record-building workflow from a primitive, array, or class instance.
- **`bind(guard, key, f)`** — Runs a second guard on the first’s object output and adds the result under a new `key`. Dual.
- **`let(guard, key, value)`** — Adds a fixed property under a new key to an object output. Dual.

`let`, `addTag`, and `bind` require object outputs and reject statically known key collisions. They use object spread and produce a new plain object. They copy own enumerable string and symbol properties; they do not preserve prototypes, inherited properties, or non-enumerable properties. Enumerable getters and proxy traps may run during the copy. Use `bindTo` to enter this record-building workflow from a primitive output.

## Example

The [basic example](./examples/basic.ts) is runnable and checked by `test:types`.

```ts
import { Effect, Option } from "effect";
import * as Guard from "@typed/guard";
import * as Schema from "effect/Schema";

const Positive = Schema.Finite.check(Schema.isGreaterThan(0));
const positive = Guard.fromSchemaDecode(Positive);

const program = positive(42).pipe(
  Effect.map(
    Option.match({
      onNone: () => "not a positive number",
      onSome: (n) => `ok: ${n}`,
    }),
  ),
);

const result = await Effect.runPromise(program);
console.log(result); // "ok: 42"

const even = Guard.liftPredicate((n: number) => n % 2 === 0);
const positiveEven = Guard.pipe(positive, even);
```
