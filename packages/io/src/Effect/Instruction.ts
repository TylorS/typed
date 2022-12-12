import * as Context from '@fp-ts/data/Context'
import { Either, isLeft, left, right } from '@fp-ts/data/Either'
import { pipe } from '@fp-ts/data/Function'
import * as Cause from '@typed/cause'
import { Expected, Sequential } from '@typed/cause'
import { Exit } from '@typed/exit'
import { SingleShotGen, OfGen } from '@typed/internal'

import type { RuntimeFiber } from '../Fiber.js'
import type { FiberId } from '../FiberId/FiberId.js'
import type { FiberRefs } from '../FiberRefs/FiberRefs.js'
import type { FiberRuntime, RuntimeOptions } from '../FiberRuntime/FiberRuntime.js'
import type { FiberScope } from '../FiberScope/FiberScope.js'
import type { Future } from '../Future/Future.js'
import type { Layer } from '../Layer/Layer.js'
import type { RuntimeFlags } from '../RuntimeFlags/RuntimeFlags.js'
import { flow2 } from '../_internal/flow2.js'

import { Effect } from './Effect.js'

export type Instruction<R, E, A> =
  | AccessContext<R, R, E, A>
  | Async<R, E, A>
  | FlatMap<R, E, any, R, E, A>
  | FlatMapCause<R, any, A, R, E, A>
  | Fork<R, E, A>
  | ForkDaemon<R, E, A>
  | FromCause<E>
  | GetFiberId
  | GetFiberScope
  | GetRuntimeFlags
  | GetRuntimeOptions<R>
  | Lazy<R, E, A>
  | Map<R, E, any, A>
  | MapCause<R, any, A, E>
  | Match<R, any, any, R, E, A, R, E, A>
  | Of<A>
  | ProvideContext<any, E, A>
  | Sync<A>
  | UpdateRuntimeFlags<R, E, A>
  | WithFiberRefs<R, E, A>
  | Race<R, E, A, R, E, A>
  | Zip<R, E, any, R, E, any>

abstract class Instr<I, R, E, A> implements Effect<R, E, A> {
  readonly [Effect.TypeId]: Effect.Variance<R, E, A>[Effect.TypeId] = Effect.Variance

  constructor(readonly input: I, readonly __trace?: string) {}

  [Symbol.iterator](): Generator<Effect<R, E, A>, A, A> {
    return new SingleShotGen<this, A>(this)
  }

  map<B>(this: Effect<R, E, A>, f: (a: A) => B, __trace?: string): Effect<R, E, B> {
    return Map.make<R, E, A, B>(this, f, __trace)
  }

  as<B>(this: Effect<R, E, A>, b: B, __trace?: string): Effect<R, E, B> {
    return this.map(() => b, __trace)
  }

  mapCause<E2>(
    this: Effect<R, E, A>,
    f: (e: Cause.Cause<E>) => Cause.Cause<E2>,
    __trace?: string,
  ): Effect<R, E2, A> {
    return new MapCause<R, E, A, E2>([this, f], __trace)
  }

  mapError<E2>(this: Effect<R, E, A>, f: (e: E) => E2, __trace?: string): Effect<R, E2, A> {
    return this.mapCause(Cause.map(f), __trace)
  }

  causedBy<Errors2>(
    this: Effect<R, E, A>,
    cause: Cause.Cause<Errors2>,
    __trace?: string | undefined,
  ): Effect<R, E | Errors2, never> {
    return this.matchCause(
      (cause2) => new FromCause(Sequential(cause, cause2)),
      () => new FromCause(cause),
      __trace,
    )
  }

  flatMap<R2, E2, B>(
    this: Effect<R, E, A>,
    f: (a: A) => Effect<R2, E2, B>,
    __trace?: string,
  ): Effect<R | R2, E | E2, B> {
    return new FlatMap<R, E, A, R2, E2, B>([this, f], __trace)
  }

  flatMapCause<R2, E2, B>(
    this: Effect<R, E, A>,
    f: (e: Cause.Cause<E>) => Effect<R2, E2, B>,
    __trace?: string,
  ): Effect<R | R2, E2, A | B> {
    return new FlatMapCause<R, E, A, R2, E2, B>([this, f], __trace)
  }

