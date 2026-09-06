import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { RandomValues } from "./RandomValues.js";

/**
 * Effect Schema and branded string type for URL-safe Nano IDs.
 * @remarks
 * ## Why
 * Runtime validation restores the brand after transport and prevents arbitrary strings from entering NanoId-specific APIs.
 * ## Ownership and lifetime
 * This module-level schema value acquires no resources and is shared; no runtime freezing guarantee is implied.
 * @example
 * ```ts
 * import { NanoId } from "@typed/id/NanoId"
 * const id = NanoId.make("V1StGXR8_Z5jdHi6B-myT")
 * ```
 * @category ID schemas
 * @since 1.0.0
 */
export const NanoId = Schema.String.pipe(
  Schema.check(Schema.isPattern(/^[0-9a-zA-Z_-]+$/)),
  Schema.brand("@typed/id/NanoId"),
);
export type NanoId = typeof NanoId.Type;

/**
 * Tests whether a string has the NanoId alphabet and brandable shape.
 * @remarks
 * ## Why
 * Refinement is the lightweight boundary check when full schema decoding is unnecessary.
 * ## Ownership and lifetime
 * This pure predicate acquires no resources and retains no input.
 * @example
 * ```ts
 * import { isNanoId } from "@typed/id/NanoId"
 * isNanoId("V1StGXR8_Z5jdHi6B-myT")
 * ```
 * @category ID validation
 * @since 1.0.0
 */
export const isNanoId: (value: string) => value is NanoId = Schema.is(NanoId);

type NanoIdSeed = Uint8Array & { length: 21 };

/**
 * Generates a 21-character NanoId from the current RandomValues service.
 * @remarks
 * ## Why
 * Effectful generation exposes entropy as a service so production and deterministic test sources are interchangeable.
 * ## Ownership and lifetime
 * The Effect acquires no persistent resource and consumes one fresh 21-byte buffer owned by the invocation.
 * @example
 * ```ts
 * import { nanoId } from "@typed/id/NanoId"
 * import { RandomValues } from "@typed/id/RandomValues"
 * import { Effect } from "effect"
 * const id = Effect.provide(nanoId, RandomValues.Default)
 * ```
 * @category ID generation
 * @since 1.0.0
 */
export const nanoId: Effect.Effect<NanoId, never, RandomValues> = Effect.map(
  RandomValues.call(21),
  (seed: NanoIdSeed): NanoId => NanoId.make(Array.from(seed, numToCharacter).join("")),
);

function numToCharacter(byte: number): string {
  byte &= 63;
  if (byte < 36) {
    // `0-9a-z`
    return byte.toString(36);
  } else if (byte < 62) {
    // `A-Z`
    return (byte - 26).toString(36).toUpperCase();
  } else if (byte > 62) {
    return "-";
  } else {
    return "_";
  }
}
