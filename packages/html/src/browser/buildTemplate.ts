import {
  Template,
  Node,
  ElementNode,
  SelfClosingElementNode,
  TextOnlyElement,
  Text,
} from '../parser/parser.js'

export function buildTemplate(document: Document, { nodes }: Template): DocumentFragment {
  const fragment = document.createDocumentFragment()

  for (let i = 0; i < nodes.length; ++i) {
    fragment.append(buildNode(document, nodes[i], false))
  }

  return fragment
}

function buildNode(document: Document, node: Node, isSvgContext: boolean): globalThis.Node {
  switch (node.type) {
    case 'element':
    case 'self-closing-element':
    case 'text-only-element':
      return buildElement(document, node, isSvgContext)
    case 'text':
      return document.createTextNode(node.value)
    case 'comment':
      return document.createComment(node.value)
    // Create placeholders for these elements
    case 'comment-part':
    case 'node':
      return document.createComment(`hole${node.index}`)
  }
}

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

function buildElement(
  document: Document,
  node: ElementNode | SelfClosingElementNode | TextOnlyElement,
  isSvgContext: boolean,
): Element {
  const { type, tagName, attributes } = node
  const isSvg = isSvgContext ? tagName !== 'foreignObject' : tagName === 'svg'
  const element = isSvg
    ? document.createElementNS(SVG_NAMESPACE, tagName)
    : document.createElement(tagName)

  for (let i = 0; i < attributes.length; ++i) {
    const attr = attributes[i]

    // We only handle static attributes here, parts are handled elsewhere
    if (attr.type === 'attribute') {
      element.setAttribute(attr.name, attr.value)
    } else if (attr.type === 'boolean') {
      element.toggleAttribute(attr.name, true)
    }
  }

  if (type === 'element') {
    element.append(...node.children.map((child) => buildNode(document, child, isSvg)))
  } else if (node.type === 'text-only-element') {
    element.append(...node.children.map((child) => buildTextChild(document, child)))
  }

  return element
}

function buildTextChild(document: Document, node: Text): globalThis.Node {
  if (node.type === 'text') {
    return document.createTextNode(node.value)
  }

  return document.createComment(`hole${node.index}`)
}
