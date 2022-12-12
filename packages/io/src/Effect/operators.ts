import * as Context from '@fp-ts/data/Context'
import * as Either from '@fp-ts/data/Either'
import { constVoid, flow, pipe } from '@fp-ts/data/Function'
import { Option } from '@fp-ts/data/Option'
import { NonEmptyReadonlyArray } from '@fp-ts/data/ReadonlyArray'
import { Cause } from '@typed/cause'
import type { Exit } from '@typed/exit'

import * as Fiber from '../Fiber/index.js'
import { FiberId } from '../FiberId/FiberId.js'
import type { FiberRef } from '../FiberRef/FiberRef.js'
import type { FiberRefs } from '../FiberRefs/FiberRefs.js'
import type { RuntimeOptions } from '../FiberRuntime/FiberRuntime.js'
import type { FiberScope } from '../FiberScope/FiberScope.js'
import type { Future } from '../Future/Future.js'
import type { Layer } from '../Layer.js'
import type { RuntimeFlags } from '../RuntimeFlags/RuntimeFlags.js'
import { flow2 } from '../_internal/flow2.js'

import { Effect } from './Effect.js'
import * as I from './Instruction.js'

export function of<A>(a: A, __trace?: string): Effect.Of<A> {
  return new I.Of(a, __trace)
}

export const unit: Effect.Of<void> = of(undefined)

export function fromCause<E>(cause: Cause<E>, __trace?: string): Effect<never, E, never> {
  return new I.FromCause(cause, __trace)
}

export const fromExit = I.fromExit

export const withFiberRefs =
  (fiberRefs: FiberRefs, __trace?: string) =>
  <R, E, A>(effect: Effect<R, E, A>) =>
    effect.withFiberRefs(fiberRefs, __trace)

export const gen = I.gen

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

export function provideContext<R>(
  context: Context.Context<R>,
  __trace?: string,
): <E, A>(effect: Effect<R, E, A>) => Effect<never, E, A> {
  return (effect) => effect.provideContext(context, __trace)
}

export function provide<S>(
  context: Context.Context<S>,
  __trace?: string,
): <R, E, A>(effect: Effect<R, E, A>) => Effect<Exclude<R, S>, E, A> {
  return (effect) => effect.provide(context, __trace)
}

export function provideSome<R0, R>(
  f: (r0: Context.Context<R0>) => Context.Context<R>,
  __trace?: string,
): <E, A>(effect: Effect<R, E, A>) => Effect<Exclude<R0, R>, E, A> {
  return (effect) => access((r0) => effect.provideContext(f(r0 as Context.Context<R0>)), __trace)
}

export function map<A, B>(f: (a: A) => B, __trace?: string) {
  return <R, E>(eff: Effect<R, E, A>): Effect<R, E, B> => eff.map(f, __trace)
}

export function flatMap<A, R2, E2, B>(f: (a: A) => Effect<R2, E2, B>, __trace?: string) {
  return <R, E>(eff: Effect<R, E, A>): Effect<R | R2, E | E2, B> => eff.flatMap(f, __trace)
}

export function tap<A, R2, E2, B>(f: (a: A) => Effect<R2, E2, B>, __trace?: string) {
  return <R, E>(eff: Effect<R, E, A>): Effect<R | R2, E | E2, A> => eff.tap(f, __trace)
}

export function matchCause<E, R2, E2, B, A, R3, E3, C>(
  onCause: (cause: Cause<E>) => Effect<R2, E2, B>,
  onValue: (value: A) => Effect<R3, E3, C>,
  __trace?: string,
) {
  return <R>(eff: Effect<R, E, A>): Effect<R | R2 | R3, E2 | E3, B | C> =>
    eff.matchCause(onCause, onValue, __trace)
}

export function matchError<E, R2, E2, B, A, R3, E3, C>(
  onError: (cause: E) => Effect<R2, E2, B>,
  onValue: (value: A) => Effect<R3, E3, C>,
  __trace?: string,
) {
  return <R>(eff: Effect<R, E, A>): Effect<R | R2 | R3, E2 | E3, B | C> =>
    eff.matchError(onError, onValue, __trace)
}

export function attempt<R, E, A>(
  eff: Effect<R, E, A>,
  __trace?: string,
): Effect<R, never, Exit<E, A>> {
  return eff.matchCause(flow2(Either.left, of), flow2(Either.right, of), __trace)
}

export function flatMapCause<E, R2, E2, B>(
  f: (cause: Cause<E>) => Effect<R2, E2, B>,
  __trace?: string,
) {
  return <R, A>(eff: Effect<R, E, A>): Effect<R | R2, E2, A | B> => eff.flatMapCause(f, __trace)
}

export function flatMapError<E, R2, E2, B>(f: (cause: E) => Effect<R2, E2, B>, __trace?: string) {
  return <R, A>(eff: Effect<R, E, A>): Effect<R | R2, E2, A | B> => eff.flatMapError(f, __trace)
}

export function mapCause<E, E2>(f: (cause: Cause<E>) => Cause<E2>, __trace?: string) {
  return <R, A>(eff: Effect<R, E, A>): Effect<R, E2, A> => eff.mapCause(f, __trace)
}

