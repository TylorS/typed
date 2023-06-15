import { Context } from './Context.js'
import * as chunks from './chunks.js'
import readAttribute, { AttrChunk } from './readAttribute.js'

type TokenState = {
  context: Context
  currentTag: string
  currentAttribute: string
  tokens: Array<Token>
}

const TEXT_ONLY_NODES_REGEX = /^(?:textarea|script|style|title|plaintext|xmp)$/

export function parseTemplateStrings(template: TemplateStringsArray): ReadonlyArray<Token> {
  const state: TokenState = {
    context: 'text',
    currentTag: '',
    currentAttribute: '',
    tokens: [],
  }

  const lastIndex = template.length - 1

  for (let i = 0; i < template.length; i++) {
    tokenize(state, template[i])

    if (i < lastIndex) {
      state.tokens.push(new PartToken(i))
    }
  }

  return state.tokens
}

export type Token =
  | OpeningTagToken
  | OpeningTagEndToken
  | ClosingTagToken
  | AttributeToken
  | AttributeStartToken
  | AttributeEndToken
  | CommentToken
  | TextToken
  | PartToken

export class OpeningTagToken {
  readonly _tag = 'opening-tag'
  constructor(readonly name: string, readonly textOnly: boolean = false) {}
}

export class AttributeStartToken {
  readonly _tag = 'attribute-start'
  constructor(readonly name: string) {}
}

export class AttributeEndToken {
  readonly _tag = 'attribute-end'
  constructor(readonly name: string) {}
}

export class AttributeToken {
  readonly _tag = 'attribute'
  constructor(readonly name: string, readonly value: string) {}
}

export class OpeningTagEndToken {
  readonly _tag = 'opening-tag-end'
  constructor(
    readonly name: string,
    readonly selfClosing: boolean,
    readonly textOnly: boolean = false,
  ) {}
}

export class ClosingTagToken {
  readonly _tag = 'closing-tag'
  constructor(readonly name: string, readonly textOnly: boolean = false) {}
}

export class CommentToken {
  readonly _tag = 'comment'
  constructor(readonly value: string) {}
}

export class TextToken {
  readonly _tag = 'text'
  constructor(readonly value: string) {}
}

export class PartToken {
  readonly _tag = 'part-token'
  constructor(readonly index: number) {}
}

function tokenize(state: TokenState, input: string) {
  const length = input.length

  let pos = 0
  let next: chunks.Chunk | undefined
  while (pos < length) {
    const char = input.charAt(pos)

    if (state.context === 'text') {
      /* #region Text */
      const isOpenBracket = char === '<'

      if (isOpenBracket && (next = chunks.getOpeningTag(input, pos))) {
        pos += next.length
        state.currentTag = next.match[2]
        state.tokens.push(
          new OpeningTagToken(state.currentTag, TEXT_ONLY_NODES_REGEX.test(state.currentTag)),
        )
        state.context = 'tag'
      } else if (isOpenBracket && (next = chunks.getClosingTag(input, pos))) {
        pos += next.length
        state.tokens.push(
          new ClosingTagToken(next.match[2], TEXT_ONLY_NODES_REGEX.test(state.currentTag)),
        )
      } else if (isOpenBracket && (next = chunks.getCommentOpen(input, pos))) {
        pos += next.length
        state.context = 'comment'
      } else if ((next = chunks.getText(input, pos))) {
        pos += next.length
        state.tokens.push(new TextToken(next.match[1]))
      } else {
        const text = input.substring(pos, pos + 1)
        pos += 1
        state.tokens.push(new TextToken(text))
      }
      /* #endregion */
    } else if (state.context === 'tag') {
      /* #region Tag */

      if ((next = chunks.getAttributeName(input, pos))) {
        pos += next.length
        const name = next.match[2]
        const hasValue = next.match[4]

        let read: AttrChunk
        if (hasValue && (read = readAttribute(input, pos)).value) {
          pos += read.length
          state.tokens.push(new AttributeToken(name, read.value))
        } else {
          state.tokens.push(new AttributeStartToken(name))
          state.currentAttribute = name
          state.context = 'attribute'
          pos += name.length
        }
      } else if ((next = chunks.getTagEnd(input, pos))) {
        pos += next.length
        const token = next.match[2] as '>' | '/>'

        state.tokens.push(
          new OpeningTagEndToken(
            state.currentTag,
            token === '/>',
            TEXT_ONLY_NODES_REGEX.test(state.currentTag),
          ),
        )

        state.context = state.currentTag === 'script' ? 'script' : 'text'
      } else {
        state.context = 'text'
      }
      /* #endregion */
    } else if (state.context === 'attribute') {
      /* #region Attribute */
      const isSelfClosing = char === '/' && input.charAt(pos + 1) === '>'
      const isClosing = char === '>'

      if (isClosing || isSelfClosing) {
        const last = lastToken(state.tokens)
        // We don't need to track whitespace between attributes and the close of a tag
        if (last && last._tag === 'text' && last.value.trim() === '') {
          state.tokens.pop()
        }

        state.tokens.push(new AttributeEndToken(state.currentAttribute))
        state.tokens.push(
          new OpeningTagEndToken(
            state.currentTag,
            isSelfClosing,
            TEXT_ONLY_NODES_REGEX.test(state.currentTag),
          ),
        )
        pos += isSelfClosing ? 2 : 1

        state.currentAttribute = ''
        state.context = 'tag'
      } else if (char === '"') {
        state.tokens.push(new AttributeEndToken(state.currentAttribute))
        state.currentAttribute = ''
        state.context = 'tag'
        pos += 1
      } else if ((next = chunks.getAttributeName(input, pos))) {
        pos += next.length
        const name = next.match[2]
        const hasValue = next.match[4]

        state.tokens.push(new AttributeEndToken(state.currentAttribute))

        if (hasValue && hasValue.length > 1) {
          const read = readAttribute(input, pos)
          pos += read.length

          state.tokens.push(new AttributeToken(name, read.value))
        } else {
          state.tokens.push(new AttributeStartToken(name))
          state.currentAttribute = name
          pos += name.length
        }
      } else if ((next = chunks.getWhitespace(input, pos))) {
        state.tokens.push(new TextToken(next.match[1]))
        pos += next.length
      } else {
        break
      }

      /* #endregion */
    } else if (state.context === 'comment') {
      /* #region Comment */
      if ((next = chunks.getComment(input, pos))) {
        pos += next.length
        state.tokens.push(new CommentToken(next.match[2]))
        state.context = 'text'
      } else {
        state.tokens.push(new CommentToken(input.substring(pos)))
        break
      }
      /* #endregion */
    } else if (state.context === 'script' || state.context === 'style') {
      if ((next = chunks.getScript(input, pos))) {
        pos += next.length

        if (next.match[2]) {
          state.tokens.push(new TextToken(next.match[2]))
        }

        state.tokens.push(new ClosingTagToken(state.context, true))
        state.context = 'text'
      } else {
        state.tokens.push(new TextToken(input.substring(pos)))
        break
      }
    } else {
      break
    }
  }
}

function lastToken(tokens: Token[]) {
  return tokens[tokens.length - 1]
}
