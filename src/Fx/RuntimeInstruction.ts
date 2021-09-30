import { Exit } from '@/Exit'

import { Fx } from './Fx'
import { Scope } from './Scope'

/**
 * Runtime instructions are used to implement asynchronous effects separately from Fx instructions
 * and deterime the exit value of an Fx.
 */
export type RuntimeInstruction<R, A> =
  | ExitInstruction<A>
  | PromiseInstruction<A>
  | ParallelInstruction<R>
  | RaceInstruction<R>

export interface ExitInstruction<A> {
  readonly type: 'Exit'
  readonly exit: Exit<A>
}

export interface PromiseInstruction<A> {
  readonly type: 'Promise'
  readonly promise: PromiseLike<A>
}

export interface ParallelInstruction<R> {
  readonly type: 'Parallel'
  readonly scope: Scope
  readonly requirements: R
  readonly fxs: ReadonlyArray<Fx<R, any>>
}

export interface RaceInstruction<R> {
  readonly type: 'Race'
  readonly scope: Scope
  readonly requirements: R
  readonly fxs: ReadonlyArray<Fx<R, any>>
}
