import * as Cause from './Cause.js'
import * as Debug from './Debug.js'
import { Effect } from './Effect.js'
import { Exit } from './Exit.js'
import { Handler } from './Handler.js'
import { Failure, FlatMap, Map, ProvideHandler, RunOp, Succeed } from './Instruction.js'
import { Op } from './Op.js'

export const succeed: <A>(value: A) => Effect<never, never, A> = Debug.methodWithTrace(
  (trace) =>
    <A>(value: A) =>
      Succeed.make(value, trace),
)

export const unit = (): Effect<never, never, void> => succeed(undefined)

export const failCause: <E>(cause: Cause.Cause<E>) => Effect<never, E, never> =
  Debug.methodWithTrace(
    (trace) =>
      <E>(cause: Cause.Cause<E>) =>
        Failure.make(cause, trace),
  )

export const fail: <E>(error: E) => Effect<never, E, never> = Debug.methodWithTrace(
  (trace) =>
    <E>(error: E) =>
      Failure.make(Cause.fail(error), trace),
)

export const fromExit = <E, A>(exit: Exit<E, A>): Effect<never, E, A> =>
  exit._tag === 'Success' ? succeed(exit.value) : failCause(exit.cause)

export const map: {
  <A, B>(f: (a: A) => B): <R, E>(effect: Effect<R, E, A>) => Effect<R, E, B>
  <R, E, A, B>(effect: Effect<R, E, A>, f: (a: A) => B): Effect<R, E, B>
} = Debug.dualWithTrace(
  2,
  (trace) =>
    <R, E, A, B>(effect: Effect<R, E, A>, f: (a: A) => B) =>
      Map.make(effect, f, trace),
)

export const flatMap: {
  <A, R2, E2, B>(f: (a: A) => Effect<R2, E2, B>): <R, E>(
    effect: Effect<R, E, A>,
  ) => Effect<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(effect: Effect<R, E, A>, f: (a: A) => Effect<R2, E2, B>): Effect<
    R | R2,
    E | E2,
    B
  >
} = Debug.dualWithTrace(
  2,
  (trace) =>
    <R, E, A, R2, E2, B>(effect: Effect<R, E, A>, f: (a: A) => Effect<R2, E2, B>) =>
      FlatMap.make(effect, f, trace),
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
  ) => Effect<Handler.ApplyOp<E, H>, Handler.ApplyError<E, H>, Handler.ApplyReturn<E, H>>
  <E extends Effect.Any, H extends Handler.Any>(effect: E, handler: H): Effect<
    Handler.ApplyOp<E, H>,
    Handler.ApplyError<E, H>,
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
