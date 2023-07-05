import { Tag } from '@effect/data/Context'

import { Effect } from './Effect.js'
import * as ExitJs from './Exit.js'
import { EffectHandler, EffectReturnHandler } from './Handler.js'
import { Lambda } from './Lambda.js'
import { Operation } from './Operation.js'

export interface Op<R, E, Input extends Lambda> extends Operation<R, E, Input> {
  new (): this

  /**
   * Helper for construction of an Effect Handler
   */
  handle<T extends Op.Any, R2, E2>(
    this: T,
    f: <I extends Op.Constraint<T>>(
      input: I,
      resume: (value: Op.Apply<T, I>) => Effect<never, never, void>,
    ) => Effect<R2, E2, void>,
  ): EffectHandler<InstanceType<this>, R2, E2>
  /**
   * Helper for construction of an Effect handler which can change the
   */
  handleReturn<T extends Op.Any, Return extends Lambda, R2 = never, E2 = never>(
    this: T,
    f: <I extends Op.Constraint<T>>(
      input: I,
      resume: (value: Op.Apply<T, I>) => Effect<never, Op.Error<T>, unknown>,
    ) => Effect<R2, E2, unknown>,
    onReturn: <A>(value: A) => Lambda.Apply<Return, A>,
  ): EffectReturnHandler<InstanceType<this>, R2, E2, Return>
}

export function Op<R, E, Input extends Lambda>(id: string): Op<R, E, Input> {
  // The Static shape is exactly the same as the runtime version so that we can
  // use the runtime Type as the identifier at all times.

  return class OpImpl {
    static _R: (_: never) => R
    static _E: (_: never) => E
    static _A: (_: Input) => never

    readonly _R!: (_: never) => R
    readonly _E!: (_: never) => E
    readonly _A!: (_: Input) => never

    static _tag = 'Op' as const
    readonly _tag = OpImpl._tag

    static id: string = id
    readonly id: string = OpImpl.id

    static key = Tag(id) as any
    readonly key = OpImpl.key as any

    static handle: Op<R, E, Input>['handle'] = Op.handle(this as any)
    readonly handle = Op.handle(this) as any

    static handleReturn: Op<R, E, Input>['handleReturn'] = Op.handleReturn(this as any)
    readonly handleReturn = Op.handleReturn(this) as any
  } as Op<R, E, Input>
}

export namespace Op {
  export type Any = Operation<any, any, any> | Operation<any, never, any>

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export type Id<O extends Any> = O extends Operation<infer R, infer _, infer __> ? R : never

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export type Error<O extends Any> = O extends Operation<infer _, infer E, infer __> ? E : never

  export type Exit<O extends Any, I> = ExitJs.Exit<Error<O>, Apply<O, I>>

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export type Input<O extends Any> = [O] extends [Operation<infer _, infer __, infer I>] ? I : never

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
        resume: (value: Op.Apply<O, I>) => Effect<never, never, unknown>,
      ) => Effect<R2, E2, unknown>,
      onReturn: <A>(value: A) => Lambda.Apply<Return, A>,
    ): EffectReturnHandler<O, R2, E2, Return> => {
      return new EffectReturnHandler(Op, f, onReturn)
    }
  }
}
