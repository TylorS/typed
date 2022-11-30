import * as Context from '@fp-ts/data/Context'
import { pipe } from '@fp-ts/data/Function'
import * as Option from '@fp-ts/data/Option'
import * as C from '@typed/clock'
import { Time, UnixTime } from '@typed/time'
import { makeTimer } from '@typed/timer'

import * as Effect from './Effect.js'
import type { FiberRefs } from './FiberRefs.js'
import { GlobalFiberScope, makeGlobalFiberScope } from './FiberScope.js'
import { IdGenerator, makeIdGenerator } from './IdGenerator.js'
import { Layer } from './Layer.js'
import { Scheduler, makeScheduler } from './Scheduler.js'

export type DefaultServices = Scheduler | IdGenerator | GlobalFiberScope

const empty = Context.empty()

export const DefaultClock = C.Clock()
export const DefaultTimer = makeTimer(DefaultClock)
export const DefaultScheduler = makeScheduler(DefaultTimer)
export const DefaultIdGenerator = makeIdGenerator()
export const DefaultGlobalScope = makeGlobalFiberScope()

export const DefaultServicesContext: Context.Context<DefaultServices> = pipe(
  empty,
  Context.add(Scheduler)(DefaultScheduler),
  Context.add(IdGenerator)(DefaultIdGenerator),
  Context.add(GlobalFiberScope)(DefaultGlobalScope),
)

export const DefaultServices: Layer<never, never, DefaultServices> = Layer(
  Effect.of(DefaultServicesContext),
)

export const getDefaultService = <R, S extends DefaultServices>(
  context: Context.Context<R>,
  fiberRefs: FiberRefs,
  service: Context.Tag<S>,
): S => {
  const contextOption = pipe(context, Context.getOption<S>(service))

  if (Option.isSome(contextOption)) {
    return contextOption.value
  }

  return pipe(
    fiberRefs.getOption(DefaultServices),
    Option.getOrElse(() => DefaultServicesContext),
    Context.unsafeGet(service),
  )
}

export const getScheduler: Effect.Effect<never, never, Scheduler> = Effect.Effect(function* () {
  const ctx = yield* Effect.context<never>()
  const fiberRefs = yield* Effect.getFiberRefs

  return getDefaultService(ctx, fiberRefs, Scheduler)
})

export const getIdGenerator: Effect.Effect<never, never, IdGenerator> = Effect.Effect(function* () {
  const ctx = yield* Effect.context<never>()
  const fiberRefs = yield* Effect.getFiberRefs

  return getDefaultService(ctx, fiberRefs, IdGenerator)
})

export const getGlobalFiberScope: Effect.Effect<never, never, GlobalFiberScope> = Effect.Effect(
  function* () {
    const ctx = yield* Effect.context<never>()
    const fiberRefs = yield* Effect.getFiberRefs

    return getDefaultService(ctx, fiberRefs, GlobalFiberScope)
  },
)

export const getClock: Effect.Effect<never, never, C.Clock> = getScheduler

export const getCurrentTime: Effect.Effect<never, never, Time> = pipe(
  getClock,
  Effect.map(C.getTime),
)

export const getCurrentUnixTime: Effect.Effect<never, never, UnixTime> = pipe(
  getClock,
  Effect.map((c) => c.currentTime()),
)

export function forkDaemon<R, E, A>(effect: Effect.Effect<R, E, A>) {
  return pipe(
    getGlobalFiberScope,
    Effect.flatMap((scope) => pipe(effect, Effect.forkWithOptions({ scope }))),
  )
}
