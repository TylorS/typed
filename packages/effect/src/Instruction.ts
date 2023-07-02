import { Cause } from './Cause.js'
import { Trace } from './Debug.js'
import { Effect } from './Effect.js'
import { Handler } from './Handler.js'
import { Op } from './Op.js'
import { Variance } from './shared.js'

export type Instruction =
  | Succeed<any>
  | Sync<any>
  | Async<any, any, any>
  | Failure<any>
  | Map<any, any, any, any>
  | FlatMap<any, any, any, any, any, any>
  | RunOp<any, any>
  | ProvideHandler<any, any>

export abstract class EffectInstruction<R, E, A> extends Variance<R, E, A> {
  abstract readonly _tag: string

  constructor(
    readonly i0: any = undefined,
    readonly i1: any = undefined,
    readonly traces: readonly Trace[] | undefined = undefined,
  ) {
    super()
  }
}

export class Succeed<A> extends EffectInstruction<never, never, A> {
  readonly _tag = 'Succeed' as const

  constructor(readonly value: A, traces?: readonly Trace[]) {
    super(value, undefined, traces)
  }

  static make<A>(value: A, trace?: Trace): Effect<never, never, A> {
    return new Succeed(value, fromTrace(trace))
  }
}

export class Failure<E> extends EffectInstruction<never, E, never> {
  readonly _tag = 'Failure' as const

  constructor(readonly cause: Cause<E>, traces?: readonly Trace[]) {
    super(cause, undefined, traces)
  }

  static make<E>(cause: Cause<E>, trace?: Trace): Effect<never, E, never> {
    return new Failure(cause, fromTrace(trace))
  }
}

export class Sync<A> extends EffectInstruction<never, never, A> {
  readonly _tag = 'Sync' as const

  constructor(readonly f: () => A, traces?: readonly Trace[]) {
    super(f, undefined, traces)
  }

  static make<A>(f: () => A, trace?: Trace): Effect<never, never, A> {
    return new Sync(f, fromTrace(trace))
  }
}

export class Map<R, E, A, B> extends EffectInstruction<R, E, B> {
  readonly _tag = 'Map' as const

  constructor(
    readonly effect: Effect<R, E, A>,
    readonly f: (a: A) => B,
    traces?: readonly Trace[],
  ) {
    super(effect, f, traces)
  }

  static make<R, E, A, B>(effect: Effect<R, E, A>, f: (a: A) => B, trace?: Trace): Effect<R, E, B> {
    if (effect instanceof Map) {
      return new Map(effect.effect, (a) => f(effect.f(a)), addTrace(effect.traces, trace))
    } else if (effect instanceof Sync) {
      return new Sync(() => f(effect.f()), addTrace(effect.traces, trace))
    } else {
      return new Map(effect, f, fromTrace(trace))
    }
  }
}

export class FlatMap<R, E, A, R2, E2, B> extends EffectInstruction<R | R2, E | E2, B> {
  readonly _tag = 'FlatMap' as const

  constructor(
    readonly effect: Effect<R, E, A>,
    readonly f: (a: A) => Effect<R2, E2, B>,
    traces?: readonly Trace[],
  ) {
    super(effect, f, traces)
  }

  static make<R, E, A, R2, E2, B>(
    effect: Effect<R, E, A>,
    f: (a: A) => Effect<R2, E2, B>,
    trace?: Trace,
  ): Effect<R | R2, E | E2, B> {
    if (effect instanceof Map) {
      return new FlatMap(effect.effect, (a) => f(effect.f(a)), addTrace(effect.traces, trace))
    }

    return new FlatMap(effect, f, fromTrace(trace))
  }
}

export class Async<R, E, A> extends EffectInstruction<R, E, A> {
  readonly _tag = 'Async' as const

  constructor(
    readonly register: (cb: (a: Effect<R, E, A>) => void) => void,
    traces?: readonly Trace[],
  ) {
    super(register, undefined, traces)
  }

  static make<R, E, A>(
    register: (cb: (a: Effect<R, E, A>) => void) => void,
    trace?: Trace,
  ): Effect<R, E, A> {
    return new Async(register, fromTrace(trace))
  }
}

export class RunOp<O extends Op.Any, I> extends EffectInstruction<O, Op.Error<O>, Op.Apply<O, I>> {
  readonly _tag = 'RunOp' as const

  constructor(readonly op: O, readonly input: I, traces?: readonly Trace[]) {
    super(op, input, traces)
  }

  static make<O extends Op.Any, I>(
    op: O,
    input: I,
    trace?: Trace,
  ): Effect<O, Op.Error<O>, Op.Apply<O, I>> {
    return new RunOp(op, input, fromTrace(trace))
  }
}

export class ProvideHandler<E extends Effect.Any, H extends Handler.Any> extends EffectInstruction<
  Handler.ApplyOp<E, H>,
  Handler.ApplyError<E, H>,
  Handler.ApplyReturn<E, H>
> {
  readonly _tag = 'ProvideHandler' as const

  constructor(readonly effect: E, readonly handler: H, traces?: readonly Trace[]) {
    super(effect, handler, traces)
  }

  static make<E extends Effect.Any, H extends Handler.Any>(
    effect: E,
    handler: H,
    trace?: Trace,
  ): Handler.Apply<E, H> {
    return new ProvideHandler(effect, handler, fromTrace(trace)) as unknown as Handler.Apply<E, H>
  }
}

function fromTrace(trace: Trace | undefined): readonly Trace[] | undefined {
  return trace ? [trace] : undefined
}

function addTrace(a: readonly Trace[] | undefined, b: Trace | undefined) {
  if (!b) return a

  return mergeTraces(a, [b])
}

function mergeTraces(a: readonly Trace[] | undefined, b: readonly Trace[] | undefined) {
  if (!a) return b
  if (!b) return a

  return [...a, ...b]
}
