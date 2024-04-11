import * as Async from "./Async.js"
import { Expected, Interrupted, Unexpected } from "./Cause.js"
import * as Effect from "./Effect.js"
import { isLeft, left, right } from "./Either"
import type * as Exit from "./Exit.js"
import type * as Fail from "./Fail.js"
import * as Disposable from "./internal/disposables.js"
import { withResolvers } from "./internal/withResolvers.js"
import { Scope } from "./Scope.js"

const getIterator = <R, A>(effect: Effect.Effect<R, A>): Iterator<R, A, any> => effect[Symbol.iterator]()

export const runSync = <A>(effect: Effect.Effect<never, A>): A => getIterator(effect).next().value

export const runSyncExit = <A, F extends Fail.Fail<any>>(
  effect: Effect.Effect<F, A>
): Exit.Exit<Fail.Fail.Error<F>, A> => {
  const iterator = getIterator(effect)
  const result = iterator.next()
  if (result.done) {
    return right(result.value)
  } else {
    return left(result.value.input)
  }
}

export const runFork = <A, F extends Fail.Fail<any> = never>(
  effect: Effect.Effect<Async.Async | Scope | F, A>,
  interruptible: boolean = true
): Async.Process<Fail.Fail.Error<F>, A> => {
  return runForkInternal(effect, new Disposable.DisposableSet(interruptible))
}

const runForkInternal = <E, A>(
  effect: Effect.Effect<Async.Async | Scope | Fail.Fail<E>, A>,
  scope: Disposable.DisposableSet
): Async.Process<E, A> => {
  const { promise, resolve } = withResolvers<Exit.Exit<E, A>>()

  runForkLoop(getIterator(effect), resolve, scope)

  return Object.assign(promise, {
    [Symbol.asyncDispose]: () => Disposable.asyncDispose(scope)
  })
}

async function runForkLoop<E, A>(
  iterator: Iterator<Async.Async | Scope | Fail.Fail<E>, A, any>,
  resolve: (exit: Exit.Exit<E, A>) => void,
  scope: Disposable.DisposableSet
): Promise<void> {
  try {
    let result = iterator.next()

    while (!result.done) {
      const instruction = result.value
      if (Effect.isService(instruction, Async.Async)) {
        const cmd = instruction.input

        if (cmd._tag === "Callback") {
          const { promise, resolve } = withResolvers<Exit.Exit<any, any>>()
          const inner = cmd.i0(makeResume(resolve))
          const ref = scope.add(inner)
          const exit = await promise

          Disposable.syncDispose(ref)

          if (isLeft(exit)) {
            return resolve(left(exit.left))
          } else if (scope.interruptible && scope.isDisposed) {
            return resolve(left(new Interrupted()))
          }

          result = iterator.next(exit.right)
        } else {
          result = iterator.next(runForkInternal(cmd.i0, scope.extend()))
        }
      } else if (Effect.isService(instruction, Scope)) {
        const cmd = instruction.input
        if (cmd._tag === "Add") {
          result = iterator.next(scope.add(cmd.i0))
        } else if (cmd._tag === "IsInterruptible") {
          result = iterator.next(scope.interruptible)
        } else {
          const exit = await runForkInternal<E, any>(cmd.i0, scope.extend(cmd.interruptible))

          if (isLeft(exit)) {
            return resolve(left(exit.left))
          } else if (scope.interruptible && scope.isDisposed) {
            return resolve(left(new Interrupted()))
          }

          result = iterator.next(exit.right)
        }
      } else {
        return resolve(left(instruction.input))
      }
    }

    resolve(right(result.value))
  } catch (u) {
    resolve(left(new Unexpected(u)))
  } finally {
    scope.hasCompleted()
    await Disposable.asyncDispose(scope)
  }
}

function makeResume<E, A>(resolve: (exit: Exit.Exit<E, A>) => void): Async.Async.Resume<E, A> {
  return {
    done: resolve,
    fail: (e) => resolve(left(new Expected(e))),
    failCause: (cause) => resolve(left(cause)),
    unexpected: (u) => resolve(left(new Unexpected(u))),
    succeed: (a) => resolve(right(a))
  }
}
