import { flow, pipe } from '@effect/data/Function'
import * as Option from '@effect/data/Option'
import * as Effect from '@effect/io/Effect'
import * as Layer from '@effect/io/Layer'
import * as Scope from '@effect/io/Scope'
import { addEventListener } from '@typed/dom'
import * as Fx from '@typed/fx'

import { isElementRef } from './ElementRef.js'
import { EventHandlerImplementation } from './EventHandler.js'
import type { Placeholder } from './Placeholder.js'
import { RenderContext } from './RenderContext.js'
import { RenderTemplate } from './RenderTemplate.js'
import { Renderable } from './Renderable.js'
import type { AttributeTemplateHole, TemplateCache, TemplateHole } from './TemplateCache.js'
import { Wire, persistent } from './Wire.js'
import { diffChildren } from './diffChildren.js'
import { parseTemplate } from './parseTemplate.js'
import { AttrPart } from './parts/AttrPart.js'
import { BasePart } from './parts/BasePart.js'
import { BooleanPart } from './parts/BooleanPart.js'
import { PropertyPart } from './parts/PropertyPart.js'
import { TextPart } from './parts/TextPart.js'
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
): Effect.Effect<R | Scope.Scope, E, Fx.Fx<R, E, unknown> | undefined | void> {
  switch (templateHole.type) {
    case 'node':
      return Effect.sync(() => updateNode(node as Comment, document, value))
    case 'attr':
      return updateAttribute(node as Element, templateHole, document, value)
    case 'text':
      return Effect.sync(() => updateText(node, value))
  }
}

function updateNode<R, E>(
  comment: Comment,
  document: Document,
  value: Renderable<R, E>,
): Fx.Fx<R, E, unknown> {
  let oldValue: any,
    text: Text,
    nodes: Node[] = []

  const handleNode = (newValue: any): void => {
    if (oldValue === newValue) return

    oldValue = newValue

    switch (typeof newValue) {
      // primitives are handled as text content
      case 'string':
      case 'number':
      case 'boolean': {
        if (!text) text = document.createTextNode('')
        text.data = String(newValue)

        nodes = diffChildren(comment, nodes, [text], document)
        break
      }
      // null, and undefined are used to cleanup previous content
      case 'object':
      case 'undefined': {
        if (newValue == null) {
          nodes = diffChildren(comment, nodes, [], document)
        }
        // arrays and nodes have a special treatment
        else if (Array.isArray(newValue)) {
          // arrays can be used to cleanup, if empty
          if (newValue.length === 0) nodes = diffChildren(comment, nodes, [], document)
          // or diffed, if these contains nodes or "wires"
          else if (newValue.some((x) => typeof x === 'object'))
            nodes = diffChildren(
              comment,
              nodes,
              // We can't diff null values, so we filter them out
              newValue.filter((x) => x !== null),
              document,
            )
          // in all other cases the content is stringified as is
          else handleNode(String(newValue))
        } else {
          nodes = diffChildren(comment, nodes, [newValue], document)
        }

        break
      }
    }
  }

  return Fx.map(unwrapPlaceholder(value), handleNode)
}

function unwrapPlaceholder<R, E>(placeholder: Renderable<R, E>): Fx.Fx<R, E, unknown> {
  if (Array.isArray(placeholder)) {
    return Fx.combineAll(...placeholder.map(unwrapPlaceholder)) as any
  }

  if (Fx.isFx<R, E, unknown>(placeholder)) {
    return placeholder
  }

  if (Effect.isEffect(placeholder)) {
    return Fx.fromEffect(placeholder) as any
  }

  return Fx.succeed(placeholder)
}

function updateText<R, E>(node: Node, value: Renderable<R, E>): Fx.Fx<R, E, unknown> | undefined {
  return handlePart(new TextPart(node), value)
}

function updateAttribute<R, E>(
  node: Element,
  templateHole: AttributeTemplateHole,
  document: Document,
  value: Renderable<R, E>,
): Effect.Effect<R | Scope.Scope, E, Fx.Fx<R, E, unknown> | undefined | void> {
  const { name } = templateHole

  switch (name[0]) {
    case '?':
      return Effect.sync(() => updateBoolean(node, name.slice(1), value))
    case '.':
      return Effect.sync(() => updateProperty(node, name.slice(1), value))
    case '@':
      return updateEvent(node, name.slice(1), value)
    case 'o':
      if (name[1] === 'n') return updateEvent(node, name.slice(2), value)
  }

  if (name === 'ref') {
    return Effect.sync(() => updateRef(node, value))
  }

  return Effect.sync(() => updateAttr(node, name, document, value))
}

function updateBoolean<R, E>(
  node: Element,
  name: string,
  value: Renderable<R, E>,
): Fx.Fx<R, E, unknown> | undefined {
  return handlePart(new BooleanPart(node, name), value)
}

function updateProperty<R, E>(
  node: Element,
  name: string,
  value: Renderable<R, E>,
): Fx.Fx<R, E, unknown> | undefined {
  return handlePart(new PropertyPart(node, name), value)
}

function updateEvent<R, E>(
  node: Element,
  type: string,
  value: Renderable<R, E>,
): Effect.Effect<R | Scope.Scope, E, void> {
  const [handler, options] = getEventHandlerAndOptions(value)
  if (!handler) {
    return Effect.unit()
  }

  return pipe(
    node,
    addEventListener(type as any, options),
    Fx.observe(handler),
    Effect.forkScoped,
    Effect.asUnit,
  )
}

function getEventHandlerAndOptions(
  value: any,
): readonly [
  undefined | ((event: any) => Effect.Effect<any, never, void>),
  boolean | AddEventListenerOptions | undefined,
] {
  if (value instanceof EventHandlerImplementation) {
    return [value.handler, value.options] as const
  }

  if (Effect.isEffect(value)) {
    return [() => value, undefined] as any
  }

  if (!value) {
    return [undefined, undefined] as const
  }

  throw new Error(`Unexpected value for event handler: ${JSON.stringify(value)}`)
}

function updateRef<R, E>(node: Element, value: Renderable<R, E>): Fx.Fx<R, E, unknown> | undefined {
  if (value == null) {
    return
  }

  if (isElementRef(value)) {
    return Fx.fromEffect(value.set(Option.some(node as HTMLElement)))
  }

  console.error(`Unexpected value for ref of `, node, `:`, value)

  throw new Error(`Unexpected value for ref: ${JSON.stringify(value)}`)
}

function updateAttr<R, E>(
  node: Element,
  name: string,
  document: Document,
  value: Renderable<R, E>,
): Fx.Fx<R, E, unknown> | undefined {
  return handlePart(new AttrPart(node, document.createAttributeNS(null, name)), value)
}

function handlePart<P extends BasePart<any>, R, E>(part: P, value: Renderable<R, E>) {
  if (Fx.isFx<R, E, unknown>(value)) {
    return Fx.map(value, part.handle)
  }

  if (Effect.isEffect(value)) {
    return Fx.map(Fx.fromEffect<R, E, any>(value as any), part.handle)
  }

  part.handle(value)
}
