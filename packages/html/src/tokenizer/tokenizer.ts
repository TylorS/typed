import * as chunks from './chunks.js'
import readAttribute, { AttrChunk } from './readAttribute.js'

type TokenState = {
  context: 'tag' | 'attribute' | 'comment' | 'text' | 'script' | 'style'
  currentTag: string
  currentAttribute: string
}

const TEXT_ONLY_NODES_REGEX = /^(?:textarea|script|style|title|plaintext|xmp)$/

const SELF_CLOSING_TAGS = new Set([
  'area',
  'base',
  'br',
  'col',
  'command',
  'embed',
  'hr',
  'img',
  'input',
  'keygen',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
])

function isSelfClosingTag(tag: string): boolean {
  return SELF_CLOSING_TAGS.has(tag)
}

export function* tokenizeTemplateStrings(template: ReadonlyArray<string>): Generator<Token> {
  const state: TokenState = {
    context: 'text',
    currentTag: '',
    currentAttribute: '',
  }

  const lastIndex = template.length - 1

  for (let i = 0; i < template.length; i++) {
    yield* tokenize(state, template[i])

    if (i < lastIndex) {
      yield new PartToken(i)
    }
  }
}

export type Token =
  | OpeningTagToken
  | OpeningTagEndToken
  | ClosingTagToken
  | AttributeToken
  | AttributeStartToken
  | AttributeEndToken
  | BooleanAttributeToken
  | BooleanAttributeStartToken
  | BooleanAttributeEndToken
  | ClassNameAttributeStartToken
  | ClassNameAttributeEndToken
  | DataAttributeStartToken
  | DataAttributeEndToken
  | EventAttributeStartToken
  | EventAttributeEndToken
  | PropertyAttributeStartToken
  | PropertyAttributeEndToken
  | RefAttributeStartToken
  | RefAttributeEndToken
  | CommentToken
  | CommentStartToken
  | CommentEndToken
  | TextToken
  | PartToken

export class OpeningTagToken {
  readonly _tag = 'opening-tag'

  constructor(
    readonly name: string,
    readonly isSelfClosing: boolean = false,
    readonly textOnly: boolean = TEXT_ONLY_NODES_REGEX.test(name),
  ) {}
}

export class AttributeStartToken {
  readonly _tag = 'attribute-start'
  constructor(readonly name: string) {}
}

export class AttributeEndToken {
  readonly _tag = 'attribute-end'
  constructor(readonly name: string) {}
}

export class BooleanAttributeStartToken {
  readonly _tag = 'boolean-attribute-start'
  constructor(readonly name: string) {}
}

export class BooleanAttributeEndToken {
  readonly _tag = 'boolean-attribute-end'
  constructor(readonly name: string) {}
}

export class ClassNameAttributeStartToken {
  readonly _tag = 'className-attribute-start'
}

export class ClassNameAttributeEndToken {
  readonly _tag = 'className-attribute-end'
}

export class DataAttributeStartToken {
  readonly _tag = 'data-attribute-start'
}

export class DataAttributeEndToken {
  readonly _tag = 'data-attribute-end'
}

export class EventAttributeStartToken {
  readonly _tag = 'event-attribute-start'
  constructor(readonly name: string) {}
}

export class EventAttributeEndToken {
  readonly _tag = 'event-attribute-end'
  constructor(readonly name: string) {}
}

export class PropertyAttributeStartToken {
  readonly _tag = 'property-attribute-start'
  constructor(readonly name: string) {}
}

export class PropertyAttributeEndToken {
  readonly _tag = 'property-attribute-end'
  constructor(readonly name: string) {}
}

export class RefAttributeStartToken {
  readonly _tag = 'ref-attribute-start'
}

export class RefAttributeEndToken {
  readonly _tag = 'ref-attribute-end'
}

export class AttributeToken {
  readonly _tag = 'attribute'
  constructor(
    readonly name: string,
    readonly value: string,
  ) {}
}

export class BooleanAttributeToken {
  readonly _tag = 'boolean-attribute'
  constructor(readonly name: string) {}
}

export class OpeningTagEndToken {
  readonly _tag = 'opening-tag-end'

  constructor(
    readonly name: string,
    readonly selfClosing: boolean,
    readonly textOnly: boolean = TEXT_ONLY_NODES_REGEX.test(name),
  ) {}
}

export class ClosingTagToken {
  readonly _tag = 'closing-tag'

  constructor(
    readonly name: string,
    readonly textOnly: boolean = TEXT_ONLY_NODES_REGEX.test(name),
  ) {}
}

export class CommentToken {
  readonly _tag = 'comment'
  constructor(readonly value: string) {}
}

export class CommentStartToken {
  readonly _tag = 'comment-start'
  constructor(readonly value: string) {}
}

