import * as Either from 'fp-ts/Either'
import { flow } from 'fp-ts/function'

import { Cancelable } from '@/Cancelable'
import { match } from '@/Cause'
import { Exit } from '@/Exit'

import { DefaultRuntime } from './DefaultRuntime'
import { Fx, OutputOf } from './Fx'
import { Scope } from './Scope'

export function runMainToExit<R, A>(
  fx: Fx<R, A>,
  requirements: R,
  onExit: (exit: Exit<A>) => void,
  scope: Scope,
): Cancelable {
  return new DefaultRuntime().runMain<R, A>(fx, scope, requirements, onExit)
}

export async function runMainPromise<F extends Fx<unknown, any>>(
  fx: F,
  scope: Scope,
): Promise<OutputOf<F>> {
  return await new Promise((resolve, reject) => {
    runMainToExit(fx, {}, Either.matchW(flow(encodeError, reject), resolve), scope)
  })
}

export function runToExit<R, A>(
  fx: Fx<R, A>,
  requirements: R,
  onExit: (exit: Exit<A>) => void,
  scope: Scope,
): Cancelable {
  return new DefaultRuntime().runFx(fx, scope, requirements, onExit)
}

export async function runPromise<F extends Fx<unknown, any>>(
  fx: F,
  scope: Scope,
): Promise<OutputOf<F>> {
  return await new Promise((resolve, reject) => {
    runToExit(fx, {}, Either.matchW(flow(encodeError, reject), resolve), scope)
  })
}

const encodeError = match(
  (unexpected) =>
    unexpected instanceof Error
      ? unexpected
      : new Error(`Unexpected: ${JSON.stringify(unexpected, null, 2)}`),

  () => new Error('Canceled'),
)
