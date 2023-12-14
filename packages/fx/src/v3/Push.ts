import type { Effect } from "effect"
import type { Cause } from "effect/Cause"
import { pipeArguments } from "effect/Pipeable"
import type { Fx } from "./Fx"
import * as core from "./internal/core"
import { FxBase } from "./internal/protos"
import * as Sink from "./Sink"

export interface Push<R, E, A, R2, E2, B> extends Sink.Sink<R, E, A>, Fx<R2, E2, B> {}

export function make<R, E, A, R2, E2, B>(
  sink: Sink.Sink<R, E, A>,
  fx: Fx<R2, E2, B>
): Push<R, E, A, R2, E2, B> {
  return new PushImpl(sink, fx)
}

class PushImpl<R, E, A, R2, E2, B> extends FxBase<R2, E2, B> implements Push<R, E, A, R2, E2, B> {
  constructor(readonly sink: Sink.Sink<R, E, A>, readonly fx: Fx<R2, E2, B>) {
    super()

    this.onFailure = this.onFailure.bind(this)
    this.onSuccess = this.onSuccess.bind(this)
  }

  run<R3>(sink: Sink.Sink<R3, E2, B>): Effect.Effect<R2 | R3, never, unknown> {
    return this.fx.run(sink)
  }

  onFailure(cause: Cause<E>): Effect.Effect<R, never, unknown> {
    return this.sink.onFailure(cause)
  }

  onSuccess(value: A): Effect.Effect<R, never, unknown> {
    return this.sink.onSuccess(value)
  }

  pipe() {
    return pipeArguments(this, arguments)
  }
}

export function mapInput<R, E, A, R2, E2, B, C>(
  push: Push<R, E, A, R2, E2, B>,
  f: (c: C) => A
): Push<R, E, C, R2, E2, B> {
  return make(
    Sink.map(push, f),
    push
  )
}

export function mapInputEffect<R, E, A, R2, E2, B, R3, C>(
  push: Push<R, E, A, R2, E2, B>,
  f: (c: C) => Effect.Effect<R3, E, A>
): Push<R | R3, E, C, R2, E2, B> {
  return make(
    Sink.mapEffect(push, f),
    push
  )
}

export function map<R, E, A, R2, E2, B, C>(
  push: Push<R, E, A, R2, E2, B>,
  f: (b: B) => C
): Push<R, E, A, R2, E2, C> {
  return make(
    push,
    core.map(push, f)
  )
}

export function mapEffect<R, E, A, R2, E2, B, R3, E3, C>(
  push: Push<R, E, A, R2, E2, B>,
  f: (b: B) => Effect.Effect<R3, E3, C>
): Push<R, E, A, R2 | R3, E2 | E3, C> {
  return make(
    push,
    core.mapEffect(push, f)
  )
}