export class CommentEndToken {
  readonly _tag = 'comment-end'
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

function* tokenize(state: TokenState, input: string): Generator<Token> {
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
        yield new OpeningTagToken(state.currentTag, isSelfClosingTag(state.currentTag))
        state.context = 'tag'
      } else if (isOpenBracket && (next = chunks.getClosingTag(input, pos))) {
        pos += next.length
        yield new ClosingTagToken(next.match[2])
      } else if (isOpenBracket && (next = chunks.getComment(input, pos))) {
        yield new CommentToken(next.match[3])
        pos += next.length
      } else if (isOpenBracket && (next = chunks.getCommentOpen(input, pos))) {
        yield new CommentStartToken(next.match[3])
        pos += next.length
        state.context = 'comment'
      } else if ((next = chunks.getText(input, pos))) {
        pos += next.length

        yield new TextToken(next.match[1])
      } else {
        const text = input.substring(pos, pos + 1)
        pos += 1
        yield new TextToken(text)
      }
      /* #endregion */
    } else if (state.context === 'tag') {
      /* #region Tag */

      if ((next = chunks.getAttributeName(input, pos))) {
        pos += next.length
        const name = next.match[2]
        const hasEqualsSign = next.match[4]

        let read: AttrChunk | null
        if (hasEqualsSign && (read = readAttribute(input, pos))?.value) {
          pos += read.length
          yield new AttributeToken(name, read.value)
        } else if (hasEqualsSign) {
          yield getAttributeTokenPartial(name, 'start')
          state.currentAttribute = name
          state.context = 'attribute'
          pos += 1
        } else {
          yield new BooleanAttributeToken(name)
        }
      } else if ((next = chunks.getTagEnd(input, pos))) {
        pos += next.length
        const token = next.match[2] as '>' | '/>'

        yield new OpeningTagEndToken(state.currentTag, token === '/>')

        state.context =
          state.currentTag === 'script' ? 'script' : state.currentTag === 'style' ? 'style' : 'text'
      } else {
        state.context = 'text'
      }
      /* #endregion */
    } else if (state.context === 'attribute') {
      /* #region Attribute */
      const isSelfClosing = char === '/' && input.charAt(pos + 1) === '>'
      const isClosing = char === '>'

      if (isClosing || isSelfClosing) {
        yield getAttributeTokenPartial(state.currentAttribute, 'end')
        yield new OpeningTagEndToken(state.currentTag, isSelfClosing)
        pos += isSelfClosing ? 2 : 1

        state.currentAttribute = ''
        state.context = 'text'
      } else if (char === '"') {
        yield getAttributeTokenPartial(state.currentAttribute, 'end')
        state.currentAttribute = ''
        state.context = 'tag'
        pos += 1
      } else if ((next = chunks.getAttributeStart(input, pos))) {
        yield getAttributeTokenPartial(state.currentAttribute, 'end')

        state.context = 'tag'
      } else if ((next = chunks.getText(input, pos))) {
        const value = next.match[1]

        // Check for self-closing element
        if (value.trim().endsWith('/>')) {
          yield getAttributeTokenPartial(state.currentAttribute, 'end')

          yield new OpeningTagEndToken(state.currentTag, true)
          pos += value.length
          state.currentAttribute = ''
          state.context = 'text'
          // Check for tag closing
        } else if (value.trim().endsWith('>')) {
          yield getAttributeTokenPartial(state.currentAttribute, 'end')
          yield new OpeningTagEndToken(state.currentTag, false)
          pos += value.length
          state.currentAttribute = ''
          state.context = 'text'
        } else if (value.includes(`"`)) {
          const [text, , remaining] = value.split(`"`)

          console.log(remaining)

          const whitespace = chunks.getWhitespace(remaining, 0)?.match[0] ?? ''

          yield new TextToken(text)
          yield getAttributeTokenPartial(state.currentAttribute, 'end')

          pos += text.length + 1 + whitespace.length
          state.currentAttribute = ''
          state.context = 'tag'
        } else {
          pos += next.length
          yield new TextToken(next.match[0])
        }
      } else if ((next = chunks.getWhitespace(input, pos))) {
        pos += next.length
      } else {
        break
      }

      /* #endregion */
    } else if (state.context === 'comment') {
      /* #region Comment */
      if ((next = chunks.getCommentEnd(input, pos))) {
        pos += next.length
        yield new CommentEndToken(next.match[2])
        state.context = 'text'
      } else {
        yield new CommentToken(input.substring(pos))
        break
      }
      /* #endregion */
    } else if (state.context === 'script') {
      if ((next = chunks.getScript(input, pos))) {
        pos += next.length

        if (next.match[2]) yield new TextToken(next.match[2])
        yield new ClosingTagToken(state.context, true)
        state.context = 'text'
      } else {
        yield new TextToken(input.substring(pos))
        break
      }
    } else if (state.context === 'style') {
      if ((next = chunks.getStyle(input, pos))) {
        pos += next.length

        if (next.match[2]) yield new TextToken(next.match[2])
        yield new ClosingTagToken(state.context, true)
        state.context = 'text'
      } else {
        yield new TextToken(input.substring(pos))
        break
      }
    } else {
      break
    }
  }
}

function getAttributeTokenPartial(name: string, ctx: 'start' | 'end') {
  switch (name[0]) {
    case '?':
      return ctx === 'start'
        ? new BooleanAttributeStartToken(name.substring(1))
        : new BooleanAttributeEndToken(name.substring(1))
    case '.': {
      const propertyName = name.substring(1)

      switch (propertyName) {
        case 'data':
          return ctx === 'start' ? new DataAttributeStartToken() : new DataAttributeEndToken()
        default:
          return ctx === 'start'
            ? new PropertyAttributeStartToken(propertyName)
            : new PropertyAttributeEndToken(propertyName)
      }
    }
    case '@':
      return ctx === 'start'
        ? new EventAttributeStartToken(name.substring(1))
        : new EventAttributeEndToken(name.substring(1))
    case 'o':
      if (name[1] === 'n')
        return ctx === 'start'
          ? new EventAttributeStartToken(name.substring(2))
          : new EventAttributeEndToken(name.substring(2))
  }

  switch (name.toLowerCase()) {
    case 'class':
    case 'classname':
      return ctx === 'start' ? new ClassNameAttributeStartToken() : new ClassNameAttributeEndToken()
    case 'ref':
      return ctx === 'start' ? new RefAttributeStartToken() : new RefAttributeEndToken()
  }

  return ctx === 'start' ? new AttributeStartToken(name) : new AttributeEndToken(name)
}
