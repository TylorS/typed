import { equals } from '@effect/data/Equal'
import { identity, pipe, dual, flow } from '@effect/data/Function'
import * as MutableRef from '@effect/data/MutableRef'
import * as Option from '@effect/data/Option'
import * as ReadonlyArray from '@effect/data/ReadonlyArray'
import * as ReadonlyRecord from '@effect/data/ReadonlyRecord'
import * as Equivalence from '@effect/data/typeclass/Equivalence'
import * as Effect from '@effect/io/Effect'
import type * as Exit from '@effect/io/Exit'
import * as Ref from '@effect/io/Ref'
import type * as Scope from '@effect/io/Scope'

import { Fx, Sink } from '../Fx.js'
import { flatMapEffect } from '../operator/flatMapEffect.js'
import { hold } from '../operator/hold.js'
import { skipWhile } from '../operator/skipWhile.js'
import { observe } from '../run/observe.js'

import { HoldSubject, isHoldSubject } from './HoldSubject.js'
import { Subject } from './Subject.js'

export interface RefSubject<A> extends HoldSubject<never, A>, Ref.Ref<A> {
  readonly eq: Equivalence.Equivalence<A>
  readonly get: Effect.Effect<never, never, A>
  readonly set: (a: A) => Effect.Effect<never, never, A>
  readonly update: (f: (a: A) => A) => Effect.Effect<never, never, A>
  readonly delete: Effect.Effect<never, never, A>
  readonly compute: <R, E, B>(
    f: (a: A) => Effect.Effect<R, E, B>,
  ) => Effect.Effect<R | Scope.Scope, never, Computed<E, B>>
  readonly computeSync: <B>(f: (a: A) => B) => Effect.Effect<Scope.Scope, never, Computed<never, B>>
}

export function makeRef<A>(
  initial: () => A,
  eq: Equivalence.Equivalence<A> = equals,
): Effect.Effect<never, never, RefSubject<A>> {
  return Effect.sync(() => RefSubject.unsafeMake(initial, eq))
}

export namespace RefSubject {
  export type ValueOf<T> = T extends RefSubject<infer A> ? A : never

