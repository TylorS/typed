import * as Cause from "effect/Cause";
import * as Deferred from "effect/Deferred";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import type * as Scope from "effect/Scope";
import * as Stream from "effect/Stream";
import type * as Fx from "../Fx/index.js";
import { continueWith as fxContinueWith } from "../Fx/combinators/continueWith.js";
import { unwrap as fxUnwrap } from "../Fx/combinators/unwrap.js";
import { fromEffect as fxFromEffect } from "../Fx/constructors/fromEffect.js";
import { isFx } from "../Fx/TypeId.js";
import { fromStream as fxFromStream } from "../Fx/stream.js";
import * as Sink from "../Sink/Sink.js";
import {
  CurrentComputedBehavior,
  make,
  type RefSubject,
  type RefSubjectOptions,
} from "./RefSubject.js";

/**
 * Runtime symbol exposing hydration metadata on a hydrated RefSubject.
 *
 * @remarks
 * ## Why
 *
 * Provides the runtime key that exposes a hydrated ref's serialization and restoration metadata
 * without changing its RefSubject prototype.
 *
 * ## Ownership and lifetime
 *
 * This declaration acquires no resources. Effects represented by the contract retain their own
 * services and Scope requirements.
 *
 * @since 2.0.0
 * @category Hydration protocol
 */
export const HydrationRefTypeId = Symbol.for("@typed/fx/RefSubjectRef");
/**
 * Describes the hydration ref type id type.
 *
 * @remarks
 * ## Why
 *
 * Provides the runtime key that exposes a hydrated ref's serialization and restoration metadata
 * without changing its RefSubject prototype.
 *
 * ## Ownership and lifetime
 *
 * HydrationRefTypeId is a contract and performs no acquisition. Implementations retain the errors,
 * services, interruption, and Scope requirements expressed by its members.
 *
 * @since 2.0.0
 * @category Hydration types
 */
export type HydrationRefTypeId = typeof HydrationRefTypeId;

/**
 * Canonical data attribute for the versioned envelope of unnamed hydrated refs.
 *
 * @remarks
 * ## Why
 *
 * Names the versioned envelope used when several unnamed hydrated values share one server-rendered
 * attribute.
 *
 * ## Ownership and lifetime
 *
 * This declaration acquires no resources. Effects represented by the contract retain their own
 * services and Scope requirements.
 *
 * @since 2.0.0
 * @category Hydration protocol
 */
export const HYDRATION_ATTRIBUTE = "data-typed-refsubject";

const allUnbounded = <A, E, R>(effects: Iterable<Effect.Effect<A, E, R>>) =>
  Effect.all(effects, { concurrency: "unbounded" });

/**
 * Defines the hydration attribute state contract.
 *
 * @remarks
 * ## Why
 *
 * Represents one exact name/value pair a server renderer can write without depending on a DOM
 * implementation.
 *
 * ## Ownership and lifetime
 *
 * HydrationAttribute is a contract and performs no acquisition. Implementations retain the errors,
 * services, interruption, and Scope requirements expressed by its members.
 *
 * @since 2.0.0
 * @category Hydration protocol
 */
export interface HydrationAttribute {
  /**
   * Exact DOM attribute name for one serialized payload.
   *
   * @remarks
   * ## Why
   *
   * Carries the exact attribute name used for a serialized value.
   *
   * ## Ownership and lifetime
   *
   * This declaration acquires no resources. Effects represented by the contract retain their own
   * services and Scope requirements.
   *
   * @since 2.0.0
   * @category Hydration protocol
   */
  readonly name: string;
  /**
   * Schema-encoded payload written to the hydration attribute.
   *
   * @remarks
   * ## Why
   *
   * Carries the already encoded attribute payload; encoding failures occur before this record is
   * produced.
   *
   * ## Ownership and lifetime
   *
   * This declaration acquires no resources. Effects represented by the contract retain their own
   * services and Scope requirements.
   *
   * @since 2.0.0
   * @category Hydration protocol
   */
  readonly value: string;
}

