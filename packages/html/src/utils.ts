import type { TemplateResult } from './TemplateResult.js'
import { TEXT_START, TYPED_START } from './meta.js'

export function isComment(node: Node): node is Comment {
  return node.nodeType === node.COMMENT_NODE
}

export function isCommentWithValue(node: Node, value: string): node is Comment {
  return isComment(node) && node.nodeValue === value
}

export function isHtmlElement(node: Node): node is HTMLElement {
  return node.nodeType === node.ELEMENT_NODE
}

export function findHoleComment(parent: Element, index: number) {
  const childNodes = parent.childNodes

  for (let i = 0; i < childNodes.length; ++i) {
    const node = childNodes[i]

    if (node.nodeType === 8 && node.nodeValue === `hole${index}`) {
      return node as Comment
    }
  }

  throw new Error(`Unable to find hole comment for index ${index}`)
}

const previousComments = new Set([TEXT_START, TYPED_START])

export function getPreviousNodes(comment: Node, index: number) {
  const nodes: Node[] = []
  let node = comment.previousSibling
  const previousHole = `hole${index - 1}`

  previousComments.add(previousHole)

  while (node && !previousComments.has(String(node.nodeValue))) {
    nodes.unshift(node)
    node = node.previousSibling
  }

  previousComments.delete(previousHole)

  return nodes
}

export function isTemplateResult(value: unknown): value is TemplateResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    '_tag' in value &&
    value._tag === 'TemplateResult'
  )
}

const digestSize = 2
const multiplier = 33
const fill = 5381

/**
 * Generates a hash for an ordered list of strings. Intended for the purposes
 * of server-side rendering with hydration.
 */
export function hashForTemplateStrings(strings: ReadonlyArray<string>) {
  const hashes = new Uint32Array(digestSize).fill(fill)

  for (let i = 0; i < strings.length; i++) {
    const s = strings[i]

    for (let j = 0; j < s.length; j++) {
      const key = j % digestSize

      hashes[key] = (hashes[key] * multiplier) ^ s.charCodeAt(j)
    }
  }

  return btoa(String.fromCharCode(...new Uint8Array(hashes.buffer)))
}
