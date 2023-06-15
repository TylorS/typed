import { Token } from './tokenizer/tokenizer.js'

export function tokensToHtml(tokens: readonly Token[], templateIndex: number, depth = 0) {
  let html = ''
  let i = 0
  let partIndex = -1

  tokenLoop: for (; i < tokens.length; i++) {
    const token = tokens[i]

    switch (token._tag) {
      case 'opening-tag': {
        html += `<${token.name}`

        if (depth === 0) {
          html += ` data-typed="${templateIndex}"`
        }

        depth++

        break
      }
      case 'closing-tag': {
        html += `</${token.name}>`
        depth--
        break
      }
      case 'opening-tag-end': {
        if (token.selfClosing) {
          html += '/>'
          depth--
        } else {
          html += '>'
        }

        break
      }
      case 'attribute': {
        html += ` ${token.name}="${token.value}"`
        break
      }
      case 'attribute-start':
      case 'boolean-attribute-start':
      case 'property-attribute-start': {
        html += ` ${token.name}="`

        break
      }
      case 'attribute-end':
      case 'boolean-attribute-end':
      case 'className-attribute-end':
      case 'property-attribute-end': {
        html += `"`
        break
      }
      case 'className-attribute-start': {
        html += ` class="`

        break
      }
      case 'comment': {
        html += `<!--${token.value}-->`
        break
      }
      case 'comment-start': {
        html += `<!--`
        break
      }
      case 'comment-end': {
        html += `-->`
        break
      }
      case 'text': {
        html += token.value
        break
      }
      case 'part-token': {
        partIndex = token.index
        break tokenLoop
      }
      // We don't render these attributes here, only rehydrate them so no need to break tokenLoop
      case 'data-attribute-start':
      case 'data-attribute-end':
      case 'event-attribute-start':
      case 'event-attribute-end':
      case 'ref-attribute-start':
      case 'ref-attribute-end': {
        break
      }
    }
  }

  return {
    // The HTML We can render now
    html,
    // The index of the part we need to wait on next
    partIndex,
    // The remaining tokens to be utilized in the next render
    remaining: tokens.slice(i + 1),
    // The depth of currently open tags
    depth,
  } as const
}
