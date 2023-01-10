const openTag = /<html.+>/
const closeTag = '</html>'

export function cleanHtml(html: string, docType: string) {
  return html.replace(docType, '').replace(openTag, '').replace(closeTag, '').trim()
}
