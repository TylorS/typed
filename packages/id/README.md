# @typed/id

> **Beta:** This package is in beta; APIs may change.

`@typed/id` provides **type-safe ID generation** (Effect-based) for multiple formats: **Cuid**, **Ksuid**, **NanoId**, **Ulid**, **Uuid4**, **Uuid5**, **Uuid7**, plus **DateTimes**, **Ids**, and **RandomValues**. Each typically exposes a branded Schema and an Effect that generates the ID (often requiring a service like `RandomValues` or `CuidState`). Use it when you need typed, reproducible IDs in Effect programs.

## Dependencies

- `effect`

Install both packages in an ESM project:

```sh
pnpm add @typed/id effect
```

`@typed/id` publishes ES modules; use `import` rather than CommonJS `require`.

## Runtime requirements

The default layers target runtimes with the standard Web Crypto and encoding globals:

- `crypto.getRandomValues` supplies entropy for `RandomValues.Default`.
- `crypto.subtle.digest` is used by CUID and UUID v5 generation.
- `TextEncoder` and `BigInt` are used by the string and time encoders.

These globals are available in modern browsers and current Node.js releases. Runtimes without the
encoding or digest globals must install equivalents. Custom `RandomValues` and `DateTimes` services
can replace the default entropy and clock sources, but they do not replace `crypto.subtle.digest`
for CUID or UUID v5 generation.

## API overview

- **Cuid** — Schema + type; `CuidState` service; Effect to generate Cuid.
- **Ksuid** — K-sortable unique IDs.
- **NanoId** — Schema + type + `nanoId` Effect (depends on `RandomValues`).
- **Ulid** — ULID schema and generation.
- **Uuid4**, **Uuid5**, **Uuid7** — UUID variants with Schema and generation.
- **DateTimes** — Date/time helpers used by some ID generators.
- **Ids** — Generic ID helpers.
- **RandomValues** — Service for secure random bytes (used by NanoId, etc.).

## Example

```ts
import { Ids, Uuid5Namespace } from "@typed/id";
import { IdsTest } from "@typed/id/IdsTest";
import * as Effect from "effect/Effect";

const program = Effect.gen(function* () {
  const cuid = yield* Ids.cuid;
  const ksuid = yield* Ids.ksuid;
  const nanoId = yield* Ids.nanoId;
  const ulid = yield* Ids.ulid;
  const uuid4 = yield* Ids.uuid4;
  const uuid5 = yield* Ids.uuid5("https://effect.website", Uuid5Namespace.URL);
  const uuid7 = yield* Ids.uuid7;

  return { cuid, ksuid, nanoId, ulid, uuid4, uuid5, uuid7 };
});

const ids = await Effect.runPromise(Effect.provide(program, Ids.Default));
console.log(ids);
```

Use `IdsTest()` from `@typed/id/IdsTest` instead of `Ids.Default` when the same program needs
deterministic test data.

## Values and serialization

Generated IDs are branded strings: the brand exists only in TypeScript, while runtime equality,
`Map`/`Set` keys, JSON, and structured clone use ordinary string semantics. Store and transmit the
string directly. Deserialization or structured clone does not restore the TypeScript brand;
validate untrusted or persisted strings with the matching exported Schema or `is*` predicate
before treating them as branded values.

| Generator | Serialized output from this package                              |
| --------- | ---------------------------------------------------------------- |
| CUID      | 24 lowercase base36 characters; the first character is a letter. |
| KSUID     | 27 base62 characters.                                            |
| Nano ID   | 21 characters from `0-9a-zA-Z_-`.                                |
| ULID      | 26 uppercase Crockford base32 characters.                        |
| UUID      | Canonical lowercase hyphenated UUID text.                        |

UUID v5 is deterministic for the same UTF-8 name and namespace bytes. The other default
generators incorporate time, entropy, or state and should not be treated as reproducible values.

## Service and seed lifecycle

`Ids.Default` is the usual production layer. It wires the clock, secure randomness, and the
stateful CUID and UUID v7 generators into the `Ids` facade. Build and share that layer at the
application scope where IDs must belong to one sequence; rebuilding a state layer resets its
in-memory counter.

The standalone generators have narrower requirements:

| Generator         | Required services              |
| ----------------- | ------------------------------ |
| `cuid`            | `CuidState`                    |
| `uuid7`           | `Uuid7State`                   |
| `ksuid`, `ulid`   | `DateTimes` and `RandomValues` |
| `nanoId`, `uuid4` | `RandomValues`                 |
| `uuid5`           | None                           |

`RandomValues.Default` uses Web Crypto and is the production entropy source. `RandomValues.Random`
derives bytes from Effect's current `Random` service and is intended for controlled tests or
simulations, not as a cryptographic entropy source. `IdsTest()` supplies fixed internal entropy
and a controllable clock; its output is for repeatable tests, not production IDs. Service state is
process-local and is not a serialization format or a persistence mechanism.

