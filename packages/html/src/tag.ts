import { pipe } from '@effect/data/Function'
import * as Option from '@effect/data/Option'
import * as Effect from '@effect/io/Effect'
import * as Scope from '@effect/io/Scope'
import { addEventListener } from '@typed/dom'
import * as Fx from '@typed/fx'

import { isElementRef } from './ElementRef.js'
import { EventHandlerImplementation } from './EventHandler.js'
import type { Placeholder } from './Placeholder.js'
import { RenderContext } from './RenderContext.js'
import type { AttributeTemplateHole, TemplateCache, TemplateHole } from './TemplateCache.js'
import { Wire, persistent } from './Wire.js'
import { diffChildren } from './diffChildren.js'
import { parseTemplate } from './parseTemplate.js'
import { findPath } from './paths.js'
import { getRenderHoleContext } from './render.js'

const strictEqual = (x: any, y: any): boolean => x === y

export function html<Values extends ReadonlyArray<Placeholder<any, any> | undefined | null>>(
  template: TemplateStringsArray,
  ...values: Values
): Fx.Fx<
  Document | RenderContext | Scope.Scope | Placeholder.ResourcesOf<Values[number]>,
  Placeholder.ErrorsOf<Values[number]>,
  HTMLElement | DocumentFragment | Wire
> {
  return renderTemplate(template, values, false)
}

html.as = <T extends Node>() =>
  html as any as <Values extends ReadonlyArray<Placeholder<any, any> | undefined | null>>(
    template: TemplateStringsArray,
    ...values: Values
  ) => Fx.Fx<
    Document | RenderContext | Scope.Scope | Placeholder.ResourcesOf<Values[number]>,
    Placeholder.ErrorsOf<Values[number]>,
    T
  >

export function svg<Values extends ReadonlyArray<Placeholder<any, any> | undefined | null>>(
  template: TemplateStringsArray,
  ...values: Values
): Fx.Fx<
  Document | RenderContext | Scope.Scope | Placeholder.ResourcesOf<Values[number]>,
  Placeholder.ErrorsOf<Values[number]>,
  SVGElement
> {
  return renderTemplate(template, values, true) as any
}

function renderTemplate<Values extends ReadonlyArray<Placeholder<any, any> | undefined | null>>(
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
    const wire = persistent(fragment)

    if (values.length === 0) {
      return Fx.succeed(wire)
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

    if (updates.length === 0) return Fx.succeed(wire)

    return Fx.skipRepeatsWith(Fx.as(Fx.combineAllDiscard(...updates), wire), strictEqual)
  })
}

function makeUpdate<R, E>(
  templateHole: TemplateHole,
  node: Node,
  document: Document,
  value: Placeholder<R, E> | null | undefined,
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
  value: Placeholder<R, E> | null | undefined,
): Fx.Fx<R, E, unknown> {
  let oldValue: Placeholder<any>,
    text: Text,
    nodes: Node[] = []

  const handleNode = (newValue: any): void => {
    switch (typeof newValue) {
      // primitives are handled as text content
      case 'string':
      case 'number':
      case 'boolean': {
        if (oldValue === newValue) {
          return
        }
        oldValue = newValue

        if (!text) text = document.createTextNode('')
        text.data = String(newValue)

        nodes = diffChildren(comment, nodes, [text], document)
        break
      }
      // null, and undefined are used to cleanup previous content
      case 'object':
      case 'undefined': {
        if (newValue == null) {
          if (oldValue === newValue) {
            return
          }

          nodes = diffChildren(comment, nodes, [], document)
          break
        }
        // arrays and nodes have a special treatment
        if (Array.isArray(newValue)) {
          // arrays can be used to cleanup, if empty
          if (newValue.length === 0) nodes = diffChildren(comment, nodes, [], document)
          // or diffed, if these contains nodes or "wires"
          else if (newValue.some((x) => typeof x === 'object'))
            nodes = diffChildren(comment, nodes, newValue, document)
          // in all other cases the content is stringified as is
          else handleNode(String(newValue))
          break
        }

        if (oldValue === newValue) {
          return
        }

        oldValue = newValue

        // if the new value is a DOM node, or a wire, and it's
        // different from the one already live, then it's diffed.
        // if the node is a fragment, it's appended once via its childNodes
        // There is no `else` here, meaning if the content
        // is not expected one, nothing happens, as easy as that.
        if ('ELEMENT_NODE' in newValue) {
          const node = newValue.nodeType === 111 ? (newValue.valueOf() as Node) : newValue

          nodes = diffChildren(
            comment,
            nodes,
            node.nodeType === 11 ? Array.from(node.childNodes) : [node],
            document,
          )
        } else {
          handleNode(newValue.valueOf())
        }

        break
      }
    }
  }

  return Fx.map(unwrapPlaceholder(value), handleNode)
}

