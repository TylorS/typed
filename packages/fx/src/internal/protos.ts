import "./module-agumentation"

import * as Equal from "@effect/data/Equal"
import { identity } from "@effect/data/Function"
import * as Hash from "@effect/data/Hash"
import { pipeArguments } from "@effect/data/Pipeable"
import * as Effect from "@effect/io/Effect"
import type * as Channel from "@effect/stream/Channel"
import type * as StreamSink from "@effect/stream/Sink"
import type * as Stream from "@effect/stream/Stream"

import { NodeInspectSymbol } from "@effect/data/Inspectable"
import type { Inspectable } from "@effect/data/Inspectable"
import * as Fiber from "@effect/io/Fiber"
import { type Fx } from "@typed/fx/Fx"
import { TypeId } from "@typed/fx/TypeId"

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

export abstract class EffectProto<R, E, A> extends BaseProto implements
  Omit<
    Effect.Effect<R, E, A>,
    ModuleAgumentedEffectKeysToOmit
  >
{
  readonly _tag = "Commit"

  readonly [Effect.EffectTypeId] = Variance as any

  abstract toEffect():
    | Effect.Effect<R, E, A>
    | Omit<
      Effect.Effect<R, E, A>,
      ModuleAgumentedEffectKeysToOmit
    >

  #effect: Effect.Effect<R, E, A> | undefined

  commit(): Effect.Effect<R, E, A> {
    if (this.#effect === undefined) {
      return (this.#effect = this.toEffect() as Effect.Effect<R, E, A>)
    } else {
      return this.#effect
    }
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

export class OnceEffect<R, E, A> extends EffectProto<R, E, A> {
  #fiber: Fiber.Fiber<E, A> | undefined

  constructor(
    readonly effect: Effect.Effect<R, E, A>
  ) {
    super()
  }

  toEffect() {
    return Effect.suspend(() => {
      if (this.#fiber) {
        return Fiber.join(this.#fiber)
      } else {
        return Effect.forkDaemon(this.effect).pipe(
          Effect.tap((fiber) => Effect.sync(() => this.#fiber = fiber)),
          Effect.flatMap(Fiber.join)
        )
      }
    })
  }
}

export const once = <R, E, A>(effect: Effect.Effect<R, E, A>): Effect.Effect<R, E, A> => new OnceEffect(effect) as any