/**
 * Defines the hydration element state contract.
 *
 * @remarks
 * ## Why
 *
 * Defines the minimal standards-based attribute surface required to restore state, allowing DOM
 * elements and compatible hosts to participate.
 *
 * ## Ownership and lifetime
 *
 * HydrationElement is a contract and performs no acquisition. Implementations retain the errors,
 * services, interruption, and Scope requirements expressed by its members.
 *
 * @since 2.0.0
 * @category Hydration protocol
 */
export interface HydrationElement {
  /**
   * Reads an encoded hydration attribute from the host.
   *
   * @remarks
   * ## Why
   *
   * Reads the serialized payload from the host during client restoration.
   *
   * ## Ownership and lifetime
   *
   * This declaration acquires no resources. Effects represented by the contract retain their own
   * services and Scope requirements.
   *
   * @since 2.0.0
   * @category DOM attribute protocol
   */
  getAttribute(name: string): string | null;
  /**
   * Writes an encoded hydration attribute to the host.
   *
   * @remarks
   * ## Why
   *
   * Writes a server-produced hydration payload through the host's native attribute contract.
   *
   * ## Ownership and lifetime
   *
   * This declaration acquires no resources. Effects represented by the contract retain their own
   * services and Scope requirements.
   *
   * @since 2.0.0
   * @category DOM attribute protocol
   */
  setAttribute(name: string, value: string): void;
  /**
   * Removes a consumed hydration attribute from the host.
   *
   * @remarks
   * ## Why
   *
   * Removes consumed hydration data so it cannot be restored twice from stale markup.
   *
   * ## Ownership and lifetime
   *
   * This declaration acquires no resources. Effects represented by the contract retain their own
   * services and Scope requirements.
   *
   * @since 2.0.0
   * @category DOM attribute protocol
   */
  removeAttribute(name: string): void;
}

type CodecEffect<A> = Effect.Effect<A, Schema.SchemaError, any>;

interface HydrationMember {
  readonly schema: Schema.Top;
  readonly attributeName: string | undefined;
  readonly ref: RefSubject<any, any, any>;
  readonly server: Effect.Effect<void>;
  readonly hydrate: (value: Effect.Effect<any, Schema.SchemaError>) => Effect.Effect<void>;
}

/**
 * Defines the hydration ref state contract.
 *
 * @remarks
 * ## Why
 *
 * Makes a state boundary callable with an attribute host while also exposing server serialization
 * as ordinary typed Effects.
 *
 * ## Ownership and lifetime
 *
 * HydrationRef is a contract and performs no acquisition. Implementations retain the errors,
 * services, interruption, and Scope requirements expressed by its members.
 *
 * @since 2.0.0
 * @category Hydration protocol
 */
export interface HydrationRef<E = never, R = never> {
  /**
   * Restores every member from a DOM-compatible attribute host.
   *
   * @remarks
   * ## Why
   *
   * Reads and removes encoded attributes, decodes them with each member's Schema, and completes the
   * deferred client initializer before ordinary state observation resumes.
   *
   * ## Ownership and lifetime
   *
   * Running the Effect requires Scope for deferred restoration and member subscriptions. Missing
   * attributes resume the original initializer; Schema failures and codec services remain on the
   * member metadata rather than becoming DOM exceptions.
   *
   * @since 2.0.0
   * @category Hydration types
   */
  (element: HydrationElement): Effect.Effect<void, never, R | Scope.Scope>;
  /**
   * Exposes the members and Effects used for serialization and restoration.
   *
   * @remarks
   * ## Why
   *
   * Keeps server serialization discoverable without changing the RefSubject prototype or requiring
   * a renderer-specific wrapper.
   *
   * ## Ownership and lifetime
   *
   * The operation starts only when its Effect is run. Any subscription or deferred hydration work is
   * finalized by the required Scope.
   *
   * @since 2.0.0
   * @category Hydration protocol
   */
  readonly [HydrationRefTypeId]: {
    readonly members: ReadonlyArray<HydrationMember>;
    readonly server: Effect.Effect<void>;
    readonly toAttributes: Effect.Effect<ReadonlyArray<HydrationAttribute>, E, R>;
  };
}

