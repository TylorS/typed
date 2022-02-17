import { Branded } from '@/Prelude/Branded'
import { flow, Lazy } from '@/Prelude/function'

export interface Clock {
  readonly getCurrentTime: Lazy<Time>
}

export type Time = Branded<number, 'Time'>
export const Time = Branded<Time>()

export const DateClock: Clock = {
  getCurrentTime: flow(Date.now, Time),
}

export const relative = (clock: Clock, offset: number = clock.getCurrentTime()): Clock => ({
  getCurrentTime: () => Time(clock.getCurrentTime() - offset),
})

export const relativeDateClock = relative(DateClock)
