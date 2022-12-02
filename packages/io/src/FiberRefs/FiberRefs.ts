import * as C from '@fp-ts/data/Context'
import { isRight } from '@fp-ts/data/Either'
import { pipe } from '@fp-ts/data/Function'
import * as Option from '@fp-ts/data/Option'

import * as Effect from '../Effect/index.js'
import { FiberRef, FiberRefId } from '../FiberRef/FiberRef.js'
import { Future, pending } from '../Future/Future.js'
import { Lock, Semaphore, withPermit } from '../Semaphore.js'

export interface FiberRefs {
  /**
   * Retrieve the current state of FiberRefs as a Map
   */
  readonly getReferences: () => ReadonlyMap<FiberRef<any, any, any>, any>
  /**
   * Check to see if a FiberRef has a current value
   */
  readonly getOption: <R, E, A>(fiberRef: FiberRef<R, E, A>) => Option.Option<A>

  /**
   * Retrieve the current value of a FiberRef, initializing it if necessary.
   */
  readonly get: <R, E, A>(fiberRef: FiberRef<R, E, A>) => Effect.Effect<R, E, A>
  /**
   * Set the value of a FiberRef, returning the updated value.
   */
  readonly set: <R, E, A>(fiberRef: FiberRef<R, E, A>, a: A) => Effect.Effect<never, never, A>
  /**
   * Update the value of a FiberRef, returning the updated value.
   */
  readonly update: <R, E, A>(fiberRef: FiberRef<R, E, A>, f: (a: A) => A) => Effect.Effect<R, E, A>
  /**
   * Atomically modify the value of a FiberRef, returning your computed value.
   */
  readonly modify: <R, E, A, B>(
    fiberRef: FiberRef<R, E, A>,
    f: (a: A) => readonly [B, A],
  ) => Effect.Effect<R, E, B>

  /**
   * Delete the value of a FiberRef, returning the previous value. Future gets will re-initalize the value.
   */
  readonly delete: <R, E, A>(fiberRef: FiberRef<R, E, A>) => Effect.Effect<R, E, Option.Option<A>>

  /**
   * Modify the value of a Fiber using an Effect.
   */
  readonly modifyEffect: <R, E, A, R2, E2, B>(
    fiberRef: FiberRef<R, E, A>,
    f: (a: A) => Effect.Effect<R2, E2, readonly [B, A]>,
  ) => Effect.Effect<R | R2, E | E2, B>

  /**
   * Update the value of a FiberRef using an Effect.
   */
  readonly updateEffect: <R, E, A, R2, E2>(
    fiberRef: FiberRef<R, E, A>,
    f: (a: A) => Effect.Effect<R2, E2, A>,
  ) => Effect.Effect<R | R2, E | E2, A>

  /**
   * The calling Fiber will inherit/join all values into the parent fiber.
   */
  readonly inherit: Effect.Effect<never, never, void>

  /**
   * Fork the FiberRefs
   */
  readonly fork: () => FiberRefs

  /**
   * Join in the values of the child FiberRefs
   */
  readonly join: (child: FiberRefs) => void
}

