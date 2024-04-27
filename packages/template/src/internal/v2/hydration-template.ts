import { isComment, isElement, toHtml } from "@typed/wire"
import { type Inspectable, NodeInspectSymbol } from "effect/Inspectable"

const TYPED_TEMPLATE_PREFIX = `typed-`
const TYPED_TEMPLATE_END_PREFIX = `/typed-`
const MANY_PREFIX = `many`
const HOLE_PREFIX = `hole`

export function getHydrationRoot(root: HTMLElement): HydrationElement {
  return new HydrationElement(root, getHydrationNodes(Array.from(root.childNodes)))
}

type ProcessNodes = {
  nodes: Array<Node>
  out: Array<HydrationNode>
}

function getHydrationNodes(nodes: Array<Node>): Array<HydrationNode> {
  const out: Array<HydrationNode> = []

  const toProcess: Array<ProcessNodes> = [
    { nodes, out }
  ]

  while (toProcess.length > 0) {
    const process = toProcess.shift()!

    const { nodes, out } = process

    for (let i = 0; i < nodes.length; ++i) {
      const node = nodes[i]

      if (isComment(node)) {
        if (node.data.startsWith(TYPED_TEMPLATE_PREFIX)) {
          const hash = node.data.slice(TYPED_TEMPLATE_PREFIX.length)
          const endIndex = getTemplateEndIndex(nodes, i, hash)
          const childNodes = nodes.slice(i + 1, endIndex)

          const childHydrationNodes: Array<HydrationNode> = []

          out.push(new HydrationTemplate(hash, childHydrationNodes))

          toProcess.push({
            nodes: childNodes,
            out: childHydrationNodes
          })
          i = endIndex
        } else if (node.data.startsWith(MANY_PREFIX)) {
          const last = out.pop()!
          out.push(new HydrationMany(node.data.slice(MANY_PREFIX.length), node, [last]))
        } else if (node.data.startsWith(HOLE_PREFIX)) {
          // When we encounter HOLE comments we need to backtrack and find all nodes that are part of this hole.
          const last = out.pop()!
          const index = parseInt(node.data.slice(HOLE_PREFIX.length), 10)
          if (last._tag === "many") {
            // Pop all many nodes
            const manyNodes: Array<HydrationNode> = [last]
            while (out.length > 0 && out[out.length - 1]._tag === "many") {
              manyNodes.unshift(out.pop()!)
            }

            out.push(new HydrationHole(index, node, manyNodes))
          } else if (last._tag === "literal") {
            // Pop all literal nodes
            const literalNodes: Array<HydrationNode> = [last]
            while (out.length > 0 && out[out.length - 1]._tag === "literal") {
              literalNodes.unshift(out.pop()!)
            }

            out.push(new HydrationHole(index, node, literalNodes))
          } else if (last._tag === "hole") {
            // If the last node is a hole, we don't want to include it in this other hole. It probably means
            // that `null` was rendered into this hole and no elements are present.
            out.push(last)
            out.push(new HydrationHole(index, node, []))
          } else {
            // Otherwise, just take the last Element or Template
            out.push(new HydrationHole(index, node, [last]))
          }
        } else {
          out.push(new HydrationLiteral(node))
        }
      } else if (isElement(node)) {
        const childHydrationNodes: Array<HydrationNode> = []

        out.push(new HydrationElement(node, childHydrationNodes))

        toProcess.push({
          nodes: Array.from(node.childNodes),
          out: childHydrationNodes
        })
      } else {
        out.push(new HydrationLiteral(node))
      }
    }
  }

  return out
}

function getTemplateEndIndex(nodes: Array<Node>, start: number, hash: string): number {
  const endHash = TYPED_TEMPLATE_END_PREFIX + hash

  for (let i = start; i < nodes.length; ++i) {
    const node = nodes[i]

    if (isComment(node) && node.data === endHash) {
      return i
    }
  }

  throw new Error(`Could not find end comment for template ${hash}`)
}

export class HydrationElement implements Inspectable {
  readonly _tag = "element" as const

  constructor(
    readonly parentNode: Element,
    readonly childNodes: Array<HydrationNode>
  ) {}

  toJSON(): unknown {
    return {
      _tag: this._tag,
      parentNode: toHtml(this.parentNode),
      childNodes: this.childNodes.map((n) => n.toJSON())
    }
  }

