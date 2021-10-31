import { left } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import { getOrElse, isSome } from 'fp-ts/Option'

import { Disposed } from '@/Cause'
import { Context } from '@/Context'
import { Disposable } from '@/Disposable'
import { Exit } from '@/Exit'
import { Fx, Of } from '@/Fx'
import * as MutableRef from '@/MutableRef'
import { MutableArray } from '@/MutableRef'
import * as Scope from '@/Scope'

import { Fiber, RuntimeFiber, Status, SyntheticFiber } from './Fiber'
import { FiberId } from './FiberId'
import { fromAsync } from './Instruction'
import { Runtime } from './Runtime'

export interface RuntimeFiberOptions<R, A> {
  readonly scope: Scope.LocalScope<R, A>
  readonly context: Context
}

export function makeRuntimeFiber<R, A>(
  fx: Fx<R, A>,
  options: RuntimeFiberOptions<R, A>,
): RuntimeFiber<A> {
  const { scope, context } = options
  const id = FiberId.make(
    context.scheduler.getCurrentTime(),
    MutableRef.getAndIncrement(Scope.getGlobal(scope).sequenceNumber),
  )

  const runtime = new Runtime(fx, scope, context)

  const exit = Fx(function* () {
    const option = scope.exit.get()

    if (isSome(option) && scope.finalized.get()) {
      return option.value
    }

    return yield* fromCb(scope.observers)
  })

  const fiber: Fiber<A> = {
    type: 'Runtime',
    id,
    status: runtime.status,
    context,
    scope,
    exit,
    dispose: async () => {
      await new Promise<Exit<A>>((resolve) => {
        const runtime = new Runtime(
          Fx(function* () {
            const { uninterruptible } = Scope.checkStatus(scope)

            if (uninterruptible) {
              yield* fromCb<void>(scope.interruptObservers)
            }

            const exit = pipe(
              scope.exit,
              MutableRef.get,
              getOrElse((): Exit<A> => left(Disposed)),
            )

            yield* pipe(scope, Scope.close(exit))

            return exit
          }),
          Scope.fork(scope),
          context,
        )

        pipe(
          scope.observers,
          MutableRef.append((a) => resolve(a)),
        )

        runtime.start()
      })
    },
  }

  runtime.start()

  return fiber
}

export function makeSyntheticFiber<A>(
  exit: Of<Exit<A>>,
  status: MutableRef.MutableRef<Status>,
  context: Context,
  disposable: Disposable,
): SyntheticFiber<A> {
  return {
    type: 'Synthetic',
    status,
    context,
    exit,
    dispose: () => disposable.dispose(),
  }
}

function fromCb<A>(observers: MutableArray<(a: A) => void>): Of<A> {
  return fromAsync<A>((cb) => {
    pipe(observers, MutableRef.append(cb))

    return {
      dispose: () => {
        pipe(observers, MutableRef.remove(cb))
      },
    }
  })
}
