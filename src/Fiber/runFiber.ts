import * as AP from 'fp-ts/Apply'
import * as Either from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'

import { Async } from '@/Async'
import * as AR from '@/AtomicReference'
import { AtomicReference } from '@/AtomicReference'
import * as C from '@/Cause'
import { Cause, getBothSemigroup } from '@/Cause'
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

  const { complete, interruptable, dispose, getDescriptor } = makeFiberState<R, E, A>(
    id,
    scope,
    outer,
  )

  const fiber: Fiber<R, E, A> = {
    id,
    descriptor: getDescriptor,
    exit: runFx_(fx, interruptable, scope, outer).then(
      async (exit) =>
        await complete(exit, {
          _tag: 'Running',
          interruptible: false,
          interrupting: false,
        }),
    ),
    dispose,
  }

  return fiber
}

async function runFx_<R, E, A>(
  fx: Fx<R, E, A>,
  interruptable: Interruptable,
  scope: AtomicReference<Scope<R>>,
  disposable: SettableDisposable<any>,
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
  outer: SettableDisposable<any>,
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
        result = generator.next(await instruction.effect())

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

      case 'InterruptibleStatus': {
        if (interruptable.isInterruptable.get) {
          interruptable.isInterruptable.set(instruction.isInterruptible)
        }

        if (interruptable.isInterruptable.get) {
          // Allow interrupters to continue on the next tick
          void Promise.resolve().then(interruptable.complete)
        }

        result = generator.next(interruptable.isInterruptable.get)

        break
      }

      case 'Fork': {
        const fiber = runFiber_(instruction.fx, new AtomicReference(forkScope(scope.get)))

        outer.add(fiber)

        result = generator.next(fiber)

        break
      }

      case 'Join': {
        const fiber = instruction.fiber

        const exit = await fiber.exit

        joinScope(scope, fiber.descriptor().scope)

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
        const local = new AtomicReference(
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
        const exit = await runFx_(instruction.fx, interruptable, local, inner)

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

        scope.get.references.set(fiberRef.id, new AtomicReference(fiberRef.initial))

        result = generator.next(fiberRef)

        break
      }

      case 'ModifyFiberRef': {
        const local = scope.get
        const fiberRef = instruction.fiberRef
        const id = fiberRef.id

        if (!local.references.has(id)) {
          local.references.set(id, new AtomicReference(fiberRef.initial))
        }

        const inner = settable()
        const { dispose } = outer.add(inner)

        const exit = await runFx_(
          pipe(
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            local.references.get(id)!,
            AR.modify(instruction.modify),
          ),
          interruptable,
          scope,
          outer,
        )

        if (Either.isLeft(exit)) {
          return exit
        }

        await dispose()

        result = generator.next(exit.right)

        break
      }

      case 'Zip': {
        const exit = await zipFx_<R, E>(instruction.fxs, interruptable, scope, outer)

        if (Either.isLeft(exit)) {
          return exit
        }

        result = generator.next(exit.right)

        break
      }

      case 'Race': {
        const exit = await raceFx_<R, E, any>(instruction.fxs, interruptable, scope, outer)

        if (Either.isLeft(exit)) {
          return exit
        }

        result = generator.next(exit.right)

        break
      }

      case 'OrElse': {
        const exit = await runFx_(instruction.fx, interruptable, scope, outer)

        if (Either.isLeft(exit) && exit.left._tag === 'Expected') {
          const alt = await runFx_(instruction.orElse(exit.left.error), interruptable, scope, outer)

          if (Either.isRight(alt)) {
            result = generator.next(alt.right)

            break
          }
        }

        if (Either.isLeft(exit)) {
          return exit
        }

        result = generator.next(exit.right)

        break
      }
    }
  }

  return Either.right(result.value)
}

