# @typed/async-data

> **Beta:** This package is in beta; APIs may change.

`@typed/async-data` provides a typed model for async data state: **NoData**, **Loading**, **Success**, **Failure**, and **Optimistic** (plus **Refreshing** as Success/Failure with progress). It integrates with Effect Schema for codecs and offers pattern matching and transformers (map, flatMap, mapError). Use it for UI state that represents remote data, loading indicators, and optimistic updates.

## Dependencies

- `effect`

## API overview

- **Type:** `AsyncData<A, E>` — union of NoData | Loading | Success\<A\> | Failure\<E\> | Optimistic\<A, E\>.
- **Schema:** `AsyncData(A, E)` — builds an Effect Schema codec for `AsyncData` given value and error schemas.
- **Constructors:** `NoData`, `loading(progress?)`, `success(value, progress?)`, `failure(cause, progress?)`, `optimistic(previous, value)`.
- **Guards:** `isNoData`, `isLoading`, `isSuccess`, `isFailure`, `isOptimistic`, `isPending`, `isRefreshing`, `isAsyncData`.
- **Pattern matching:** `match(data, { NoData, Loading, Success, Failure, Optimistic })`.
- **Helpers:** `startLoading`, `stopLoading`; `getSuccess`, `getCause`, `getError`.
- **Transformers:** `map`, `flatMap`, `mapError`; `fromExit`, `fromResult`.

## API reference

### Types

- **`Progress`** — `{ readonly loaded: number; readonly total?: number }`. Used for loading/refresh progress.
- **`NoData`** — `{ readonly _tag: "NoData" }`. Initial state before any load.
- **`Loading`** — `{ readonly _tag: "Loading"; readonly progress?: Progress }`. Load in progress.
- **`Success<A>`** — `{ readonly _tag: "Success"; readonly value: A; readonly progress?: Progress }`. Loaded value; optional progress when refreshing.
- **`Failure<E>`** — `{ readonly _tag: "Failure"; readonly cause: Cause.Cause<E>; readonly progress?: Progress }`. Error state; optional progress when refreshing.
- **`Optimistic<A, E>`** — `{ readonly _tag: "Optimistic"; readonly value: A; readonly previous: AsyncData<A, E> }`. Optimistic value with previous state.
- **`AsyncData<A, E>`** — `NoData | Loading | Success<A> | Failure<E> | Optimistic<A, E>`.
- **`Refreshing<A, E>`** — `(Success<A> | Failure<E>) & { readonly progress: Progress }`. Success or Failure that is currently refreshing.

### Schema

```ts
AsyncData(A, E): Schema.Codec<AsyncData<A, E>, ...>
```

Builds an Effect Schema codec for `AsyncData` given value schema `A` and error schema `E`.

`Failure.cause` uses the full Effect `Cause` model. Its encoded form is an ordered JSON array of
`Fail`, `Die`, and `Interrupt` reasons; defects are normalized with `Schema.Defect()`. For example,
`failure(Cause.fail("offline"))` encodes its cause as
`[{ _tag: "Fail", error: "offline" }]` and decodes back to a `Cause.Cause<string>`.

Progress codecs accept finite numbers, including negative and fractional values. They reject
`NaN`, `Infinity`, and `-Infinity` without imposing count or percentage semantics.

### Constructors

```ts
NoData: NoData
loading(progress?: Progress): Loading
success<A>(value: A, progress?: Progress): Success<A>
failure<E>(cause: Cause.Cause<E>, progress?: Progress): Failure<E>
optimistic<A, E>(previous: AsyncData<A, E>, value: A): Optimistic<A, E>
```

### Guards

```ts
isNoData<A, E>(asyncData: AsyncData<A, E>): asyncData is NoData
isLoading<A, E>(asyncData: AsyncData<A, E>): asyncData is Loading
isSuccess<A, E>(asyncData: AsyncData<A, E>): asyncData is Success<A>
isFailure<A, E>(asyncData: AsyncData<A, E>): asyncData is Failure<E>
isOptimistic<A, E>(asyncData: AsyncData<A, E>): asyncData is Optimistic<A, E>
isAsyncData<A, E>(u: unknown): u is AsyncData<A, E>
isRefreshing<A, E>(asyncData: AsyncData<A, E>): asyncData is Refreshing<A, E>
isPending<A, E>(asyncData: AsyncData<A, E>): asyncData is Loading | Refreshing<A, E>
```

### Pattern matching

```ts
const label = AsyncData.match(AsyncData.success(1), {
  NoData: () => "no data",
  Loading: () => "loading",
  Failure: () => "failure",
  Success: (value) => `success: ${value}`,
  Optimistic: (value) => `optimistic: ${value}`,
});
```

Returns a unified result type from the matching branch. Callbacks receive the variant payload (and full variant for `Failure`/`Success`/`Optimistic`).

### Helpers

```ts
startLoading<A, E>(data: AsyncData<A, E>, progress?: Progress): AsyncData<A, E>
```

Puts data into a loading/refreshing state: Success/Failure become refreshing with optional progress; Optimistic recurs on `previous`; NoData/Loading become Loading (with optional progress).

```ts
stopLoading<A, E>(data: AsyncData<A, E>): AsyncData<A, E>
```

Removes progress from Success/Failure/Optimistic (stops refreshing); NoData/Loading unchanged.

```ts
getSuccess<A, E>(data: AsyncData<A, E>): Option.Option<A>
getCause<A, E>(data: AsyncData<A, E>): Option.Option<Cause.Cause<E>>
getError<A, E>(data: AsyncData<A, E>): Option.Option<E>
```

Extract the success value, failure cause, or first error from the variant (or `Option.none` when not applicable).

### Transformers

```ts
const mapped = AsyncData.map(AsyncData.success(1), (value) => value + 1);
```

Maps the success/optimistic value; NoData, Loading, and Failure are unchanged.

```ts
const chained = AsyncData.flatMap(AsyncData.success(1), (value) =>
  AsyncData.success(String(value)),
);
```

Chains on success or optimistic; NoData, Loading, and Failure are unchanged.

```ts
import * as Cause from "effect/Cause";

const mappedFailure = AsyncData.mapError(
  AsyncData.failure(Cause.fail("offline")),
  (error) => new Error(error),
);
```

Maps the failure error type; Success, NoData, Loading unchanged; Optimistic recurs on `previous`.

```ts
fromExit<A, E>(exit: Exit.Exit<A, E>): AsyncData<A, E>
fromResult<A, E>(result: Result.Result<A, E>): AsyncData<A, E>
```

Convert an Effect `Exit` or `Result` to `AsyncData`.

## Example

```ts
import { Option } from "effect";
import * as AsyncData from "@typed/async-data";

// Success and match
const data = AsyncData.success({ id: 1, name: "Alice" });
const message = AsyncData.match(data, {
  NoData: () => "no data",
  Loading: () => "loading...",
  Failure: (cause) => `error: ${cause}`,
  Success: (user) => `user: ${user.name}`,
  Optimistic: (user) => `optimistic: ${user.name}`,
});
// message === "user: Alice"

// From Result and getSuccess
const result = { _tag: "Success" as const, success: { id: 2, name: "Bob" } };
const data2 = AsyncData.fromResult(result);
const name = AsyncData.getSuccess(data2).pipe(
  Option.map((u) => u.name),
  Option.getOrElse(() => "unknown"),
);
// name === "Bob"
```