export function mapError<E, E2>(f: (cause: E) => E2, __trace?: string) {
  return <R, A>(eff: Effect<R, E, A>): Effect<R, E2, A> => eff.mapError(f, __trace)
}

export function wait<R, E, A>(future: Future<R, E, A>): Effect<R, E, A> {
  return new I.Async(future)
}

export function updateRuntimeFlags(f: (flags: RuntimeFlags) => RuntimeFlags, __trace?: string) {
  return <R, E, A>(effect: Effect<R, E, A>) => effect.updateRuntimeFlags(f, __trace)
}

export function uninterruptable<R, E, A>(eff: Effect<R, E, A>): Effect<R, E, A> {
  return eff.uninterruptable
}

export function interruptable<R, E, A>(eff: Effect<R, E, A>): Effect<R, E, A> {
  return eff.interruptable
}

export const getFiberRefs: Effect.Of<FiberRefs> = new I.GetFiberRefs()

export const getFiberScope: Effect.Of<FiberScope> = new I.GetFiberScope()

export const getFiberId: Effect.Of<FiberId> = new I.GetFiberId()

export const getRuntimeFlags: Effect.Of<RuntimeFlags> = new I.GetRuntimeFlags()

const getRuntimeOptions_ = new I.GetRuntimeOptions<any>()

export const getRuntimeOptions = <R>(): Effect<R, never, RuntimeOptions<R>> => getRuntimeOptions_

export const getFiberRef = <R, E, A>(ref: FiberRef<R, E, A>): Effect<R, E, A> =>
  getFiberRefs.flatMap((refs) => refs.get(ref))

export const getFiberRefOption = <R, E, A>(ref: FiberRef<R, E, A>): Effect.Of<Option<A>> =>
  getFiberRefs.map((refs) => refs.getOption(ref))

export const setFiberRef =
  <A>(value: A) =>
  <R, E>(ref: FiberRef<R, E, A>): Effect<R, E, A> =>
    getFiberRefs.flatMap((refs) => refs.set(ref, value))

export const updateFiberRef =
  <A>(f: (a: A) => A) =>
  <R, E>(ref: FiberRef<R, E, A>): Effect<R, E, A> =>
    getFiberRefs.flatMap((refs) => refs.update(ref, f))

export const modifyFiberRef =
  <A, B>(f: (a: A) => readonly [B, A]) =>
  <R, E>(ref: FiberRef<R, E, A>): Effect<R, E, B> =>
    getFiberRefs.flatMap((refs) => refs.modify(ref, f))

export const removeFiberRef = <R, E, A>(ref: FiberRef<R, E, A>): Effect<R, E, Option<A>> =>
  getFiberRefs.flatMap((refs) => refs.delete(ref))

export { removeFiberRef as deleteFiberRef }

export const updateFiberRefEffect =
  <A, R2, E2>(f: (a: A) => Effect<R2, E2, A>) =>
  <R, E>(ref: FiberRef<R, E, A>): Effect<R2 | R, E2 | E, A> =>
    getFiberRefs.flatMap((refs) => refs.updateEffect(ref, f))

export const modifyFiberRefEffect =
  <A, R2, E2, B>(f: (a: A) => Effect<R2, E2, readonly [B, A]>) =>
  <R, E>(ref: FiberRef<R, E, A>): Effect<R2 | R, E2 | E, B> =>
    getFiberRefs.flatMap((refs) => refs.modifyEffect(ref, f))

export const fork = <R, E, A>(
  effect: Effect<R, E, A>,
  __trace?: string,
): Effect<R, never, Fiber.RuntimeFiber<E, A>> => effect.fork(undefined, __trace)

export const forkDaemon = <R, E, A>(
  effect: Effect<R, E, A>,
  __trace?: string,
): Effect<R, never, Fiber.RuntimeFiber<E, A>> => effect.forkDaemon(undefined, __trace)

export const join = <E, A>(fiber: Fiber.Fiber<E, A>): Effect<never, E, A> => fiber.join

export const forkWithOptions =
  <R>(options: Partial<RuntimeOptions<R>>, __trace?: string) =>
  <E, A>(effect: Effect<R, E, A>): Effect<R, never, Fiber.RuntimeFiber<E, A>> =>
    effect.fork(options, __trace)

export const forkDaemonWithOptions =
  <R>(options: Omit<Partial<RuntimeOptions<R>>, 'scope'>, __trace?: string) =>
  <E, A>(effect: Effect<R, E, A>): Effect<R, never, Fiber.RuntimeFiber<E, A>> =>
    effect.forkDaemon(options, __trace)

export const context = <R>(): Effect<R, never, Context.Context<R>> => access(of)

export const ensuring =
  <E, A, R2, E2, B>(
    f: (exit: Exit<E, A>) => Effect<R2, E2, B>,
    __trace?: string,
  ): (<R>(effect: Effect<R, E, A>) => Effect<R | R2, E | E2, A>) =>
  (effect) =>
    effect.ensuring(f, __trace)