function unwrapPlaceholder<R, E>(
  placeholder: Placeholder<R, E> | null | undefined,
): Fx.Fx<R, E, unknown> {
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

function updateText<R, E>(
  node: Node,
  value: Placeholder<R, E> | null | undefined,
): Fx.Fx<R, E, unknown> | undefined {
  let oldValue: any

  const handleText = (newValue: any): void => {
    if (oldValue != newValue) {
      oldValue = newValue
      node.textContent = newValue == undefined ? '' : (newValue as string)
    }
  }

  if (Fx.isFx<R, E, unknown>(value)) {
    return Fx.map(value, handleText)
  }

  if (Effect.isEffect(value)) {
    // TODO: Sample this Effect
    return Fx.map(Fx.fromEffect<R, E, any>(value as any), handleText)
  }

  handleText(value)
}

function updateAttribute<R, E>(
  node: Element,
  templateHole: AttributeTemplateHole,
  document: Document,
  value: Placeholder<R, E> | null | undefined,
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
  value: Placeholder<R, E> | null | undefined,
): Fx.Fx<R, E, unknown> | undefined {
  let oldValue: any = false

  const handleBoolean = (newValue: any): void => {
    if (oldValue != newValue) {
      const b = !!newValue

      if (oldValue !== b) {
        node.toggleAttribute(name, (oldValue = b))
      }
    }
  }

  if (Fx.isFx<R, E, unknown>(value)) {
    return Fx.map(value, handleBoolean)
  }

  if (Effect.isEffect(value)) {
    return Fx.map(Fx.fromEffect<R, E, any>(value as any), handleBoolean)
  }

  handleBoolean(value)
}

function updateProperty<R, E>(
  node: Element,
  name: string,
  value: Placeholder<R, E> | null | undefined,
): Fx.Fx<R, E, unknown> | undefined {
  let oldValue: any

  const handleProperty = (newValue: any): void => {
    if (oldValue != newValue) {
      oldValue = newValue
      ;(node as any)[name] = newValue
    }
  }

  if (Fx.isFx<R, E, unknown>(value)) {
    return Fx.map(value, handleProperty)
  }

  if (Effect.isEffect(value)) {
    return Fx.map(Fx.fromEffect<R, E, any>(value as any), handleProperty)
  }

  handleProperty(value)
}

function updateEvent<R, E>(
  node: Element,
  type: string,
  value: Placeholder<R, E> | null | undefined,
): Effect.Effect<R | Scope.Scope, E, void> {
  const [handler, options] = getEventHandlerAndOptions(value)
  if (!handler) {
    return Effect.unit()
  }

  return pipe(
    node,
    addEventListener(type as any, options),
    Fx.flatMapEffect(handler),
    Fx.drain,
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
    return [undefined, undefined] as any
  }

  throw new Error(`Unexpected value for event handler: ${JSON.stringify(value)}`)
}

function updateRef<R, E>(
  node: Element,
  value: Placeholder<R, E> | null | undefined,
): Fx.Fx<R, E, unknown> | undefined {
  if (isElementRef(value)) {
    return Fx.fromEffect(value.set(Option.some(node as HTMLElement)))
  }

  console.error(`Unexpected value for ref of `, node, `:`, value)

  throw new Error(`Unexpected value for ref: ${JSON.stringify(value)}`)
}

const getValue = (value: any) => (value == null ? value : value.valueOf())

function updateAttr<R, E>(
  node: Element,
  name: string,
  document: Document,
  value: Placeholder<R, E> | undefined | null,
): Fx.Fx<R, E, unknown> | undefined {
  let oldValue: Placeholder<any, any>,
    orphan = true
  const attributeNode = document.createAttributeNS(null, name)
  const handleAttr = (newValue: any) => {
    const value = getValue(newValue)
    if (oldValue !== value) {
      if ((oldValue = value) == null) {
        if (!orphan) {
          node.removeAttributeNode(attributeNode)
          orphan = true
        }
      } else {
        attributeNode.value = value
        if (orphan) {
          node.setAttributeNodeNS(attributeNode)
          orphan = false
        }
      }
    }
  }

  if (Fx.isFx<R, E, unknown>(value)) {
    return Fx.map(value, handleAttr)
  }

  if (Effect.isEffect(value)) {
    return Fx.map(Fx.fromEffect<R, E, any>(value as any), handleAttr)
  }

  handleAttr(value)
}
