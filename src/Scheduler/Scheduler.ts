import { Clock } from '@/Clock'
import { Context } from '@/Context'
import { Fiber } from '@/Fiber'
import { Fx } from '@/Fx'
import { Scope } from '@/Scope'

export interface Scheduler extends Clock {
  readonly asap: Asap
  readonly delay: Delay
  readonly periodic: Periodic
}

export type Asap = <R, E, A>(
  fx: Fx<R, E, A>,
  resources: R,
  context: Context<E>,
  scope: Scope<E, A>,
) => Fiber<E, A>

export type Delay = <R, E, A>(
  delay: number,
  fx: Fx<R, E, A>,
  resources: R,
  context: Context<E>,
  scope: Scope<E, A>,
) => Fiber<E, A>

export type Periodic = <R, E, A>(
  period: number,
  fx: Fx<R, E, A>,
  resources: R,
  context: Context<E>,
  scope: Scope<E, A>,
) => Fiber<E, never>
