import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Schema from "effect/Schema";
import * as Context from "effect/Context";
import { sha512 } from "./_sha.js";
import { DateTimes } from "./DateTimes.js";
import { RandomValues } from "./RandomValues.js";

// Constants
const DEFAULT_LENGTH = 24;
const BIG_LENGTH = 32;
const INITIAL_COUNT_MAX = 476782367;

/**
 * Effect Schema and branded string type for 24-character CUID values.
 * @remarks
 * ## Why
 * The schema validates transport or persisted strings before restoring the compile-time brand; generating a new client ID is not hydration identity.
 * ## Ownership and lifetime
 * This module-level schema value acquires no resources and is shared; no runtime freezing guarantee is implied.
 * @example
 * ```ts
 * import { Cuid } from "@typed/id/Cuid"
 * const id = Cuid.make("a00000000000000000000000")
 * ```
 * See [Effect Schema](https://effect.website/docs/schema/introduction/).
 * @category ID schemas
 * @since 1.0.0
 */
export const Cuid = Schema.String.pipe(
  Schema.check(Schema.isPattern(/^[a-z][0-9a-z]{23}$/)),
  Schema.brand("@typed/id/CUID"),
);
export type Cuid = Schema.Schema.Type<typeof Cuid>;

/**
 * Tests whether a string is a valid branded CUID.
 * @remarks
 * ## Why
 * Runtime refinement restores trust after JSON, structured clone, or other transport has erased the TypeScript brand.
 * ## Ownership and lifetime
 * This pure predicate acquires no resources and retains no input.
 * @example
 * ```ts
 * import { isCuid } from "@typed/id/Cuid"
 * isCuid("a00000000000000000000000")
 * ```
 * @category ID validation
 * @since 1.0.0
 */
export const isCuid: (value: string) => value is Cuid = Schema.is(Cuid);

// Types
/**
 * The complete deterministic input used to derive one CUID.
 * @remarks
 * ## Why
 * Keeping time, sequence, entropy, and caller fingerprint explicit makes generator identity rules testable and reviewable.
 * ## Ownership and lifetime
 * This data acquires no resources; callers own the random byte array and state services produce fresh seeds.
 * @example
 * ```ts
 * import type { CuidSeed } from "@typed/id/Cuid"
 * const seed: CuidSeed = { timestamp: 0, counter: 0, random: new Uint8Array(32) as CuidSeed["random"], fingerprint: "test" }
 * ```
 * @category ID types
 * @since 1.0.0
 */
export type CuidSeed = {
  /** Millisecond timestamp sampled for this seed. Inherits the seed's resource-free lifetime. @since 1.0.0 */
  readonly timestamp: number;
  /** Process-local sequence value for this seed. Inherits the seed's resource-free lifetime. @since 1.0.0 */
  readonly counter: number;
  /** Fresh 32-byte entropy buffer owned by this seed's consumer. @since 1.0.0 */
  readonly random: Uint8Array & { readonly length: 32 };
  /** Caller-derived discriminator captured by the CuidState instance. @since 1.0.0 */
  readonly fingerprint: string;
};

/**
 * Process-local Effect service that supplies sequential CUID seeds.
 * @remarks
 * ## Why
 * Counter state and caller-provided `envData` live in an explicit service so tests and applications choose the sharing boundary instead of relying on hidden globals.
 * ## Ownership and lifetime
 * Each Layer instance owns its mutable counter and captured fingerprint. A new process, worker, or Layer resets that sequence; exact SSR identity must be serialized and reused.
 * @example
 * ```ts
 * import { cuid, CuidState } from "@typed/id/Cuid"
 * import { Effect } from "effect"
 * const program = Effect.provide(cuid, CuidState.Default)
 * ```
 * See [Effect services](https://effect.website/docs/requirements-management/services/) and [Layers](https://effect.website/docs/requirements-management/layers/).
 * @category Sequence state
 * @since 1.0.0
 */
