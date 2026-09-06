import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Schema from "effect/Schema";
import * as Context from "effect/Context";
import { uuidStringify } from "./_uuid-stringify.js";
import { DateTimes } from "./DateTimes.js";
import { RandomValues } from "./RandomValues.js";

/**
 * Effect Schema and branded string type for RFC UUID version 7 values.
 * @remarks
 * ## Why
 * The schema verifies version and variant at transport boundaries; generated ordering is local to one Uuid7State, not a distributed total order.
 * ## Ownership and lifetime
 * This module-level schema value acquires no resources and is shared; no runtime freezing guarantee is implied.
 * @example
 * ```ts
 * import { Uuid7 } from "@typed/id/Uuid7"
 * import { Schema } from "effect"
 * const id = Schema.decodeUnknownSync(Uuid7)("01890f2e-7d6c-7cc0-98c4-dc0c0c07398f")
 * ```
 * @category ID schemas
 * @since 1.0.0
 */
export const Uuid7 = Schema.String.pipe(
  Schema.check(Schema.isUUID(7)),
  Schema.brand("@typed/id/UUID7"),
);
export type Uuid7 = typeof Uuid7.Type;

/**
 * Tests whether a string is an RFC UUID version 7 value.
 * @remarks
 * ## Why
 * Runtime refinement restores trust after serialization has erased the TypeScript brand.
 * ## Ownership and lifetime
 * This pure predicate acquires no resources and retains no input.
 * @example
 * ```ts
 * import { isUuid7 } from "@typed/id/Uuid7"
 * const valid = isUuid7("01890f2e-7d6c-7cc0-98c4-dc0c0c07398f")
 * ```
 * @category ID validation
 * @since 1.0.0
 */
export const isUuid7: (value: string) => value is Uuid7 = Schema.is(Uuid7);

/**
 * The validated time, sequence, and entropy used to format one UUID version 7.
 * @remarks
 * ## Why
 * An explicit seed documents the exact inputs to version and variant bit layout and makes generator state testable.
 * ## Ownership and lifetime
 * This data acquires no resources; the producing service owns sequence state and transfers a fresh random byte array.
 * @example
 * ```ts
 * import type { Uuid7Seed } from "@typed/id/Uuid7"
 * const seed: Uuid7Seed = { timestamp: 0, seq: 0, randomBytes: new Uint8Array(16) as Uuid7Seed["randomBytes"] }
 * ```
 * @category Sequence state
 * @since 1.0.0
 */
export type Uuid7Seed = {
  /** Validated millisecond timestamp encoded into the UUID. @since 1.0.0 */
  readonly timestamp: number;
  /** Unsigned 32-bit sequence integer in the range [0, 0xffffffff]. @since 1.0.0 */
  readonly seq: number;
  /** Fresh entropy buffer whose final bytes complete the UUID payload. @since 1.0.0 */
  readonly randomBytes: Uint8Array & { length: 16 };
};

const maximumTimestamp = 2 ** 48 - 1;

/**
 * Process-local Effect service that produces monotonic UUID version 7 seeds.
 * @remarks
 * ## Why
 * Clock rollback and 32-bit sequence rollover are handled inside an explicit service, guaranteeing monotonicity only for one shared service instance.
 * ## Ownership and lifetime
 * Each Layer instance owns mutable timestamp and sequence state. A new process, worker, deployment, or Layer resets it; exact hydration identity must be serialized.
 * @example
 * ```ts
 * import { uuid7, Uuid7State } from "@typed/id/Uuid7"
 * import { Effect } from "effect"
 * const id = Effect.provide(uuid7, Uuid7State.Default)
 * ```
 * @category Sequence state
 * @since 1.0.0
 */
