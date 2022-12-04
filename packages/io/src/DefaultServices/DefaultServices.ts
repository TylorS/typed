import * as Context from '@fp-ts/data/Context'
import { pipe } from '@fp-ts/data/Function'
import * as Option from '@fp-ts/data/Option'
import * as C from '@typed/clock'
import { Time, UnixTime } from '@typed/time'
import { Timer } from '@typed/timer'

import * as Effect from '../Effect/Effect.js'
import { gen } from '../Effect/Instruction.js'
import * as ops from '../Effect/operators.js'
import { FiberRefs } from '../FiberRefs.js'
import type { RuntimeOptions } from '../FiberRuntime/FiberRuntime.js'
import { GlobalFiberScope } from '../FiberScope/FiberScope.js'
import { IdGenerator } from '../IdGenerator/IdGenerator.js'
import * as Layer from '../Layer/Layer.js'
import { Scheduler } from '../Scheduler/Scheduler.js'

export type DefaultServices = Scheduler | IdGenerator | GlobalFiberScope

export const DefaultClock: Layer.FromService<C.Clock> = Layer.fromService(C.Clock)(C.Clock())

export const DefaultTimer: Layer.FromService<Timer> = pipe(
  Timer(DefaultClock.service),
  Layer.fromService(Timer),
)

export const DefaultScheduler: Layer.FromService<Scheduler> = pipe(
  Scheduler(DefaultTimer.service),
  Layer.fromService(Scheduler),
)

export const DefaultIdGenerator: Layer.FromService<IdGenerator> = Layer.fromService(IdGenerator)(
  IdGenerator(),
)

export const DefaultGlobalFiberScope: Layer.FromService<GlobalFiberScope> = Layer.fromService(
  GlobalFiberScope,
)(GlobalFiberScope())

export const DefaultServicesContext = pipe(
  Context.empty(),
  Context.add(Scheduler)(DefaultScheduler.service),
  Context.add(IdGenerator)(DefaultIdGenerator.service),
  Context.add(GlobalFiberScope)(DefaultGlobalFiberScope.service),
)

export const getDefaultService = <R, S extends DefaultServices>(
  context: Context.Context<R>,
  fiberRefs: FiberRefs,
  service: Context.Tag<S>,
): S =>
  pipe(
    context,
    Context.getOption<S>(service),
    Option.getOrElse(() =>
      pipe(
        fiberRefs.getOption(getDefaultFiberRef<S>(service)),
        Option.getOrElse(() => DefaultServicesContext),
        Context.unsafeGet(service),
      ),
    ),
  )

export const getDefaultFiberRef = <S extends DefaultServices>(
  tag: Context.Tag<S>,
): Layer.FromService<S> => {
  if (Object.is(tag, Scheduler)) {
    return DefaultScheduler as unknown as Layer.FromService<S>
  }

  if (Object.is(tag, DefaultIdGenerator)) {
    return DefaultIdGenerator as unknown as Layer.FromService<S>
  }

  return DefaultGlobalFiberScope as unknown as Layer.FromService<S>
}

export const getScheduler: Effect.Effect<never, never, Scheduler> = gen(function* () {
  const ctx = yield* ops.context<never>()

  return yield* pipe(
    ctx,
    Context.getOption<Scheduler>(Scheduler),
    Option.match(() => DefaultScheduler.ask(Scheduler), ops.of),
  )
})

export const getIdGenerator: Effect.Effect<never, never, IdGenerator> = gen(function* () {
  const ctx = yield* ops.context<never>()

  return yield* pipe(
    ctx,
    Context.getOption<IdGenerator>(IdGenerator),
    Option.match(() => DefaultIdGenerator.ask(IdGenerator), ops.of),
  )
})

export const getGlobalFiberScope: Effect.Effect<never, never, GlobalFiberScope> = gen(function* () {
  const ctx = yield* ops.context<never>()

  return yield* pipe(
    ctx,
    Context.getOption<GlobalFiberScope>(GlobalFiberScope),
    Option.match(() => DefaultGlobalFiberScope.ask(GlobalFiberScope), ops.of),
  )
})

export const getClock: Effect.Effect<never, never, C.Clock> = getScheduler

export const getCurrentTime: Effect.Effect<never, never, Time> = pipe(getClock, ops.map(C.getTime))

export const getCurrentUnixTime: Effect.Effect<never, never, UnixTime> = pipe(
  getClock,
  ops.map((c) => c.currentTime()),
)

export function forkDaemon<R, E, A>(effect: Effect.Effect<R, E, A>) {
  return pipe(
    getGlobalFiberScope,
    ops.flatMap((scope) => pipe(effect, ops.forkWithOptions({ scope }))),
  )
}

export function forkDaemonWithOptions<R>(options: Omit<Partial<RuntimeOptions<R>>, 'scope'>) {
  return <E, A>(effect: Effect.Effect<R, E, A>) => {
    return pipe(
      getGlobalFiberScope,
      ops.flatMap((scope) => pipe(effect, ops.forkWithOptions({ scope, ...options }))),
    )
  }
}
