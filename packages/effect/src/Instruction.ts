import { Trace } from './Debug.js'
import { Effect } from './Effect.js'
import { Handler } from './Handler.js'
import { Op } from './Op.js'
import { Variance } from './shared.js'

export type Instruction =
  | Succeed<any>
  | Map<any, any, any>
  | FlatMap<any, any, any, any>
  | RunOp<any, any>
  | ProvideHandler<any, any>

export abstract class EffectInstruction<R, A> extends Variance<R, A> {
  abstract readonly _tag: string

  constructor(
    readonly i0: any = undefined,
    readonly i1: any = undefined,
    readonly traces: readonly Trace[] | undefined = undefined,
  ) {
    super()
  }
}

export class Succeed<A> extends EffectInstruction<never, A> {
  readonly _tag = 'Succeed' as const

  constructor(readonly value: A, traces?: readonly Trace[]) {
    super(value, undefined, traces)
  }

  static make<A>(value: A, trace?: Trace): Effect<never, A> {
    return new Succeed(value, fromTrace(trace))
  }
}

export class Map<R, A, B> extends EffectInstruction<R, B> {
  readonly _tag = 'Map' as const

  constructor(readonly effect: Effect<R, A>, readonly f: (a: A) => B, traces?: readonly Trace[]) {
    super(effect, f, traces)
  }

  static make<R, A, B>(effect: Effect<R, A>, f: (a: A) => B, trace?: Trace): Effect<R, B> {
    if (effect instanceof Map) {
      return new Map(effect.effect, (a) => f(effect.f(a)), addTrace(effect.traces, trace))
    }

    return new Map(effect, f, fromTrace(trace))
  }
}

export class FlatMap<R, A, R2, B> extends EffectInstruction<R | R2, B> {
  readonly _tag = 'FlatMap' as const

  constructor(
    readonly effect: Effect<R, A>,
    readonly f: (a: A) => Effect<R2, B>,
    traces?: readonly Trace[],
  ) {
    super(effect, f, traces)
  }

  static make<R, A, R2, B>(
    effect: Effect<R, A>,
    f: (a: A) => Effect<R2, B>,
    trace?: Trace,
  ): Effect<R | R2, B> {
    if (effect instanceof Map) {
      return new FlatMap(effect.effect, (a) => f(effect.f(a)), addTrace(effect.traces, trace))
    }

    return new FlatMap(effect, f, fromTrace(trace))
  }
}

export class RunOp<O extends Op<any, any>, I> extends EffectInstruction<O, Op.Apply<O, I>> {
  readonly _tag = 'RunOp' as const

  constructor(readonly op: O, readonly input: I, traces?: readonly Trace[]) {
    super(op, input, traces)
  }

  static make<O extends Op<any, any>, I>(
    op: O,
    input: I,
    trace?: Trace,
  ): Effect<O, Op.Apply<O, I>> {
    return new RunOp(op, input, fromTrace(trace))
  }
}

export class ProvideHandler<E extends Effect.Any, H extends Handler.Any> extends EffectInstruction<
  Handler.ApplyOp<E, H>,
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