export function provideService<S>(tag: Context.Tag<S>, service: S, __trace?: string) {
  return <R, E, A>(effect: Effect<R | S, E, A>): Effect<Exclude<R, S>, E, A> =>
    effect.provideService(tag, service, __trace)
}

export function provideLayer<R2, E2, I, S>(layer: Layer<R2, E2, I, S>, __trace?: string) {
  return <R, E, A>(effect: Effect<R | S, E, A>): Effect<R2 | Exclude<R, S>, E | E2, A> =>
    effect.provideLayer(layer, __trace)
}

export function asksEffect<S, R, E, A>(
  tag: Context.Tag<S>,
  f: (s: S) => Effect<R, E, A>,
  __trace?: string,
): Effect<R | S, E, A> {
  return access(flow(Context.unsafeGet(tag), f), __trace)
}

export function ask<S>(tag: Context.Tag<S>, __trace?: string): Effect<S, never, S> {
  return asksEffect(tag, of, __trace)
}

export function asks<S, A>(
  tag: Context.Tag<S>,
  f: (s: S) => A,
  __trace?: string,
): Effect<S, never, A> {
  return asksEffect(tag, flow2(f, of), __trace)
}

export function zip<R2, E2, B>(second: Effect<R2, E2, B>) {
  return <R, E, A>(first: Effect<R, E, A>): Effect<R | R2, E | E2, readonly [A, B]> =>
    first.zip(second)
}

export const tupled: <R, E, A>(eff: Effect<R, E, A>) => Effect<R, E, readonly [A]> = map(
  <A>(value: A) => [value] as const,
)

export function zipAll<Effs extends ReadonlyArray<Effect<any, any, any>>>(
  effects: Effs,
): Effect<
  Effect.ResourcesOf<Effs[number]>,
  Effect.ErrorsOf<Effs[number]>,
  {
    readonly [K in keyof Effs]: Effect.OutputOf<Effs[K]>
  }
> {
  type R = Effect<
    Effect.ResourcesOf<Effs[number]>,
    Effect.ErrorsOf<Effs[number]>,
    {
      readonly [K in keyof Effs]: Effect.OutputOf<Effs[K]>
    }
  >

  if (effects.length === 0) {
    return of([]) as R
  } else if (effects.length === 1) {
    return tupled(effects[0]) as R
  } else if (effects.length === 2) {
    return effects[0].zip(effects[1]) as R
  }

  const [first, ...rest] = effects

  return rest.reduce(
    (prev, cur) =>
      pipe(
        prev,
        zip(cur),
        map(([acc, x]) => [...acc, x]),
      ),
    tupled(first),
  ) as R
}

export const asUnit = <R, E, A>(effect: Effect<R, E, A>, __trace?: string): Effect<R, E, void> =>
  effect.map(constVoid, __trace)

export function zipAllUnit<Effs extends ReadonlyArray<Effect<any, any, any>>>(
  effects: Effs,
): Effect<Effect.ResourcesOf<Effs[number]>, Effect.ErrorsOf<Effs[number]>, void> {
  if (effects.length === 0) return unit
  if (effects.length === 1) return asUnit(effects[0])

  return asUnit(effects.reduce((prev, curr) => flatMap(() => curr)(prev)))
}

export function race<R2, E2, B>(second: Effect<R2, E2, B>) {
  return <R, E, A>(first: Effect<R, E, A>): Effect<R | R2, E | E2, A | B> => first.race(second)
}

export function raceAll<Effs extends NonEmptyReadonlyArray<Effect<any, any, any>>>(
  effects: Effs,
): Effect<
  Effect.ResourcesOf<Effs[number]>,
  Effect.ErrorsOf<Effs[number]>,
  Effect.OutputOf<Effs[number]>
> {
  type R = Effect<
    Effect.ResourcesOf<Effs[number]>,
    Effect.ErrorsOf<Effs[number]>,
    Effect.OutputOf<Effs[number]>
  >

  if (effects.length === 1) {
    return effects[0] as R
  }

  return effects.reduce((prev, cur) => prev.race(cur)) as R
}

export function interrupt<E, A>(fiber: Fiber.Fiber<E, A>) {
  return getFiberId.flatMap((id) => fiber.interruptAs(id))
}

export function struct<Effects extends Readonly<Record<string, Effect<any, any, any>>>>(
  effects: Effects,
): Effect<
  Effect.ResourcesOf<Effects[string]>,
  Effect.ErrorsOf<Effects[string]>,
  { readonly [K in keyof Effects]: Effect.OutputOf<Effects[K]> }
> {
  return zipAll(
    Object.entries(effects).map(([k, effect]) => effect.map((v) => [k, v] as const)),
  ).map(Object.fromEntries) as any
}

export function bracket<R, E, A, R2, E2, B, R3, E3>(
  acquire: Effect<R, E, A>,
  use: (a: A) => Effect<R2, E2, B>,
  release: (a: A, exit: Exit<E2, B>) => Effect<R3, E3, unknown>,
): Effect<R | R2 | R3, E | E2 | E3, B> {
  return acquire.flatMap((a) => use(a).ensuring((exit) => release(a, exit)))
}