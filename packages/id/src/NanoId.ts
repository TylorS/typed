/**
 * @since 1.0.0
 */

import { Brand, Effect } from "effect"
import { GetRandomValues } from "./GetRandomValues.js"

const nanoIdPattern = /[0-9a-zA-Z_-]/

/**
 * @since 1.0.0
 */
export const isNanoId = (id: string): id is NanoId => nanoIdPattern.test(id)

/**
 * @since 1.0.0
 */
export type NanoId = string & Brand.Brand<"@typed/id/NanoId">

/**
 * @since 1.0.0
 */
export const NanoId = Brand.refined<NanoId>(
  isNanoId,
  (input) => Brand.error(`Expected a NanoID but received ${input}.`)
)

/**
 * @since 1.0.0
 */
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

/**
 * @since 1.0.0
 */
export const nanoId = (seed: NanoIdSeed): NanoId => NanoId(seed.reduce((id, x) => id + characters[x], ""))

/**
 * @since 1.0.0
 */
export const makeNanoIdSeed: Effect.Effect<NanoIdSeed, never, GetRandomValues> = GetRandomValues(21) as any

/**
 * @since 1.0.0
 */
export const makeNanoId: Effect.Effect<NanoId, never, GetRandomValues> = Effect.map(makeNanoIdSeed, nanoId)