`CuidSeed` and `Uuid7Seed` describe one generation step; they are not serialized IDs or snapshots
of the state service. `CuidState` and `Uuid7State` are themselves Effect-valued services that yield
the next seed. When assembling one manually, construct the service with `Layer.effect` and provide
its clock and entropy dependencies to that layer:

```ts
import { CuidState, DateTimes, RandomValues, cuid } from "@typed/id";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Random from "effect/Random";

const deterministicRandomValues = Layer.effect(
  RandomValues,
  RandomValues.pipe(Effect.provide(RandomValues.Random), Random.withSeed("documentation-example")),
);

const deterministicCuidState = Layer.effect(
  CuidState,
  CuidState.make("documentation-example"),
).pipe(Layer.provide([DateTimes.Fixed(1_700_000_000_000), deterministicRandomValues]));

const id = await Effect.runPromise(Effect.provide(cuid, deterministicCuidState));
```

This provider is deterministic and is therefore test-only. Application code normally uses
`Ids.Default` or `CuidState.Default`.

## API reference

### Ids and IdsTest

Unified service for generating all ID types. Requires `DateTimes`, `RandomValues`, `CuidState`, and `Uuid7State` (use `Ids.Default` or `IdsTest()` to provide them).

| Member               | Type                                                            | Description                                                                                             |
| -------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `Ids.cuid`           | `Effect<Cuid, never, Ids>`                                      | Generate a Cuid.                                                                                        |
| `Ids.ksuid`          | `Effect<Ksuid, IllegalArgumentError, Ids>`                      | Generate a Ksuid; invalid service timestamps fail.                                                      |
| `Ids.nanoId`         | `Effect<NanoId, never, Ids>`                                    | Generate a NanoId.                                                                                      |
| `Ids.ulid`           | `Effect<Ulid, IllegalArgumentError, Ids>`                       | Generate a ULID; invalid service timestamps fail.                                                       |
| `Ids.uuid4`          | `Effect<Uuid4, never, Ids>`                                     | Generate a UUID v4.                                                                                     |
| `Ids.uuid5`          | `(name, namespace) => Effect<Uuid5, IllegalArgumentError, Ids>` | Generate a UUID v5; namespaces not exactly 16 bytes fail. Also has `.dns`, `.url`, `.oid`, and `.x500`. |
| `Ids.uuid7`          | `Effect<Uuid7, IllegalArgumentError, Ids>`                      | Generate a UUID v7; timestamps outside its 48-bit field fail before state mutation.                     |
| `Ids.Default`        | `Layer<Ids \| DateTimes \| RandomValues>`                       | Layer that provides `Ids` with default Cuid/Uuid7/DateTimes/RandomValues.                               |
| `IdsTest(options?)` | `Layer<Ids \| DateTimes \| RandomValues, IllegalArgumentError>` | Reproducible test layer; invalid `currentTime` values fail.                                             |

**IdsTestOptions:**
`{ currentTime?: number | string | Date; envData?: string }`

`IdsTest()` defaults to time `1_400_000_000_000` and uses fixed internal test entropy.

---

### Cuid

| Export              | Type                               | Description                                        |
| ------------------- | ---------------------------------- | -------------------------------------------------- |
| `Cuid`              | `Schema<string, Cuid>`             | Branded schema for 24-character Cuid strings.      |
| `Cuid` (type)       | `string`                           | Branded Cuid type.                                 |
| `isCuid`            | `(value: string) => value is Cuid` | Type guard.                                        |
| `CuidState`         | Service                            | Provides `next: Effect<CuidSeed>`. Used by `cuid`. |
| `CuidState.Default` | `Layer<CuidState>`                 | Default CuidState (uses `"node"` envData).         |
| `cuid`              | `Effect<Cuid, never, CuidState>`   | Generate a Cuid.                                   |

`envData` is a caller-provided discriminator incorporated into CUID generation. It is not a
detected machine fingerprint and does not provide a uniqueness guarantee by itself.

> **Beta migration:** CUID generation now consumes the complete seed with domain-separated,
> unbiased sampling. The 24-character serialized shape is unchanged, but fixed fixtures,
> persisted expected values, and cross-version deterministic snapshots must be updated.

---

### Ksuid

| Export         | Type                                                             | Description                                                              |
| -------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `Ksuid`        | `Schema<string, Ksuid>`                                          | Branded schema for 27-char base62 Ksuids.                                |
| `Ksuid` (type) | `string`                                                         | Branded Ksuid type.                                                      |
| `isKsuid`      | `(value: string) => value is Ksuid`                              | Type guard.                                                              |
| `ksuid`        | `Effect<Ksuid, IllegalArgumentError, DateTimes \| RandomValues>` | Generate a Ksuid; timestamps must fit its unsigned 32-bit seconds field. |

---

### NanoId