/**
 * Defines the hydrated ref subject state contract.
 *
 * @remarks
 * ## Why
 *
 * Combines writable renderer-independent state with its hydration boundary so restoration precedes
 * ordinary pushed updates.
 *
 * ## Ownership and lifetime
 *
 * HydratedRefSubject is a contract and performs no acquisition. Implementations retain the errors,
 * services, interruption, and Scope requirements expressed by its members.
 *
 * @since 2.0.0
 * @category Hydration protocol
 */
export interface HydratedRefSubject<A, E = never, R = never, RH = R>
  extends RefSubject<A, E, R>, HydrationRef<E, RH> {}

/**
 * Type utilities for writable RefSubjects that carry hydration metadata.
 *
 * @remarks
 * ## Why
 *
 * Combines writable renderer-independent state with its hydration boundary so restoration precedes
 * ordinary pushed updates.
 *
 * ## Ownership and lifetime
 *
 * The operation starts only when its Effect is run. Any subscription or deferred hydration work is
 * finalized by the required Scope.
 *
 * @since 2.0.0
 * @category Hydration protocol
 */
export declare namespace HydratedRefSubject {
  /**
   * Describes the any type.
   *
   * @remarks
   * ## Why
   *
   * Provides an existential hydrated-ref type for heterogeneous collections such as hydrateAll.
   *
   * ## Ownership and lifetime
   *
   * Any is a contract and performs no acquisition. Implementations retain the errors, services,
   * interruption, and Scope requirements expressed by its members.
   *
   * @since 2.0.0
   * @category Hydration types
   */
  export type Any = HydratedRefSubject<any, any, any, any>;
  /**
   * Describes the hydration error type.
   *
   * @remarks
   * ## Why
   *
   * Extracts the typed serialization failure shared by a HydrationRef composition.
   *
   * ## Ownership and lifetime
   *
   * HydrationError is a contract and performs no acquisition. Implementations retain the errors,
   * services, interruption, and Scope requirements expressed by its members.
   *
   * @since 2.0.0
   * @category Hydration types
   */
  export type HydrationError<T> = T extends HydrationRef<infer E, any> ? E : never;
  /**
   * Describes the hydration services type.
   *
   * @remarks
   * ## Why
   *
   * Extracts codec services required to encode or decode a HydrationRef composition.
   *
   * ## Ownership and lifetime
   *
   * HydrationServices is a contract and performs no acquisition. Implementations retain the
   * errors, services, interruption, and Scope requirements expressed by its members.
   *
   * @since 2.0.0
   * @category Hydration types
   */
  export type HydrationServices<T> = T extends HydrationRef<any, infer R> ? R : never;
}

/**
 * Tests whether a value carries callable hydration metadata.
 *
 * @remarks
 * ## Why
 *
 * Detects hydration capability by its public TypeId instead of relying on a concrete class or
 * renderer.
 *
 * ## Ownership and lifetime
 *
 * This declaration acquires no resources. Effects represented by the contract retain their own
 * services and Scope requirements.
 *
 * @since 2.0.0
 * @category Type guards
 */
export function isHydrationRef(value: unknown): value is HydrationRef<any, any> {
  return (
    typeof value === "function" &&
    HydrationRefTypeId in value &&
    typeof value[HydrationRefTypeId] === "object" &&
    value[HydrationRefTypeId] !== null
  );
}

/**
 * Defines the hydrate options state contract.
 *
 * @remarks
 * ## Why
 *
 * Adds an optional stable attribute name to ordinary RefSubject initialization and equality
 * options.
 *
 * ## Ownership and lifetime
 *
 * HydrateOptions is a contract and performs no acquisition. Implementations retain the errors,
 * services, interruption, and Scope requirements expressed by its members.
 *
 * @since 2.0.0
 * @category Hydration protocol
 */
