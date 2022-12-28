import { readFileSync } from 'fs'

const openTag = /<html.+>/
const closeTag = '</html>'

export function readIndexHtml(filePath: string) {
  return readFileSync(filePath).toString().replace(openTag, '').replace(closeTag, '')
}
