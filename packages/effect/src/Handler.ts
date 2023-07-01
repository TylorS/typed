import * as Semigroup from '@effect/data/typeclass/Semigroup'

import { Effect } from './Effect.js'
import { Lambda } from './Lambda.js'
import type { Op } from './Op.js'

export type Handler<InputR, Input extends Lambda, ReturnR, Return extends Lambda = never> =
  | EffectHandler<InputR, Input, ReturnR>
  | ([Return] extends [never] ? never : EffectReturnHandler<InputR, Input, ReturnR, Return>)

export namespace Handler {
  export type Any = EffectHandler.Any | EffectReturnHandler.Any

  export type ApplyOp<E extends Effect.Any, H extends Any> = [
    H extends EffectReturnHandler.Any
      ? EffectReturnHandler.ApplyOp<E, H>
      : H extends EffectHandler.Any
      ? EffectHandler.ApplyOp<E, H>
      : never,
  ] extends [infer R]
    ? R
    : never

  export type ApplyReturn<E extends Effect.Any, H extends Any> = [
    H extends EffectReturnHandler.Any
      ? EffectReturnHandler.ApplyReturn<E, H>
      : H extends EffectHandler.Any
      ? EffectHandler.ApplyReturn<E, H>
      : never,
  ] extends [infer R]
    ? R
    : never

  export type Apply<E extends Effect.Any, H extends Any> = Effect<ApplyOp<E, H>, ApplyReturn<E, H>>
}

export class EffectHandler<R, Input extends Lambda, R2> {
  readonly _tag = 'EffectHandler' as const

  constructor(
    readonly op: Op<R, Input>,
    readonly handle: <I extends Lambda.Constraint<Input>>(
      input: I,
      resume: (ouptut: Lambda.Apply<Input, I>) => Effect<never, void>,
    ) => Effect<R2, void>,
  ) {}
}

export namespace EffectHandler {
  export type ApplyOp<E extends Effect.Any, H extends Any> =
    | Exclude<Effect.Op<E>, InputOp<H>>
    | ReturnOp<H>

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export type ApplyReturn<E extends Effect.Any, _ extends Any> = Effect.Return<E>

  export type Apply<E extends Effect.Any, H extends Any> = Effect<
    Exclude<Effect.Op<E>, InputOp<H>> | ReturnOp<H>,
    Effect.Return<E>
  >

  export type Any = EffectHandler<any, any, any>

  export type InputOp<H extends Any> = H extends EffectHandler<infer R, any, any> ? R : never

  export type Input<H extends Any> = H extends EffectHandler<any, infer I, any> ? I : never

  export type ReturnOp<H extends Any> = H extends EffectHandler<any, any, infer R> ? R : never
}

export class EffectReturnHandler<R, Input extends Lambda, R2, Return extends Lambda> {
  readonly _tag = 'EffectReturnHandler' as const

  constructor(
    readonly op: Op<R, Input>,
    readonly handle: <I extends Lambda.Constraint<Input>>(
      input: I,
      resume: (ouptut: Lambda.Apply<Input, I>) => Effect<never, void>,
    ) => Effect<R2, void>,
    readonly onReturn: <A>(value: A) => Lambda.Apply<Return, A>,
    readonly semigroup: Semigroup.Semigroup<Lambda.Apply<Return, any>>,
  ) {}
}

export namespace EffectReturnHandler {
  export type ApplyOp<E extends Effect.Any, H extends Any> =
    | Exclude<Effect.Op<E>, InputOp<H>>
    | ReturnOp<H>

  export type ApplyReturn<E extends Effect.Any, H extends Any> = Lambda.Apply<
    Return<H>,
    Effect.Return<E>
  >

  export type Apply<E extends Effect.Any, H extends Any> = Effect<ApplyOp<E, H>, ApplyReturn<E, H>>

  export type Any = EffectReturnHandler<any, any, any, any>

  export type InputOp<H extends EffectReturnHandler<any, any, any, any>> =
    H extends EffectReturnHandler<infer R, any, any, any> ? R : never

  export type Input<H extends EffectReturnHandler<any, any, any, any>> =
    H extends EffectReturnHandler<any, infer I, any, any> ? I : never

  export type Return<H extends EffectReturnHandler<any, any, any, any>> =
    H extends EffectReturnHandler<any, any, any, infer R> ? R : never

  export type ReturnOp<H extends EffectReturnHandler<any, any, any, any>> =
    H extends EffectReturnHandler<any, any, infer R, any> ? R : never
}