export interface HydrateOptions<A> extends RefSubjectOptions<A> {
  /**
   * Optional stable name for a dedicated hydration attribute.
   *
   * @remarks
   * ## Why
   *
   * Carries the exact attribute name used for a serialized value.
   *
   * ## Ownership and lifetime
   *
   * This declaration acquires no resources. Effects represented by the contract retain their own
   * services and Scope requirements.
   *
   * @since 2.0.0
   * @category Hydration protocol
   */
  readonly name?: string;
}

type HydrationInput<A, E, R> = A | Effect.Effect<A, E, R> | Stream.Stream<A, E, R> | Fx.Fx<A, E, R>;

type HydrateEffect<S extends Schema.Top, E, R> = Effect.Effect<
  HydratedRefSubject<
    Schema.Schema.Type<S>,
    E | Schema.SchemaError,
    never,
    Schema.Codec.DecodingServices<S> | Schema.Codec.EncodingServices<S>
  >,
  never,
  R | Scope.Scope
>;

/**
 * Creates a named hydrated RefSubject using a string-encoded Schema codec.
 *
 * @remarks
 * ## Why
 *
 * Creates state whose server value is Schema-encoded and whose browser value is Schema-decoded
 * before the initializer resumes.
 *
 * ## Ownership and lifetime
 *
 * The creation Effect requires Scope; that Scope owns initializer subscriptions and deferred
 * server/client coordination. Schema errors and codec services remain typed.
 *
 * Values, Effects, Effect Streams, and Fx are accepted as initializers. A named string codec uses
 * its own `data-*` attribute; unnamed values share the versioned `data-typed-refsubject` envelope.
 * See {@link https://effect.website/docs/schema/introduction/ | Effect Schema} for the codec and
 * service model used by this boundary.
 *
 * ## Synchronous configuration errors
 *
 * Supplying an empty name, the reserved `typed-refsubject` name, or a name containing characters
 * forbidden in an HTML attribute throws `TypeError` immediately while `hydrate` is called. These
 * programmer errors are outside the returned Effect's typed error channel. Schema decoding and
 * encoding failures remain `Schema.SchemaError`, and codec requirements remain typed services.
 *
 * @example
 * ```ts
 * import { Effect, Schema } from "effect"
 * import * as Hydration from "@typed/fx/RefSubject"
 * import { RefSubject } from "@typed/fx"
 *
 * const attributes = Effect.scoped(Effect.gen(function* () {
 *   const count = yield* Hydration.hydrate(Schema.FiniteFromString, 0, { name: "count" })
 *   yield* RefSubject.update(count, (value) => value + 1)
 *   return yield* count[Hydration.HydrationRefTypeId].toAttributes
 * }))
 * ```
 *
 * @since 2.0.0
 * @category Hydration construction
 */
export function hydrate<S extends Schema.Codec<any, string, any, any>, E = never, R = never>(
  schema: S,
  effect: HydrationInput<NoInfer<Schema.Schema.Type<S>>, E, R>,
  options: HydrateOptions<Schema.Schema.Type<S>> & { readonly name: string },
): HydrateEffect<S, E, R>;
/**
 * Creates an unnamed hydrated RefSubject stored in the shared hydration envelope.
 *
 * @remarks
 * ## Why
 *
 * Creates state whose server value is Schema-encoded and whose browser value is Schema-decoded
 * before the initializer resumes.
 *
 * ## Ownership and lifetime
 *
 * The creation Effect requires Scope; that Scope owns initializer subscriptions and deferred
 * server/client coordination. Schema errors and codec services remain typed.
 *
 * @since 2.0.0
 * @category Hydration construction
 */
