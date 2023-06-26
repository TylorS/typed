import * as Effect from '@effect/io/Effect'
import * as Fx from '@typed/fx'

import { isDirective } from '../Directive.js'
import { Renderable } from '../Renderable.js'

import type { Part, SparsePart } from './Part.js'

/**
 * Lifts all possible values into an Fx. This is used to handle
 * NodeParts which have the ability to be arrays of values.
 */
export function unwrapRenderable<R, E, A>(renderable: Renderable<R, E>): Fx.Fx<R, E, A> {
  if (Array.isArray(renderable)) {
    return Fx.combineAll(...renderable.map(unwrapRenderable)) as any
  }

  if (Fx.isFx<R, E, any>(renderable)) {
    return Fx.switchMap(renderable, unwrapRenderable) as any
  }

  if (Effect.isEffect(renderable)) {
    return Fx.switchMap(Fx.fromEffect<R, E, any>(renderable as any), unwrapRenderable) as any
  }

  return Fx.succeed(renderable as A)
}

export function unwrapRenderableConcurrently<R, E, A>(
  renderable: Renderable<R, E>,
): Fx.Fx<R, E, A> {
  if (Array.isArray(renderable)) {
    return Fx.mergeBufferConcurrently(...renderable.map(unwrapRenderable)) as any
  }

  if (Fx.isFx<R, E, any>(renderable)) {
    return Fx.switchMap(renderable, unwrapRenderable) as any
  }

  if (Effect.isEffect(renderable)) {
    return Fx.switchMap(Fx.fromEffect<R, E, any>(renderable as any), unwrapRenderable) as any
  }

  return Fx.succeed(renderable as A)
}

export function unwrapSparsePartRenderables<R, E>(
  renderables: readonly Renderable<R, E>[],
  part: SparsePart,
): Fx.Fx<R, E, unknown> {
  return Fx.combineAll(
    ...renderables.map((renderable, i) => {
      const p = part.parts[i]

      if (p._tag === 'StaticText') {
        return Fx.succeed(p.text)
      }

      if (isDirective<R, E>(renderable)) {
        return Fx.fromEffect(Effect.map(renderable.f(p), () => p.value))
      }

      return Fx.flatMapEffect(
        unwrapRenderable(renderable),
        (u) => p.update(u) as Effect.Effect<R, E, unknown>,
      )
    }),
  )
}

/**
 * Handle a single renderable value. This is only possible
 * in attribute and text "holes" in the template.
 */
export function handlePart<R, E>(
  part: Part,
  renderable: Renderable<R, E>,
): Effect.Effect<R, E, Fx.Fx<R, E, unknown> | void> {
  if (isDirective<R, E>(renderable)) {
    return Effect.asUnit(renderable.f(part))
  }

  // Listen to Fx values
  if (Fx.isFx<R, E, unknown>(renderable)) {
    return Effect.succeed(Fx.switchMapEffect(renderable, part.update as any))
  }

  // Sample effects
  if (Effect.isEffect(renderable)) {
    return Effect.asUnit(
      Effect.flatMap(renderable as any as Effect.Effect<R, E, unknown>, part.update as any),
    )
  }

  // Unchanging values
  return Effect.asUnit((part as any).update(renderable))
}
