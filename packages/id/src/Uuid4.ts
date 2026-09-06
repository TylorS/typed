import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { uuidStringify } from "./_uuid-stringify.js";
import { RandomValues } from "./RandomValues.js";

/**
 * Effect Schema and branded string type for RFC UUID version 4 values.
 * @remarks
 * ## Why
 * The schema verifies version and variant bits before restoring the compile-time brand after transport.
 * ## Ownership and lifetime
 * This module-level schema value acquires no resources and is shared; no runtime freezing guarantee is implied.
 * @example
 * ```ts
 * import { Uuid4 } from "@typed/id/Uuid4"
 * const id = Uuid4.make("550e8400-e29b-41d4-a716-446655440000")
 * ```
 * @category ID schemas
 * @since 1.0.0
 */
export const Uuid4 = Schema.String.pipe(
  Schema.check(Schema.isUUID(4)),
  Schema.brand("@typed/id/UUID4"),
);
export type Uuid4 = typeof Uuid4.Type;

/**
 * Tests whether a string is an RFC UUID version 4 value.
 * @remarks
 * ## Why
 * Runtime refinement restores trust after serialization has erased the TypeScript brand.
 * ## Ownership and lifetime
 * This pure predicate acquires no resources and retains no input.
 * @example
 * ```ts
 * import { isUuid4 } from "@typed/id/Uuid4"
 * isUuid4("550e8400-e29b-41d4-a716-446655440000")
 * ```
 * @category ID validation
 * @since 1.0.0
 */
export const isUuid4: (value: string) => value is Uuid4 = Schema.is(Uuid4);

type Uuid4Seed = Uint8Array & { length: 16 };

/**
 * Generates an RFC UUID version 4 from 16 fresh random bytes.
 * @remarks
 * ## Why
 * Effectful generation exposes entropy as a service and explicitly sets version and variant bits; custom services must return a usable fresh buffer.
 * ## Ownership and lifetime
 * The invocation mutates only its fresh byte buffer, acquires no persistent resource, and returns an immutable string.
 * @example
 * ```ts
 * import { uuid4 } from "@typed/id/Uuid4"
 * import { RandomValues } from "@typed/id/RandomValues"
 * import { Effect } from "effect"
 * const id = Effect.provide(uuid4, RandomValues.Default)
 * ```
 * @category ID generation
 * @since 1.0.0
 */
export const uuid4: Effect.Effect<Uuid4, never, RandomValues> = Effect.map(
  RandomValues.call(16),
  (seed: Uuid4Seed): Uuid4 => {
    // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
    seed[6] = (seed[6] & 0x0f) | 0x40;
    seed[8] = (seed[8] & 0x3f) | 0x80;
    return Uuid4.make(uuidStringify(seed));
  },
);
