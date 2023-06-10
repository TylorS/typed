import * as Effect from '@effect/io/Effect'
import * as Scope from '@effect/io/Scope'
import * as Fx from '@typed/fx'

import { isDirective } from './Directive.js'
import { Renderable } from './Renderable.js'
import { BasePart } from './part/BasePart.js'
import { Part } from './part/Part.js'

/**
 * Lifts all possible values into an Fx. This is used to handle
 * NodeParts which have the ability to be arrays of values.
 */
export function unwrapRenderable<R, E>(renderable: Renderable<R, E>): Fx.Fx<R, E, unknown> {
  if (Array.isArray(renderable)) {
    return Fx.combineAll(...renderable.map(unwrapRenderable)) as any
  }

  if (Fx.isFx<R, E, any>(renderable)) {
    return Fx.switchMap(renderable, unwrapRenderable) as any
  }

  if (Effect.isEffect(renderable)) {
    return Fx.switchMap(Fx.fromEffect<R, E, any>(renderable as any), unwrapRenderable) as any
  }

  return Fx.succeed(renderable)
}

/**
 * Handle a single renderable value. This is only possible
 * in attribute and text "holes" in the template.
 */
export function handlePart<R, E>(
  part: BasePart<R, E>,
  renderable: Renderable<R, E>,
): Effect.Effect<R | Scope.Scope, E, Fx.Fx<R, E, unknown> | void> {
  if (isDirective<R, E>(renderable)) {
    return Effect.asUnit(renderable.f(part as any as Part))
  }

  // Listen to Fx values
  if (Fx.isFx<R, E, unknown>(renderable)) {
    return Effect.succeed(Fx.switchMapEffect(renderable, part.update))
  }

  // Sample effects
  if (Effect.isEffect(renderable)) {
    return Effect.asUnit(
      Effect.flatMap(renderable as any as Effect.Effect<R, E, unknown>, part.update),
    )
  }

  // Unchanging values
  return Effect.asUnit(part.update(renderable))
}

export function handleEffectPart<R, E>(part: Part, renderable: Renderable<R, E>) {
  if (isDirective<R, E>(renderable)) {
    return Effect.asUnit(renderable.f(part))
  }

  // Events can only be null/undefined, EventHandler, or an Effect,
  // so we don't need to use handlePart here
  return Effect.asUnit(part.update(renderable) || Effect.unit())
}