  flatMapError<Resources2, Errors2, Output2>(
    this: Effect<R, E, A>,
    f: (a: E) => Effect<Resources2, Errors2, Output2>,
    __trace?: string | undefined,
  ): Effect<R | Resources2, Errors2, A | Output2> {
    return this.flatMapCause(
      Cause.expectedOrCause(f, (cause) => new FromCause(cause)),
      __trace,
    )
  }

  matchCause<R2, E2, B, R3, E3, C>(
    this: Effect<R, E, A>,
    onFailure: (e: Cause.Cause<E>) => Effect<R2, E2, B>,
    onSuccess: (a: A) => Effect<R3, E3, C>,
    __trace?: string,
  ): Effect<R | R2 | R3, E2 | E3, B | C> {
    return new Match<R, E, A, R2, E2, B, R3, E3, C>([this, onFailure, onSuccess], __trace)
  }

  matchError<R2, E2, B, R3, E3, C>(
    this: Effect<R, E, A>,
    onFailure: (e: E) => Effect<R2, E2, B>,
    onSuccess: (a: A) => Effect<R3, E3, C>,
    __trace?: string,
  ): Effect<R | R2 | R3, E2 | E3, B | C> {
    return this.matchCause(
      Cause.expectedOrCause(onFailure, (cause) => new FromCause(cause)),
      onSuccess,
      __trace,
    )
  }

  tap<R2, E2, B>(
    this: Effect<R, E, A>,
    f: (a: A) => Effect<R2, E2, B>,
    __trace?: string,
  ): Effect<R | R2, E | E2, A> {
    return this.flatMap((a) => f(a).as(a), __trace)
  }

  tapCause<R2, E2, B>(
    this: Effect<R, E, A>,
    f: (e: Cause.Cause<E>) => Effect<R2, E2, B>,
    __trace?: string,
  ): Effect<R | R2, E | E2, A> {
    return this.flatMapCause((e) => f(e).causedBy(e), __trace)
  }

  tapError<R2, E2, B>(
    this: Effect<R, E, A>,
    f: (e: E) => Effect<R2, E2, B>,
    __trace?: string,
  ): Effect<R | R2, E | E2, A> {
    return this.flatMapError((e) => f(e).causedBy(Expected(e)), __trace)
  }

  ensuring<R2, E2, B>(
    this: Effect<R, E, A>,
    finalizer: (exit: Exit<E, A>) => Effect<R2, E2, B>,
    __trace?: string,
  ): Effect<R | R2, E | E2, A> {
    return this.matchCause(
      (cause1) => finalizer(left(cause1)).causedBy(cause1),
      (value) => finalizer(right(value)).as(value),
      __trace,
    )
  }

  race<R2, E2, A2>(
    this: Effect<R, E, A>,
    that: Effect<R2, E2, A2>,
    __trace?: string,
  ): Effect<R | R2, E | E2, A | A2> {
    return new Race([this, that], __trace)
  }

  zip<R2, E2, A2>(
    this: Effect<R, E, A>,
    that: Effect<R2, E2, A2>,
    __trace?: string,
  ): Effect<R | R2, E | E2, readonly [A, A2]> {
    return new Zip([this, that], __trace)
  }

  get attempt(): Effect<R, never, Exit<E, A>> {
    return this.matchCause(
      (c) => new Of(left(c)),
      (a) => new Of(right(a)),
    )
  }

  get either(): Effect<R, never, Either<E, A>> {
    return this.matchError(
      (c) => new Of(left(c)),
      (a) => new Of(right(a)),
    )
  }

  fork(
    this: Effect<R, E, A>,
    options?: Partial<RuntimeOptions<R>>,
    __trace?: string,
  ): Effect<R, never, RuntimeFiber<E, A>> {
    return new Fork<R, E, A>([this, options], __trace)
  }

  forkDaemon(
    this: Effect<R, E, A>,
    options?: Omit<Partial<RuntimeOptions<R>>, 'scope'>,
    __trace?: string,
  ): Effect<R, never, RuntimeFiber<E, A>> {
    return new ForkDaemon<R, E, A>([this, options], __trace)
  }

