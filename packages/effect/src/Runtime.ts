import * as Async from "./Async.js"
import { Expected, Unexpected } from "./Cause.js"
import type { Cause } from "./Cause.js"
import * as Effect from "./Effect.js"
import { isLeft, left, right } from "./Either"
import type * as Exit from "./Exit.js"
import type * as Fail from "./Fail.js"
import { asyncDispose, DisposableSet, isSyncDisposable, syncDispose } from "./internal/disposables.js"
import { withResolvers } from "./internal/withResolvers.js"
import type { ScopeCommand } from "./Scope.js"
import { Scope } from "./Scope.js"

const iterator = <R, A>(effect: Effect.Effect<R, A>): Iterator<R, A, any> => effect[Symbol.iterator]()

export const runSync = <A>(effect: Effect.Effect<never, A>): A => iterator(effect).next().value

export const runSyncExit = <E, A>(effect: Effect.Effect<Fail.Fail<E>, A>): Exit.Exit<E, A> => {
  const iterator = effect[Symbol.iterator]()
  const result = iterator.next()
  if (result.done) {
    return right(result.value)
  } else {
    return left(result.value.input)
  }
}

export const runFork = <A, E = never>(
  effect: Effect.Effect<Async.Async | Scope | Fail.Fail<E>, A>,
  interruptible: boolean = true
): Async.Process<E, A> => {
  return runForkInternal(effect, new DisposableSet(interruptible))
}

const runForkInternal = <E, A>(
  effect: Effect.Effect<Async.Async | Scope | Fail.Fail<E>, A>,
  disposable: DisposableSet
): Async.Process<E, A> => {
  const { promise, resolve } = withResolvers<Exit.Exit<E, A>>()

  runForkLoop(effect[Symbol.iterator](), resolve, disposable)

  return Object.assign(promise, {
    [Symbol.asyncDispose]: () => asyncDispose(disposable)
  })
}

async function runForkLoop<E, A>(
  iterator: Iterator<Async.Async | Scope | Fail.Fail<E>, A, any>,
  resolve: (exit: Exit.Exit<E, A>) => void,
  parent: DisposableSet
): Promise<void> {
  try {
    let result = iterator.next()

    while (!result.done) {
      const instruction = result.value
      if (Effect.isService(instruction, Async.Async)) {
        const cmd = instruction.input
        switch (cmd._tag) {
          case "Callback": {
            const { promise, resolve } = withResolvers<Exit.Exit<any, any>>()
            const inner = cmd.i0(makeResume(resolve))
            const ref = parent.add(inner)
            const exit = await promise

            syncDispose(ref)
            if (isSyncDisposable(inner!)) {
              syncDispose(inner!)
            } else {
              await asyncDispose(inner!)
            }

            if (isLeft(exit)) {
              return resolve(left(exit.left))
            }

            result = iterator.next(exit.right)
            break
          }
          case "Fork": {
            const process = runForkInternal(cmd.i0, parent.extend())
            result = iterator.next(process)
            break
          }
        }
      } else if (Effect.isService(instruction, Scope)) {
        const cmd = instruction.input as ScopeCommand<any, any>
        if (cmd._tag === "Add") {
          result = iterator.next(parent.add(cmd.i0))
        } else if (cmd._tag === "IsInterruptible") {
          result = iterator.next(parent.interruptible)
        } else {
          const child = parent.extend(cmd.interruptible)
          const exit = await runForkInternal(cmd.i0, child)
          if (isLeft(exit)) {
            return resolve(left(exit.left as Cause<E>))
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
    parent.hasCompleted()
    await asyncDispose(parent)
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
