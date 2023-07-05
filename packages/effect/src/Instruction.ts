import * as Debug from '@effect/data/Debug'

import type { Cause } from './Cause.js'
import type { Continuation } from './Continuation.js'
import type { Effect } from './Effect.js'
import type { Handler } from './Handler.js'
import type { Op } from './Op.js'
import { Variance } from './shared.js'

Debug.runtimeDebug.tracingEnabled = false

export type Instruction =
  | Succeed<any>
  | Sync<any>
  | Async<any, any, any>
  | Failure<any>
  | Map<any, any, any, any>
  | FlatMap<any, any, any, any, any, any>
  | FlatMapCause<any, any, any, any, any, any>
  | RunOp<any, any>
  | ProvideHandler<any, any>
  | Resume<any>
  | Suspend<any, any, any>
  | YieldNow

export abstract class EffectInstruction<R, E, A> extends Variance<R, E, A> {
  abstract readonly _tag: string

  constructor(readonly i0: any = undefined, readonly i1: any = undefined) {
    super()
  }
}

export class Succeed<A> extends EffectInstruction<never, never, A> {
  readonly _tag = 'Succeed' as const

  constructor(value: A) {
    super(value, undefined)
  }

  static make<A>(value: A): Effect<never, never, A> {
    return new Succeed(value)
  }
}

export class Failure<E> extends EffectInstruction<never, E, never> {
  readonly _tag = 'Failure' as const

  constructor(cause: Cause<E>) {
    super(cause, undefined)
  }

  static make<E>(cause: Cause<E>): Effect<never, E, never> {
    return new Failure(cause)
  }
}

export class Sync<A> extends EffectInstruction<never, never, A> {
  readonly _tag = 'Sync' as const

  constructor(f: () => A) {
    super(f, undefined)
  }

  static make<A>(f: () => A): Effect<never, never, A> {
    return new Sync(f)
  }
}

export class Suspend<R, E, A> extends EffectInstruction<R, E, A> {
  readonly _tag = 'Suspend' as const

  constructor(f: () => Effect<R, E, A>) {
    super(f, undefined)
  }

  static make<R, E, A>(f: () => Effect<R, E, A>): Effect<R, E, A> {
    return new Suspend(f)
  }
}

export class Map<R, E, A, B> extends EffectInstruction<R, E, B> {
  readonly _tag = 'Map' as const

  constructor(effect: Effect<R, E, A>, f: (a: A) => B) {
    super(effect, f)
  }

  static make<R, E, A, B>(effect: Effect<R, E, A>, f: (a: A) => B): Effect<R, E, B> {
    if (effect instanceof Map) {
      return new Map(effect.i0, (a) => f(effect.i1(a)))
    } else if (effect instanceof Sync) {
      return new Sync(() => f(effect.i1()))
    } else {
      return new Map(effect, f)
    }
  }
}

export class FlatMap<R, E, A, R2, E2, B> extends EffectInstruction<R | R2, E | E2, B> {
  readonly _tag = 'FlatMap' as const

  constructor(effect: Effect<R, E, A>, f: (a: A) => Effect<R2, E2, B>) {
    super(effect, f)
  }

  static make<R, E, A, R2, E2, B>(
    effect: Effect<R, E, A>,
    f: (a: A) => Effect<R2, E2, B>,
  ): Effect<R | R2, E | E2, B> {
    if (effect instanceof Map) {
      return new FlatMap(effect.i0, (a) => f(effect.i1(a)))
    }

    return new FlatMap(effect, f)
  }
}

export class FlatMapCause<R, E, A, R2, E2, B> extends EffectInstruction<R | R2, E2, B> {
  readonly _tag = 'FlatMapCause' as const

  constructor(effect: Effect<R, E, A>, f: (cause: Cause<E>) => Effect<R2, E2, B>) {
    super(effect, f)
  }

  static make<R, E, A, R2, E2, B>(
    effect: Effect<R, E, A>,
    f: (cause: Cause<E>) => Effect<R2, E2, B>,
  ): Effect<R | R2, E | E2, B> {
    return new FlatMapCause(effect, f)
  }
}

export class Async<R, E, A> extends EffectInstruction<R, E, A> {
  readonly _tag = 'Async' as const

  constructor(register: (cb: (a: Effect<R, E, A>) => void) => void) {
    super(register, undefined)
  }

  static make<R, E, A>(register: (cb: (a: Effect<R, E, A>) => void) => void): Effect<R, E, A> {
    return new Async(register)
  }
}

export class RunOp<O extends Op.Any, I> extends EffectInstruction<O, Op.Error<O>, Op.Apply<O, I>> {
  readonly _tag = 'RunOp' as const

  constructor(op: O, input: I) {
    super(op, input)
  }

  static make<O extends Op.Any, I>(op: O, input: I): Effect<O, Op.Error<O>, Op.Apply<O, I>> {
    return new RunOp(op, input)
  }
}

export class ProvideHandler<E extends Effect.Any, H extends Handler.Any> extends EffectInstruction<
  Handler.ApplyOp<E, H>,
  Handler.ApplyError<E, H>,
  Handler.ApplyReturn<E, H>
> {
  readonly _tag = 'ProvideHandler' as const

  constructor(effect: E, readonly handler: H) {
    super(effect, handler)
  }

  static make<E extends Effect.Any, H extends Handler.Any>(
    effect: E,
    handler: H,
  ): Handler.Apply<E, H> {
    return new ProvideHandler(effect, handler) as unknown as Handler.Apply<E, H>
  }
}

export class Resume<A> extends EffectInstruction<never, never, unknown> {
  readonly _tag = 'Resume' as const

  constructor(input: A, cont: Continuation) {
    super(input, cont)
  }

  static make<A>(input: A, cont: Continuation): Effect<never, never, unknown> {
    return new Resume(input, cont)
  }
}

export class YieldNow extends EffectInstruction<never, never, void> {
  readonly _tag = 'YieldNow' as const
}
