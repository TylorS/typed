import * as Effect from '@effect/io/Effect'
import * as Ref from '@effect/io/Ref'
import * as Synchronized from '@effect/io/Ref/Synchronized'
import * as TSemaphore from '@effect/stm/TSemaphore'
import { equals } from '@fp-ts/data/Equal'
import { identity, pipe } from '@fp-ts/data/Function'
import * as MutableRef from '@fp-ts/data/MutableRef'
import * as Option from '@fp-ts/data/Option'

import { Fx } from '../Fx.js'

import { HoldSubject } from './HoldSubject.js'
import { isRefSubject, RefSubject } from './RefSubject.js'
import { Subject } from './Subject.js'

export interface SynchronizedSubject<A> extends RefSubject<A>, Synchronized.Synchronized<A> {
  readonly updateEffect: <R2, E2>(f: (a: A) => Effect.Effect<R2, E2, A>) => Effect.Effect<R2, E2, A>
}

export function unsafeMake<A>(
  initial: () => A,
  eq: (a: A, b: A) => boolean = equals,
): SynchronizedSubject<A> {
  const mutableRef = MutableRef.make(Option.some(initial()))
  const subject = HoldSubject.unsafeMake<never, A>(mutableRef)
  const semaphore = TSemaphore.unsafeMake(1)
  const locked = TSemaphore.withPermit(semaphore)

  const getValue = () =>
    pipe(
      mutableRef.get(),
      Option.getOrElse(() => {
        const a = initial()

        mutableRef.set(Option.some(a))

        return a
      }),
    )

  const modifyEffect = <B, R2, E2>(
    f: (a: A) => Effect.Effect<R2, E2, readonly [B, A]>,
  ): Effect.Effect<R2, E2, B> =>
    locked(
      Effect.gen(function* ($) {
        const current = getValue()
        const [b, a] = yield* $(f(current))

        if (eq(current, a)) {
          return b
        }

        mutableRef.set(Option.some(a))

        yield* $(subject.event(a))

        return b
      }),
    )

  const modify = <B>(f: (a: A) => readonly [B, A]): Effect.Effect<never, never, B> =>
    modifyEffect((a) => Effect.sync(() => f(a)))

  const synchronizedSubject: SynchronizedSubject<A> = {
    [Fx.TypeId]: subject[Fx.TypeId],
    [Subject.TypeId]: subject[Subject.TypeId],
    [HoldSubject.TypeId]: subject[HoldSubject.TypeId],
    [Ref.RefTypeId]: {
      _A: identity,
    },
    [Synchronized.SynchronizedTypeId]: {
      _A: identity,
    },
    run: subject.run.bind(subject),
    event: subject.event.bind(subject),
    error: subject.error.bind(subject),
    end: subject.end,
    value: subject.value,
    modify,
    modifyEffect,
    get get() {
      return Synchronized.get(synchronizedSubject)
    },
    set(a: A) {
      return Ref.updateAndGet(() => a)(synchronizedSubject)
    },
    update(f: (a: A) => A) {
      return Ref.updateAndGet(f)(synchronizedSubject)
    },
    updateEffect<R2, E2>(f: (a: A) => Effect.Effect<R2, E2, A>) {
      return Synchronized.updateAndGetEffect(f)(synchronizedSubject)
    },
    delete: Effect.sync(() => {
      const option = mutableRef.get()

      // Next pull should recompute the initial value
      mutableRef.set(Option.none)

      return option
    }),
  }

  return synchronizedSubject
}

export function isSynchronizedSubject<A>(u: unknown): u is SynchronizedSubject<A> {
  return isRefSubject(u) && Synchronized.SynchronizedTypeId in u
}
