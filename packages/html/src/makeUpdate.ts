import * as Effect from '@effect/io/Effect'
import * as Scope from '@effect/io/Scope'
import * as Fx from '@typed/fx'

import { isDirective } from './Directive.js'
import { Renderable } from './Renderable.js'
import type { AttributeTemplateHole, TemplateHole } from './TemplateCache.js'
import { AttrPart } from './part/AttrPart.js'
import { BasePart } from './part/BasePart.js'
import { BooleanPart } from './part/BooleanPart.js'
import { ClassNamePart } from './part/ClassNamePart.js'
import { DataPart } from './part/DataPart.js'
import { EventPart } from './part/EventPart.js'
import { NodePart } from './part/NodePart.js'
import { Part } from './part/Part.js'
import { PropertyPart } from './part/PropertyPart.js'
import { RefPart } from './part/RefPart.js'
import { TextPart } from './part/TextPart.js'

export function makeUpdate<R, E>(
  templateHole: TemplateHole,
  node: Node,
  document: Document,
  value: Renderable<R, E>,
): Effect.Effect<R | Scope.Scope, E, Fx.Fx<R, E, unknown> | void> {
  switch (templateHole.type) {
    case 'node':
      return updateNode(node as Comment, document, value)
    case 'attr':
      return updateAttribute(node as HTMLElement, templateHole, document, value)
    case 'text':
      return updateText(document, node, value)
  }
}

export function updateNode<R, E>(
  comment: Comment,
  document: Document,
  renderable: Renderable<R, E>,
): Effect.Effect<R, E, Fx.Fx<R, E, unknown> | void> {
  const part = new NodePart(document, comment)

  if (isDirective<R, E>(renderable)) {
    return Effect.asUnit(renderable.f(part))
  }

  return Effect.succeed(Fx.map(unwrapRenderable(renderable), part.update))
}

export function updateText<R, E>(document: Document, node: Node, renderable: Renderable<R, E>) {
  return handlePart(new TextPart(document, node), renderable)
}

export function updateAttribute<R, E>(
  element: HTMLElement,
  templateHole: AttributeTemplateHole,
  document: Document,
  renderable: Renderable<R, E>,
) {
  const { name } = templateHole

  switch (name[0]) {
    case '?':
      return updateBoolean(document, element, name.slice(1), renderable)
    case '.': {
      const propertyName = name.slice(1)

      switch (propertyName) {
        case 'data':
          return updateData(document, element, renderable)
        default:
          return updateProperty(document, element, propertyName, renderable)
      }
    }
    case '@':
      return updateEvent(document, element, name.slice(1), renderable)
    case 'o':
      if (name[1] === 'n') return updateEvent(document, element, name.slice(2), renderable)
  }

  switch (name.toLowerCase()) {
    case 'ref':
      return updateRef(document, element, renderable)
    case 'class':
    case 'classname':
      return updateClass(document, element, renderable)
  }

  return updateAttr(document, element, name, renderable)
}

export function updateBoolean<R, E>(
  document: Document,
  element: HTMLElement,
  name: string,
  renderable: Renderable<R, E>,
) {
  return handlePart(new BooleanPart(document, element, name), renderable)
}

export function updateData<R, E>(
  document: Document,
  element: HTMLElement,
  renderable: Renderable<R, E>,
) {
  return handlePart(new DataPart(document, element), renderable)
}

export function updateProperty<R, E>(
  document: Document,
  element: HTMLElement,
  name: string,
  renderable: Renderable<R, E>,
) {
  return handlePart(new PropertyPart(document, element, name), renderable)
}

export function updateEvent<R, E>(
  document: Document,
  element: HTMLElement,
  type: string,
  renderable: Renderable<R, E>,
) {
  return handleEffectPart(new EventPart(document, element, type), renderable)
}

export function updateRef<R, E>(
  document: Document,
  element: HTMLElement,
  renderable: Renderable<R, E>,
) {
  return handleEffectPart(new RefPart(document, element), renderable)
}

export function updateClass<R, E>(
  document: Document,
  node: HTMLElement,
  renderable: Renderable<R, E>,
) {
  return handlePart(new ClassNamePart(document, node), renderable)
}

export function updateAttr<R, E>(
  document: Document,
  node: HTMLElement,
  name: string,
  renderable: Renderable<R, E>,
) {
  return handlePart(
    new AttrPart(document, node, document.createAttributeNS(null, name)),
    renderable,
  )
}

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
