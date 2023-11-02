import { Equivalence, Option } from "effect"
import { dual } from "effect/Function"

export interface Progress {
  readonly loaded: bigint
  readonly total: Option.Option<bigint>
}

export function Progress(loaded: bigint, total: Option.Option<bigint> = Option.none()): Progress {
  return {
    loaded,
    total
  }
}

export const make = (loaded: bigint, total?: bigint | null): Progress => Progress(loaded, Option.fromNullable(total))

export const setLoaded: {
  (loaded: bigint): (progress: Progress) => Progress
  (progress: Progress, loaded: bigint): Progress
} = dual(2, function setLoaded(progress: Progress, loaded: bigint): Progress {
  return Progress(
    loaded,
    progress.total
  )
})

export const setTotal: {
  (total: bigint): (progress: Progress) => Progress
  (progress: Progress, total: bigint): Progress
} = dual(2, function setTotal(progress: Progress, total: bigint): Progress {
  return Progress(
    progress.loaded,
    Option.some(total)
  )
})

export const equals: Equivalence.Equivalence<Progress> = Equivalence.struct<
  { readonly [K in keyof Progress]: Equivalence.Equivalence<Progress[K]> }
>({
  loaded: Equivalence.bigint,
  total: Option.getEquivalence(Equivalence.bigint)
})
