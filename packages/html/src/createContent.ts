export function createContent(
  innerHtml: string,
  svg: boolean,
  document: Document,
): DocumentFragment {
  return svg ? createSvg(innerHtml, document) : createHtml(innerHtml, document)
}

export function createHtml(innerHtml: string, document: Document): DocumentFragment {
  const template = document.createElement('template')
  template.innerHTML = innerHtml
  return template.content
}

export function createSvg(innerHtml: string, document: Document): DocumentFragment {
  const fragment = document.createDocumentFragment()
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.innerHTML = innerHtml
  fragment.append(...Array.from(svg.childNodes))

  return fragment
}
