import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import { dual } from "effect/Function";
import * as Layer from "effect/Layer";
import * as Context from "effect/Context";
import type { Cuid } from "./Cuid.js";
import { cuid, CuidState } from "./Cuid.js";
import { DateTimes } from "./DateTimes.js";
import type { Ksuid } from "./Ksuid.js";
import { ksuid } from "./Ksuid.js";
import type { NanoId } from "./NanoId.js";
import { nanoId } from "./NanoId.js";
import { RandomValues } from "./RandomValues.js";
import type { Ulid } from "./Ulid.js";
import { ulid } from "./Ulid.js";
import type { Uuid4 } from "./Uuid4.js";
import { uuid4 } from "./Uuid4.js";
import { type Uuid5, uuid5, Uuid5Namespace } from "./Uuid5.js";
import type { Uuid7 } from "./Uuid7.js";
import { uuid7, Uuid7State } from "./Uuid7.js";
import { makeLazyIds } from "./internal/Ids.js";

/**
 * Unified Effect service for every Typed ID generator.
 * @remarks
 * ## Why
 * One facade captures time, entropy, and state services once, so application code composes generators through a single explicit dependency without hiding their behavior.
 * ## Ownership and lifetime
 * Each Ids Layer owns its captured services plus lazy CUID and UUIDv7 state. Recreating the Layer resets process-local sequences; serialize server IDs when identity must survive hydration.
 * @example
 * ```ts
 * import { Ids } from "@typed/id/Ids"
 * import { Effect } from "effect"
 * const program = Effect.gen(function* () { return yield* Ids.uuid7 }).pipe(Effect.provide(Ids.Default))
 * ```
 * See [Effect services](https://effect.website/docs/requirements-management/services/) and [Layers](https://effect.website/docs/requirements-management/layers/).
 * @category Services
 * @since 1.0.0
 */