  provideContext(
    this: Effect<R, E, A>,
    context: Context.Context<R>,
    __trace?: string,
  ): Effect<never, E, A> {
    return new ProvideContext([this, context], __trace)
  }

  provide<S>(
    this: Effect<R, E, A>,
    context: Context.Context<S>,
    __trace?: string,
  ): Effect<Exclude<R, S>, E, A> {
    return new AccessContext(
      (r: Context.Context<Exclude<R, S>>) =>
        this.provideContext(pipe(r as Context.Context<R>, Context.merge(context))),
      __trace,
    )
  }

  provideService<S>(
    this: Effect<R, E, A>,
    tag: Context.Tag<S>,
    service: S,
    __trace?: string,
  ): Effect<Exclude<R, S>, E, A> {
    return this.provide(Context.add(tag)(service)(Context.empty()), __trace)
  }

  provideLayer<R2, E2, I, S>(this: Effect<R, E, A>, layer: Layer<R2, E2, I, S>, __trace?: string) {
    return layer.get.flatMap((i) => this.provide(i), __trace)
  }

  withFiberRefs(
    this: Effect<R, E, A>,
    refs: FiberRefs,
    __trace?: string | undefined,
  ): Effect<R, E, A> {
    return new WithFiberRefs([this, refs], __trace)
  }

  updateRuntimeFlags(
    this: Effect<R, E, A>,
    f: (flags: RuntimeFlags) => RuntimeFlags,
    __trace?: string,
  ): Effect<R, E, A> {
    return new UpdateRuntimeFlags([this, f], __trace)
  }

  get interruptable(): Effect<R, E, A> {
    return this.updateRuntimeFlags((flags) => ({ ...flags, interruptable: true }))
  }

  get uninterruptable(): Effect<R, E, A> {
    return this.updateRuntimeFlags((flags) => ({ ...flags, interruptable: false }))
  }
}

export class AccessContext<R, R2, E, A> extends Instr<
  (r: Context.Context<R>) => Effect<R2, E, A>,
  R | R2,
  E,
  A
> {
  readonly tag = 'AccessContext'
}

export class ProvideContext<R, E, A> extends Instr<
  readonly [Effect<R, E, A>, Context.Context<R>],
  never,
  E,
  A
> {
  readonly tag = 'ProvideContext'
}

export class FromCause<E> extends Instr<Cause.Cause<E>, never, E, never> {
  readonly tag = 'FromCause'
}

export class Of<A> extends Instr<A, never, never, A> {
  readonly tag = 'Of';

  readonly [Symbol.iterator] = () => new OfGen(this.input)
}

export class Sync<A> extends Instr<() => A, never, never, A> {
  readonly tag = 'Sync'
}

export class Lazy<R, E, A> extends Instr<() => Effect<R, E, A>, R, E, A> {
  readonly tag = 'Lazy'
}

export class Map<R, E, A, B> extends Instr<readonly [Effect<R, E, A>, (a: A) => B], R, E, B> {
  readonly tag = 'Map'

  static make<R, E, A, B>(
    effect: Effect<R, E, A>,
    f: (a: A) => B,
    __trace?: string,
  ): Effect<R, E, B> {
    if ((effect as Instruction<R, E, A>).tag === 'Of') {
      return new Of(f((effect as any as Of<A>).input))
    } else if ((effect as Instruction<R, E, A>).tag === 'Map') {
      const [eff, e] = (effect as Map<R, E, A, any>).input

      return new Map([eff, flow2(e, f)], __trace)
    }

    return new Map([effect, f], __trace)
  }
}

export class FlatMap<R, E, A, R2, E2, B> extends Instr<
  readonly [Effect<R, E, A>, (a: A) => Effect<R2, E2, B>],
  R | R2,
  E | E2,
  B
> {
  readonly tag = 'FlatMap'
}

export class MapCause<R, E, A, E2> extends Instr<
  readonly [Effect<R, E, A>, (a: Cause.Cause<E>) => Cause.Cause<E2>],
  R,
  E2,
  A
> {
  readonly tag = 'MapCause'
}

