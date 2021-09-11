import { Branded } from '@/Branded'
import { fromReader } from '@/Fx'
import { Fx, Pure, RFx } from '@/Fx/Fx'

export interface Clock {
  readonly getCurrentTime: Pure<Time>
}

export type Time = Branded<number, { readonly Time: unique symbol }>
export const Time = Branded<Time>()

export const getCurrentTime: RFx<Clock, Time> = Fx(function* () {
  const get = yield* fromReader((c: Clock) => c.getCurrentTime)

  return yield* get
})
