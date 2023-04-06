import type { Trace } from '@effect/data/Debug'
import { methodWithTrace } from '@effect/data/Debug'
import * as Equal from '@effect/data/Equal'
import * as Hash from '@effect/data/Hash'
import * as Effect from '@effect/io/Effect'
import type { Scope } from '@effect/io/Scope'

import * as fx from '@typed/fx/internal/Fx'
import * as run from '@typed/fx/internal/run/index'

export function isFx(value: unknown): value is fx.Fx<unknown, unknown, unknown> {
  return isObject(value) && hasRunFunction(value)
}

const isObject = (value: unknown): value is object => value !== null && typeof value === 'object'

const hasRunFunction = (value: object): value is fx.Fx<unknown, unknown, unknown> =>
  'run' in value && typeof value['run'] === 'function' && value['run'].length === 1

export abstract class BaseFx<R, E, A> implements fx.Fx<R, E, A> {
  abstract readonly name: string

  abstract run(sink: fx.Sink<E, A>): Effect.Effect<R | Scope, never, unknown>

  readonly traced: fx.Fx<R, E, A>['traced'] = (trace) => (trace ? new TracedFx(this, trace) : this)

  readonly transform: fx.Fx<R, E, A>['transform'] = methodWithTrace(
    (trace) => (f) => new TransformedFx(this, f).traced(trace),
  )

  readonly observe: fx.Fx<R, E, A>['observe'] = methodWithTrace(
    (trace) => (f) => run.observe(this, f).traced(trace),
  )

  readonly forkObserve: fx.Fx<R, E, A>['forkObserve'] = methodWithTrace(
    (trace) => (f) => Effect.forkScoped(this.observe(f)).traced(trace),
  );

  [Hash.symbol]() {
    return Hash.random(this)
  }

  [Equal.symbol](that: Equal.Equal): boolean {
    return this === that
  }
}

export class TransformedFx<R, E, A, R2, E2> extends BaseFx<Exclude<R2, Scope>, E | E2, A> {
  readonly name = 'Transformed' as const

  constructor(
    readonly self: fx.Fx<R, E, A>,
    readonly f: (
      fx: Effect.Effect<R | Scope, never, unknown>,
    ) => Effect.Effect<R2 | Scope, E2, unknown>,
  ) {
    super()
  }

  run(sink: fx.Sink<E | E2, A>): Effect.Effect<Scope | Exclude<R2, Scope>, never, unknown> {
    return Effect.catchAllCause(this.f(this.self.run(sink)), sink.error) as Effect.Effect<
      Exclude<R2, Scope> | Scope,
      never,
      unknown
    >
  }
}

export class TracedFx<R, E, A, R2, E2> extends BaseFx<Exclude<R2, Scope>, E | E2, A> {
  readonly name = 'Traced' as const

  constructor(readonly self: fx.Fx<R, E, A>, readonly trace: Trace) {
    super()
  }

  run(sink: fx.Sink<E | E2, A>) {
    return this.self.run(fx.Sink.traced(sink, this.trace)).traced(this.trace) as Effect.Effect<
      Exclude<R2, Scope> | Scope,
      never,
      unknown
    >
  }
}

export function make<R, E, A>(run: fx.Fx<R, E, A>['run'], name?: string): fx.Fx<R, E, A> {
  return new (class Fx extends BaseFx<R, E, A> {
    readonly name = name || 'Fx'
    readonly run = run
  })()
}
