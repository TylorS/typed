import { IO } from 'fp-ts/IO'

import { Branded } from '@/Branded'

export interface Clock {
  readonly getCurrentTime: IO<Time>
}

export type Time = Branded<number, { readonly Time: unique symbol }>
export const Time = Branded<Time>()
