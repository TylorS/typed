import * as Either from 'fp-ts/Either'

import { Cancelable } from '@/Cancelable'
import { match } from '@/Cause'
import { Exit } from '@/Exit'

import { Fx, OutputOf } from './Fx'
import { Runtime } from './Runtime'
import { Scope } from './Scope'

export function runFxToExit<R, E, A>(
  fx: Fx<R, E, A>,
  requirements: R,
  onExit: (exit: Exit<E, A>) => void,
  scope: Scope = new Scope(),
): Cancelable {
  return new Runtime(fx).runMain(scope, requirements, onExit)
}

export function runPromiseExit<R>(reqirements: R, scope?: Scope) {
  return async <E, A>(fx: Fx<R, E, A>): Promise<Exit<E, A>> =>
    await new Promise((resolve) => runFxToExit(fx, reqirements, resolve, scope))
}

export async function runMain<F extends Fx<unknown, any, any>>(
  fx: F,
  scope: Scope = new Scope(),
): Promise<OutputOf<F>> {
  return await new Promise((resolve, reject) => {
    runFxToExit(
      fx,
      {},
      Either.matchW(
        match(
          (expected) => reject(new Error(`Expected error: ${JSON.stringify(expected, null, 2)}`)),
          (unexpected) =>
            reject(
              unexpected instanceof Error
                ? unexpected
                : new Error(`Unexpected: ${JSON.stringify(unexpected, null, 2)}`),
            ),
          () => reject(new Error('Canceled')),
        ),
        resolve,
      ),
      scope,
    )
  })
}
