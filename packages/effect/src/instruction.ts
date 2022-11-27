import { Context } from '@fp-ts/data/Context'
import { Cause } from '@typed/cause'
import { SingleShotGen } from '@typed/internal'
import { Platform } from '@typed/platform'

import { Effect } from './definition.js'

export type Instruction =
  | WithPlaftorm<any, any, any>
  | ProvideTrace<any, any, any>
  | WithContext<any, any, any, any>
  | ProvideContext<any, any, any>
  | Now<any>
  | FromLazy<any>
  | FromCause<any>
  | Lazy<any, any, any>

export const instr = <T extends string>(tag: T) =>
  class Instr<I, R, E, A> implements Effect<R, E, A> {
    constructor(readonly input: I) {}

    static tag: T = tag
    readonly tag: T = tag;

    readonly [Effect.TypeId] = Effect.Variance;
    readonly [Symbol.iterator] = () => new SingleShotGen<this, A>(this)
    readonly traced = (trace?: string): Effect<R, E, A> =>
      trace ? new ProvideTrace([this, trace]) : this
  }

export class ProvideTrace<R, E, A> extends instr('ProvideTrace')<
  readonly [Effect<R, E, A>, string],
  R,
  E,
  A
> {}

export class WithPlaftorm<R, E, A> extends instr('WithPlaftorm')<
  (platform: Platform) => Effect<R, E, A>,
  R,
  E,
  A
> {}

export class WithContext<R, R2, E, A> extends instr('WithContext')<
  (ctx: Context<R>) => Effect<R2, E, A>,
  R | R2,
  E,
  A
> {}

export class ProvideContext<R, E, A> extends instr('ProvideContext')<
  readonly [Effect<R, E, A>, Context<R>],
  never,
  E,
  A
> {}

export class Now<A> extends instr('Now')<A, never, never, A> {}

export class FromLazy<A> extends instr('FromLazy')<() => A, never, never, A> {}

export class FromCause<E> extends instr('FromCause')<Cause<E>, never, E, never> {}

export class Lazy<R, E, A> extends instr('Lazy')<() => Effect<R, E, A>, R, E, A> {}