  export function unsafeMake<A>(
    initial: () => A,
    eq: Equivalence.Equivalence<A> = equals,
  ): RefSubject<A> {
    const current = MutableRef.make(Option.some(initial()))
    const subject = HoldSubject.unsafeMake<never, A>(current)

    const getValue = () => pipe(current.get(), Option.getOrElse(initial))

    const modify = <B>(f: (a: A) => readonly [B, A]): Effect.Effect<never, never, B> =>
      Effect.suspendSucceed(() => {
        const currentValue = getValue()
        const [b, a] = f(currentValue)

        current.set(Option.some(a))

        if (eq(currentValue, a)) {
          return Effect.succeed(b)
        }

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
      eq,
      modify,
      ...makeDerivations(modify, Effect.sync(getValue)),
      delete: Effect.sync(() => {
        const option = current.get()
        const reset = initial()
        current.set(Option.some(reset))

        return Option.getOrElse(option, () => reset)
      }),
      compute: (f) => makeComputed(refSubject, f),
      computeSync: (f) => makeComputed(refSubject, (a) => Effect.sync(() => f(a))),
    }

    return refSubject
  }

  export function tuple<Subjects extends ReadonlyArray.NonEmptyReadonlyArray<RefSubject<any>>>(
    ...subjects: Subjects
  ): Effect.Effect<
    Scope.Scope,
    never,
    RefSubject<{ readonly [K in keyof Subjects]: ValueOf<Subjects[K]> }>
  > {
    type Val = { readonly [K in keyof Subjects]: ValueOf<Subjects[K]> }
    const length = subjects.length

    const getUnderlyingValues = Effect.tuple(
      ...ReadonlyArray.mapNonEmpty(subjects, (s) => s.get),
    ) as Effect.Effect<never, never, Val>

    const eq = Equivalence.tuple(
      ...ReadonlyArray.mapNonEmpty(subjects, (s) => s.eq),
    ) as Equivalence.Equivalence<Val>

    return Effect.gen(function* ($) {
      const initial = yield* $(getUnderlyingValues)
      const refSubject = unsafeMake(() => initial, eq)

      const updateAtIndex =
        <I extends keyof Val & number>(i: I) =>
        (a: Val[I]) =>
          Effect.gen(function* ($) {
            const current = yield* $(refSubject.get)
            const next = current.slice()
            next[i] = a

            yield* $(refSubject.set(next as Val))
          })

      // Override event to replicate events into underlying subjects
      const event = (val: Val) =>
        Effect.tuple(...ReadonlyArray.mapNonEmpty(subjects, (s, i) => s.event(val[i])))

      // Override modify to replicate events into underlying subjects
      const modify = <B>(f: (a: Val) => readonly [B, Val]): Effect.Effect<never, never, B> =>
        Effect.gen(function* ($) {
          const current = yield* $(getUnderlyingValues)
          const [b, a] = f(current)

          if (!eq(current, a)) {
            // Will update this RefSubject using observe below
            yield* $(event(a))
          }

          return b
        })

      // Listen to changes to each subject and update the derived subject
      for (let i = 0; i < length; i++) {
        yield* $(Effect.forkScoped(observe(updateAtIndex(i))(subjects[i])))
      }

      // Allow underlying subscriptions to start
      yield* $(Effect.yieldNow())

      const derived: RefSubject<Val> = {
        ...refSubject,
        event,
        modify,
        ...makeDerivations(modify, refSubject.get),
        compute: (f) => makeComputed(derived, f),
      }

      return derived
    })
  }

  export function struct<Subjects extends Readonly<Record<string, RefSubject<any>>>>(
    subjects: Subjects,
  ): Effect.Effect<
    Scope.Scope,
    never,
    RefSubject<{ readonly [K in keyof Subjects]: ValueOf<Subjects[K]> }>
  > {
    type Val = { readonly [K in keyof Subjects]: ValueOf<Subjects[K]> }

    const getUnderlyingValues = Effect.struct(
      ReadonlyRecord.map(subjects, (s) => s.get),
    ) as Effect.Effect<never, never, Val>

    const eq = Equivalence.struct(
      ReadonlyRecord.map(subjects, (s) => s.eq),
    ) as Equivalence.Equivalence<Val>

    return Effect.gen(function* ($) {
      const initial = yield* $(getUnderlyingValues)
      const refSubject = unsafeMake(() => initial, eq)

      const updateAtKey =
        <I extends keyof Val & string>(i: I) =>
        (a: Val[I]) =>
          Effect.gen(function* ($) {
            const current = yield* $(refSubject.get)
            const next = { ...current, [i]: a }

            yield* $(refSubject.set(next as Val))
          })

      // Override event to replicate events into underlying subjects
      const event = (val: Val) =>
        Effect.struct(ReadonlyRecord.map(subjects, (s, i) => s.event(val[i])))

      // Override modify to replicate events into underlying subjects
      const modify = <B>(f: (a: Val) => readonly [B, Val]): Effect.Effect<never, never, B> =>
        Effect.gen(function* ($) {
          const current = yield* $(getUnderlyingValues)
          const [b, a] = f(current)

          if (!eq(current, a)) {
            // Will update this RefSubject using observe below
            yield* $(event(a))
          }

          return b
        })

      // Listen to changes to each subject and update the derived subject
      for (const i in subjects) {
        yield* $(Effect.forkScoped(observe(updateAtKey(i))(subjects[i])))
      }

      // Allow underlying subscriptions to start
      yield* $(Effect.yieldNow())

      const derived: RefSubject<Val> = {
        ...refSubject,
        event,
        modify,
        ...makeDerivations(modify, refSubject.get),
        compute: (f) => makeComputed(derived, f),
      }

      return derived
    })
  }

  const makeDerivations = <A>(
    modify: <B>(f: (a: A) => readonly [B, A]) => Effect.Effect<never, never, B>,
    getValue: Effect.Effect<never, never, A>,
  ) => {
    return {
      get: getValue,
      set(a: A) {
        return modify(() => [a, a])
      },
      update(f: (a: A) => A) {
        return modify((a) => {
          const a2 = f(a)
          return [a2, a2]
        })
      },
    }
  }
}

export function isRefSubject<A>(u: unknown): u is RefSubject<A> {
  return isHoldSubject(u) && Ref.RefTypeId in u
}

export interface Computed<E, A> extends Fx<never, E, A> {
  readonly get: Effect.Effect<never, E, A>
}

export namespace Computed {
  export function make<A, R, E, B>(
    input: RefSubject<A>,
    compute: (a: A) => Effect.Effect<R, E, B>,
  ): Effect.Effect<R | Scope.Scope, never, Computed<E, B>> {
    return Effect.gen(function* ($) {
      const compute_ = flow(compute, Effect.exit)
      const initialInput = yield* $(input.get)
      const initial = yield* $(compute_(initialInput))
      const refSubject = yield* $(makeRef(() => initial))

      yield* $(
        pipe(
          input,
          skipWhile((x) => input.eq(x, initialInput)), // We already have the initial value, don't waste downstream resources
          observe((a) => Effect.flatMap(compute_(a), refSubject.set)),
          Effect.forkScoped,
        ),
      )

      // Allow subscription to finalize as HoldFx under the hood of RefSubject schedules the start of the Fx.
      yield* $(Effect.yieldNow())

      return new ComputedImpl(refSubject)
    })
  }

  class ComputedImpl<E, A> extends Fx.Variance<never, E, A> implements Computed<E, A> {
    readonly fx: Fx<never, E, A>

    constructor(readonly input: RefSubject<Exit.Exit<E, A>>) {
      super()

      this.fx = pipe(input, flatMapEffect(Effect.done), hold)
    }

    run<R3>(sink: Sink<R3, E, A>) {
      return this.fx.run(sink)
    }

    readonly get = Effect.flatMap(this.input.get, Effect.done)
  }
}

export const makeComputed: {
  <A, R, E, B>(input: RefSubject<A>, compute: (a: A) => Effect.Effect<R, E, B>): Effect.Effect<
    R | Scope.Scope,
    never,
    Computed<E, B>
  >

  <A, R, E, B>(compute: (a: A) => Effect.Effect<R, E, B>): (
    input: RefSubject<A>,
  ) => Effect.Effect<R | Scope.Scope, never, Computed<E, B>>
} = dual(2, Computed.make)
