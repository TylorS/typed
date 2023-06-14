import type { Rendered } from '../render.js'

export function addQuotations(previous: string, value: string) {
  if (previous.endsWith(`"`) || previous.endsWith(`'`)) {
    return previous + value
  }

  return previous + `"${value}"`
}

export function wrapAttrInComment(template: string, name: string, value: string, index: number) {
  const html = addQuotations(template, value)

  return html.replace(new RegExp(`(${name}=)("?)`), `${attrStart(index)}$1"`) + `"${attrEnd(index)}`
}

export function wrapBooleanInComment(template: string, name: string, index: number) {
  return (
    template.replace(new RegExp(`\\?(${name}=)("?)`), `${attrStart(index)} $1"`) +
    `" ${attrEnd(index)}`
  )
}

export function attrStart(index: number) {
  return `<!--attr${index}-start-->`
}

export function attrEnd(index: number) {
  return `<!--attr${index}-end-->`
}

export function removeAttribute(name: string, template: string) {
  return replaceAttribute(name, '', template)
}

export function replaceAttribute(name: string, value: string, template: string) {
  return template.replace(new RegExp(`${name}=(["'])?`, 'g'), value)
}

export function trimEmptyQuotes(template: string) {
  return template.replace(/\s"\s?"/g, '').replace(/>">/g, '>>')
}

const DATA_TYPED_ATTR = (n: number) => ` data-typed="${n}"`

export function addDataTypedAttributes(template: string, n: number) {
  return template.replace(/<([a-z]+)([^>]*)/, `<$1${DATA_TYPED_ATTR(n)}$2`)
}

export function nodeToHtml(node: Node | null): string {
  if (node === null) return 'null'

  switch (node.nodeType) {
    case node.TEXT_NODE:
      return node.textContent || ''
    case node.COMMENT_NODE:
      return `<!--${node.textContent || ''}-->`
    case node.DOCUMENT_FRAGMENT_NODE:
      return Array.from(node.childNodes).map(nodeToHtml).join('')
    case node.ATTRIBUTE_NODE:
      return `${(node as Attr).name}="${(node as Attr).value}"`
    default:
      return (node.valueOf() as Element).outerHTML
  }
}

export function tryNodeToHtml(node: unknown): string {
  try {
    return nodeToHtml(node as Node)
  } catch (error) {
    return JSON.stringify(node)
  }
}

export function renderedToHtml(rendered: Rendered): string {
  if (Array.isArray(rendered)) {
    return rendered.map(renderedToHtml).join('')
  }

  return nodeToHtml(rendered as Node | null)
}
