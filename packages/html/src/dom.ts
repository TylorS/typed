import { flow } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import * as Layer from '@effect/io/Layer'
import * as Scope from '@effect/io/Scope'
import * as Fx from '@typed/fx'

import { isDirective } from './Directive.js'
import type { Placeholder } from './Placeholder.js'
import { RenderContext } from './RenderContext.js'
import { RenderTemplate } from './RenderTemplate.js'
import { Renderable } from './Renderable.js'
import type { AttributeTemplateHole, TemplateCache, TemplateHole } from './TemplateCache.js'
import { Wire, persistent } from './Wire.js'
import { parseTemplate } from './parseTemplate.js'
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
import { findPath } from './paths.js'
import { getRenderHoleContext } from './render.js'

export const dom: Layer.Layer<Document | RenderContext, never, RenderTemplate> =
  RenderTemplate.layer(
    Effect.gen(function* ($) {
      const context = yield* $(Effect.context<Document | RenderContext>())

      return {
        renderTemplate: flow(renderTemplate, Fx.provideSomeContext(context)),
      }
    }),
  )

const strictEqual = (x: any, y: any): boolean => x === y

function renderTemplate<Values extends ReadonlyArray<Renderable<any, any>>>(
  template: TemplateStringsArray,
  values: Values,
  isSvg: boolean,
): Fx.Fx<
  Document | RenderContext | Scope.Scope | Placeholder.ResourcesOf<Values[number]>,
  Placeholder.ErrorsOf<Values[number]>,
  any
> {
  return Fx.gen(function* ($) {
    const { document, renderContext } = yield* $(getRenderHoleContext)
    const { templateCache } = renderContext

    if (!templateCache.has(template)) {
      templateCache.set(template, parseTemplate(template, document, isSvg))
    }

    const { content, holes } = templateCache.get(template) as TemplateCache
    const fragment = document.importNode(content, true)

    if (values.length === 0) {
      return Fx.succeed(persistent(fragment))
    }

    const updates: Array<
      Fx.Fx<
        Document | RenderContext | Placeholder.ResourcesOf<Values[number]>,
        Placeholder.ErrorsOf<Values[number]>,
        unknown
      >
    > = []

    for (let i = 0; i < values.length; i++) {
      const hole = holes[i]
      const update = yield* $(makeUpdate(hole, findPath(fragment, hole.path), document, values[i]))

      if (update) updates.push(update)
    }

    if (updates.length === 0) return Fx.succeed(persistent(fragment))

    let wire: Wire | Node | DocumentFragment

    return Fx.skipRepeatsWith(
      Fx.map(Fx.combineAllDiscard(...updates), () => wire || (wire = persistent(fragment))),
      strictEqual,
    )
  })
}

function makeUpdate<R, E>(
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

function updateNode<R, E>(
  comment: Comment,
  document: Document,
  renderable: Renderable<R, E>,
): Effect.Effect<R, E, Fx.Fx<R, E, unknown> | void> {
  const part = new NodePart(document, comment)

  if (isDirective<R, E>(renderable)) {
    return renderable.f(part)
  }

  return Effect.succeed(Fx.map(unwrapRenderable(renderable), part.update))
}

function updateText<R, E>(document: Document, node: Node, renderable: Renderable<R, E>) {
  return handlePart(new TextPart(document, node), renderable)
}

function updateAttribute<R, E>(
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

function updateBoolean<R, E>(
  document: Document,
  element: HTMLElement,
  name: string,
  renderable: Renderable<R, E>,
) {
  return handlePart(new BooleanPart(document, element, name), renderable)
}

function updateData<R, E>(document: Document, element: HTMLElement, renderable: Renderable<R, E>) {
  return handlePart(new DataPart(document, element), renderable)
}

function updateProperty<R, E>(
  document: Document,
  element: HTMLElement,
  name: string,
  renderable: Renderable<R, E>,
) {
  return handlePart(new PropertyPart(document, element, name), renderable)
}

function updateEvent<R, E>(
  document: Document,
  element: HTMLElement,
  type: string,
  renderable: Renderable<R, E>,
) {
  const part = new EventPart(document, element, type)

  if (isDirective<R, E>(renderable)) {
    return Effect.asUnit(renderable.f(part))
  }

  // Events can only be null/undefined, EventHandler, or an Effect,
  // so we don't need to use handlePart here
  return part.update(renderable) || Effect.unit()
}

function updateRef<R, E>(document: Document, element: HTMLElement, renderable: Renderable<R, E>) {
  const part = new RefPart(document, element)

  if (isDirective<R, E>(renderable)) {
    return Effect.asUnit(renderable.f(part))
  }

  const effect = part.update(renderable)

  // Refs can only be null/undefined or an ElementRef,
  // so we don't need to use handlePart here
  return effect ? Effect.asUnit(effect) : Effect.unit()
}

function updateClass<R, E>(document: Document, node: HTMLElement, renderable: Renderable<R, E>) {
  return handlePart(new ClassNamePart(document, node), renderable)
}

function updateAttr<R, E>(
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
function unwrapRenderable<R, E>(renderable: Renderable<R, E>): Fx.Fx<R, E, unknown> {
  if (Array.isArray(renderable)) {
    return Fx.combineAll(...renderable.map(unwrapRenderable)) as any
  }

  if (Fx.isFx<R, E, unknown>(renderable)) {
    return renderable
  }

  if (Effect.isEffect(renderable)) {
    return Fx.fromEffect(renderable) as any
  }

  return Fx.succeed(renderable)
}

/**
 * Handle a single renderable value. This is only possible
 * in attribute and text "holes" in the template.
 */
function handlePart<A, R, E>(
  part: BasePart<A>,
  renderable: Renderable<R, E>,
): Effect.Effect<R | Scope.Scope, E, Fx.Fx<R, E, unknown> | void> {
  if (isDirective<R, E>(renderable)) {
    return Effect.succeed(Fx.fromEffect(renderable.f(part as any as Part)))
  }

  // Listen to Fx values
  if (Fx.isFx<R, E, unknown>(renderable)) {
    return Effect.succeed(Fx.map(renderable, part.update))
  }

  // Sample effects
  if (Effect.isEffect(renderable)) {
    return Effect.asUnit(Effect.map(renderable as any as Effect.Effect<R, E, unknown>, part.update))
  }

  // Unchanging values
  return Effect.sync(() => {
    part.update(renderable)
  })
}
