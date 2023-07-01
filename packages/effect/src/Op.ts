import { Tag } from '@effect/data/Context'
import * as Semigroup from '@effect/data/typeclass/Semigroup'

import { Effect } from './Effect.js'
import { EffectHandler, EffectReturnHandler, Handler } from './Handler.js'
import { Lambda } from './Lambda.js'

export function Op<R, Input extends Lambda>(id: string) {
  // The Static shape is exactly the same as the runtime version so that we can
  // use the runtime Type as the identifier at all times.

  return class Op {
    static _tag = 'Op'
    readonly _tag = Op._tag

    static id: string = id
    readonly id: string = Op.id

    static key: Tag<R, Handler<R, Input, any, any>> = Tag(id)
    readonly key: Tag<R, Handler<R, Input, any, any>> = Op.key
  }
}

export interface Op<R, Input extends Lambda> extends ReturnType<typeof Op<R, Input>> {}

export namespace Op {
  export type Any = Op<any, any>

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export type Id<O extends Op<any, any>> = O extends Op<infer R, infer _> ? R : never

  export type Input<O extends Op<any, any>> = O extends Op<any, infer I> ? I : never

  export type Constraint<O extends Op<any, any>> = Lambda.Constraint<Input<O>>

  export type Apply<O extends Op<any, any>, I> = Lambda.Apply<Input<O>, I>

  export function handle<R, Input extends Lambda>(Op: Op<R, Input>) {
    return <R2>(
      f: <I extends Lambda.Constraint<Input>>(
        input: I,
        resume: (value: Lambda.Apply<Input, I>) => Effect<never, void>,
      ) => Effect<R2, void>,
    ): EffectHandler<R, Input, R2> => {
      return new EffectHandler(Op, f)
    }
  }

  export function handleReturn<R, Input extends Lambda>(Op: Op<R, Input>) {
    return <Return extends Lambda, R2 = never>(
      f: <I extends Lambda.Constraint<Input>>(
        input: I,
        resume: (value: Lambda.Apply<Input, I>) => Effect<never, void>,
      ) => Effect<R2, void>,
      onReturn: <A>(value: A) => Lambda.Apply<Return, A>,
      semigroup: Semigroup.Semigroup<Lambda.Apply<Return, any>>,
    ): EffectReturnHandler<R, Input, R2, Return> => {
      return new EffectReturnHandler(Op, f, onReturn, semigroup)
    }
  }
}