export function hydrate<S extends Schema.Top, E = never, R = never>(
  schema: S,
  effect: HydrationInput<NoInfer<Schema.Schema.Type<S>>, E, R>,
  options?: HydrateOptions<Schema.Schema.Type<S>> & { readonly name?: undefined },
): HydrateEffect<S, E, R>;
/**
 * Implements named and unnamed hydrated RefSubject construction.
 *
 * @remarks
 * ## Why
 *
 * Creates state whose server value is Schema-encoded and whose browser value is Schema-decoded
 * before the initializer resumes.
 *
 * ## Ownership and lifetime
 *
 * The creation Effect requires Scope; that Scope owns initializer subscriptions and deferred
 * server/client coordination. Schema errors and codec services remain typed.
 *
 * @since 2.0.0
 * @category Hydration construction
 */
export function hydrate<S extends Schema.Top, E = never, R = never>(
  schema: S,
  effect: HydrationInput<Schema.Schema.Type<S>, E, R>,
  options?: HydrateOptions<Schema.Schema.Type<S>>,
): HydrateEffect<S, E, R> {
  const attributeName =
    options?.name === undefined ? undefined : toHydrationAttributeName(options.name);
  return Effect.gen(function* () {
    const initializer = yield* makeHydrationInitializer(
      normalizeHydrationInitializer<Schema.Schema.Type<S>, E, R>(effect),
    );
    const ref = yield* make<Schema.Schema.Type<S>, E | Schema.SchemaError, R>(initializer.value, {
      ...options,
      eq: options?.eq ?? Schema.toEquivalence(schema),
    });
    const member: HydrationMember = {
      schema,
      attributeName,
      ref,
      server: initializer.server,
      hydrate: initializer.dom,
    };

    const initializeForCurrentBehavior = Effect.flatMap(CurrentComputedBehavior, (behavior) =>
      behavior === "one" ? initializer.server : Effect.void,
    );
    const hydrationRef = Object.assign(makeHydrationRef([member]), {
      run: <RSink>(sink: Sink.Sink<Schema.Schema.Type<S>, E | Schema.SchemaError, RSink>) =>
        Effect.andThen(initializeForCurrentBehavior, ref.run(sink)),
      toEffect: () => Effect.andThen(initializeForCurrentBehavior, ref),
    });

    return Object.setPrototypeOf(hydrationRef, ref) as HydratedRefSubject<
      Schema.Schema.Type<S>,
      E | Schema.SchemaError,
      never,
      Schema.Codec.DecodingServices<S> | Schema.Codec.EncodingServices<S>
    >;
  });
}

function toHydrationAttributeName(name: string): string {
  const attributeName = `data-${name}`.toLowerCase();
  if (
    name.length === 0 ||
    attributeName === HYDRATION_ATTRIBUTE ||
    !isValidAttributeName(attributeName)
  ) {
    throw new TypeError(`Invalid hydration attribute name: ${name}`);
  }
  return attributeName;
}

const forbiddenAttributeNameCharacters = new Set(['"', "'", "/", ">", "=", "<"]);

function isValidAttributeName(name: string): boolean {
  for (const character of name) {
    const codePoint = character.codePointAt(0)!;
    if (
      codePoint <= 0x20 ||
      (codePoint >= 0x7f && codePoint <= 0x9f) ||
      forbiddenAttributeNameCharacters.has(character)
    ) {
      return false;
    }
  }
  return true;
}

type HydrationEnvironment = "server" | "dom";

interface HydrationInitializer<A, E, R> {
  readonly value: Effect.Effect<A, E | Schema.SchemaError, R> | Fx.Fx<A, E | Schema.SchemaError, R>;
  readonly server: Effect.Effect<void>;
  readonly dom: (value: Effect.Effect<A, Schema.SchemaError>) => Effect.Effect<void>;
}

