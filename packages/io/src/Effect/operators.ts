import * as Context from '@fp-ts/data/Context'
import * as Either from '@fp-ts/data/Either'
import { pipe } from '@fp-ts/data/Function'
import { Option } from '@fp-ts/data/Option'
import { NonEmptyReadonlyArray } from '@fp-ts/data/ReadonlyArray'
import { Cause } from '@typed/cause'
import type { Exit } from '@typed/exit'

import * as Fiber from '../Fiber.js'
import { FiberId } from '../FiberId.js'
import type { FiberRef } from '../FiberRef.js'
import type { FiberRefs } from '../FiberRefs.js'
import type { RuntimeOptions } from '../FiberRuntime.js'
import type { FiberScope } from '../FiberScope.js'
import type { Future } from '../Future.js'
import { Layer } from '../Layer.js'
import type { RuntimeFlags } from '../RuntimeFlags.js'
import { flow2 } from '../_internal.js'

import { Effect } from './Effect.js'
import * as I from './Instruction.js'

export function of<A>(a: A, __trace?: string): Effect.Of<A> {
  return new I.Of(a, __trace)
}

export const unit: Effect.Of<void> = of(undefined)

export function fromCause<E>(cause: Cause<E>, __trace?: string): Effect<never, E, never> {
  return new I.FromCause(cause, __trace)
}

export function fromExit<E, A>(exit: Exit<E, A>, __trace?: string): Effect<never, E, A> {
  return exit._tag === 'Right' ? of(exit.right, __trace) : fromCause(exit.left, __trace)
}

export function sync<A>(f: () => A, __trace?: string): Effect.Of<A> {
  return new I.Sync(f, __trace)
}

export function lazy<R, E, A>(f: () => Effect<R, E, A>, __trace?: string): Effect<R, E, A> {
  return new I.Lazy(f, __trace)
}

export function access<R, R2, E2, A>(
  f: (r: Context.Context<R>) => Effect<R2, E2, A>,
  __trace?: string,
): Effect<R | R2, E2, A> {
  return new I.AccessContext<R, R2, E2, A>(f, __trace)
}

export function provide<R>(
  context: Context.Context<R>,
  __trace?: string,
): <E, A>(effect: Effect<R, E, A>) => Effect<never, E, A> {
  return (effect) => new I.ProvideContext([effect, context], __trace)
}

export function map<A, B>(f: (a: A) => B, __trace?: string) {
  return <R, E>(eff: Effect<R, E, A>): Effect<R, E, B> => new I.Map([eff, f], __trace)
}

export function flatMap<A, R2, E2, B>(f: (a: A) => Effect<R2, E2, B>, __trace?: string) {
  return <R, E>(eff: Effect<R, E, A>): Effect<R | R2, E | E2, B> => new I.FlatMap([eff, f], __trace)
}

export function tap<A, R2, E2, B>(f: (a: A) => Effect<R2, E2, B>, __trace?: string) {
  return <R, E>(eff: Effect<R, E, A>): Effect<R | R2, E | E2, A> =>
    new I.FlatMap(
      [
        eff,
        (a) =>
          pipe(
            a,
            f,
            map(() => a),
          ),
      ],
      __trace,
    )
}

export function matchCause<E, R2, E2, B, A, R3, E3, C>(
  onCause: (cause: Cause<E>) => Effect<R2, E2, B>,
  onValue: (value: A) => Effect<R3, E3, C>,
  __trace?: string,
) {
  return <R>(eff: Effect<R, E, A>): Effect<R | R2 | R3, E2 | E3, B | C> =>
    new I.Match<R, E, A, R2, E2, B, R3, E3, C>([eff, onCause, onValue], __trace)
}

export function attempt<R, E, A>(
  eff: Effect<R, E, A>,
  __trace?: string,
): Effect<R, never, Exit<E, A>> {
  return pipe(eff, matchCause(flow2(Either.left, of), flow2(Either.right, of), __trace))
}

export function flatMapCause<E, R2, E2, B>(
  f: (cause: Cause<E>) => Effect<R2, E2, B>,
  __trace?: string,
) {
  return <R, A>(eff: Effect<R, E, A>): Effect<R | R2, E2, A | B> =>
    new I.FlatMapCause([eff, f], __trace)
}

export function mapCause<E, E2>(f: (cause: Cause<E>) => Cause<E2>, __trace?: string) {
  return <R, A>(eff: Effect<R, E, A>): Effect<R, E2, A> => new I.MapCause([eff, f], __trace)
}

export function wait<R, E, A>(future: Future<R, E, A>): Effect<R, E, A> {
  return new I.Async(future)
}

