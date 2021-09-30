import { constant } from 'fp-ts/lib/function'

import { Settable } from '@/Cancelable/settable'
import { Exit } from '@/Exit'
import { Fiber, FiberId } from '@/Fiber'

import { fromPromise, of } from '../Computations'
import { Fx } from '../Fx'
import { Scope } from '../Scope'
import { DefaultRuntime } from './DefaultRuntime'

export function createFiber<R, A>(
  fx: Fx<R, A>,
  requirements: R,
  scope: Scope,
  description?: string,
): Fiber<A> {
  const id = FiberId(Symbol(description))
  const cancelable = new Settable()
  const promise = new Promise<Exit<A>>((resolve) => {
    cancelable.add(new DefaultRuntime().runMain(fx, scope, requirements, resolve))
  })

  return {
    id,
    cancel: cancelable.cancel,
    exit: fromPromise(constant(promise)),
    scope: of(scope),
  }
}