export class Uuid7State extends Context.Service<Uuid7State>()("@typed/id/Uuid7State", {
  make: Effect.gen(function* () {
    const { now } = yield* DateTimes;
    const getRandomValues = yield* RandomValues;
    const state = {
      msecs: Number.NEGATIVE_INFINITY,
      seq: 0,
    };

    function updateV7State(now: number, randomBytes: Uint8Array) {
      let msecs: number;
      let seq: number;

      if (now > state.msecs) {
        // Time has moved on! Pick a new random sequence number
        seq =
          ((randomBytes[6] << 24) |
            (randomBytes[7] << 16) |
            (randomBytes[8] << 8) |
            randomBytes[9]) >>>
          0;
        msecs = now;
      } else {
        // Bump sequence counter w/ 32-bit rollover
        seq = (state.seq + 1) >>> 0;
        msecs = state.msecs;

        // In case of rollover, bump timestamp to preserve monotonicity. This is
        // allowed by the RFC and should self-correct as the system clock catches
        // up. See https://www.rfc-editor.org/rfc/rfc9562.html#section-6.2-9.4
        if (seq === 0) {
          msecs++;
        }
      }

      state.msecs = msecs;
      state.seq = seq;
    }

    return {
      next: Effect.gen(function* () {
        const timestamp = yield* now;
        if (!Number.isSafeInteger(timestamp) || timestamp < 0 || timestamp > maximumTimestamp) {
          return yield* new Cause.IllegalArgumentError(
            `UUIDv7 timestamp must be a safe integer between 0 and ${maximumTimestamp}, received ${timestamp}`,
          );
        }
        if (
          timestamp <= state.msecs &&
          state.msecs === maximumTimestamp &&
          state.seq === 0xffffffff
        ) {
          return yield* new Cause.IllegalArgumentError(
            "UUIDv7 sequence rollover exceeds its 48-bit timestamp field",
          );
        }
        const randomBytes = yield* getRandomValues(16);
        updateV7State(timestamp, randomBytes);
        return { timestamp: state.msecs, seq: state.seq, randomBytes };
      }),
    };
  }),
}) {
  /**
   * Reads the next validated seed from the current Uuid7State.
   * @remarks
   * ## Why
   * The accessor exposes ordered state through Effect's service channel and reports timestamp exhaustion as `IllegalArgumentError`.
   * ## Ownership and lifetime
   * The Effect uses the state owned by its provided Layer and acquires no separate persistent resource.
   * @category Services
   * @since 1.0.0
   */
  static readonly next = Effect.gen(function* () {
    const { next } = yield* Uuid7State;
    return yield* next;
  });

  /**
   * Provides Uuid7State from system time and Web Crypto entropy.
   * @remarks
   * ## Why
   * The production default is explicit while remaining replaceable by deterministic service layers.
   * ## Ownership and lifetime
   * Layer acquisition creates one mutable sequence state owned by the surrounding Layer Scope.
   * @category Production layers
   * @since 1.0.0
   */
  static readonly Default = Layer.effect(Uuid7State, Uuid7State.make).pipe(
    Layer.provide([DateTimes.Default, RandomValues.Default]),
  );
}

/**
 * Generates one UUID version 7 from the current Uuid7State.
 * @remarks
 * ## Why
 * Effectful generation makes the state boundary explicit and preserves `IllegalArgumentError` for invalid or exhausted timestamp space.
 * ## Ownership and lifetime
 * The Effect acquires no persistent resource and uses state owned by the provided Uuid7State Layer.
 * @example
 * ```ts
 * import { uuid7, Uuid7State } from "@typed/id/Uuid7"
 * import { Effect } from "effect"
 * const id = Effect.provide(uuid7, Uuid7State.Default)
 * ```
 * @category ID generation
 * @since 1.0.0
 */
export const uuid7: Effect.Effect<Uuid7, Cause.IllegalArgumentError, Uuid7State> = Effect.map(
  Uuid7State.next,
  uuid7FromSeed,
);

function uuid7FromSeed({ randomBytes, seq, timestamp }: Uuid7Seed): Uuid7 {
  const result = new Uint8Array(16);

  // byte 0-5: timestamp (48 bits)
  result[0] = (timestamp / 0x10000000000) & 0xff;
  result[1] = (timestamp / 0x100000000) & 0xff;
  result[2] = (timestamp / 0x1000000) & 0xff;
  result[3] = (timestamp / 0x10000) & 0xff;
  result[4] = (timestamp / 0x100) & 0xff;
  result[5] = timestamp & 0xff;

  // byte 6: `version` (4 bits) | sequence bits 28-31 (4 bits)
  result[6] = 0x70 | ((seq >>> 28) & 0x0f);

  // byte 7: sequence bits 20-27 (8 bits)
  result[7] = (seq >>> 20) & 0xff;

  // byte 8: `variant` (2 bits) | sequence bits 14-19 (6 bits)
  result[8] = 0x80 | ((seq >>> 14) & 0x3f);

  // byte 9: sequence bits 6-13 (8 bits)
  result[9] = (seq >>> 6) & 0xff;

  // byte 10: sequence bits 0-5 (6 bits) | random (2 bits)
  result[10] = ((seq << 2) & 0xff) | (randomBytes[10] & 0x03);

  // bytes 11-15: random (40 bits)
  result[11] = randomBytes[11];
  result[12] = randomBytes[12];
  result[13] = randomBytes[13];
  result[14] = randomBytes[14];
  result[15] = randomBytes[15];

  return Uuid7.make(uuidStringify(result));
}
