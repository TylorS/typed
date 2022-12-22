import * as Effect from '@effect/io/Effect'
import * as Ref from '@effect/io/Ref'
import { equals } from '@fp-ts/data/Equal'
import { identity, pipe } from '@fp-ts/data/Function'
import * as MutableRef from '@fp-ts/data/MutableRef'
import * as Option from '@fp-ts/data/Option'

import { Fx } from '../Fx.js'

import { HoldSubject, isHoldSubject } from './HoldSubject.js'
import { Subject } from './Subject.js'

export interface RefSubject<A> extends HoldSubject<never, A>, Ref.Ref<A> {
  readonly get: Effect.Effect<never, never, A>
  readonly set: (a: A) => Effect.Effect<never, never, A>
  readonly update: (f: (a: A) => A) => Effect.Effect<never, never, A>
  readonly delete: Effect.Effect<never, never, Option.Option<A>>
}

export function makeRef<A>(
  initial: () => A,
  eq: (a: A, b: A) => boolean = equals,
): Effect.Effect<never, never, RefSubject<A>> {
  return Effect.sync(() => RefSubject.unsafeMake(initial, eq))
}

export namespace RefSubject {
  export function unsafeMake<A>(
    initial: () => A,
    eq: (a: A, b: A) => boolean = equals,
  ): RefSubject<A> {
    const mutableRef = MutableRef.make(Option.some(initial()))
    const subject = HoldSubject.unsafeMake<never, A>(mutableRef)

    const getValue = () =>
      pipe(
        mutableRef.get(),
        Option.getOrElse(() => {
          const a = initial()

          mutableRef.set(Option.some(a))

          return a
        }),
      )

    const modify = <B>(f: (a: A) => [B, A]): Effect.Effect<never, never, B> =>
      Effect.suspendSucceed(() => {
        const current = getValue()
        const [b, a] = f(current)

        if (eq(current, a)) {
          return Effect.succeed(b)
        }

        mutableRef.set(Option.some(a))

        return pipe(subject.event(a), Effect.as(b))
      })

    const refSubject: RefSubject<A> = {
      [Fx.TypeId]: subject[Fx.TypeId],
      [Subject.TypeId]: subject[Subject.TypeId],
      [HoldSubject.TypeId]: subject[HoldSubject.TypeId],
      [Ref.RefTypeId]: {
        _A: identity,
      },
      run: subject.run.bind(subject),
      event: subject.event.bind(subject),
      error: subject.error.bind(subject),
      end: subject.end,
      value: subject.value,
      modify,
      get get() {
        return Ref.get(refSubject)
      },
      set(a: A) {
        return Ref.updateAndGet(() => a)(refSubject)
      },
      update(f: (a: A) => A) {
        return Ref.updateAndGet(f)(refSubject)
      },
      delete: Effect.sync(() => {
        const option = mutableRef.get()

        // Next pull should recompute the initial value
        mutableRef.set(Option.none)

        return option
      }),
    }

    return refSubject
  }
}

export function isRefSubject<A>(u: unknown): u is RefSubject<A> {
  return isHoldSubject(u) && Ref.RefTypeId in u
}
