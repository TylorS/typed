import { Brand, Effect, Random } from "effect"

export type NanoId = string & Brand.Brand<"@typed/id/NanoId">
export const NanoId = Brand.nominal<NanoId>()

export type NanoIdSeed = readonly [
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
  fifteen: number,
  sixteen: number,
  seventeen: number,
  eighteen: number,
  nineteen: number,
  twenty: number
]

const nanoId = (seed: NanoIdSeed): NanoId => {
  let id: string = ""

  for (let byte of seed) {
    byte &= 63
    if (byte < 36) {
      // `0-9a-z`
      id += byte.toString(36)
    } else if (byte < 62) {
      // `A-Z`
      id += (byte - 26).toString(36).toUpperCase()
    } else if (byte > 62) {
      id += "-"
    } else {
      id += "_"
    }
  }

  return NanoId(id)
}

export const makeNanoIdSeed: Effect.Effect<never, never, NanoIdSeed> = Effect.all(
  Array.from({ length: 21 }, () => Random.nextInt)
) as any as Effect.Effect<never, never, NanoIdSeed>

export const makeNanoId: Effect.Effect<never, never, NanoId> = Effect.map(makeNanoIdSeed, nanoId)
