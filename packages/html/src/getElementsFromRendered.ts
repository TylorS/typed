import type { Wire } from '@typed/wire'

import type { Rendered } from './render.js'

export function getElementsFromRendered<T extends Rendered>(element: T): ReadonlyArray<Element> {
  if (isWire(element)) return getElementsFromRendered(element.valueOf() as DocumentFragment)
  if (isElement(element)) return [element]
  if (isDocumentFragment(element))
    return element.childElementCount > 0 ? Array.from(element.childNodes).filter(isElement) : []

  // Must be a Node
  if (element.parentElement) return [element.parentElement]

  return []
}

function isDocumentFragment(element: Rendered): element is DocumentFragment {
  return element.nodeType === element.DOCUMENT_FRAGMENT_NODE
}

function isElement(element: Rendered): element is Element {
  return element.nodeType === element.ELEMENT_NODE
}

function isWire(element: Rendered): element is Wire {
  return element.nodeType === 111
}
