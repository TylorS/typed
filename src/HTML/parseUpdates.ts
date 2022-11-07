import * as Effect from '@effect/core/io/Effect'

import { createAttributeNS, createTextNode, importNode } from '../DOM/Document.js'
import { isEffect } from '../_internal.js'

import type { Entry } from './Entry.js'
import { EventHandler, EventHandlerImplementation } from './EventHandler.js'
import { Hole } from './Hole.js'
import { Placeholder } from './Placeholder.js'
import { RenderContext } from './RenderContext.js'
import { AttributeTemplateHole, TemplateCache, TemplateHole } from './TemplateCache.js'
import { diffChildren } from './diffChildren.js'
import { parseTemplate } from './parseTemplate.js'
import { findPath } from './paths.js'

export function parseUpdates(
  hole: Hole,
): Effect.Effect<RenderContext | Document, never, Pick<Entry, 'content' | 'updates'>> {
  return Effect.gen(function* ($) {
    const cache = yield* $(RenderContext.getTemplateCache)

    if (!cache.has(hole.template)) {
      cache.set(hole.template, yield* $(parseTemplate(hole)))
    }

    const templateCache = cache.get(hole.template) as TemplateCache
    const content = yield* $(importNode(templateCache.content, true))
    const updates: Entry['updates'] = templateCache.holes.map((templateHole) =>
      makeUpdate(templateHole, content),
    )

    return {
      content,
      updates,
    }
  })
}

function makeUpdate(
  templateHole: TemplateHole,
  content: DocumentFragment,
): <R>(value: Placeholder<R>) => Effect.Effect<R | Document, never, void> {
  const node = findPath(content, templateHole.path)
  const update =
    templateHole.type === 'node'
      ? updateNode(node as Comment)
      : templateHole.type === 'attr'
      ? updateAttribute(node as Element, templateHole)
      : updateText(node)

  return <R>(value: Placeholder<R>) => update(value)
}

function updateNode(comment: Comment) {
  let oldValue: Placeholder<any>,
    text: Text,
    nodes: readonly Node[] = []

  const handleNode = <R>(newValue: Placeholder<R>): Effect.Effect<R | Document, never, void> =>
    Effect.gen(function* ($) {
      switch (typeof newValue) {
        // primitives are handled as text content
        case 'string':
        case 'number':
        case 'boolean':
          if (oldValue !== newValue) {
            oldValue = newValue

            if (!text) text = yield* $(createTextNode(''))
            text.data = String(newValue)

            nodes = yield* $(diffChildren(comment, nodes, [text]))
          }
          break
        // null, and undefined are used to cleanup previous content
        case 'object':
        case 'undefined':
          if (newValue == undefined) {
            if (oldValue != newValue) {
              oldValue = newValue
              nodes = yield* $(diffChildren(comment, nodes, []))
            }
            break
          }
          // arrays and nodes have a special treatment
          if (Array.isArray(newValue)) {
            oldValue = newValue
            // arrays can be used to cleanup, if empty
            if (newValue.length === 0) nodes = yield* $(diffChildren(comment, nodes, []))
            // or diffed, if these contains nodes or "wires"
            else if (newValue.some((x) => typeof x === 'object'))
              nodes = yield* $(diffChildren(comment, nodes, newValue))
            // in all other cases the content is stringified as is
            else yield* $(handleNode(String(newValue)))
            break
          }
          // if the new value is a DOM node, or a wire, and it's
          // different from the one already live, then it's diffed.
          // if the node is a fragment, it's appended once via its childNodes
          // There is no `else` here, meaning if the content
          // is not expected one, nothing happens, as easy as that.
          if (oldValue !== newValue && 'ELEMENT_NODE' in newValue) {
            oldValue = newValue
            nodes = yield* $(
              diffChildren(
                comment,
                nodes,
                (newValue as SVGElement).nodeType === 11
                  ? Array.from((newValue as SVGElement).childNodes)
                  : [newValue as Node],
              ),
            )
          }
          break
        case 'function': {
          const x = newValue(comment)
          // TODO: Add support for directives here?
          const y = isEffect<R, never>(x) ? yield* $(x) : x

          yield* $(handleNode<R>(y))
          break
        }
      }
    })

  return handleNode
}

function updateAttribute(
  node: Element,
  templateHole: AttributeTemplateHole,
): <R>(value: Placeholder<R>) => Effect.Effect<R | Document, never, void> {
  const { name } = templateHole

  switch (name[0]) {
    case '?':
      return boolean(node, name.slice(1), false)
    case '.':
      return setter(node, name.slice(1))
    case '@':
      return event(node, 'on' + name.slice(1))
    case 'o':
      if (name[1] === 'n') return event(node, name)
  }

  // TODO: Refs + Aria support

  // switch (name) {
  //   case 'ref':
  //     return ref(node)
  //   case 'aria':
  //     return aria(node)
  // }

  return attribute(node, name)
}

function boolean(node: Element, key: string, oldValue = false) {
  return <R>(newValue: Placeholder<R>) =>
    Effect.sync(() => {
      const b = !!newValue
      if (oldValue !== b) {
        node.toggleAttribute(key, (oldValue = b))
      }
    })
}

function setter(node: Element, key: string) {
  return <R>(newValue: Placeholder<R>) =>
    Effect.sync(() => {
      ;(node as any)[key] = newValue
    })
}

function event(node: Element, name: string) {
  let oldValue: unknown,
    lower: string,
    type: string = name.slice(2),
    listener: EventListener | undefined
  if (!(name in node) && (lower = name.toLowerCase()) in node) type = lower.slice(2)

  return <R>(newValue: Placeholder<R>): Effect.Effect<R, never, void> =>
    Effect.gen(function* ($) {
      if (oldValue === newValue) {
        return
      }

      oldValue = newValue

      if (listener) {
        node.removeEventListener(type, listener, (oldValue as EventHandler<any, any>).options)
        listener = undefined
      }

      if (newValue instanceof EventHandlerImplementation) {
        const runtime = yield* $(Effect.runtime<R>())
        listener = (ev: Event) => runtime.unsafeRunAsync(newValue.handler(ev))
        node.addEventListener(type, listener, newValue.options)

        return
      }

      if (newValue == null) {
        return
      }

      throw new Error(`Unable to define an event listener for ${name} without using EventHandler.`)
    })
}

function attribute(node: Element, name: string) {
  let oldValue: Placeholder<any>,
    orphan = true
  let attributeNode: Attr

  return <R>(newValue: Placeholder<R>) =>
    Effect.gen(function* ($) {
      if (!attributeNode) {
        attributeNode = yield* $(createAttributeNS(null, name))
      }

      if (oldValue !== newValue) {
        oldValue = newValue
        if (oldValue == undefined) {
          if (!orphan) {
            node.removeAttributeNode(attributeNode)
            orphan = true
          }
        } else {
          const value = newValue
          if (value == undefined) {
            if (!orphan) node.removeAttributeNode(attributeNode)
            orphan = true
          } else {
            attributeNode.value = value as string
            if (orphan) {
              node.setAttributeNodeNS(attributeNode)
              orphan = false
            }
          }
        }
      }
    })
}

function updateText(node: Node) {
  let oldValue: Placeholder<any>

  return <R>(newValue: Placeholder<R>): Effect.Effect<never, never, void> =>
    Effect.sync(() => {
      if (oldValue != newValue) {
        oldValue = newValue
        node.textContent = newValue == undefined ? '' : (newValue as string)
      }
    })
}
