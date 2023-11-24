import { GetRandomValues } from "@typed/id/GetRandomValues"
import { Brand, Effect } from "effect"

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

const numToCharacter = (byte: number): string => {
  byte &= 63
  if (byte < 36) {
    // `0-9a-z`
    return byte.toString(36)
  } else if (byte < 62) {
    // `A-Z`
    return (byte - 26).toString(36).toUpperCase()
  } else if (byte > 62) {
    return "-"
  } else {
    return "_"
  }
}

const characters = Array.from({ length: 64 }, (_, i) => {
  return numToCharacter(i)
})

export const nanoId = (seed: NanoIdSeed): NanoId => NanoId(seed.reduce((id, x) => id + characters[x], ""))

export const makeNanoIdSeed: Effect.Effect<GetRandomValues, never, NanoIdSeed> = GetRandomValues.apply(21) as any

export const makeNanoId: Effect.Effect<GetRandomValues, never, NanoId> = Effect.map(makeNanoIdSeed, nanoId)
