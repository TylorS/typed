import { Context } from '@fp-ts/data/Context'
import { isLeft } from '@fp-ts/data/Either'
import { Cause, CauseError } from '@typed/cause'
import { Exit } from '@typed/exit'
import { SingleShotGen, OfGen } from '@typed/internal'

import type { FiberId } from '../FiberId/FiberId.js'
import type { FiberRefs } from '../FiberRefs/FiberRefs.js'
import type { FiberRuntime, RuntimeOptions } from '../FiberRuntime/FiberRuntime.js'
import type { FiberScope } from '../FiberScope/FiberScope.js'
import type { Future } from '../Future/Future.js'
import type { RuntimeFlags } from '../RuntimeFlags/RuntimeFlags.js'
import { flow2 } from '../_internal.js'

import { Effect } from './Effect.js'

export type Instruction<R, E, A> =
  | AccessContext<R, R, E, A>
  | Async<R, E, A>
  | FlatMap<R, E, any, R, E, A>
  | FlatMapCause<R, any, A, R, E, A>
  | Fork<R, E, A>
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

abstract class Instr<I, R, E, A> implements Effect<R, E, A> {
  readonly [Effect.TypeId]: Effect.Variance<R, E, A>[Effect.TypeId] = Effect.Variance

  constructor(readonly input: I, readonly __trace?: string) {}

  [Symbol.iterator](): Generator<Effect<R, E, A>, A, A> {
    return new SingleShotGen<this, A>(this)
  }
}

export class AccessContext<R, R2, E, A> extends Instr<
  (r: Context<R>) => Effect<R2, E, A>,
  R | R2,
  E,
  A
> {
  readonly tag = 'AccessContext'
}

export class ProvideContext<R, E, A> extends Instr<
  readonly [Effect<R, E, A>, Context<R>],
  never,
  E,
  A
> {
  readonly tag = 'ProvideContext'
}

export class FromCause<E> extends Instr<Cause<E>, never, E, never> {
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
      return new Of(f((effect as Of<A>).input))
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
  readonly [Effect<R, E, A>, (a: Cause<E>) => Cause<E2>],
  R,
  E2,
  A
> {
  readonly tag = 'MapCause'
}

export class FlatMapCause<R, E, A, R2, E2, B> extends Instr<
  readonly [Effect<R, E, A>, (a: Cause<E>) => Effect<R2, E2, B>],
  R | R2,
  E2,
  B
> {
  readonly tag = 'FlatMapCause'
}

export class Match<R, E, A, R2, E2, B, R3, E3, C> extends Instr<
  readonly [Effect<R, E, A>, (e: Cause<E>) => Effect<R2, E2, B>, (a: A) => Effect<R3, E3, C>],
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

export function gen<Eff extends Effect<any, any, any>, A, N = unknown>(
  f: () => Generator<Eff, A, N>,
  __trace?: string,
): Effect<Effect.ResourcesOf<Eff>, Effect.ErrorsOf<Eff>, A> {
  return new Lazy(() => {
    const gen = f()

    return new FlatMapCause([
      runEffectGenerator(gen, gen.next()),
      // TOOD: better error handling
      (cause) => runEffectGenerator(gen, gen.throw(new CauseError(cause))),
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

export const withFiberRefs =
  (refs: FiberRefs, __trace?: string) =>
  <R, E, A>(effect: Effect<R, E, A>): Effect<R, E, A> =>
    new WithFiberRefs([effect, refs], __trace)