function makeHydrationInitializer<A, E, R>(
  value: Effect.Effect<A, E, R> | Fx.Fx<A, E, R>,
): Effect.Effect<HydrationInitializer<A, E, R>> {
  return Effect.gen(function* () {
    const environment = yield* Deferred.make<HydrationEnvironment>();
    const hydrated = yield* Deferred.make<A, E | Schema.SchemaError>();
    const server = Effect.asVoid(Deferred.succeed(environment, "server"));
    const dom = (value: Effect.Effect<A, Schema.SchemaError>) =>
      Effect.asVoid(
        Effect.andThen(Deferred.complete(hydrated, value), Deferred.succeed(environment, "dom")),
      );

    if (isFx(value)) {
      const hydratedValueDeferredFx = fxFromEffect(Deferred.await(hydrated));
      return {
        value: fxUnwrap(
          Effect.map(Deferred.await(environment), (environment) =>
            environment === "server" ? value : fxContinueWith(hydratedValueDeferredFx, () => value),
          ),
        ),
        server,
        dom,
      };
    }

    let first = true;
    const hydratedValueDeferred = Effect.suspend(() => {
      if (first) {
        first = false;
        return Deferred.await(hydrated);
      }
      return value;
    });

    return {
      value: Effect.flatMap(Deferred.await(environment), (environment) =>
        environment === "server" ? value : hydratedValueDeferred,
      ),
      server,
      dom,
    };
  });
}

function normalizeHydrationInitializer<A, E, R>(
  value: A | Effect.Effect<A, E, R> | Fx.Fx<A, E, R> | Stream.Stream<A, E, R>,
): Effect.Effect<A, E, R> | Fx.Fx<A, E, R> {
  if (isFx(value) || Effect.isEffect(value)) return value;
  if (Stream.isStream(value)) return fxFromStream(value);
  return Effect.succeed(value);
}

/**
 * Combines hydrated refs into one serialization and restoration boundary.
 *
 * @remarks
 * ## Why
 *
 * Combines member metadata so several refs serialize and restore as one boundary while retaining
 * each member's errors and codec services.
 *
 * ## Ownership and lifetime
 *
 * The combined boundary acquires nothing and delegates lifetime to its member refs. Encoding or
 * decoding retains the members' Schema errors and services.
 *
 * Named attributes must be unique. Unnamed members are encoded together and restored as a group,
 * so normal initializers cannot race ahead of a partially decoded envelope.
 *
 * ## Synchronous configuration errors
 *
 * Combining two named refs whose normalized `data-*` attribute names are equal throws `TypeError`
 * immediately while `hydrateAll` is called. This duplicate-name check is a configuration error,
 * not a typed Schema failure. Member encoding and decoding errors remain `Schema.SchemaError`, and
 * their codec services remain visible in the returned `HydrationRef`.
 *
 * @example
 * ```ts
 * import { Effect, Schema } from "effect"
 * import * as Hydration from "@typed/fx/RefSubject"
 *
 * const attributes = Effect.scoped(Effect.gen(function* () {
 *   const count = yield* Hydration.hydrate(Schema.Finite, 0)
 *   const status = yield* Hydration.hydrate(Schema.String, "ready")
 *   const state = Hydration.hydrateAll(count, status)
 *   return yield* state[Hydration.HydrationRefTypeId].toAttributes
 * }))
 * ```
 *
 * @since 2.0.0
 * @category Hydration construction
 */
export function hydrateAll<
  const Refs extends readonly [HydratedRefSubject.Any, ...HydratedRefSubject.Any[]],
>(
  ...refs: Refs
): HydrationRef<
  HydratedRefSubject.HydrationError<Refs[number]>,
  HydratedRefSubject.HydrationServices<Refs[number]>
> {
  return makeHydrationRef(refs.flatMap((ref) => ref[HydrationRefTypeId].members));
}

