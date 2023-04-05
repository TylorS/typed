import * as Maybe from '@effect/data/Option'
import { isEffect } from '@effect/io/Effect'
import * as Runtime from '@effect/io/Runtime'

import { isElementRef } from './ElementRef.js'
import type { Entry } from './Entry.js'
import { EventHandler, EventHandlerImplementation } from './EventHandler.js'
import type { Hole } from './Hole.js'
import type { Placeholder } from './Placeholder.js'
import type { AttributeTemplateHole, TemplateCache, TemplateHole } from './TemplateCache.js'
import { diffChildren } from './diffChildren.js'
import { parseTemplate } from './parseTemplate.js'
import { findPath } from './paths.js'

export function parseUpdates(
  hole: Hole,
  document: Document,
  cache: WeakMap<TemplateStringsArray, TemplateCache>,
): Pick<Entry, 'content' | 'updates'> {
  if (!cache.has(hole.template)) {
    cache.set(hole.template, parseTemplate(hole, document))
  }

  const templateCache = cache.get(hole.template) as TemplateCache
  const content = document.importNode(templateCache.content, true)
  const updates = templateCache.holes.map((templateHole) =>
    makeUpdate(templateHole, content, document),
  )

  return {
    content,
    updates: updates as Entry['updates'],
  }
}

function makeUpdate(templateHole: TemplateHole, content: DocumentFragment, document: Document) {
  const node = findPath(content, templateHole.path)
  const update =
    templateHole.type === 'node'
      ? updateNode(node as Comment, document)
      : templateHole.type === 'attr'
      ? updateAttribute(node as Element, templateHole, document)
      : updateText(node)

  return update
}

function updateNode(comment: Comment, document: Document) {
  let oldValue: Placeholder<any>,
    text: Text,
    nodes: readonly Node[] = []

  const handleNode = <R>(newValue: Placeholder<R>): void => {
    switch (typeof newValue) {
      // primitives are handled as text content
      case 'string':
      case 'number':
      case 'boolean': {
        if (oldValue !== newValue) {
          oldValue = newValue

          if (!text) text = document.createTextNode('')
          text.data = String(newValue)

          nodes = diffChildren(comment, nodes, [text], document)
        }
        break
      }
      // null, and undefined are used to cleanup previous content
      case 'object':
      case 'undefined': {
        if (newValue == undefined) {
          if (oldValue != newValue) {
            oldValue = newValue
            nodes = diffChildren(comment, nodes, [], document)
          }
          break
        }
        // arrays and nodes have a special treatment
        if (Array.isArray(newValue)) {
          oldValue = newValue
          // arrays can be used to cleanup, if empty
          if (newValue.length === 0) nodes = diffChildren(comment, nodes, [], document)
          // or diffed, if these contains nodes or "wires"
          else if (newValue.some((x) => typeof x === 'object'))
            nodes = diffChildren(comment, nodes, newValue, document)
          // in all other cases the content is stringified as is
          else handleNode(String(newValue))
          break
        }
        // if the new value is a DOM node, or a wire, and it's
        // different from the one already live, then it's diffed.
        // if the node is a fragment, it's appended once via its childNodes
        // There is no `else` here, meaning if the content
        // is not expected one, nothing happens, as easy as that.
        if (oldValue !== newValue && 'ELEMENT_NODE' in newValue) {
          oldValue = newValue
          nodes = diffChildren(
            comment,
            nodes,
            (newValue as SVGElement).nodeType === 11
              ? Array.from((newValue as SVGElement).childNodes)
              : [newValue as Node],
            document,
          )
        }
        break
      }
    }
  }

  return handleNode
}

function updateAttribute(node: Element, templateHole: AttributeTemplateHole, document: Document) {
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

  // TODO: Aria + Style support

  switch (name) {
    case 'ref':
      return ref(node)
    // case 'aria':
    //   return aria(node)
    // case 'style':
    //   return style(node)
  }

  return attribute(node, name, document)
}

function boolean(node: Element, key: string, oldValue = false) {
  return <R>(newValue: Placeholder<R>) => {
    const b = !!newValue
    if (oldValue !== b) {
      node.toggleAttribute(key, (oldValue = b))
    }
  }
}

function setter(node: Element, key: string) {
  return <R>(newValue: Placeholder<R>) => {
    ;(node as any)[key] = newValue
  }
}

function ref(node: Element) {
  let oldValue: any = null
  return <R>(newValue: Placeholder<R>, runtime: Runtime.Runtime<R>): void => {
    if (oldValue !== newValue && isElementRef(newValue)) {
      oldValue = newValue

      Runtime.runFork(runtime)(newValue.set(Maybe.some(node as HTMLElement)))
    }
  }
}

function event(node: Element, name: string) {
  let oldValue: unknown,
    lower: string,
    type: string = name.slice(2),
    listener: EventListener | undefined
  if (!(name in node) && (lower = name.toLowerCase()) in node) type = lower.slice(2)

  return <R>(newValue: Placeholder<R>, runtime: Runtime.Runtime<R>) => {
    if (oldValue === newValue) {
      return
    }

    oldValue = newValue

    if (listener) {
      node.removeEventListener(type, listener, (oldValue as EventHandler<any, any>).options)
      listener = undefined
    }

    if (newValue instanceof EventHandlerImplementation) {
      listener = (ev: Event) => Runtime.runFork(runtime)(newValue.handler(ev))
      node.addEventListener(type, listener, newValue.options)

      return
    }

    if (isEffect(newValue)) {
      listener = () => Runtime.runFork(runtime)(newValue as any)
      node.addEventListener(type, listener)

      return
    }

    if (newValue == null) {
      return
    }

    throw new Error(`Unable to define an event listener for ${name} without using EventHandler.`)
  }
}

const getValue = (value: any) => (value == null ? value : value.valueOf())

function attribute(node: Element, name: string, document: Document) {
  let oldValue: Placeholder<any, any>,
    orphan = true
  const attributeNode = document.createAttributeNS(null, name)
  return (newValue: Placeholder<any, any>) => {
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
}

function updateText(node: Node) {
  let oldValue: Placeholder<any>

  return <R>(newValue: Placeholder<R>): void => {
    if (oldValue != newValue) {
      oldValue = newValue
      node.textContent = newValue == undefined ? '' : (newValue as string)
    }
  }
}
