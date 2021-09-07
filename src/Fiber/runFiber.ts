import * as Either from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'

import { Async } from '@/Async'
import * as AR from '@/AtomicReference'
import { AtomicReference } from '@/AtomicReference'
import * as C from '@/Cause'
import { settable, SettableDisposable } from '@/Disposable'
import { DeepEqual } from '@/Eq'
import * as Exit from '@/Exit'
import { unsafeMakeFiberRef } from '@/FiberRef'
import { Fx, Instruction } from '@/Fx'

import { Fiber } from './Fiber'
import { FiberDescriptor } from './FiberDescriptor'
import { FiberId, unsafeFiberId } from './FiberId'
import { FiberStatus } from './FiberStatus'
import { forkScope, joinScope, makeEmptyScope, Scope, updateRequirements } from './Scope'

export function runFiber<R>(requirements: R, scope: Scope<R> = makeEmptyScope<R>(requirements)) {
  return <E, A>(fx: Fx<R, E, A>): Fiber<R, E, A> => runFiber_(fx, new AtomicReference(scope))
}

function runFiber_<R, E, A>(fx: Fx<R, E, A>, scope: AtomicReference<Scope<R>>): Fiber<R, E, A> {
  const id = unsafeFiberId()
  const outer = settable()
  const { complete, fail, interruptable, interruptAs, getDescriptor } = makeFiberState<R, E, A>(
    id,
    scope,
    outer,
  )
  const promise = runFx_(fx, interruptable, scope, outer)
    .then(async (exit) => await complete(exit, Either.isLeft(exit) && C.isInterrupted(exit.left)))
    .catch(fail)

  const fiber: Fiber<R, E, A> = {
    id,
    descriptor: getDescriptor,
    await: promise,
    interruptAs,
  }

  return fiber
}

async function runFx_<R, E, A>(
  fx: Fx<R, E, A>,
  interruptable: Interruptable,
  scope: AtomicReference<Scope<R>>,
  disposable: SettableDisposable,
): Promise<Exit.Exit<E, A>> {
  try {
    const gen = fx[Symbol.iterator]()

    return await interpretFx_(gen, gen.next(), interruptable, scope, disposable)
  } catch (error) {
    return Either.left(C.Died(error))
  }
}

// TODO: Handle finalizations
async function interpretFx_<R, E, A>(
  generator: Generator<Instruction<R, E, any>, A>,
  result: IteratorResult<Instruction<R, E, any>, A>,
  interruptable: Interruptable,
  scope: AtomicReference<Scope<R>>,
  outer: SettableDisposable,
): Promise<Exit.Exit<E, A>> {
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  while (!result.done) {
    const instruction = result.value

    switch (instruction._tag) {
      case 'Cause':
        return Either.left(instruction.effect)

      case 'Either': {
        const either = instruction.effect

        if (Either.isLeft(either)) {
          return Either.left(C.Expected(either.left))
        }

        result = generator.next(either.right)

        break
      }

      case 'IOEither': {
        const either = instruction.effect()

        if (Either.isLeft(either)) {
          return Either.left(C.Expected(either.left))
        }

        result = generator.next(either.right)

        break
      }

      case 'ReaderEither': {
        const either = instruction.effect(scope.get.requirements)

        if (Either.isLeft(either)) {
          return Either.left(C.Expected(either.left))
        }

        result = generator.next(either.right)

        break
      }

      case 'PromiseInstruction': {
        result = generator.next(await instruction.effect)

        break
      }

      case 'ReaderTaskEither': {
        const either = await instruction.effect(scope.get.requirements)()

        if (Either.isLeft(either)) {
          return Either.left(C.Expected(either.left))
        }

        result = generator.next(either.right)

        break
      }

      case 'Async': {
        const either = await trackAsyncResources(instruction.effect, scope.get.requirements, outer)

        if (Either.isLeft(either)) {
          return Either.left(C.Expected(either.left))
        }

        result = generator.next(either.right)

        break
      }

      case 'Suspend': {
        await generator.next(await interruptable.suspend(instruction.resume))

        break
      }

      case 'InterruptibleStatus': {
        interruptable.isInterruptable.set(instruction.isInterruptible)

        result = generator.next(instruction.isInterruptible)

        break
      }

      case 'Fork': {
        const local = new AtomicReference(forkScope(scope.get))
        const fiber = runFiber_(instruction.fx, local)

        result = generator.next(fiber)

        break
      }

      case 'Join': {
        const fiber = instruction.fiber
        const descriptor = fiber.descriptor()

        scope.set(joinScope(scope.get, descriptor.scope))

        const exit = await fiber.await

        if (Either.isLeft(exit)) {
          return exit
        }

        result = generator.next(exit.right)

        break
      }

      case 'Disposable': {
        result = generator.next(outer.add(instruction.disposable))

        break
      }

      case 'Provide': {
        const updatedScope = new AtomicReference(
          updateRequirements(
            {
              ...scope.get.requirements,
              ...(instruction.requirements as {}),
            },
            scope.get,
          ),
        )

        const inner = settable()
        const { dispose } = outer.add(inner)
        const exit = await runFx_(instruction.fx, interruptable, updatedScope, inner)

        if (Either.isLeft(exit)) {
          return exit
        }

        await dispose()

        result = generator.next(exit.right)

        break
      }

      case 'MakeFiberRef': {
        const fiberRef = unsafeMakeFiberRef(
          instruction.initial,
          instruction.options.equals ?? DeepEqual.equals,
        )

        scope.get.references.set(fiberRef.id, fiberRef.initial)

        result = generator.next(fiberRef)

        break
      }

      case 'ModifyFiberRef': {
        result = generator.next(
          pipe(
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            scope.get.references.get(instruction.fiberRef.id)!,
            AR.modify(instruction.fiberRef)(instruction.modify),
          ),
        )

        break
      }
    }
  }

  return Either.right(result.value)
}

