import { Disposable } from '@typed/disposable'
import * as Exit from '@typed/exit'

import { Effect } from '../Effect/Effect.js'
import * as FiberId from '../FiberId/FiberId.js'

export type Fiber<E, A> = RuntimeFiber<E, A> | SyntheticFiber<E, A>

// TODO: Tracing
export interface RuntimeFiber<Errors, Output> extends Omit<SyntheticFiber<Errors, Output>, 'tag'> {
  readonly tag: 'Runtime'
  readonly addObserver: (observer: (exit: Exit.Exit<Errors, Output>) => void) => Disposable
}

export function Runtime<E, A>(options: Omit<RuntimeFiber<E, A>, 'tag'>): RuntimeFiber<E, A> {
  return { tag: 'Runtime', ...options }
}

export interface SyntheticFiber<Errors, Output> {
  readonly tag: 'Synthetic'
  readonly id: FiberId.FiberId
  readonly exit: Effect<never, never, Exit.Exit<Errors, Output>>
  readonly inheritRefs: Effect<never, never, void>
  readonly interruptAs: (id: FiberId.FiberId) => Effect<never, never, Exit.Exit<Errors, Output>>
}

export function Synthetic<E, A>(options: Omit<SyntheticFiber<E, A>, 'tag'>): SyntheticFiber<E, A> {
  return { tag: 'Synthetic', ...options }
}

export function match<E, A, B, C>(
  onSynthetic: (fiber: SyntheticFiber<E, A>) => B,
  onRuntime: (fiber: RuntimeFiber<E, A>) => C,
) {
  return (fiber: Fiber<E, A>): B | C =>
    fiber.tag === 'Synthetic' ? onSynthetic(fiber) : onRuntime(fiber)
}