export class FlatMapCause<R, E, A, R2, E2, B> extends Instr<
  readonly [Effect<R, E, A>, (a: Cause.Cause<E>) => Effect<R2, E2, B>],
  R | R2,
  E2,
  A | B
> {
  readonly tag = 'FlatMapCause'
}

export class Match<R, E, A, R2, E2, B, R3, E3, C> extends Instr<
  readonly [Effect<R, E, A>, (e: Cause.Cause<E>) => Effect<R2, E2, B>, (a: A) => Effect<R3, E3, C>],
  R | R2 | R3,
  E2 | E3,
  B | C
> {
  readonly tag = 'Match'
}

export class Async<R, E, A> extends Instr<Future<R, E, A>, R, E, A> {
  readonly tag = 'Async'
}

export class GetRuntimeFlags extends Instr<void, never, never, RuntimeFlags> {
  readonly tag = 'GetRuntimeFlags'
}

export class GetRuntimeOptions<R> extends Instr<void, R, never, RuntimeOptions<R>> {
  readonly tag = 'GetRuntimeOptions'
}

export class UpdateRuntimeFlags<R, E, A> extends Instr<
  readonly [Effect<R, E, A>, (flags: RuntimeFlags) => RuntimeFlags],
  R,
  E,
  A
> {
  readonly tag = 'UpdateRuntimeFlags'
}

export class GetFiberRefs extends Instr<void, never, never, FiberRefs> {
  readonly tag = 'GetFiberRefs'
}

export class WithFiberRefs<R, E, A> extends Instr<readonly [Effect<R, E, A>, FiberRefs], R, E, A> {
  readonly tag = 'WithFiberRefs'
}

export class GetFiberScope extends Instr<void, never, never, FiberScope> {
  readonly tag = 'GetFiberScope'
}

export class GetFiberId extends Instr<void, never, never, FiberId> {
  readonly tag = 'GetFiberId'
}

export class Fork<R, E, A> extends Instr<
  readonly [Effect<R, E, A>, Partial<RuntimeOptions<R>>?],
  R,
  never,
  FiberRuntime<R, E, A>
> {
  readonly tag = 'Fork'
}

export class ForkDaemon<R, E, A> extends Instr<
  readonly [Effect<R, E, A>, Omit<Partial<RuntimeOptions<R>>, 'scope'>?],
  R,
  never,
  FiberRuntime<R, E, A>
> {
  readonly tag = 'ForkDaemon'
}

export class Zip<R, E, A, R2, E2, B> extends Instr<
  readonly [Effect<R, E, A>, Effect<R2, E2, B>],
  R | R2,
  E | E2,
  readonly [A, B]
> {
  readonly tag = 'Zip'
}

export class Race<R, E, A, R2, E2, B> extends Instr<
  readonly [Effect<R, E, A>, Effect<R2, E2, B>],
  R | R2,
  E | E2,
  A | B
> {
  readonly tag = 'Race'
}

export function gen<Eff extends Effect<any, any, any>, A, N = unknown>(
  f: () => Generator<Eff, A, N>,
  __trace?: string,
): Effect<Effect.ResourcesOf<Eff>, Effect.ErrorsOf<Eff>, A> {
  return new Lazy<Effect.ResourcesOf<Eff>, Effect.ErrorsOf<Eff>, A>(() => {
    const gen = f()

    return new FlatMapCause([
      runEffectGenerator(gen, gen.next()),
      // TOOD: better error handling
      (cause) => runEffectGenerator(gen, gen.throw(new Cause.CauseError(cause))),
    ])
  }, __trace)
}

function runEffectGenerator<Eff extends Effect<any, any, any>, A>(
  gen: Generator<Eff, A>,
  result: IteratorResult<Eff, A>,
): Effect<Effect.ResourcesOf<Eff>, Effect.ErrorsOf<Eff>, A> {
  if (result.done) {
    return new Of(result.value)
  }

  return new FlatMap([result.value, (value) => runEffectGenerator(gen, gen.next(value))])
}

export function fromExit<E, A>(exit: Exit<E, A>, __trace?: string): Effect.IO<E, A> {
  return isLeft(exit) ? new FromCause(exit.left, __trace) : new Of(exit.right, __trace)
}
