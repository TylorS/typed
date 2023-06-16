import { TYPED_ATTR, TYPED_END, TYPED_START } from './meta.js'
import { Token } from './tokenizer/tokenizer.js'

type TokenToHtmlState = {
  depth: number
  partIndex: number
  attributes: Map<Depth, Set<PartIndex>>
  currentAttribute: string
  previousBooleanAttribute: string
}

type Depth = number
type PartIndex = number

export const defaultTokenToHtmlState = (): TokenToHtmlState => ({
  depth: 0,
  partIndex: -1,
  attributes: new Map(),
  currentAttribute: '',
  previousBooleanAttribute: '',
})

export function tokensToHtml(
  tokens: readonly Token[],
  templateIndex: number,
  hash = `${templateIndex}`,
  state: TokenToHtmlState = defaultTokenToHtmlState(),
) {
  let html = ''
  let i = 0

  if (templateIndex === -1) {
    html += TYPED_START
  }

  tokenLoop: for (; i < tokens.length; i++) {
    const token = tokens[i]

    switch (token._tag) {
      case 'opening-tag': {
        html += `<${token.name}`

        if (state.depth === 0) {
          html += ` data-typed="${hash}"`
        }

        state.depth++

        break
      }
      case 'closing-tag': {
        html += appendAttributeAtDepth(state)
        html += `</${token.name}>`
        state.depth--
        break
      }
      case 'opening-tag-end': {
        if (token.selfClosing) {
          html += '/>'
          html += appendAttributeAtDepth(state)
          state.depth--
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
      case 'property-attribute-start': {
        html += ` ${token.name}="`

        state.currentAttribute = token.name

        break
      }
      // Booleans are special because they don't have a value when false and we don't want to render them here
      case 'boolean-attribute-start': {
        state.currentAttribute = token.name
        state.previousBooleanAttribute = token.name

        break
      }
      case 'attribute-end':
      case 'className-attribute-end':
      case 'property-attribute-end': {
        html += `"`
        state.currentAttribute = ''
        break
      }
      case 'boolean-attribute-end': {
        state.currentAttribute = ''
        state.previousBooleanAttribute = ''
        break
      }
      case 'className-attribute-start': {
        html += ` class="`
        state.currentAttribute = 'class'

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
      // We don't render these attributes here, only rehydrate them so no need to break tokenLoop
      case 'data-attribute-start':
      case 'event-attribute-start':
      case 'ref-attribute-start': {
        state.currentAttribute = token._tag.split('-')[0]
        break
      }
      case 'data-attribute-end':
      case 'event-attribute-end':
      case 'ref-attribute-end': {
        state.currentAttribute = ''
        break
      }

      case 'part-token': {
        state.partIndex = token.index

        // If we are in an attribute, add it to the attributes at the current depth
        // To be rendered later when we close the corresponding tag.
        if (state.currentAttribute) {
          addAttrAtDepth(state)
        }

        break tokenLoop
      }
    }
  }

  const remaining = tokens.slice(i + 1)

  if (remaining.length === 0) {
    state.partIndex = -1

    if (templateIndex === -1) {
      html += TYPED_END
    }
  }

  return {
    // The HTML We can render now
    html,
    // The remaining tokens to be utilized in the next render
    remaining,
    // The remaining state to be utilized in the next render
    state,
  } as const
}

function appendAttributeAtDepth(state: TokenToHtmlState) {
  const { depth, attributes } = state

  let html = ''

  const attrsAtDepth = attributes.get(depth)
  if (attrsAtDepth) {
    attrsAtDepth.forEach((partIndex) => {
      html += TYPED_ATTR(partIndex)
    })
    attributes.delete(depth)
  }

  return html
}

function addAttrAtDepth(state: TokenToHtmlState) {
  let current = state.attributes.get(state.depth)
  if (current === undefined) {
    current = new Set()
    state.attributes.set(state.depth, current)
  }

  current.add(state.partIndex)
}
