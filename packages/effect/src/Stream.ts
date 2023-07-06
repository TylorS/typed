import { Effect } from './Effect.js'
import { Lambda } from './Lambda.js'
import { Op } from './Op.js'
import { Operation } from './Operation.js'
import { dual, pipe } from './_function.js'
import * as core from './core.js'

export type Stream<E, A> = StreamError<E> | StreamEvent<A> | StreamEnd

export namespace Stream {
  export type Any = Stream<any, any>

  export type StreamFrom<E extends Effect.Any> = [Stream<ErrorFrom<E>, EventFrom<E>>] extends [
    Stream<infer E2, infer A2>,
  ]
    ? Stream<E2, A2>
    : never

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export type ErrorFrom<E extends Effect.Any> = [Extract<Effect.Op<E>, StreamError<any>>] extends [
    never,
  ]
    ? never
    : [Extract<Effect.Op<E>, StreamError<any>>] extends [StreamError<infer E2>]
    ? E2
    : never

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export type EventFrom<E extends Effect.Any> = [Extract<Effect.Op<E>, StreamEvent<any>>] extends [
    never,
  ]
    ? never
    : [Extract<Effect.Op<E>, StreamEvent<any>>] extends [StreamEvent<infer A>]
    ? A
    : never
}

export interface StreamEventLambda extends Lambda {
  readonly Out: void
}

export class StreamEvent<A> extends Operation<StreamEventLambda>('@typed/effect/Stream/Event')<
  StreamEvent<A>,
  never
> {
  constructor() {
    super()
    this.produce = this.produce.bind(this)
    this.produceAll = this.produceAll.bind(this)
  }

  produce(value: A) {
    return core.op<StreamEvent<A>>(this)(value)
  }

  produceAll(...values: Array<A>) {
    return core.map(core.tuple(...Array.from(values, this.produce)), (a): void => void a)
  }
}

export interface StreamErrorLambda extends Lambda {
  readonly Out: void
}

export class StreamError<E> extends Operation<StreamErrorLambda>('@typed/effect/Stream/Error')<
  StreamError<E>,
  never
> {
  constructor() {
    super()

    this.produce = this.produce.bind(this)
  }

  produce(value: E) {
    return core.op<StreamError<E>>(this)(value)
  }
}

export interface StreamEndLambda extends Lambda {
  readonly InConstraint: void
  readonly Out: void
}

export class StreamEnd extends Op<StreamEnd, never, StreamEndLambda>()('@typed/effect/Stream/End') {
  static readonly produce = core.op<StreamEnd>(StreamEnd)(undefined)
}

export const observe: {
  // Data-last
  <R extends Stream<any, any>, R2, E2, B>(f: (a: Stream.EventFrom<R>) => Effect<R2, E2, B>): <E, A>(
    effect: Effect<R, E, A>,
  ) => Effect<
    Exclude<R | R2, Stream.StreamFrom<typeof effect>>,
    E | E2 | Stream.ErrorFrom<typeof effect>,
    void
  >

  // Data-first
  <R extends Stream<any, any>, E, A, R2, E2, B>(
    effect: Effect<R, E, A>,
    f: (a: Stream.EventFrom<R>) => Effect<R2, E2, B>,
  ): Effect<
    Exclude<R | R2, Stream.StreamFrom<typeof effect>>,
    E | E2 | Stream.ErrorFrom<typeof effect>,
    void
  >
} = dual(2, function observe<
  R extends Stream<any, any>,
  E,
  A,
  R2,
  E2,
  B,
>(effect: Effect<R, E, A>, f: (a: Stream.EventFrom<R>) => Effect<R2, E2, B>): Effect<
  Exclude<R | R2, Stream.StreamFrom<typeof effect>>,
  E | E2 | Stream.ErrorFrom<typeof effect>,
  void
> {
  const eventOp = new StreamEvent<Stream.EventFrom<R>>()
  const errorOp = new StreamError<Stream.ErrorFrom<typeof effect>>()
  const handleEvent = core.handle(
    Op.handle(eventOp)((value, resume) => core.flatMap(f(value), resume)),
  )

  return core.async((resume) =>
    pipe(
      effect,
      handleEvent,
      core.handle(Op.handle(errorOp)((value) => core.sync(() => resume(core.fail(value))))),
      core.handle(StreamEnd.handle(() => core.sync(() => resume(core.unit())))),
    ),
  )
})
