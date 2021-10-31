import { match } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'

import * as Context from '@/Context'
import { Exit } from '@/Exit'
import { Runtime } from '@/Fiber/Runtime'
import { append } from '@/MutableRef'
import { LocalScope, makeLocalScope } from '@/Scope'

import { Of, OutputOf } from './Fx'

export async function runMain<T extends Of<any>>(
  fx: T,
  context: Context.Context,
  scope: LocalScope<unknown, OutputOf<T>> = makeLocalScope<unknown, OutputOf<T>>({}),
): Promise<OutputOf<T>> {
  return await new Promise<OutputOf<T>>((resolve, reject) => {
    pipe(scope.observers, append<(exit: Exit<OutputOf<T>>) => void>(match(reject, resolve)))

    new Runtime(fx, scope, context).start()
  })
}
