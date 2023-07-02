import * as Semigroup from '@effect/data/typeclass/Semigroup'

import { Effect } from './Effect.js'
import { Exit } from './Exit.js'
import { Lambda } from './Lambda.js'
import type { Op } from './Op.js'

export type Handler<O extends Op.Any, ReturnR, ReturnE, Return extends Lambda = never> =
  | EffectHandler<O, ReturnR, ReturnE>
  | ([Return] extends [never] ? never : EffectReturnHandler<O, ReturnR, ReturnE, Return>)

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

  export type ApplyError<E extends Effect.Any, H extends Any> = [
    H extends EffectReturnHandler.Any
      ? EffectReturnHandler.ApplyError<E, H>
      : H extends EffectHandler.Any
      ? EffectHandler.ApplyError<E, H>
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

  export type Apply<E extends Effect.Any, H extends Any> = Effect<
    ApplyOp<E, H>,
    ApplyError<E, H>,
    ApplyReturn<E, H>
  >
}

export class EffectHandler<O extends Op.Any, R2, E2> {
  readonly _tag = 'EffectHandler' as const

  constructor(
    readonly op: O,
    readonly handle: <I extends Op.Constraint<O>>(
      input: I,
      resume: (ouptut: Op.Apply<O, I>) => Effect<never, never, void>,
    ) => Effect<R2, E2, void>,
  ) {}
}

export namespace EffectHandler {
  export type ApplyOp<E extends Effect.Any, H extends Any> =
    | Exclude<Effect.Op<E>, Op<H>>
    | ReturnOp<H>

  export type ApplyError<E extends Effect.Any, H extends Any> =
    | Effect.Error<E>
    | Op.Error<Op<H>>
    | ReturnError<H>

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export type ApplyReturn<E extends Effect.Any, _ extends Any> = Effect.Return<E>

  export type Apply<E extends Effect.Any, H extends Any> = Effect<
    ApplyOp<E, H>,
    ApplyError<E, H>,
    ApplyReturn<E, H>
  >

  export type Any = EffectHandler<any, any, any> | EffectHandler<any, any, never>

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export type Op<T extends Any> = T extends EffectHandler<infer O, infer _, infer __> ? O : never

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export type ReturnOp<T extends Any> = T extends EffectHandler<infer _, infer R, infer __>
    ? R
    : never

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export type ReturnError<T extends Any> = T extends EffectHandler<infer _, infer _, infer E>
    ? E
    : never
}

export class EffectReturnHandler<O extends Op.Any, R2, E2, Return extends Lambda> {
  readonly _tag = 'EffectReturnHandler' as const

  constructor(
    readonly op: O,
    readonly handle: <I extends Op.Constraint<O>>(
      input: I,
      resume: (ouptut: Exit<Op.Error<O>, Op.Apply<O, I>>) => Effect<never, never, void>,
    ) => Effect<R2, E2, void>,
    readonly onReturn: <A>(value: A) => Lambda.Apply<Return, A>,
    readonly semigroup: Semigroup.Semigroup<Lambda.Apply<Return, any>>,
  ) {}
}

export namespace EffectReturnHandler {
  export type ApplyOp<E extends Effect.Any, H extends Any> =
    | Exclude<Effect.Op<E>, Op<H>>
    | ReturnOp<H>

  export type ApplyError<E extends Effect.Any, H extends Any> =
    | Effect.Error<E>
    | Op.Error<Op<H>>
    | ReturnError<H>

  export type ApplyReturn<E extends Effect.Any, H extends Any> = Lambda.Apply<
    Return<H>,
    Effect.Return<E>
  >

  export type Apply<E extends Effect.Any, H extends Any> = Effect<
    ApplyOp<E, H>,
    ApplyError<E, H>,
    ApplyReturn<E, H>
  >

  export type Any =
    | EffectReturnHandler<any, any, any, any>
    | EffectReturnHandler<any, any, never, any>

  export type Op<H extends Any> = H extends EffectReturnHandler<infer R, any, any, any> ? R : never

  export type ReturnOp<H extends Any> = H extends EffectReturnHandler<any, infer R, any, any>
    ? R
    : never

  export type ReturnError<H extends Any> = H extends EffectReturnHandler<any, any, infer E, any>
    ? E
    : never

  export type Return<H extends Any> = H extends EffectReturnHandler<any, any, any, infer R>
    ? R
    : never
}
