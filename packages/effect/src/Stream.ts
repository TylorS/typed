import { Effect } from './Effect.js'
import { Lambda } from './Lambda.js'
import { Op } from './Op.js'
import { Operation } from './Operation.js'
import { dual, pipe } from './_function.js'
import * as core from './core.js'

export type Stream<E, A> = StreamError<E> | StreamEvent<A> | StreamEnd

export namespace Stream {
  export type Any = Stream<any, any>

  export type StreamFrom<E extends Effect.Any> = [Effect.Op<E>] extends [Stream<infer E2, infer A>]
    ? Stream<E2, A>
    : never

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export type ErrorFrom<E extends Effect.Any> = [StreamFrom<E>] extends [Stream<infer E2, infer _A>]
    ? E2
    : never

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export type EventFrom<E extends Effect.Any> = [StreamFrom<E>] extends [Stream<infer _E2, infer A>]
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

export class StreamEnd extends Op<StreamEnd, never, StreamEndLambda>('@typed/effect/Stream/End') {
  static readonly produce = core.op<StreamEnd>(StreamEnd)(undefined)
}

export const observe: {
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
  return core.async((cb) => {
    const eventOp = new StreamEvent<Stream.EventFrom<R>>()
    const errorOp = new StreamError<Stream.ErrorFrom<typeof effect>>()

    return pipe(
      effect,
      core.handle(Op.handle(eventOp)((value, resume) => core.flatMap(f(value), resume))),
      core.handle(Op.handle(errorOp)((value) => core.sync(() => cb(core.fail(value))))),
      core.handle(StreamEnd.handle(() => core.sync(() => cb(core.unit())))),
    )
  })
})
