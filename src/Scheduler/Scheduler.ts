import { Clock } from '@/Clock'
import { Fiber } from '@/Fiber'
import { Fx } from '@/Fx'
import { StreamContext } from '@/Stream'

export interface Scheduler extends Clock {
  readonly asap: Asap
  readonly delay: Delay
  readonly periodic: Periodic
}

export type Asap = <R, E, A>(fx: Fx<R, E, A>, context: StreamContext<R, E>) => Fiber<E, A>

export type Delay = <R, E, A>(
  delay: number,
  fx: Fx<R, E, A>,
  context: StreamContext<R, E>,
) => Fiber<E, A>

export type Periodic = <R, E, A>(
  period: number,
  fx: Fx<R, E, A>,
  context: StreamContext<R, E>,
) => Fiber<E, never>
