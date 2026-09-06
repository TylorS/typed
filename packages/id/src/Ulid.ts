import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { DateTimes } from "./DateTimes.js";
import { RandomValues } from "./RandomValues.js";

/**
 * Effect Schema and branded string type for canonical ULID values.
 * @remarks
 * ## Why
 * The schema validates values at transport boundaries; encoded time does not imply a total order across independent generators.
 * ## Ownership and lifetime
 * This module-level schema value acquires no resources and is shared; no runtime freezing guarantee is implied.
 * @example
 * ```ts
 * import { Ulid } from "@typed/id/Ulid"
 * const id = Ulid.make("01ARZ3NDEKTSV4RRFFQ69G5FAV")
 * ```
 * @category ID schemas
 * @since 1.0.0
 */
export const Ulid = Schema.String.pipe(
  Schema.check(Schema.isULID()),
  Schema.brand("@typed/id/ULID"),
);
export type Ulid = typeof Ulid.Type;

/**
 * Tests whether a string is a canonical ULID.
 * @remarks
 * ## Why
 * Runtime refinement restores trust after serialization has erased the TypeScript brand.
 * ## Ownership and lifetime
 * This pure predicate acquires no resources and retains no input.
 * @example
 * ```ts
 * import { isUlid } from "@typed/id/Ulid"
 * isUlid("01ARZ3NDEKTSV4RRFFQ69G5FAV")
 * ```
 * @category ID validation
 * @since 1.0.0
 */
export const isUlid: (value: string) => value is Ulid = Schema.is(Ulid);

type UlidSeed = Uint8Array & { length: 16 };

// Crockford's Base32
const ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const ENCODING_LEN = ENCODING.length;
const TIME_MAX = 2 ** 48 - 1;
const TIME_LEN = 10;
const RANDOM_LEN = 16;

/**
 * Generates a ULID from the current millisecond time and random bytes.
 * @remarks
 * ## Why
 * Time and entropy remain explicit services; unsafe, negative, or out-of-range 48-bit timestamps fail with `IllegalArgumentError`.
 * ## Ownership and lifetime
 * The Effect acquires no persistent resources and uses DateTimes and RandomValues only for the invocation.
 * @example
 * ```ts
 * import { ulid } from "@typed/id/Ulid"
 * import { Ids } from "@typed/id/Ids"
 * import { Effect } from "effect"
 * const id = Effect.provide(ulid, Ids.Default)
 * ```
 * @category ID generation
 * @since 1.0.0
 */
export const ulid: Effect.Effect<Ulid, Cause.IllegalArgumentError, RandomValues | DateTimes> =
  Effect.gen(function* () {
    const now = yield* DateTimes.now;
    if (!Number.isSafeInteger(now) || now < 0 || now > TIME_MAX) {
      return yield* new Cause.IllegalArgumentError(
        `ULID timestamp must be a safe integer between 0 and ${TIME_MAX}, received ${now}`,
      );
    }

    const seed: UlidSeed = yield* RandomValues.call(16);
    return Ulid.make(encodeTime(now, TIME_LEN) + encodeRandom(seed));
  });

function encodeTime(now: number, len: number): string {
  let str = "";
  for (let i = len - 1; i >= 0; i--) {
    const mod = now % ENCODING_LEN;
    str = ENCODING.charAt(mod) + str;
    now = (now - mod) / ENCODING_LEN;
  }
  return str;
}

function encodeRandom(seed: UlidSeed): string {
  let str = "";
  for (let i = 0; i < RANDOM_LEN; i++) {
    str = str + ENCODING.charAt(seed[i] % ENCODING_LEN);
  }
  return str;
}
