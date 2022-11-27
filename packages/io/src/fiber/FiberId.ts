import * as Option from '@fp-ts/data/Option'
import { UnixTime } from '@typed/time'

export type FiberId = None | Live | Synthetic

export interface None extends Option.None {}
export const None: None = Option.none as None

export interface Live {
  readonly _tag: 'Live'
  readonly id: number
  readonly startTime: UnixTime
}

export const Live = (id: number, startTime: UnixTime): Live => ({
  _tag: 'Live',
  id,
  startTime,
})

export interface Synthetic {
  readonly _tag: 'Synthetic'
  readonly ids: readonly FiberId[]
}

export const Synthetic = (ids: readonly FiberId[]): Synthetic => ({
  _tag: 'Synthetic',
  ids,
})

export const isNone = (fiberId: FiberId): fiberId is None => fiberId._tag === 'None'

export const isLive = (fiberId: FiberId): fiberId is Live => fiberId._tag === 'Live'

export const isSynthetic = (fiberId: FiberId): fiberId is Synthetic => fiberId._tag === 'Synthetic'
