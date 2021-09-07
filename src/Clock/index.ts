import { Branded } from '@/Branded'
import { Pure } from '@/Fx/Fx'

export interface Clock {
  readonly getCurrentTime: Pure<Time>
}

export type Time = Branded<number, { readonly Time: unique symbol }>
export const Time = Branded<Time>()
