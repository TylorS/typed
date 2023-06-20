import { RefTemplateHole } from './TemplateCache.js'
import {
  AttributeStartToken,
  BooleanAttributeStartToken,
  ClassNameAttributeStartToken,
  CommentStartToken,
  DataAttributeStartToken,
  OpeningTagToken,
  PropertyAttributeStartToken,
  Token,
} from './tokenizer/tokenizer.js'

type AttrStartToken =
  | AttributeStartToken
  | BooleanAttributeStartToken
  | ClassNameAttributeStartToken
  | DataAttributeStartToken
  | PropertyAttributeStartToken

type TokenToHolesState = {
  depth: number
  partIndex: number
  currentTag: OpeningTagToken | null
  currentAttribute: AttrStartToken | null
  currentComment: CommentStartToken | null
}

export function tokensToTemplateHoles(tokens: Token[]): readonly TemplateHole[] {
  const holes: TemplateHole[] = []
  const state: TokenToHolesState = {
    depth: 0,
    partIndex: -1,
    currentTag: null,
    currentAttribute: null,
    currentComment: null,
  }

  const previousHole = () => holes[holes.length - 1]

  function pushAttr(hole: AttrStartToken) {
    const previousHole = state.previousHole
  }

  function pushClassNameAttr(hole: ClassNameAttributeStartToken) { }
}

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]

    switch (token._tag) {
      case 'opening-tag': {
        state.currentTag = token
        state.depth++
        break
      }
      case 'opening-tag-end': {
        if (token.selfClosing) {
          state.depth--
          state.currentTag = null
        }

        break
      }
      case 'closing-tag': {
        state.depth--
        state.currentTag = null
        break
      }
      case 'attribute': {
        break
      }
      case 'attribute-start': {
        state.currentAttribute = token
        break
      }
      case 'attribute-end': {
        state.currentAttribute = null
        break
      }
      case 'boolean-attribute-start': {
        state.currentAttribute = token
        break
      }
      case 'boolean-attribute-end': {
        state.currentAttribute = null
        break
      }
      case 'className-attribute-start': {
        state.currentAttribute = token
        break
      }
      case 'className-attribute-end': {
        state.currentAttribute = null
        break
      }
      case 'data-attribute-start': {
        state.currentAttribute = token
        break
      }
      case 'data-attribute-end': {
        state.currentAttribute = null
        break
      }
      case 'event-attribute-start': {
        break
      }
      case 'event-attribute-end': {
        state.currentAttribute = null
        break
      }
      case 'property-attribute-start': {
        state.currentAttribute = token
        break
      }
      case 'property-attribute-end': {
        state.currentAttribute = null
        break
      }
      case 'ref-attribute-start': {
        break
      }
      case 'ref-attribute-end': {
        state.currentAttribute = null
        break
      }
      case 'comment': {
        break
      }
      case 'comment-start': {
        state.currentComment = token
        break
      }
      case 'comment-end': {
        state.currentComment = null
        break
      }
      case 'part-token': {
        if (state.currentAttribute) {
          switch (state.currentAttribute._tag) {
            case 'attribute-start': {
              holes.push({
                type: 'attr',
                name: state.currentAttribute.name,
                index: token.index,
              })
              break
            }
            case 'boolean-attribute-start': {
              holes.push({
                type: 'boolean',
                name: state.currentAttribute.name,
                index: token.index,
              })
              break
            }
            case 'className-attribute-start': {
              holes.push({
                type: 'className',
                index: token.index,
              })
              break
            }
            case 'data-attribute-start': {
              holes.push({
                type: 'data',
                index: token.index,
              })
              break
            }
            case 'property-attribute-start': {
              holes.push({
                type: 'property',
                name: state.currentAttribute.name,
                index: token.index,
              })
            }
          }
        } else if (state.currentComment) {
          holes.push({
            type: 'comment',
            index: token.index,
          })
        } else if (state.currentTag) {
          if (state.currentTag.textOnly) {
            holes.push({
              type: 'text',
              index: token.index,
            })
          } else {
            holes.push({
              type: 'node',
              index: token.index,
            })
          }
        } else {
          holes.push({
            type: 'node',
            index: token.index,
          })
        }

        state.partIndex = token.index

        break
      }
      case 'text': {
        break
      }
    }
  }

  return holes
}

export type TemplateHole =
  | NodeTemplateHole
  | AttrTemplateHole
  | BooleanTemplateHole
  | ClassNameTemplateHole
  | DataTemplateHole
  | PropertyTemplateHole
  | RefTemplateHole
  | TextTemplateHole
  | CommentTemplateHole

export interface NodeTemplateHole {
  readonly type: 'node'
  readonly index: number
}

export interface AttrTemplateHole {
  readonly type: 'attr'
  readonly name: string
  readonly index: number
}

export interface SparseAttrTemplateHole {
  readonly type: 'sparseAttr'
  readonly name: string
  readonly holes: AttrTemplateHole[]
}

export interface BooleanTemplateHole {
  readonly type: 'boolean'
  readonly name: string
  readonly index: number
}

export interface ClassNameTemplateHole {
  readonly type: 'className'
  readonly index: number
}

export interface SparseClassNameTemplateHole {
  readonly type: 'sparse-class-name'
  readonly holes: ClassNameTemplateHole[]
}

export interface DataTemplateHole {
  readonly type: 'data'
  readonly index: number
}

export interface PropertyTemplateHole {
  readonly type: 'property'
  readonly name: string
  readonly index: number
}

export interface TextTemplateHole {
  readonly type: 'text'
  readonly index: number
}

export interface CommentTemplateHole {
  readonly type: 'comment'
  readonly index: number
}
