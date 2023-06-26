import {
  Template,
  Node,
  ElementNode,
  SelfClosingElementNode,
  TextOnlyElement,
  Text,
} from '../parser/parser.js'

export function buildTemplate(document: Document, template: Template): DocumentFragment {
  const fragment = document.createDocumentFragment()

  for (let i = 0; i < template.nodes.length; ++i) {
    fragment.append(buildNode(document, template.nodes[i]))
  }

  return fragment
}

function buildNode(document: Document, node: Node): globalThis.Node {
  switch (node.type) {
    case 'element':
    case 'self-closing-element':
    case 'text-only-element':
      return buildElement(document, node)
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
): Element {
  const element =
    node.tagName === 'svg'
      ? document.createElementNS(SVG_NAMESPACE, node.tagName)
      : document.createElement(node.tagName)

  for (let i = 0; i < node.attributes.length; ++i) {
    const attr = node.attributes[i]

    // We only handle static attributes here, parts are handled elsewhere
    if (attr.type === 'attribute') {
      element.setAttribute(attr.name, attr.value)
    } else if (attr.type === 'boolean') {
      element.toggleAttribute(attr.name, true)
    }
  }

  if (node.type === 'element') {
    element.append(...node.children.map((child) => buildNode(document, child)))
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
