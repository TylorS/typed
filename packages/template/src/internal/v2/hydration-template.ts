import { isComment, isElement, toHtml } from "@typed/wire"
import { type Inspectable, NodeInspectSymbol } from "effect/Inspectable"

const TYPED_TEMPLATE_PREFIX = `typed-`
const TYPED_TEMPLATE_END_PREFIX = `/typed-`
const MANY_PREFIX = `many`
const HOLE_PREFIX = `hole`

export function getHydrationRoot(root: HTMLElement): HydrationElement {
  const childNodes = Array.from(root.childNodes)
  let hydrationNodes = getHydrationNodes(childNodes)

  // If your whole template is wrapped in a single hole, unwrap it.
  if (hydrationNodes.length === 1 && hydrationNodes[0]._tag === "hole") {
    hydrationNodes = getChildNodes(hydrationNodes[0])
  }

  return new HydrationElement(root, hydrationNodes)
}

function getHydrationNodes(nodes: Array<Node>): Array<HydrationNode> {
  const out: Array<HydrationNode> = []

  for (let i = 0; i < nodes.length; ++i) {
    const node = nodes[i]

    if (isComment(node)) {
      if (node.data.startsWith(TYPED_TEMPLATE_PREFIX)) {
        const hash = node.data.slice(TYPED_TEMPLATE_PREFIX.length)
        const endIndex = getTemplateEndIndex(nodes, i, hash)
        const childNodes = nodes.slice(i + 1, endIndex)

        out.push(new HydrationTemplate(hash, getHydrationNodes(childNodes)))

        i = endIndex
      } else if (node.data.startsWith(MANY_PREFIX)) {
        const last = out.pop()
        out.push(new HydrationMany(node.data.slice(MANY_PREFIX.length), node, last ? [last] : []))
      } else if (node.data.startsWith(HOLE_PREFIX)) {
        const index = parseInt(node.data.slice(HOLE_PREFIX.length), 10)
        const endIndex = getHoleEndIndex(nodes, i, index)
        out.push(new HydrationHole(index, node, getHydrationNodes(nodes.slice(i + 1, endIndex))))
        i = endIndex
      } else {
        out.push(new HydrationLiteral(node))
      }
    } else if (isElement(node)) {
      out.push(new HydrationElement(node, getHydrationNodes(Array.from(node.childNodes))))
    } else {
      out.push(new HydrationLiteral(node))
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

function getHoleEndIndex(nodes: Array<Node>, start: number, index: number): number {
  const endHash = `/hole${index}`

  for (let i = start; i < nodes.length; ++i) {
    const node = nodes[i]

    if (isComment(node) && node.data === endHash) {
      return i
    }
  }

  throw new Error(`Could not find end comment for hole ${index}`)
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
  const toProcess: Array<HydrationNode> = [...nodes]

  while (toProcess.length > 0) {
    const node = toProcess.shift()!

    if (node._tag === "template" && node.hash === templateHash) {
      return node
    } else if (node._tag === "element") {
      toProcess.push(...node.childNodes)
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
  for (const node of nodes) {
    if (node._tag === "hole" && node.index === index) {
      return node
    } else if (node._tag === "element") {
      const found = findHydrationHole(node.childNodes, index)
      if (found !== null) {
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