export class CuidState extends Context.Service<CuidState>()("@typed/id/CuidState", {
  make: (envData: string) =>
    Effect.gen(function* () {
      const { now } = yield* DateTimes;
      const getRandomValues = yield* RandomValues;
      const initialBytes = yield* getRandomValues(4);
      const initialValue =
        Math.abs(
          (initialBytes[0] << 24) |
            (initialBytes[1] << 16) |
            (initialBytes[2] << 8) |
            initialBytes[3],
        ) % INITIAL_COUNT_MAX;

      // Derive a stable discriminator from caller-provided environment data
      const fingerprint = (yield* hash(envData)).substring(0, BIG_LENGTH);

      let counter = initialValue;

      return {
        next: Effect.gen(function* () {
          const timestamp = yield* now;
          const random = yield* getRandomValues(32);
          return {
            timestamp,
            counter: counter++,
            random,
            fingerprint,
          } satisfies CuidSeed;
        }),
      };
    }),
}) {
  /**
   * Reads one seed from the current CuidState service.
   * @remarks
   * ## Why
   * The accessor exposes stateful sequencing through Effect's service channel rather than a module-global counter.
   * ## Ownership and lifetime
   * The Effect requires `CuidState`; its Layer owns the counter for the Layer lifetime.
   * @category Services
   * @since 1.0.0
   */
  static readonly next = Effect.gen(function* () {
    const { next } = yield* CuidState;
    return yield* next;
  });

  /**
   * Provides a default CuidState backed by system time and Web Crypto entropy.
   * @remarks
   * ## Why
   * The explicit Layer gives production code a standard service while keeping test and environment-specific alternatives replaceable.
   * ## Ownership and lifetime
   * Layer acquisition creates one counter state; the surrounding Layer Scope owns it. Web Crypto must be available in the runtime.
   * @category Production layers
   * @since 1.0.0
   */
  static readonly Default = Layer.effect(CuidState, CuidState.make("node")).pipe(
    Layer.provide([DateTimes.Default, RandomValues.Default]),
  );
}

/**
 * Generates one CUID from the current CuidState service.
 * @remarks
 * ## Why
 * Generation is an Effect so sequencing and entropy dependencies remain explicit and replaceable; `envData` is only a caller discriminator, not a machine fingerprint guarantee. Missing Web Crypto or rejected SHA-512 work is a defect because the typed error channel is `never`.
 * ## Ownership and lifetime
 * The Effect acquires no resources itself and uses the CuidState owned by its provided Layer.
 * @example
 * ```ts
 * import { cuid, CuidState } from "@typed/id/Cuid"
 * import { Effect } from "effect"
 * const id = Effect.provide(cuid, CuidState.Default)
 * ```
 * @category ID generation
 * @since 1.0.0
 */
export const cuid: Effect.Effect<Cuid, never, CuidState> = Effect.flatMap(
  CuidState.next,
  cuidFromSeed,
);

// Utilities
const LETTER_ALPHABET = "abcdefghijklmnopqrstuvwxyz";
const BODY_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";
const LETTER_DOMAIN = "@typed/id/cuid/letter";
const BODY_DOMAIN = "@typed/id/cuid/body";
const encoder = new TextEncoder();

function hash(input: string): Effect.Effect<string> {
  return Effect.map(sha512(encoder.encode(input)), (buffer) => {
    const view = new Uint8Array(buffer);
    let value = 0n;
    for (const byte of view) {
      value = (value << 8n) + BigInt(byte);
    }
    // Drop the first character because it will bias the histogram to the left
    return value.toString(36).slice(1);
  });
}

function sample(
  domain: string,
  alphabet: string,
  length: number,
  canonicalInput: Uint8Array,
): Effect.Effect<string> {
  return Effect.gen(function* () {
    const limit = Math.floor(256 / alphabet.length) * alphabet.length;
    let value = "";

    for (let block = 0; value.length < length; block++) {
      const prefix = encoder.encode(`${domain}\0${block.toString(10)}\0`);
      const input = new Uint8Array(prefix.length + canonicalInput.length);
      input.set(prefix);
      input.set(canonicalInput, prefix.length);
      const digest = new Uint8Array(yield* sha512(input));

      for (const byte of digest) {
        if (byte >= limit) continue;
        value += alphabet[byte % alphabet.length];
        if (value.length === length) break;
      }
    }

    return value;
  });
}

function cuidFromSeed({ counter, fingerprint, random, timestamp }: CuidSeed): Effect.Effect<Cuid> {
  return Effect.gen(function* () {
    const randomHex = Array.from(random, (byte) => byte.toString(16).padStart(2, "0")).join("");
    const canonicalInput = encoder.encode(
      [timestamp.toString(36), counter.toString(36), fingerprint, randomHex].join("\0"),
    );
    const firstLetter = yield* sample(LETTER_DOMAIN, LETTER_ALPHABET, 1, canonicalInput);
    const body = yield* sample(BODY_DOMAIN, BODY_ALPHABET, DEFAULT_LENGTH - 1, canonicalInput);

    return Cuid.make(firstLetter + body);
  });
}
