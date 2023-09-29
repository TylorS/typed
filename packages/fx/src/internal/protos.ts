import "./module-agumentation"

import type * as Channel from "effect/Channel"
import * as Effect from "effect/Effect"
import * as Equal from "effect/Equal"
import { identity } from "effect/Function"
import * as Hash from "effect/Hash"
import { pipeArguments } from "effect/Pipeable"
import type * as StreamSink from "effect/Sink"
import type * as Stream from "effect/Stream"

import { type Fx } from "@typed/fx/Fx"
import { TypeId } from "@typed/fx/TypeId"
import { Effectable } from "effect"
import * as Fiber from "effect/Fiber"
import { NodeInspectSymbol } from "effect/Inspectable"
import type { Inspectable } from "effect/Inspectable"

export type ModuleAgumentedEffectKeysToOmit =
  | TypeId
  | keyof Stream.Stream<any, any, any>
  | keyof StreamSink.Sink<any, any, any, any, any>
  | keyof Channel.Channel<any, any, any, any, any, any, any>

export const Variance: Fx<any, any, any>[TypeId] = {
  _R: identity,
  _E: identity,
  _A: identity
}

export abstract class BaseProto implements Equal.Equal, Hash.Hash, Inspectable {
  [Equal.symbol](that: unknown) {
    return this === that
  }

  [Hash.symbol]() {
    return Hash.random(this)
  }

  pipe() {
    return pipeArguments(this, arguments)
  }

  toJSON(): unknown {
    return this
  }

  [NodeInspectSymbol]() {
    return this.toJSON()
  }

  toString() {
    return JSON.stringify(this.toJSON())
  }
}

export abstract class FxProto<R, E, A> extends BaseProto implements Fx<R, E, A> {
  abstract readonly _fxTag: string
  readonly [TypeId]: Fx<R, E, A>[TypeId] = Variance

  constructor(
    readonly i0?: unknown,
    readonly i1?: unknown,
    readonly i2?: unknown
  ) {
    super()
  }

  [Equal.symbol](that: unknown) {
    return this === that
  }

  [Hash.symbol]() {
    return Hash.random(this)
  }

  toJSON(): unknown {
    return this
  }

  pipe() {
    return pipeArguments(this, arguments)
  }
}

export class OnceEffect<R, E, A> extends Effectable.Effectable<R, E, A> {
  #fiber: Fiber.Fiber<E, A> | undefined

  constructor(
    readonly effect: Effect.Effect<R, E, A>
  ) {
    super()
  }

  commit() {
    if (this.#fiber) {
      return Fiber.join(this.#fiber)
    } else {
      return Effect.forkDaemon(this.effect).pipe(
        Effect.tap((fiber) => Effect.sync(() => this.#fiber = fiber)),
        Effect.flatMap(Fiber.join)
      )
    }
  }
}

export const once = <R, E, A>(effect: Effect.Effect<R, E, A>): Effect.Effect<R, E, A> => new OnceEffect(effect)