| Export          | Type                                  | Description                                  |
| --------------- | ------------------------------------- | -------------------------------------------- |
| `NanoId`        | `Schema<string, NanoId>`              | Branded schema for `[0-9a-zA-Z_-]+` strings. |
| `NanoId` (type) | `string`                              | Branded NanoId type.                         |
| `isNanoId`      | `(value: string) => value is NanoId`  | Type guard.                                  |
| `nanoId`        | `Effect<NanoId, never, RandomValues>` | Generate a 21-char NanoId.                   |

---

### Ulid

| Export        | Type                                                            | Description                                                        |
| ------------- | --------------------------------------------------------------- | ------------------------------------------------------------------ |
| `Ulid`        | `Schema<string, Ulid>`                                          | Branded schema for ULID strings.                                   |
| `Ulid` (type) | `string`                                                        | Branded Ulid type.                                                 |
| `isUlid`      | `(value: string) => value is Ulid`                              | Type guard.                                                        |
| `ulid`        | `Effect<Ulid, IllegalArgumentError, DateTimes \| RandomValues>` | Generate a ULID; timestamps must fit its 48-bit millisecond field. |

---

### Uuid4

| Export         | Type                                 | Description                 |
| -------------- | ------------------------------------ | --------------------------- |
| `Uuid4`        | `Schema<string, Uuid4>`              | Branded schema for UUID v4. |
| `Uuid4` (type) | `string`                             | Branded Uuid4 type.         |
| `isUuid4`      | `(value: string) => value is Uuid4`  | Type guard.                 |
| `uuid4`        | `Effect<Uuid4, never, RandomValues>` | Generate a UUID v4.         |

---

### Uuid5

| Export                                          | Type                                                                  | Description                                                                         |
| ----------------------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `Uuid5`                                         | `Schema<string, Uuid5>`                                               | Branded schema for UUID v5.                                                         |
| `Uuid5` (type)                                  | `string`                                                              | Branded Uuid5 type.                                                                 |
| `Uuid5Namespace`                                | `Uint8Array` (type) + const object                                    | Namespace type; `DNS`, `URL`, `OID`, and `X500` each return a fresh canonical copy. |
| `isUuid5`                                       | `(value: string) => value is Uuid5`                                   | Type guard.                                                                         |
| `uuid5`                                         | `(name, namespace) => Effect<Uuid5, IllegalArgumentError>` or curried | Generate UUID v5; the namespace must contain exactly 16 bytes.                      |
| `dnsUuid5`, `urlUuid5`, `oidUuid5`, `x500Uuid5` | `(name: string) => Effect<Uuid5, IllegalArgumentError>`               | Pre-bound effects for standard namespaces.                                          |

---

### Uuid7

| Export               | Type                                              | Description                                                                |
| -------------------- | ------------------------------------------------- | -------------------------------------------------------------------------- |
| `Uuid7`              | `Schema<string, Uuid7>`                           | Branded schema for UUID v7.                                                |
| `Uuid7` (type)       | `string`                                          | Branded Uuid7 type.                                                        |
| `isUuid7`            | `(value: string) => value is Uuid7`               | Type guard.                                                                |
| `Uuid7State`         | Service                                           | Provides `next: Effect<Uuid7Seed, IllegalArgumentError>`. Used by `uuid7`. |
| `Uuid7State.Default` | `Layer<Uuid7State>`                               | Default Uuid7State.                                                        |
| `uuid7`              | `Effect<Uuid7, IllegalArgumentError, Uuid7State>` | Generate a UUID v7; invalid or exhausted timestamps fail.                  |

---

### DateTimes

| Export                      | Type                                     | Description                                                           |
| --------------------------- | ---------------------------------------- | --------------------------------------------------------------------- |
| `DateTimes`                 | Service                                  | Provides `now: Effect<number>`, `date: Effect<Date>`.                 |
| `DateTimes.now`             | `Effect<number, never, DateTimes>`       | Current time in ms.                                                   |
| `DateTimes.date`            | `Effect<Date, never, DateTimes>`         | Current date.                                                         |
| `DateTimes.Default`         | `Layer<DateTimes>`                       | Real clock.                                                           |
| `DateTimes.Fixed(baseDate)` | `Layer<DateTimes, IllegalArgumentError>` | Fixed time for tests; invalid `number \| string \| Date` inputs fail. |

---

### RandomValues

| Export                      | Type                                                               | Description                               |
| --------------------------- | ------------------------------------------------------------------ | ----------------------------------------- |
| `RandomValues`              | Service                                                            | Provides exact-length random bytes.       |
| `RandomValues.call(length)` | `Effect<Uint8Array & { readonly length: N }, never, RandomValues>` | Request exactly `N` random bytes.         |
| `RandomValues.Default`      | `Layer<RandomValues>`                                              | Uses `crypto.getRandomValues`.            |
| `RandomValues.Random`       | `Layer<RandomValues>`                                              | Uses the current Effect `Random` service. |
