import * as Effect from "effect/Effect"
import * as Equal from "effect/Equal"
import { identity } from "effect/Function"
import * as Hash from "effect/Hash"
import { pipeArguments } from "effect/Pipeable"

import { Effectable } from "effect"
import * as Fiber from "effect/Fiber"
import { NodeInspectSymbol } from "effect/Inspectable"
import type { Inspectable } from "effect/Inspectable"
import type { Fx, ToFx } from "../Fx"
import { TypeId } from "../TypeId"

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

export class OnceEffect<R, E, A> extends Effectable.Class<R, E, A> {
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

// @ts-expect-error private properties don't quite work out
export abstract class FxEffectBase<R, E, A, R2, E2, B> extends Effectable.StructuralClass<R2, E2, B>
  implements ToFx<R, E, A>
{
  _fxTag = "ToFx" as const

  readonly [TypeId] = Variance as any

  protected abstract toFx(): Fx<R, E, A>
  protected abstract toEffect(): Effect.Effect<R2, E2, B>

  private _fx: Fx<R, E, A> | undefined

  get fx(): Fx<R, E, A> {
    return this._fx ||= this.toFx()
  }

  private _effect: Effect.Effect<R2, E2, B> | undefined

  commit(): Effect.Effect<R2, E2, B> {
    return this._effect ||= this.toEffect()
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
