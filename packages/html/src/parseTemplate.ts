import instrument from '@webreflection/uparser'

import type { TemplateCache, TemplateHole } from './TemplateCache.js'
import { createContent } from './createContent.js'
import { createPath } from './paths.js'

const PREFIX = `hole`

const COMMENT_REGEX = /<!--hole[0-9]+-->/g

export function stripHoleComments(html: string) {
  return html.replace(COMMENT_REGEX, '')
}

// a RegExp that helps checking nodes that cannot contain comments
const TEXT_ONLY_NODES_REGEX = /^(?:textarea|script|style|title|plaintext|xmp)$/

export function parseTemplate(template: TemplateStringsArray, document: Document, isSvg: boolean) {
  const innerHtml = instrument(template, PREFIX, isSvg)
  const content = createContent(innerHtml, isSvg, document)
  const walker = document.createTreeWalker(content, 1 | 128)

  const holes: TemplateHole[] = []
  const length = template.length - 1

  let i = 0
  // updates are searched via unique names, linearly increased across the tree
  // <div isµ0="attr" isµ1="other"><!--isµ2--><style><!--isµ3--</style></div>
  let search = `${PREFIX}${i}`

  const nextSearch = () => {
    search = `${PREFIX}${++i}`
  }

  while (i < length) {
    const node = walker.nextNode()

    // if not all updates are bound but there's nothing else to crawl
    // it means that there is something wrong with the template.
    if (!node) throw `bad template: ${innerHtml}`

    // if the current node is a comment, and it contains fphtmlX
    // it means the update should take care of any content
    if (node.nodeType === 8) {
      // The only comments to be considered are those
      // which content is exactly the same as the searched one.
      if ((node as Comment).data === search) {
        holes.push({ type: 'node', path: createPath(node) })
        nextSearch()
      }
    } else {
      // if the node is not a comment, loop through all its attributes
      // named fphtmlX and relate attribute updates to this node and the
      // attribute name, retrieved through node.getAttribute("fphtmlX")
      // the fphtmlX attribute will be removed as irrelevant for the layout
      // let svg = -1;
      while ((node as Element).hasAttribute(search)) {
        holes.push({
          type: 'attr',
          path: createPath(node),
          name: (node as Element).getAttribute(search) as string,
        })
        ;(node as Element).removeAttribute(search)
        nextSearch()
      }

      // if the node was a style, textarea, or others, check its content
      // and if it is <!--fphtmlX--> then update tex-only this node
      if (
        TEXT_ONLY_NODES_REGEX.test((node as Element).localName) &&
        node.textContent?.trim() === `<!--${search}-->`
      ) {
        node.textContent = ''
        holes.push({ type: 'text', path: createPath(node) })
        nextSearch()
      }
    }
  }

  const templateCache: TemplateCache = {
    content,
    holes,
  }

  return templateCache
}