export function updateRuntimeFlags(f: (flags: RuntimeFlags) => RuntimeFlags, __trace?: string) {
  return <R, E, A>(effect: Effect<R, E, A>) => new I.UpdateRuntimeFlags([effect, f], __trace)
}

export function uninterruptable<R, E, A>(eff: Effect<R, E, A>, __trace?: string): Effect<R, E, A> {
  return updateRuntimeFlags((flags) => ({ ...flags, interruptStatus: false }), __trace)(eff)
}

export function interruptable<R, E, A>(eff: Effect<R, E, A>, __trace?: string): Effect<R, E, A> {
  return updateRuntimeFlags((flags) => ({ ...flags, interruptStatus: true }), __trace)(eff)
}

export const getFiberRefs: Effect.Of<FiberRefs> = new I.GetFiberRefs()

export const getFiberScope: Effect.Of<FiberScope> = new I.GetFiberScope()

export const getFiberId: Effect.Of<FiberId> = new I.GetFiberId()

export const getRuntimeFlags: Effect.Of<RuntimeFlags> = new I.GetRuntimeFlags()

const getRuntimeOptions_ = new I.GetRuntimeOptions<any>()

export const getRuntimeOptions = <R>(): Effect<R, never, RuntimeOptions<R>> => getRuntimeOptions_

export const getFiberRef = <R, E, A>(ref: FiberRef<R, E, A>): Effect<R, E, A> =>
  pipe(
    getFiberRefs,
    flatMap((refs) => refs.get(ref)),
  )

export const getFiberRefOption = <R, E, A>(ref: FiberRef<R, E, A>): Effect.Of<Option<A>> =>
  pipe(
    getFiberRefs,
    map((refs) => refs.getOption(ref)),
  )

export const setFiberRef =
  <A>(value: A) =>
  <R, E>(ref: FiberRef<R, E, A>): Effect<R, E, A> =>
    pipe(
      getFiberRefs,
      flatMap((refs) => refs.set(ref, value)),
    )

export const updateFiberRef =
  <A>(f: (a: A) => A) =>
  <R, E>(ref: FiberRef<R, E, A>): Effect<R, E, A> =>
    pipe(
      getFiberRefs,
      flatMap((refs) => refs.update(ref, f)),
    )

export const modifyFiberRef =
  <A, B>(f: (a: A) => readonly [B, A]) =>
  <R, E>(ref: FiberRef<R, E, A>): Effect<R, E, B> =>
    pipe(
      getFiberRefs,
      flatMap((refs) => refs.modify(ref, f)),
    )

export const removeFiberRef = <R, E, A>(ref: FiberRef<R, E, A>): Effect<R, E, Option<A>> =>
  pipe(
    getFiberRefs,
    flatMap((refs) => refs.delete(ref)),
  )

export { removeFiberRef as deleteFiberRef }

export const updateFiberRefEffect =
  <A, R2, E2>(f: (a: A) => Effect<R2, E2, A>) =>
  <R, E>(ref: FiberRef<R, E, A>): Effect<R2 | R, E2 | E, A> =>
    pipe(
      getFiberRefs,
      flatMap((refs) => refs.updateEffect(ref, f)),
    )

export const modifyFiberRefEffect =
  <A, R2, E2, B>(f: (a: A) => Effect<R2, E2, readonly [B, A]>) =>
  <R, E>(ref: FiberRef<R, E, A>): Effect<R2 | R, E2 | E, B> =>
    pipe(
      getFiberRefs,
      flatMap((refs) => refs.modifyEffect(ref, f)),
    )

export const withFiberRefs =
  (refs: FiberRefs, __trace?: string) =>
  <R, E, A>(effect: Effect<R, E, A>): Effect<R, E, A> =>
    new I.WithFiberRefs([effect, refs], __trace)

export const fork = <R, E, A>(
  effect: Effect<R, E, A>,
  __trace?: string,
): Effect<R, never, Fiber.RuntimeFiber<E, A>> => new I.Fork([effect], __trace)

export const join = <E, A>(fiber: Fiber.Fiber<E, A>, __trace?: string): Effect<never, E, A> =>
  pipe(
    fiber.exit,
    tap((exit) => (Either.isRight(exit) ? fiber.inheritRefs : unit)),
    flatMap(fromExit, __trace),
  )

export const forkWithOptions =
  <R>(options: Partial<RuntimeOptions<R>>) =>
  <E, A>(effect: Effect<R, E, A>, __trace?: string): Effect<R, never, Fiber.RuntimeFiber<E, A>> =>
    new I.Fork([effect, options], __trace)

