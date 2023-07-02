import { Tag } from '@effect/data/Context'
import * as Semigroup from '@effect/data/typeclass/Semigroup'

import { Effect } from './Effect.js'
import { Exit } from './Exit.js'
import { EffectHandler, EffectReturnHandler, Handler } from './Handler.js'
import { Lambda } from './Lambda.js'

export function Op<R, E, Input extends Lambda>(
  id: string,
): Operation<R, E, Input> & (new () => Operation<R, E, Input>) {
  // The Static shape is exactly the same as the runtime version so that we can
  // use the runtime Type as the identifier at all times.

  return class Op implements Operation<R, E, Input> {
    static _R: (_: never) => R
    static _E: (_: never) => E
    static _A: (_: Input) => never

    readonly _R!: (_: never) => R
    readonly _E!: (_: never) => E
    readonly _A!: (_: Input) => never

    static _tag = 'Op' as const
    readonly _tag = Op._tag

    static id: string = id
    readonly id: string = Op.id

    static key: Tag<R, Handler<Op, any, any>> = Tag(id)
    readonly key: Tag<R, Handler<Op, any, any>> = Op.key
  }
}

export interface Operation<R, E, Input extends Lambda> {
  readonly _R: (_: never) => R
  readonly _E: (_: never) => E
  readonly _A: (_: Input) => never

  readonly _tag: 'Op'
  readonly id: string
  readonly key: Tag<R, Handler<Operation<R, E, Input>, any, any>>
}

export type Op<R, E, Input extends Lambda> = Operation<R, E, Input>

export namespace Op {
  export type Any = Op<any, any, any> | Op<any, never, any>

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export type Id<O extends Any> = O extends Op<infer R, infer _, infer __> ? R : never

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export type Error<O extends Any> = O extends Op<infer _, infer E, infer __> ? E : never

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export type Input<O extends Any> = [O] extends [Op<infer _, infer __, infer I>] ? I : never

  export type Constraint<O extends Any> = Lambda.Constraint<Input<O>>

  export type Apply<O extends Any, I> = Lambda.Apply<Input<O>, I>

  export function handle<O extends Op.Any>(Op: O) {
    return <R2, E2>(
      f: <I extends Op.Constraint<O>>(
        input: I,
        resume: (value: Op.Apply<O, I>) => Effect<never, never, void>,
      ) => Effect<R2, E2, void>,
    ): EffectHandler<O, R2, E2> => {
      return new EffectHandler(Op, f)
    }
  }

  export function handleReturn<O extends Op.Any>(Op: O | (O & (new (...args: any) => O))) {
    return <Return extends Lambda, R2 = never, E2 = never>(
      f: <I extends Op.Constraint<O>>(
        input: I,
        resume: (value: Exit<Op.Error<O>, Op.Apply<O, I>>) => Effect<never, never, void>,
      ) => Effect<R2, E2, void>,
      onReturn: <A>(value: A) => Lambda.Apply<Return, A>,
      semigroup: Semigroup.Semigroup<Lambda.Apply<Return, any>>,
    ): EffectReturnHandler<O, R2, E2, Return> => {
      return new EffectReturnHandler(Op, f, onReturn, semigroup)
    }
  }
}