export const FiberRefs = Object.assign(function makeFiberRefs(
  references: Iterable<readonly [FiberRef<any, any, any>, any]> = [],
): FiberRefs {
  const valuesById = new Map<FiberRefId<any>, any>(
    Array.from(references).map(([fiberRef, value]) => [fiberRef.id, value]),
  )
  const refsById = new Map<FiberRefId<any>, FiberRef<any, any, any>>(
    Array.from(references).map(([fiberRef]) => [fiberRef.id, fiberRef]),
  )
  const initializing = new Map<FiberRefId<any>, Future<any, any, any>>()
  const locks = new Map<FiberRefId<any>, Semaphore>()

  function fiberRefScoped(id: FiberRefId<any>) {
    return <R, E, A>(effect: Effect.Effect<R, E, A>) => {
      if (locks.has(id)) {
        return withPermit(locks.get(id) as Semaphore)(effect)
      }

      const l = Lock()

      locks.set(id, l)

      return withPermit(l)(effect)
    }
  }

  const getReferences = () => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return new Map(Array.from(valuesById).map(([id, value]) => [refsById.get(id)!, value]))
  }

  const getOption: FiberRefs['getOption'] = (fiberRef) => {
    if (valuesById.has(fiberRef.id)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return Option.some(valuesById.get(fiberRef.id)!)
    }

    return Option.none
  }

  const initialize: FiberRefs['get'] = (fiberRef) =>
    Effect.gen(function* () {
      if (initializing.has(fiberRef.id)) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return yield* Effect.wait(initializing.get(fiberRef.id)!)
      }

      const future = pending<any, any, any>()
      initializing.set(fiberRef.id, future)
      const exit = yield* Effect.attempt(fiberRef.initial)

      if (isRight(exit)) {
        refsById.set(fiberRef.id, fiberRef)
        valuesById.set(fiberRef.id, exit.right)
      }

      const eff = Effect.fromExit(exit)

      future.complete(eff)
      initializing.delete(fiberRef.id)

      return yield* eff
    })

  const get: FiberRefs['get'] = (fiberRef) =>
    pipe(
      getOption(fiberRef),
      Option.match(() => initialize(fiberRef), Effect.of),
    )

  const modifyEffect: FiberRefs['modifyEffect'] = (fiberRef, f) =>
    pipe(
      get(fiberRef),
      Effect.flatMap(f),
      Effect.flatMap(([b, a]) =>
        Effect.sync(() => {
          valuesById.set(fiberRef.id, a)
          refsById.set(fiberRef.id, fiberRef)

          return b
        }),
      ),
      fiberRefScoped(fiberRef.id),
    )

  const modify: FiberRefs['modify'] = (fiberRef, f) =>
    modifyEffect(fiberRef, (a) => Effect.of(f(a)))

  const update: FiberRefs['update'] = (fiberRef, f) =>
    modify(fiberRef, (a) => {
      const a2 = f(a)

      return [a2, a2]
    })

  const set: FiberRefs['set'] = (fiberRef, a) =>
    fiberRefScoped(fiberRef.id)(
      Effect.sync(() => {
        valuesById.set(fiberRef.id, a)
        refsById.set(fiberRef.id, fiberRef)

        return a
      }),
    )

  const delete_: FiberRefs['delete'] = (fiberRef) =>
    fiberRefScoped(fiberRef.id)(
      Effect.sync(() => {
        const option = getOption(fiberRef)

        valuesById.delete(fiberRef.id)
        refsById.delete(fiberRef.id)
        locks.delete(fiberRef.id)

        return option
      }),
    )

  const inherit: FiberRefs['inherit'] = pipe(
    Effect.getFiberRefs,
    Effect.flatMap((fiberRefs) => Effect.sync(() => fiberRefs.join(refs))),
  )

  const fork: FiberRefs['fork'] = () => {
    const refs = new Map()

    for (const [fiberRef, value] of getReferences()) {
      const option = fiberRef.fork(value)

      if (Option.isSome(option)) {
        refs.set(fiberRef, option.value)
      }
    }

    return makeFiberRefs(refs)
  }

  const join: FiberRefs['join'] = (child) => {
    for (const [fiberRef, value] of child.getReferences()) {
      const option = getOption(fiberRef)

      if (Option.isSome(option)) {
        valuesById.set(fiberRef.id, fiberRef.join(option.value, value))
      } else {
        valuesById.set(fiberRef.id, value)
      }
    }
  }

  const refs: FiberRefs = {
    getReferences,
    getOption,
    get,
    set,
    update,
    modify,
    delete: delete_,
    modifyEffect,
    updateEffect: (fiberRef, f) =>
      modifyEffect(fiberRef, (a) =>
        pipe(
          f(a),
          Effect.map((a) => [a, a]),
        ),
      ),
    inherit,
    fork,
    join,
  }

  return refs
},
C.Tag<FiberRefs>())