async function trackAsyncResources<R, E, A>(
  async: Async<R, E, A>,
  requirements: R,
  outer: SettableDisposable,
): Promise<Either.Either<E, A>> {
  const inner = settable()
  const { dispose } = outer.add(inner)

  try {
    return await new Promise((resolve) => inner.add(async.runAsync(requirements, resolve)))
  } finally {
    await dispose()
  }
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function makeFiberState<R, E, A>(
  id: FiberId,
  scope: AtomicReference<Scope<R>>,
  outer: SettableDisposable,
) {
  const isInterruptible = new AtomicReference(true)

  const status = new AtomicReference<FiberStatus<E, A>>({
    _tag: 'Running',
    interrupting: false,
    get interruptible() {
      return isInterruptible.get
    },
  })

  const interruptable = new Interruptable(async (cb) => {
    return await new Promise((resolve) => {
      status.set({
        _tag: 'Suspended',
        previous: status.get,
        get interruptible() {
          return isInterruptible.get
        },
      })

      cb(resolve)
    })
  }, isInterruptible)

  function getDescriptor(): FiberDescriptor<R, E, A> {
    return {
      id,
      get isInterruptible() {
        return isInterruptible.get
      },
      get status() {
        return status.get
      },
      get scope() {
        return scope.get
      },
    }
  }

  async function complete(exit: Exit.Exit<E, A>, interrupting: boolean): Promise<Exit.Exit<E, A>> {
    const currentStatus = status.get

    if (currentStatus._tag === 'Completed' || currentStatus._tag === 'Failed') {
      return exit
    }

    status.set({
      _tag: interrupting ? 'Finishing' : 'Running',
      interrupting,
      interruptible: false,
    })

    await Promise.all([outer.dispose(), interruptable.dispose()])

    pipe(
      exit,
      Either.matchW(
        (cause) => status.set({ _tag: 'Failed', cause }),
        (value) => status.set({ _tag: 'Completed', value }),
      ),
    )

    return exit
  }

  async function fail(error: unknown): Promise<Exit.Exit<E, A>> {
    return await complete(Either.left(C.Died(error)), true)
  }

  async function interruptAs(id: FiberId): Promise<Exit.Exit<E, A>> {
    const s = status.get

    if (s._tag === 'Completed') {
      return Either.right(s.value)
    }

    if (s._tag === 'Failed') {
      return Either.left(s.cause)
    }

    if (s.interruptible) {
      return await complete(Either.left(C.Interrupted(id)), true)
    }

    await interruptable.await()

    return await interruptAs(id)
  }

  return {
    interruptable,
    getDescriptor,
    complete,
    fail,
    interruptAs,
  } as const
}

class Interruptable {
  private readonly interrupters: Set<() => void> = new Set()

  constructor(
    readonly suspend: (resume: (cb: () => void) => void) => Promise<void>,
    readonly isInterruptable: AtomicReference<boolean>,
  ) {}

  readonly await = async (): Promise<void> =>
    await new Promise<void>((resolve) => this.interrupters.add(resolve))

  readonly complete = (): void => this.interrupters.forEach((f) => f())

  readonly dispose = (): void => {
    this.interrupters.clear()
  }
}
