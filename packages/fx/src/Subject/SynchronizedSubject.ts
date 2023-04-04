import { equals } from '@effect/data/Equal'
import { identity, pipe } from '@effect/data/Function'
import * as Option from '@effect/data/Option'
import * as Effect from '@effect/io/Effect'
import * as Ref from '@effect/io/Ref'
import * as Synchronized from '@effect/io/Ref/Synchronized'

import { Fx } from '../Fx.js'
import { Mutable } from '../_internal/Mutable.js'

import { HoldSubject } from './HoldSubject.js'
import { Computed, isRefSubject, RefSubject } from './RefSubject.js'
import { Subject } from './Subject.js'

export interface SynchronizedSubject<A> extends RefSubject<A>, Synchronized.Synchronized<A> {
  readonly updateEffect: <R2, E2>(f: (a: A) => Effect.Effect<R2, E2, A>) => Effect.Effect<R2, E2, A>
}

export function makeSynchronized<A>(
  initial: () => A,
  eq: (a: A, b: A) => boolean = equals,
): Effect.Effect<never, never, SynchronizedSubject<A>> {
  return Effect.sync(() => SynchronizedSubject.unsafeMake(initial, eq))
}

export namespace SynchronizedSubject {
  export function unsafeMake<A>(
    initial: () => A,
    eq: (a: A, b: A) => boolean = equals,
  ): SynchronizedSubject<A> {
    const current = Mutable(Option.some(initial()))
    const subject = HoldSubject.unsafeMake<never, A>(current)
    const locked = Effect.unsafeMakeSemaphore(1).withPermits(1)

    const getValue = () =>
      pipe(
        current.get(),
        Option.getOrElse(() => {
          const a = initial()

          current.set(Option.some(a))

          return a
        }),
      )

    const modifyEffect = <B, R2, E2>(
      f: (a: A) => Effect.Effect<R2, E2, readonly [B, A]>,
    ): Effect.Effect<R2, E2, B> =>
      locked(
        Effect.gen(function* ($) {
          const next = getValue()
          const [b, a] = yield* $(f(next))

          if (eq(next, a)) {
            return b
          }

          current.set(Option.some(a))

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
      current,
      eq,
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
        const value = getValue()

        current.set(Option.some(value))

        return value
      }),
      compute: (f) => Computed.make(synchronizedSubject, f),
      computeSync: (f) => Computed.make(synchronizedSubject, (a) => Effect.sync(() => f(a))),
    }

    return synchronizedSubject
  }
}

export function isSynchronizedSubject<A>(u: unknown): u is SynchronizedSubject<A> {
  return isRefSubject(u) && Synchronized.SynchronizedTypeId in u
}
