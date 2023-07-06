import * as Cause from './Cause.js'
import { Effect } from './Effect.js'
import { Exit } from './Exit.js'
import { Handler } from './Handler.js'
import {
  Failure,
  FlatMap,
  Map,
  ProvideHandler,
  RunOp,
  Succeed,
  Suspend,
  YieldNow,
} from './Instruction.js'
import { Op } from './Op.js'
import { dual } from './_function.js'

export const succeed: <A>(value: A) => Effect<never, never, A> = Succeed.make

export const unit = (): Effect<never, never, void> => succeed(undefined)

export const failCause: <E>(cause: Cause.Cause<E>) => Effect<never, E, never> = Failure.make

export const fail = <E>(error: E) => Failure.make(Cause.fail(error))

export const fromExit = <E, A>(exit: Exit<E, A>): Effect<never, E, A> =>
  exit._tag === 'Success' ? succeed(exit.value) : failCause(exit.cause)

export const map: {
  <A, B>(f: (a: A) => B): <R, E>(effect: Effect<R, E, A>) => Effect<R, E, B>
  <R, E, A, B>(effect: Effect<R, E, A>, f: (a: A) => B): Effect<R, E, B>
} = dual(2, <R, E, A, B>(effect: Effect<R, E, A>, f: (a: A) => B) => Map.make(effect, f))

export const flatMap: {
  <A, R2, E2, B>(f: (a: A) => Effect<R2, E2, B>): <R, E>(
    effect: Effect<R, E, A>,
  ) => Effect<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(effect: Effect<R, E, A>, f: (a: A) => Effect<R2, E2, B>): Effect<
    R | R2,
    E | E2,
    B
  >
} = dual(2, <R, E, A, R2, E2, B>(effect: Effect<R, E, A>, f: (a: A) => Effect<R2, E2, B>) =>
  FlatMap.make(effect, f),
)

export const op: {
  <O extends Op.Any>(op: O): <I extends Op.Constraint<O>>(
    input: I,
  ) => Effect<O, Op.Error<O>, Op.Apply<O, I>>
  <O extends Op.Any, I extends Op.Constraint<O>>(op: O, input: I): Effect<
    O,
    Op.Error<O>,
    Op.Apply<O, I>
  >
} = function op<O extends Op.Any, I extends Op.Constraint<O>>(...args: [O, I] | [O]): any {
  if (args.length === 1) {
    return (input: I) => new RunOp(args[0], input)
  }

  return RunOp.make(args[0], args[1])
}

export const handle: {
  <H extends Handler.Any>(handler: H): <E extends Effect.Any<any>>(effect: E) => Handler.Apply<E, H>
  <E extends Effect.Any<any>, H extends Handler.Any>(effect: E, handler: H): Handler.Apply<E, H>
} = dual(2, function handle<
  E extends Effect.Any,
  H extends Handler.Any,
>(effect: E, handler: H): Handler.Apply<E, H> {
  return ProvideHandler.make(effect, handler)
})

export const suspend = <R, E, A>(f: () => Effect<R, E, A>) => Suspend.make(f)

export const yieldNow: Effect<never, never, void> = new YieldNow()

export const tuple = <Effs extends ReadonlyArray<Effect.Any>>(
  ...effects: Effs
): Effect<
  Effect.Op<Effs[number]>,
  Effect.Error<Effs[number]>,
  {
    readonly [K in keyof Effs]: Effect.Return<Effs[K]>
  }
> => {
  type R = Effect<
    Effect.Op<Effs[number]>,
    Effect.Error<Effs[number]>,
    {
      readonly [K in keyof Effs]: Effect.Return<Effs[K]>
    }
  >

  const { length } = effects

  if (length === 0) {
    return succeed([]) as R
  } else if (length === 1) {
    return map(effects[0], (x) => [x]) as R
  } else {
    let output: Effect.Any<any[]> = succeed([])

    for (let i = 0; i < effects.length; ++i) {
      const effect = effects[i]
      output = flatMap(output, (previous) => map(effect, (a) => [...previous, a]))
    }

    return output as R
  }
}

// TODO: TuplePar
