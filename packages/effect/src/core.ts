import * as Debug from './Debug.js'
import { Effect } from './Effect.js'
import { Handler } from './Handler.js'
import { FlatMap, Map, ProvideHandler, RunOp, Succeed } from './Instruction.js'
import { Op } from './Op.js'

export const succeed: <A>(value: A) => Effect<never, A> = Debug.methodWithTrace(
  (trace) =>
    <A>(value: A) =>
      Succeed.make(value, trace),
)

export const unit = (): Effect<never, void> => succeed(undefined)

export const map: {
  <A, B>(f: (a: A) => B): <R>(effect: Effect<R, A>) => Effect<R, B>
  <R, A, B>(effect: Effect<R, A>, f: (a: A) => B): Effect<R, B>
} = Debug.dualWithTrace(
  2,
  (trace) =>
    <R, A, B>(effect: Effect<R, A>, f: (a: A) => B) =>
      Map.make(effect, f, trace),
)

export const flatMap: {
  <A, R2, B>(f: (a: A) => Effect<R2, B>): <R>(effect: Effect<R, A>) => Effect<R | R2, B>
  <R, A, R2, B>(effect: Effect<R, A>, f: (a: A) => Effect<R2, B>): Effect<R | R2, B>
} = Debug.dualWithTrace(
  2,
  (trace) =>
    <R, A, R2, B>(effect: Effect<R, A>, f: (a: A) => Effect<R2, B>) =>
      FlatMap.make(effect, f, trace),
)

export const op: {
  <O extends Op.Any>(op: O): <I extends Op.Constraint<O>>(input: I) => Effect<O, Op.Apply<O, I>>
  <O extends Op.Any, I extends Op.Constraint<O>>(op: O, input: I): Effect<O, Op.Apply<O, I>>
} = Debug.methodWithTrace(
  (outer) =>
    function op<O extends Op.Any, I extends Op.Constraint<O>>(...args: [O, I] | [O]): any {
      if (args.length === 1) {
        return Debug.methodWithTrace(
          (inner) => (input: I) => new RunOp(args[0], input, [outer, inner]),
        )
      }

      return RunOp.make(args[0], args[1], outer)
    },
)

export const handle: {
  <H extends Handler.Any>(handler: H): <E extends Effect.Any>(
    effect: E,
  ) => Effect<Handler.ApplyOp<E, H>, Handler.ApplyReturn<E, H>>
  <E extends Effect.Any, H extends Handler.Any>(effect: E, handler: H): Effect<
    Handler.ApplyOp<E, H>,
    Handler.ApplyReturn<E, H>
  >
} = Debug.dualWithTrace(
  2,
  (trace) =>
    function handle<E extends Effect.Any, H extends Handler.Any>(
      effect: E,
      handler: H,
    ): Handler.Apply<E, H> {
      return ProvideHandler.make(effect, handler, trace)
    },
)