  [NodeInspectSymbol]() {
    return JSON.stringify(this.toJSON(), null, 2)
  }
}

export class HydrationTemplate implements Inspectable {
  readonly _tag = "template" as const

  constructor(
    readonly hash: string,
    readonly childNodes: Array<HydrationNode>
  ) {}

  toJSON(): unknown {
    return {
      _tag: this._tag,
      hash: this.hash,
      childNodes: this.childNodes.map((n) => n.toJSON())
    }
  }

  [NodeInspectSymbol]() {
    return JSON.stringify(this.toJSON(), null, 2)
  }
}

export type HydrationNode = HydrationElement | HydrationTemplate | HydrationMany | HydrationHole | HydrationLiteral

export class HydrationMany implements Inspectable {
  readonly _tag = "many" as const

  constructor(
    readonly key: string,
    readonly comment: Comment,
    readonly childNodes: Array<HydrationNode>
  ) {}

  toJSON(): unknown {
    return {
      _tag: this._tag,
      key: this.key,
      childNodes: this.childNodes.map((n) => n.toJSON())
    }
  }

  [NodeInspectSymbol]() {
    return JSON.stringify(this.toJSON(), null, 2)
  }
}

export class HydrationHole implements Inspectable {
  readonly _tag = "hole" as const

  constructor(
    readonly index: number,
    readonly comment: Comment,
    readonly childNodes: Array<HydrationNode>
  ) {}

  toJSON(): unknown {
    return {
      _tag: this._tag,
      index: this.index,
      childNodes: this.childNodes.map((n) => n.toJSON())
    }
  }

  [NodeInspectSymbol]() {
    return JSON.stringify(this.toJSON(), null, 2)
  }
}

export class HydrationLiteral implements Inspectable {
  readonly _tag = "literal" as const

  constructor(
    readonly node: Node
  ) {}

  toJSON(): unknown {
    return {
      _tag: this._tag,
      node: toHtml(this.node)
    }
  }

  [NodeInspectSymbol]() {
    return JSON.stringify(this.toJSON(), null, 2)
  }
}

export function getChildNodes(node: HydrationNode): Array<HydrationNode> {
  switch (node._tag) {
    case "literal":
      return []
    case "hole":
    case "element":
    case "template":
    case "many":
      return node.childNodes
  }
}

export function findHydrationTemplate(
  nodes: Array<HydrationNode>,
  templateHash: string
): HydrationTemplate | null {
  for (let i = 0; i < nodes.length; ++i) {
    const node = nodes[i]

    if (node._tag === "template" && node.hash === templateHash) {
      return node
    }
  }

  return null
}

export function findHydrationMany(
  nodes: Array<HydrationNode>,
  key: string
): HydrationMany | null {
  for (let i = 0; i < nodes.length; ++i) {
    const node = nodes[i]

    if (node._tag === "many" && node.key === key) {
      return node
    }
  }

  return null
}

export function findHydrationHole(nodes: Array<HydrationNode>, index: number): HydrationHole | null {
  for (let i = 0; i < nodes.length; ++i) {
    const node = nodes[i]

    if (node._tag === "hole" && node.index === index) {
      return node
    } else if (node._tag === "element") {
      const found = findHydrationHole(node.childNodes, index)
      if (found) {
        return found
      }
    }
  }

  return null
}

export function findHydrationNode(
  node: HydrationNode,
  index: number,
  manyKey?: string
): HydrationHole | HydrationMany | null {
  const childNodes = getChildNodes(node)
  const found = manyKey === undefined
    ? findHydrationHole(childNodes, index)
    : findHydrationMany(childNodes, manyKey)

  return found
}

export function getNodes(node: HydrationNode): Array<Node> {
  switch (node._tag) {
    case "element":
      return [node.parentNode]
    case "literal":
      return [node.node]
    case "hole":
      return [...node.childNodes.flatMap(getNodes), node.comment]
    case "many":
      return [...node.childNodes.flatMap(getNodes), node.comment]
    case "template":
      return node.childNodes.flatMap(getNodes)
  }
}

export function getPreviousNodes(hole: HydrationHole | HydrationMany): Array<Node> {
  return hole.childNodes.flatMap(getNodes).filter((n) => n !== hole.comment)
}
