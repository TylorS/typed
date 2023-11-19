import * as Brand from "effect/Brand"
import * as Effect from "effect/Effect"
import * as Random from "effect/Random"

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

/**
 * Returns `true` if a string is a UUID.
 * @name isUuid(value: string): value is Uuid
 */
export const isUuid: (value: string) => value is Uuid = (value: string): value is Uuid => uuidPattern.test(value)

export type Uuid = string & Brand.Brand<"@typed/id/UUID">
export const Uuid = Brand.refined<Uuid>(isUuid, (input) => Brand.error(`Expected a UUID`, { input }))

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

export function uuid4(seed: UuidSeed): Uuid {
  return ((seed[0].toString(16) +
    seed[1].toString(16) +
    seed[2].toString(16) +
    seed[3].toString(16) +
    "-" +
    seed[4].toString(16) +
    seed[5].toString(16) +
    "-" +
    ((seed[6] & 0x0f) | 0x40).toString(16) +
    seed[7].toString(16) +
    "-" +
    ((seed[8] & 0xbf) | 0x80).toString(16) +
    seed[9].toString(16) +
    "-" +
    seed[10].toString(16) +
    seed[11].toString(16) +
    seed[12].toString(16) +
    seed[13].toString(16) +
    seed[14].toString(16) +
    seed[15].toString(16)) as any) as Uuid
}

export const makeUuidSeed: Effect.Effect<never, never, UuidSeed> = Effect.all(
  Array.from({ length: 16 }, () => Random.nextInt)
) as any as Effect.Effect<never, never, UuidSeed>

export const makeUuid: Effect.Effect<never, never, Uuid> = Effect.map(makeUuidSeed, uuid4)