export class Ids extends Context.Service<Ids>()("@typed/id/Ids", {
  make: Effect.gen(function* () {
    const services = yield* Effect.context<DateTimes | RandomValues | CuidState | Uuid7State>();

    const uuid5_: {
      (
        namespace: Uuid5Namespace,
      ): (name: string) => Effect.Effect<Uuid5, Cause.IllegalArgumentError>;
      (name: string, namespace: Uuid5Namespace): Effect.Effect<Uuid5, Cause.IllegalArgumentError>;
      readonly dns: (name: string) => Effect.Effect<Uuid5, Cause.IllegalArgumentError>;
      readonly url: (name: string) => Effect.Effect<Uuid5, Cause.IllegalArgumentError>;
      readonly oid: (name: string) => Effect.Effect<Uuid5, Cause.IllegalArgumentError>;
      readonly x500: (name: string) => Effect.Effect<Uuid5, Cause.IllegalArgumentError>;
    } = Object.assign(
      dual(2, (name: string, namespace: Uuid5Namespace) =>
        Effect.provide(uuid5(name, namespace), services),
      ),
      {
        dns: uuid5(Uuid5Namespace.DNS),
        url: uuid5(Uuid5Namespace.URL),
        oid: uuid5(Uuid5Namespace.OID),
        x500: uuid5(Uuid5Namespace.X500),
      },
    );

    return {
      cuid: Effect.provide(cuid, services),
      ksuid: Effect.provide(ksuid, services),
      nanoId: Effect.provide(nanoId, services),
      ulid: Effect.provide(ulid, services),
      uuid4: Effect.provide(uuid4, services),
      uuid5: uuid5_,
      uuid7: Effect.provide(uuid7, services),
    };
  }),
}) {
  /**
   * Generates a CUID using the current Ids service.
   * @remarks
   * ## Why
   * The facade shares the Ids-owned CuidState instead of allocating a new sequence for every call.
   * ## Ownership and lifetime
   * This Effect acquires no resources and uses state owned by the provided Ids Layer.
   * @category ID generation
   * @since 1.0.0
   */
  static readonly cuid: Effect.Effect<Cuid, never, Ids> = Effect.flatMap(Ids, ({ cuid }) => cuid);

  /**
   * Generates a KSUID using the current Ids service.
   * @remarks
   * ## Why
   * The facade reuses captured time and entropy while retaining `IllegalArgumentError` for invalid KSUID timestamps.
   * ## Ownership and lifetime
   * This Effect acquires no persistent resource and uses services owned by the provided Ids Layer.
   * @category ID generation
   * @since 1.0.0
   */
  static readonly ksuid: Effect.Effect<Ksuid, Cause.IllegalArgumentError, Ids> = Effect.flatMap(
    Ids,
    ({ ksuid }) => ksuid,
  );

  /**
   * Generates a NanoId using the current Ids service.
   * @remarks
   * ## Why
   * The facade makes the selected entropy implementation available through one application dependency.
   * ## Ownership and lifetime
   * This Effect acquires no persistent resource and uses entropy owned by the provided Ids Layer.
   * @category ID generation
   * @since 1.0.0
   */
  static readonly nanoId: Effect.Effect<NanoId, never, Ids> = Effect.flatMap(
    Ids,
    ({ nanoId }) => nanoId,
  );

  /**
   * Generates a ULID using the current Ids service.
   * @remarks
   * ## Why
   * The facade reuses captured time and entropy while retaining `IllegalArgumentError` for invalid 48-bit timestamps.
   * ## Ownership and lifetime
   * This Effect acquires no persistent resource and uses services owned by the provided Ids Layer.
   * @category ID generation
   * @since 1.0.0
   */
  static readonly ulid: Effect.Effect<Ulid, Cause.IllegalArgumentError, Ids> = Effect.flatMap(
    Ids,
    ({ ulid }) => ulid,
  );

  /**
   * Generates a random UUID version 4 using the current Ids service.
   * @remarks
   * ## Why
   * The facade keeps entropy selection replaceable while preserving UUID version and variant semantics.
   * ## Ownership and lifetime
   * This Effect acquires no persistent resource and uses entropy owned by the provided Ids Layer.
   * @category ID generation
   * @since 1.0.0
   */
  static readonly uuid4: Effect.Effect<Uuid4, never, Ids> = Effect.flatMap(
    Ids,
    ({ uuid4 }) => uuid4,
  );

  /**
   * Derives deterministic UUID version 5 values through the current Ids service, with DNS, URL, OID, and X.500 helpers.
   * @remarks
   * ## Why
   * The facade supports data-first and namespace-first calls while keeping namespace choice and `IllegalArgumentError` explicit.
   * ## Ownership and lifetime
   * Each Effect acquires no persistent resources and reads the Ids service for one invocation; helper namespaces are stable captured copies.
   * @example
   * ```ts
   * import { Ids } from "@typed/id/Ids"
   * import { Effect } from "effect"
   * const program = Ids.uuid5.dns("example.com").pipe(Effect.provide(Ids.Default))
   * ```
   * @category ID generation
   * @since 1.0.0
   */
  static readonly uuid5: {
    /** Binds a namespace first, then derives UUIDv5 values for names. @since 1.0.0 */
    (
      namespace: Uuid5Namespace,
    ): (name: string) => Effect.Effect<Uuid5, Cause.IllegalArgumentError, Ids>;
    /** Derives a UUIDv5 from a name and namespace through the current Ids service. @since 1.0.0 */
    (
      name: string,
      namespace: Uuid5Namespace,
    ): Effect.Effect<Uuid5, Cause.IllegalArgumentError, Ids>;
    /** Derives a UUIDv5 in the standard DNS namespace. @since 1.0.0 */
    readonly dns: (name: string) => Effect.Effect<Uuid5, Cause.IllegalArgumentError, Ids>;
    /** Derives a UUIDv5 in the standard URL namespace. @since 1.0.0 */
    readonly url: (name: string) => Effect.Effect<Uuid5, Cause.IllegalArgumentError, Ids>;
    /** Derives a UUIDv5 in the standard OID namespace. @since 1.0.0 */
    readonly oid: (name: string) => Effect.Effect<Uuid5, Cause.IllegalArgumentError, Ids>;
    /** Derives a UUIDv5 in the standard X.500 namespace. @since 1.0.0 */
    readonly x500: (name: string) => Effect.Effect<Uuid5, Cause.IllegalArgumentError, Ids>;
  } = Object.assign(
    dual(2, (name: string, namespace: Uuid5Namespace) =>
      Effect.flatMap(Ids, ({ uuid5 }) => uuid5(name, namespace)),
    ),
    {
      dns: (name: string) => Effect.flatMap(Ids, ({ uuid5 }) => uuid5.dns(name)),
      url: (name: string) => Effect.flatMap(Ids, ({ uuid5 }) => uuid5.url(name)),
      oid: (name: string) => Effect.flatMap(Ids, ({ uuid5 }) => uuid5.oid(name)),
      x500: (name: string) => Effect.flatMap(Ids, ({ uuid5 }) => uuid5.x500(name)),
    },
  );
  /**
   * Generates a UUID version 7 using the current Ids service.
   * @remarks
   * ## Why
   * The facade shares one lazy Uuid7State per Ids Layer, preserving local monotonicity and typed timestamp errors.
   * ## Ownership and lifetime
   * This Effect acquires no resources and uses sequence state owned by the provided Ids Layer.
   * @category ID generation
   * @since 1.0.0
   */
  static readonly uuid7: Effect.Effect<Uuid7, Cause.IllegalArgumentError, Ids> = Effect.flatMap(
    Ids,
    ({ uuid7 }) => uuid7,
  );

  /**
   * Provides production Ids, DateTimes, and RandomValues services.
   * @remarks
   * ## Why
   * The standard Layer uses system time and Web Crypto while lazily creating sequence state only when CUID or UUIDv7 is first requested.
   * ## Ownership and lifetime
   * The surrounding Layer Scope owns captured services and lazy sequence state; Web Crypto must exist in the runtime.
   * @category Production layers
   * @since 1.0.0
   */
  static readonly Default: Layer.Layer<Ids | DateTimes | RandomValues, never, never> = Layer.effect(
    Ids,
    makeLazyIds("node"),
  ).pipe(Layer.provideMerge([DateTimes.Default, RandomValues.Default]));
}