async function trackAsyncResources<R, E, A>(
  async: Async<R, E, A>,
  requirements: R,
  outer: SettableDisposable<any>,
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
  outer: SettableDisposable<any>,
) {
  const isInterruptible = new AtomicReference(true)

  const status = new AtomicReference<FiberStatus<E, A>>({
    _tag: 'Running',
    interrupting: false,
    get interruptible() {
      return isInterruptible.get
    },
  })

  const interruptable = new Interruptable(isInterruptible)

  function getDescriptor(): FiberDescriptor<R, E, A> {
    return {
      id,
      isInterruptible: isInterruptible.get,
      status: status.get,
      scope: scope.get,
    }
  }

  async function complete(
    exit: Exit.Exit<E, A>,
    nextStatus: FiberStatus<E, A>,
  ): Promise<Exit.Exit<E, A>> {
    const currentStatus = status.get

    if (currentStatus._tag === 'Completed' || currentStatus._tag === 'Failed') {
      return exit
    }

    status.set(nextStatus)

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

  async function dispose(): Promise<Exit.Exit<E, A>> {
    const s = status.get

    if (s._tag === 'Completed') {
      return Either.right(s.value)
    }

    if (s._tag === 'Failed') {
      return Either.left(s.cause)
    }

    if (s.interruptible) {
      return await complete(Either.left(C.Interrupted), {
        _tag: 'Running',
        interruptible: false,
        interrupting: true,
      })
    }

    await interruptable.await()

    return await dispose()
  }

  return {
    interruptable,
    getDescriptor,
    complete,
    dispose,
  } as const
}

class Interruptable {
  private readonly interrupters: Set<() => void> = new Set()

  constructor(readonly isInterruptable: AtomicReference<boolean>) {}

  readonly await = async (): Promise<void> =>
    await new Promise<void>((resolve) => this.interrupters.add(resolve))

  readonly complete = (): void => this.interrupters.forEach((f) => f())

  readonly dispose = (): void => {
    this.interrupters.clear()
  }
}

async function zipFx_<R, E>(
  fxs: ReadonlyArray<Fx<R, any, any>>,
  interruptable: Interruptable,
  scope: AtomicReference<Scope<R>>,
  outer: SettableDisposable<any>,
): Promise<Exit.Exit<E, readonly any[]>> {
  const current = settable()

  const { dispose } = outer.add(current)

  const exit = await new Promise<Exit.Exit<E, readonly any[]>>((resolve, reject) => {
    let values = Array(fxs.length)
    let referenceCount = fxs.length

    function complete(x: Exit.Exit<any, any>, index: number): void {
      referenceCount--

      if (Either.isLeft(x)) {
        values = []

        return resolve(x)
      }

      values[index] = x.right

      if (referenceCount === 0) {
        resolve(Either.right(values))
      }
    }

    void Promise.all(
      fxs.map(
        async (fx, i) =>
          await runFx_(fx, interruptable, scope, current).then((e) => complete(e, i)),
      ),
    ).catch(reject)
  })

  await Promise.all([current.dispose(), dispose()])

  return exit
}

async function raceFx_<R, E, A>(
  fxs: ReadonlyArray<Fx<R, any, any>>,
  interruptable: Interruptable,
  scope: AtomicReference<Scope<R>>,
  outer: SettableDisposable<any>,
): Promise<Exit.Exit<E, A>> {
  const current = settable()

  const { dispose } = outer.add(current)

  const exit = await new Promise<Exit.Exit<E, A>>((resolve, reject) => {
    const causes: Array<Cause<E>> = []
    let referenceCount = fxs.length

    const validation = Either.getApplicativeValidation(getBothSemigroup<E>())
    const { concat: concatErrors } = AP.getApplySemigroup(validation)({
      concat: (): unknown => undefined,
    })

    function complete(x: Exit.Exit<any, any>): void {
      referenceCount--

      if (Either.isLeft(x)) {
        causes.push(x.left)

        if (referenceCount === 0) {
          const [f, ...rest] = causes.map(Either.left)

          resolve(rest.reduce(concatErrors, f) as Exit.Exit<E, A>)
        }

        return
      }

      resolve(x)
    }

    void Promise.all(
      fxs.map(async (fx) => await runFx_(fx, interruptable, scope, current).then(complete)),
    ).catch(reject)
  })

  await Promise.all([current.dispose(), dispose()])

  return exit
}