function makeHydrationRef(members: ReadonlyArray<HydrationMember>): HydrationRef<any, any> {
  const unnamed = members.filter((member) => member.attributeName === undefined);
  const named = members.filter((member) => member.attributeName !== undefined);
  const names = new Set<string>();
  for (const member of named) {
    const attributeName = member.attributeName!;
    if (names.has(attributeName)) {
      throw new TypeError(`Duplicate hydration attribute: ${attributeName}`);
    }
    names.add(attributeName);
  }

  const tuple = Schema.Tuple(unnamed.map((member) => member.schema) as any);
  const envelope = Schema.Struct({
    version: Schema.Literal(1),
    values: tuple,
  });
  const codec = Schema.fromJsonString(Schema.toCodecJson(envelope));
  const server = Effect.asVoid(allUnbounded(members.map((member) => member.server)));
  const attributeEffects = [
    ...(unnamed.length === 0
      ? []
      : [
          Effect.flatMap(allUnbounded(unnamed.map((member) => member.ref)), (values) =>
            Effect.map(Schema.encodeEffect(codec)({ version: 1, values } as any), (value) => ({
              name: HYDRATION_ATTRIBUTE,
              value,
            })),
          ),
        ]),
    ...named.map((member) =>
      Effect.flatMap(member.ref, (value) =>
        Effect.map(encodeMember(member, value), (value) => ({
          name: member.attributeName!,
          value,
        })),
      ),
    ),
  ];
  const toAttributes = Effect.andThen(server, allUnbounded(attributeEffects));

  const hydrateUnnamed = (element: HydrationElement) => {
    if (unnamed.length === 0) return Effect.void;
    const encoded = element.getAttribute(HYDRATION_ATTRIBUTE);
    if (encoded === null) {
      return Effect.asVoid(allUnbounded(unnamed.map((member) => member.server)));
    }

    return Effect.matchEffect(Schema.decodeEffect(codec)(encoded), {
      onFailure: (error) =>
        Effect.asVoid(allUnbounded(unnamed.map((member) => member.hydrate(Effect.fail(error))))),
      onSuccess: ({ values }) =>
        Effect.andThen(
          allUnbounded(
            unnamed.map((member, index) => member.hydrate(Effect.succeed(values[index]))),
          ),
          Effect.sync(() => element.removeAttribute(HYDRATION_ATTRIBUTE)),
        ),
    });
  };

  const hydrateNamed = (member: HydrationMember, element: HydrationElement) => {
    const attributeName = member.attributeName!;
    const encoded = element.getAttribute(attributeName);
    if (encoded !== null) {
      return Effect.matchEffect(decodeMember(member, encoded), {
        onFailure: (error) => member.hydrate(Effect.fail(error)),
        onSuccess: (value) => member.hydrate(Effect.succeed(value)),
      });
    }

    return Effect.andThen(
      member.server,
      Effect.matchCauseEffect(member.ref, {
        onFailure: () => Effect.void,
        onSuccess: (value) => writeNamed(member, element, value),
      }),
    );
  };

  const hydrateElement = (element: HydrationElement) =>
    Effect.andThen(
      allUnbounded([
        hydrateUnnamed(element),
        ...named.map((member) => hydrateNamed(member, element)),
      ]),
      Effect.asVoid(
        allUnbounded(named.map((member) => Effect.forkScoped(synchronizeNamed(member, element)))),
      ),
    );

  return Object.assign(hydrateElement, {
    [HydrationRefTypeId]: { members, server, toAttributes },
  });
}

function encodeMember(member: HydrationMember, value: unknown): CodecEffect<string> {
  return Schema.encodeEffect(member.schema)(value as any) as any;
}

function decodeMember(member: HydrationMember, value: string): CodecEffect<unknown> {
  return Schema.decodeEffect(member.schema)(value as any) as any;
}

function writeAttribute(element: HydrationElement, name: string, value: string) {
  return Effect.sync(() => {
    if (element.getAttribute(name) !== value) element.setAttribute(name, value);
  });
}

function writeNamed(member: HydrationMember, element: HydrationElement, value: unknown) {
  return Effect.matchEffect(encodeMember(member, value), {
    onFailure: (error) => member.ref.onFailure(Cause.fail(error)),
    onSuccess: (encoded) => writeAttribute(element, member.attributeName!, encoded),
  });
}

function synchronizeNamed(member: HydrationMember, element: HydrationElement) {
  return member.ref.run(
    Sink.make(
      () => Effect.void,
      (value) => writeNamed(member, element, value),
    ),
  );
}
