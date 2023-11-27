/**
 * @since 1.0.0
 */

import { Equivalence, Option } from "effect"
import { dual } from "effect/Function"

/**
 * @since 1.0.0
 */
export interface Progress {
  readonly loaded: bigint
  readonly total: Option.Option<bigint>
}

/**
 * @since 1.0.0
 */
export function Progress(loaded: bigint, total: Option.Option<bigint> = Option.none()): Progress {
  return {
    loaded,
    total
  }
}

/**
 * @since 1.0.0
 */
export const make = (loaded: bigint, total?: bigint | null): Progress => Progress(loaded, Option.fromNullable(total))

/**
 * @since 1.0.0
 */
export const setLoaded: {
  (loaded: bigint): (progress: Progress) => Progress
  (progress: Progress, loaded: bigint): Progress
} = dual(2, function setLoaded(progress: Progress, loaded: bigint): Progress {
  return Progress(
    loaded,
    progress.total
  )
})

/**
 * @since 1.0.0
 */
export const setTotal: {
  (total: bigint): (progress: Progress) => Progress
  (progress: Progress, total: bigint): Progress
} = dual(2, function setTotal(progress: Progress, total: bigint): Progress {
  return Progress(
    progress.loaded,
    Option.some(total)
  )
})

/**
 * @since 1.0.0
 */
export const equals: Equivalence.Equivalence<Progress> = Equivalence.struct<
  { readonly [K in keyof Progress]: Equivalence.Equivalence<Progress[K]> }
>({
  loaded: Equivalence.bigint,
  total: Option.getEquivalence(Equivalence.bigint)
})
