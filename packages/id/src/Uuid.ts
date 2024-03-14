/**
 * @since 1.0.0
 */

import * as Brand from "effect/Brand"
import * as Effect from "effect/Effect"
import { GetRandomValues } from "./GetRandomValues.js"

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Returns `true` if a string is a UUID.
 * @since 1.0.0
 */
export const isUuid: (value: string) => value is Uuid = (value: string): value is Uuid => uuidPattern.test(value)

/**
 * @since 1.0.0
 */
export type Uuid = string & Brand.Brand<"@typed/id/UUID">
/**
 * @since 1.0.0
 */
export const Uuid = Brand.refined<Uuid>(isUuid, (input) => Brand.error(`Expected a UUID but received ${input}.`))

/**
 * @since 1.0.0
 */
export type UuidSeed = readonly [
  zero: number,
  one: number,
  two: number,
  three: number,
  four: number,
  five: number,
  six: number,
  seven: number,
  eight: number,
  nine: number,
  ten: number,
  eleven: number,
  twelve: number,
  thirteen: number,
  fourteen: number,
  fifteen: number
]

/**
 * @since 1.0.0
 */
export const makeUuidSeed: Effect.Effect<UuidSeed, never, GetRandomValues> = GetRandomValues(32) as any

/**
 * @since 1.0.0
 */
export const makeUuid: Effect.Effect<Uuid, never, GetRandomValues> = Effect.map(makeUuidSeed, uuid4)

/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */
const byteToHex: Array<string> = []

for (let i = 0; i < 256; ++i) {
  byteToHex.push((i + 0x100).toString(16).slice(1))
}

/**
 * @since 1.0.0
 */
export function uuid4(seed: UuidSeed): Uuid {
  // Note: Be careful editing this code!  It's been tuned for performance
  // and works in ways you may not expect. See https://github.com/uuidjs/uuid/pull/434
  //
  // Note to future-self: No, you can't remove the `toLowerCase()` call.
  // REF: https://github.com/uuidjs/uuid/pull/677#issuecomment-1757351351
  return (
    byteToHex[seed[0]] +
    byteToHex[seed[1]] +
    byteToHex[seed[2]] +
    byteToHex[seed[3]] +
    "-" +
    byteToHex[seed[4]] +
    byteToHex[seed[5]] +
    "-" +
    byteToHex[seed[6]] +
    byteToHex[seed[7]] +
    "-" +
    byteToHex[seed[8]] +
    byteToHex[seed[9]] +
    "-" +
    byteToHex[seed[10]] +
    byteToHex[seed[11]] +
    byteToHex[seed[12]] +
    byteToHex[seed[13]] +
    byteToHex[seed[14]] +
    byteToHex[seed[15]]
  ).toLowerCase() as Uuid
}