export const context = <R>(): Effect<R, never, Context.Context<R>> => access(of)

export const onExit =
  <E, A, R2, E2, B>(
    f: (exit: Exit<E, A>) => Effect<R2, E2, B>,
  ): (<R>(effect: Effect<R, E, A>) => Effect<R | R2, E | E2, A>) =>
  (effect) =>
    pipe(effect, attempt, tap(f), flatMap(fromExit))

export function provideService<S>(tag: Context.Tag<S>, service: S) {
  const addService = Context.add(tag)(service)

  return <R, E, A>(effect: Effect<R | S, E, A>): Effect<Exclude<R, S>, E, A> =>
    access((env) => pipe(effect, provide(addService(env as Context.Context<R>))))
}

export function provideLayer<R2, E2, S>(layer: Layer<R2, E2, S>) {
  return <R, E, A>(effect: Effect<R | S, E, A>): Effect<R2 | Exclude<R, S>, E | E2, A> =>
    access((env) =>
      pipe(
        layer,
        getFiberRef,
        flatMap((env2) =>
          pipe(effect, provide(Context.merge(env2)(env as Context.Context<R | R2>))),
        ),
      ),
    )
}

export function asksEffect<S, R, E, A>(
  tag: Context.Tag<S>,
  f: (s: S) => Effect<R, E, A>,
): Effect<R | S, E, A> {
  return access((env: Context.Context<S>) => pipe(env, Context.unsafeGet(tag), f))
}

export function ask<S>(tag: Context.Tag<S>): Effect<S, never, S> {
  return asksEffect(tag, of)
}

export function asks<S, A>(tag: Context.Tag<S>, f: (s: S) => A): Effect<S, never, A> {
  return asksEffect(tag, flow2(f, of))
}

export function zip<R2, E2, B>(second: Effect<R2, E2, B>) {
  return <R, E, A>(first: Effect<R, E, A>): Effect<R | R2, E | E2, readonly [A, B]> =>
    pipe(
      first,
      fork,
      flatMap((fiberF) =>
        pipe(
          second,
          fork,
          map((fiberS) => Fiber.zip(fiberS)(fiberF)),
        ),
      ),
      flatMap(join),
    )
}

export const tupled: <R, E, A>(eff: Effect<R, E, A>) => Effect<R, E, readonly [A]> = map(
  <A>(value: A) => [value] as const,
)

export function zipAll<Effs extends ReadonlyArray<Effect<any, any, any>>>(
  effects: Effs,
): Effect<
  Effect.ServicesOf<Effs[number]>,
  Effect.ErrorsOf<Effs[number]>,
  {
    readonly [K in keyof Effs]: Effect.OutputOf<Effs[K]>
  }
> {
  type R = Effect<
    Effect.ServicesOf<Effs[number]>,
    Effect.ErrorsOf<Effs[number]>,
    {
      readonly [K in keyof Effs]: Effect.OutputOf<Effs[K]>
    }
  >

  if (effects.length === 0) {
    return of([]) as R
  } else if (effects.length === 1) {
    return pipe(effects[0], tupled) as R
  }

  const [first, ...rest] = effects

  return rest.reduce(
    (prev, cur) =>
      pipe(
        prev,
        zip(cur),
        map(([acc, x]) => [...acc, x]),
      ),
    pipe(
      first,
      map((x) => [x]),
    ),
  ) as R
}

export function race<R2, E2, B>(second: Effect<R2, E2, B>) {
  return <R, E, A>(first: Effect<R, E, A>): Effect<R | R2, E | E2, A | B> =>
    pipe(
      first,
      fork,
      flatMap((fiberF) =>
        pipe(
          second,
          fork,
          map((fiberS) => Fiber.race(fiberS)(fiberF)),
        ),
      ),
      flatMap(join),
    )
}

export function raceAll<Effs extends NonEmptyReadonlyArray<Effect<any, any, any>>>(
  effects: Effs,
): Effect<
  Effect.ServicesOf<Effs[number]>,
  Effect.ErrorsOf<Effs[number]>,
  Effect.OutputOf<Effs[number]>
> {
  type R = Effect<
    Effect.ServicesOf<Effs[number]>,
    Effect.ErrorsOf<Effs[number]>,
    Effect.OutputOf<Effs[number]>
  >

  if (effects.length === 1) {
    return effects[0] as R
  }

  return effects.reduce((prev, cur) => race(cur)(prev)) as R
}

export function interrupt<E, A>(fiber: Fiber.Fiber<E, A>) {
  return pipe(
    getFiberId,
    flatMap((id) => fiber.interruptAs(id)),
  )
}
