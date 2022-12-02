import { NonEmptyReadonlyArray } from '@fp-ts/data/ReadonlyArray'
import { Time } from '@typed/time'

export type FiberId = FiberId.Live | FiberId.Synthetic | FiberId.None

export namespace FiberId {
  export interface Live {
    readonly tag: 'Live'
    readonly id: number
    readonly startTime: Time
  }

  export interface Synthetic {
    readonly tag: 'Synthetic'
    readonly ids: NonEmptyReadonlyArray<FiberId>
  }

  export interface None {
    readonly tag: 'None'
  }
}

export function Live(id: number, startTime: Time): FiberId.Live {
  return {
    tag: 'Live',
    id,
    startTime,
  }
}

export function Synthetic(ids: NonEmptyReadonlyArray<FiberId>): FiberId.Synthetic {
  return {
    tag: 'Synthetic',
    ids,
  }
}

export const None: FiberId.None = { tag: 'None' }
