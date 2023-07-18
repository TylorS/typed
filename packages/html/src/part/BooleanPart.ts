import * as Effect from '@effect/io/Effect'
import * as Scope from '@effect/io/Scope'
import { Sink } from '@typed/fx'

import { Renderable } from '../Renderable.js'

import { BasePart } from './BasePart.js'
import { handlePart } from './updates.js'

export class BooleanPart extends BasePart<boolean> {
  readonly _tag = 'Boolean' as const

  constructor(
    protected toggleAttribute: (bool: boolean) => Effect.Effect<never, never, void>,
    index: number,
    value = false,
  ) {
    super(index, value)
  }

  observe<R, E, R2>(
    placeholder: Renderable<R, E>,
    sink: Sink<R2, E, unknown>,
  ): Effect.Effect<R | R2 | Scope.Scope, never, void> {
    return Effect.matchCauseEffect(handlePart(this, placeholder), {
      onFailure: sink.error,
      onSuccess: (fx) => (fx ? Effect.forkScoped(fx.run(sink)) : sink.event(this.value)),
    })
  }

  protected getValue(value: unknown): boolean {
    return !!value
  }

  protected setValue(value: boolean): Effect.Effect<never, never, void> {
    return this.toggleAttribute(value)
  }

  static fromElement(element: Element, name: string, index: number) {
    return new BooleanPart(
      (b) => Effect.sync(() => element.toggleAttribute(name, b)),
      index,
      element.hasAttribute(name),
    )
  }
}
