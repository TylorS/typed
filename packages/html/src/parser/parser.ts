import { State } from './State.js'
import * as chunks from './chunks.js'
import readAttribute from './readAttribute.js'

type TokenState = {
  state: State
  currentTag: string
  tokens: Array<Token>
}

export function parseTemplateStrings(template: TemplateStringsArray): ReadonlyArray<Token> {
  const state: TokenState = {
    state: 'text',
    currentTag: '',
    tokens: [],
  }

  for (let i = 0; i < template.length; i++) {
    tokenize(state, template[i])
  }

  return state.tokens
}

export type Token =
  | OpeningTag
  | OpeningTagEnd
  | ClosingTag
  | Attribute
  | AttributeStart
  | AttributeEnd
  | Comment
  | Text
  | Script
  | Style

export class OpeningTag {
  readonly _tag = 'opening-tag'
  constructor(readonly name: string) {}
}

export class AttributeStart {
  readonly _tag = 'attribute-start'
  constructor(readonly name: string) {}
}

export class AttributeEnd {
  readonly _tag = 'attribute-end'
  constructor(readonly name: string) {}
}

export class Attribute {
  readonly _tag = 'attribute'
  constructor(readonly name: string, readonly value: string) {}
}

export class OpeningTagEnd {
  readonly _tag = 'opening-tag-end'
  constructor(readonly name: string, readonly selfClosing: boolean) {}
}

export class ClosingTag {
  readonly _tag = 'closing-tag'
  constructor(readonly name: string) {}
}

export class Comment {
  readonly _tag = 'comment'
  constructor(readonly value: string) {}
}

export class Text {
  readonly _tag = 'text'
  constructor(readonly value: string) {}
}

export class Script {
  readonly _tag = 'script'
  constructor(readonly value: string) {}
}

export class Style {
  readonly _tag = 'style'
  constructor(readonly value: string) {}
}

function tokenize(state: TokenState, input: string) {
  const length = input.length

  let pos = 0
  let next: chunks.Chunk | undefined
  while (pos < length) {
    if (state.state === 'text') {
      /* #region Text */
      const char = input.charAt(pos)
      const isOpenBracket = char === '<'

      if (isOpenBracket && (next = chunks.getOpeningTag(input, pos))) {
        pos += next.length
        state.currentTag = next.match[2]
        state.tokens.push(new OpeningTag(state.currentTag))
        state.state = 'tag'
      } else if (isOpenBracket && (next = chunks.getClosingTag(input, pos))) {
        pos += next.length
        state.tokens.push(new ClosingTag(next.match[2]))
      } else if (isOpenBracket && (next = chunks.getCommentOpen(input, pos))) {
        pos += next.length
        state.state = 'comment'
      } else if ((next = chunks.getText(input, pos))) {
        pos += next.length
        state.tokens.push(new Text(next.match[1]))
      } else {
        const text = input.substring(pos, pos + 1)
        pos += 1
        state.tokens.push(new Text(text))
      }
      /* #endregion */
    } else if (state.state === 'tag') {
      /* #region Tag */

      if ((next = chunks.getAttributeName(input, pos))) {
        pos += next.length
        const name = next.match[2]
        const hasValue = next.match[4]

        console.log(next.match)

        if (hasValue && hasValue !== '=') {
          const read = readAttribute(input, pos)
          pos += read.length

          state.tokens.push(new Attribute(name, read.value))
        } else {
          state.tokens.push(new AttributeStart(name))
          state.state = 'attribute'
        }
      } else if ((next = chunks.getTagEnd(input, pos))) {
        pos += next.length
        const token = next.match[2] as '>' | '/>'

        state.tokens.push(new OpeningTagEnd(state.currentTag, token === '/>'))

        state.state = state.currentTag === 'script' ? 'script' : 'text'
      } else {
        state.state = 'text'
      }
      /* #endregion */
    } else if (state.state === 'attribute') {
      // TODO: Support reading partial attributes
      console.log('attribute', state, input.substring(pos))
    } else if (state.state === 'comment') {
      /* #region Comment */
      if ((next = chunks.getComment(input, pos))) {
        pos += next.length
        state.tokens.push(new Comment(next.match[2]))
        state.state = 'text'
      } else {
        state.tokens.push(new Comment(input.substring(pos)))
        break
      }
      /* #endregion */
    } else if (state.state === 'script' || state.state === 'style') {
      if ((next = chunks.getScript(input, pos))) {
        pos += next.length
        state.tokens.push(new Text(next.match[2]))
        state.tokens.push(new ClosingTag(state.state))
        state.state = 'text'
      } else {
        state.tokens.push(new Text(input.substring(pos)))
        break
      }
    } else {
      break
    }
  }
}
