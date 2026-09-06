import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { DateTimes } from "./DateTimes.js";
import { RandomValues } from "./RandomValues.js";

// Constants
const EPOCH = 14e11; // 2014-05-13T16:53:20Z
const TIMESTAMP_MAX = EPOCH + 2 ** 32 * 1_000 - 1;
const TIMESTAMP_BYTES = 4;
const PAYLOAD_BYTES = 16;
const TOTAL_BYTES = TIMESTAMP_BYTES + PAYLOAD_BYTES;
const STRING_LENGTH = 27;

// Schema
/**
 * Effect Schema and branded string type for 27-character KSUID values.
 * @remarks
 * ## Why
 * The schema validates transported values before restoring the compile-time brand; lexical time ordering is not a global generation-order guarantee.
 * ## Ownership and lifetime
 * This module-level schema value acquires no resources and is shared; no runtime freezing guarantee is implied.
 * @example
 * ```ts
 * import { Ksuid } from "@typed/id/Ksuid"
 * import { Schema } from "effect"
 * const id = Schema.decodeUnknownSync(Ksuid)("0ujtsYcgvSTl8PAuAdqWYSMnLOv")
 * ```
 * @category ID schemas
 * @since 1.0.0
 */
export const Ksuid = Schema.String.pipe(
  Schema.check(Schema.isPattern(/^[0-9A-Za-z]{27}$/)),
  Schema.brand("@typed/id/KSUID"),
);
export type Ksuid = typeof Ksuid.Type;

/**
 * Tests whether a string has the KSUID encoding shape.
 * @remarks
 * ## Why
 * Runtime refinement restores trust after serialization has erased the TypeScript brand.
 * ## Ownership and lifetime
 * This pure predicate acquires no resources and retains no input.
 * @example
 * ```ts
 * import { isKsuid } from "@typed/id/Ksuid"
 * isKsuid("0ujtsYcgvSTl8PAuAdqWYSMnLOv")
 * ```
 * @category ID validation
 * @since 1.0.0
 */
export const isKsuid: (value: string) => value is Ksuid = Schema.is(Ksuid);

// Types
type KsuidSeed = Uint8Array & { length: 16 };

// Public API
/**
 * Generates a KSUID from the current time and 16 random bytes.
 * @remarks
 * ## Why
 * Time and entropy remain explicit Effect services; timestamps outside KSUID's 32-bit seconds field fail with `IllegalArgumentError`.
 * ## Ownership and lifetime
 * The Effect acquires no persistent resources and uses DateTimes and RandomValues only for the invocation.
 * @example
 * ```ts
 * import { ksuid } from "@typed/id/Ksuid"
 * import { DateTimes } from "@typed/id/DateTimes"
 * import { RandomValues } from "@typed/id/RandomValues"
 * import { Effect, Layer } from "effect"
 * const id = Effect.provide(ksuid, Layer.merge(DateTimes.Default, RandomValues.Default))
 * ```
 * @category ID generation
 * @since 1.0.0
 */
export const ksuid: Effect.Effect<Ksuid, Cause.IllegalArgumentError, DateTimes | RandomValues> =
  Effect.gen(function* () {
    const timestamp = yield* DateTimes.now;
    if (!Number.isSafeInteger(timestamp) || timestamp < EPOCH || timestamp > TIMESTAMP_MAX) {
      return yield* new Cause.IllegalArgumentError(
        `KSUID timestamp must be a safe integer between ${EPOCH} and ${TIMESTAMP_MAX}, received ${timestamp}`,
      );
    }

    const payload: KsuidSeed = yield* RandomValues.call(PAYLOAD_BYTES);
    // Create the combined bytes
    const bytes = new Uint8Array(TOTAL_BYTES);

    // Write timestamp (4 bytes, big-endian)
    const seconds = Math.floor((timestamp - EPOCH) / 1000);
    bytes[0] = (seconds >>> 24) & 0xff;
    bytes[1] = (seconds >>> 16) & 0xff;
    bytes[2] = (seconds >>> 8) & 0xff;
    bytes[3] = seconds & 0xff;

    // Copy payload
    bytes.set(payload, TIMESTAMP_BYTES);

    // Encode as base62
    return Ksuid.make(base62Encode(bytes));
  });

// Utilities
const base62Chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const base = BigInt(base62Chars.length);

function base62Encode(bytes: Uint8Array): string {
  let number = 0n;
  for (const byte of bytes) {
    number = (number << 8n) + BigInt(byte);
  }

  const chars: Array<string> = Array(STRING_LENGTH);
  let i = chars.length;

  while (i > 0) {
    i--;
    const remainder = Number(number % base);
    chars[i] = base62Chars[remainder];
    number = number / base;
  }

  return chars.join("");
}
