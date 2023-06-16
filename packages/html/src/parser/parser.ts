import * as Option from '@effect/data/Option'

import { Token, tokenizeTemplateStrings } from '../tokenizer/tokenizer.js'

export class Parser {
  protected _template: ReadonlyArray<string> = []
  protected _tokenStream!: Iterator<Token>
  protected _lookahead: Token | null = null

  parse(template: ReadonlyArray<string>) {
    this._template = template
    this._tokenStream = tokenizeTemplateStrings(template)
    this._lookahead = this.getNextToken()

    return this.Template()
  }

  protected Template(): Template {
    const nodes: Node[] = []

    while (this._lookahead !== null) {
      const node = this.Node()

      if (node) {
        nodes.push(node)
      }
    }

    return new Template(nodes)
  }

  protected Node(): Node {
    const token = this.findTokenOfType('opening-tag', 'text', 'part-token')

    if (token._tag === 'text') {
      return new TextNode(token.value)
    }

    if (token._tag === 'part-token') {
      return new NodePart(token.index)
    }

    if (token.isSelfClosing) {
      return this.SelfClosingElementNode(token.name)
    } else if (token.textOnly) {
      return this.TextOnlyElement(token.name)
    } else {
      return this.ElementNode(token.name)
    }
  }

  protected ElementNode(tagName: string): ElementNode {
    const attributes = this.Attributes()
    const children = this.Children()

    return new ElementNode(tagName, attributes, children)
  }

  protected SelfClosingElementNode(tagName: string): SelfClosingElementNode {
    const attributes = this.Attributes()

    return new SelfClosingElementNode(tagName, attributes)
  }

  protected TextOnlyElement(tagName: string): TextOnlyElement {
    const attributes = this.Attributes()
    const children = this.TextChildren()

    return new TextOnlyElement(tagName, attributes, children)
  }

  protected Attributes(): Attribute[] {
    const attributes: Attribute[] = []

    while (this._lookahead !== null) {
      if (this._lookahead._tag === 'opening-tag-end') {
        this._lookahead = this.getNextToken()
        break
      } else {
        attributes.push(this.Attribute())
      }
    }

    return attributes
  }

  protected Attribute(): Attribute {
    const token = this.findTokenOfType(
      'attribute',
      'attribute-start',
      'boolean-attribute-start',
      'className-attribute-start',
      'data-attribute-start',
      'event-attribute-start',
      'property-attribute-start',
      'ref-attribute-start',
      'text',
    )

    switch (token._tag) {
      case 'attribute':
        return new AttributeNode(token.name, token.value)
      case 'attribute-start':
        return this.SparseAttrNode(token.name)
      case 'boolean-attribute-start':
        return this.BooleanNode(token.name)
      case 'className-attribute-start':
        return this.SparseClassNameNode()
      case 'data-attribute-start':
        return this.DataNode()
      case 'event-attribute-start':
        return this.EventNode(token.name)
      case 'property-attribute-start':
        return this.PropertyNode(token.name)
      case 'ref-attribute-start':
        return this.RefNode()
      case 'text':
        return new TextNode(token.value)
    }
  }

  protected SparseAttrNode(name: string): SparseAttrNode | AttrPartNode | BooleanNode {
    const nodes: Array<AttrPartNode | TextNode> = []

    while (this._lookahead !== null) {
      const token = this.findTokenOfType('text', 'part-token', 'attribute-end')

      if (token._tag === 'text') {
        if (token.value.trim() === '') continue
        nodes.push(new TextNode(token.value))
      } else if (token._tag === 'part-token') {
        nodes.push(new AttrPartNode(name, token.index))
      } else {
        if (nodes.length === 0) {
          return new BooleanNode(name, Option.none())
        }

        break
      }
    }

    if (nodes.length === 1) {
      return nodes[0] as AttrPartNode
    }

    if (nodes.length === 0) {
      throw new SyntaxError(`Expected at least one part or text element in attribute ${name}`)
    }

    return new SparseAttrNode(name, nodes)
  }

  protected AttrNode(name: string): AttrPartNode {
    const token = this.findTokenOfType('part-token')

    return new AttrPartNode(name, token.index)
  }

  protected BooleanNode(name: string): BooleanNode {
    // We know that the next token MUST be a part-token
    const part = this.predictNextToken('part-token')

    // We don't need to do anything with a boolean-attribute-end token, skip it
    this.predictNextToken('boolean-attribute-end')

    return new BooleanNode(name, Option.some(part.index))
  }

  protected ClassNamePartNode(): ClassNamePartNode {
    const part = this.predictNextToken('part-token')

    return new ClassNamePartNode(part.index)
  }

  protected SparseClassNameNode(): SparseClassNameNode | ClassNameNode {
    const nodes: Array<ClassNameNode> = []

    while (this._lookahead !== null) {
      const token = this.findTokenOfType('text', 'part-token', 'className-attribute-end')

      if (token._tag === 'text') {
        if (token.value.trim() === '') continue
        nodes.push(new ClassNameTextNode(token.value))
      } else if (token._tag === 'part-token') {
        nodes.push(new ClassNamePartNode(token.index))
      } else {
        break
      }
    }

    if (nodes.length === 0) {
      throw new SyntaxError('Expected at least one node in class name attribute')
    }

    if (nodes.length === 1) {
      return nodes[0]
    }

    return new SparseClassNameNode(nodes)
  }

  protected DataNode(): DataNode {
    const part = this.predictNextToken('part-token')

    // We don't need to do anything with a data-attribute-end token, skip it
    this.predictNextToken('data-attribute-end')

    return new DataNode(part.index)
  }

  protected EventNode(name: string): EventNode {
    const part = this.predictNextToken('part-token')

    // We don't need to do anything with a event-attribute-end token, skip it
    this.predictNextToken('event-attribute-end')

    return new EventNode(name, part.index)
  }

  protected PropertyNode(name: string): PropertyNode {
    const part = this.predictNextToken('part-token')

    // We don't need to do anything with a property-attribute-end token, skip it
    this.predictNextToken('property-attribute-end')

    return new PropertyNode(name, part.index)
  }

  protected RefNode(): RefNode {
    const part = this.predictNextToken('part-token')

    // We don't need to do anything with a ref-attribute-end token, skip it
    this.predictNextToken('ref-attribute-end')

    return new RefNode(part.index)
  }

  protected TextNode(value: string): TextNode {
    return new TextNode(value)
  }

  protected TextPartNode(): TextPartNode {
    const token = this.predictNextToken('part-token')

    return new TextPartNode(token.index)
  }

  protected Children(): Node[] {
    const children: Node[] = []

    while (this._lookahead) {
      if (this._lookahead._tag === 'closing-tag') {
        this._lookahead = this.getNextToken()
        break
      } else {
        const child = this.Node()

        if (child) {
          children.push(child)
        } else {
          break
        }
      }
    }

    return children
  }

  protected TextChildren(): Text[] {
    const children: Text[] = []

    while (this._lookahead !== null) {
      const token = this.findTokenOfType('text', 'part-token', 'closing-tag')

      if (token._tag === 'text') {
        children.push(new TextNode(token.value))
      } else if (token._tag === `part-token`) {
        children.push(new TextPartNode(token.index))
      } else {
        break
      }
    }

    return children
  }

  protected findTokenOfType<T extends ReadonlyArray<Token['_tag']>>(
    ...tokenTypes: T
  ): Extract<Token, { readonly _tag: T[number] }> {
    const token = this._lookahead

    if (token === null) {
      throw new SyntaxError(
        `Unexpected end of template. Expected one of types ${tokenTypes.join(', ')}.`,
      )
    }

    for (let i = 0; i < tokenTypes.length; i++) {
      if (token._tag === tokenTypes[i]) {
        this._lookahead = this.getNextToken()

        return token as Extract<Token, { readonly _tag: T[number] }>
      }
    }

    throw new SyntaxError(
      `Unexpected token ${token._tag}. Expected one of types ${tokenTypes.join(', ')}.`,
    )
  }

  protected predictNextToken<T extends Token['_tag']>(
    type: T,
  ): Extract<Token, { readonly _tag: T }> {
    const token = this._lookahead

    if (token === null) {
      throw new SyntaxError(`Unexpected end of template. Expected ${type}.`)
    }

    if (token._tag !== type) {
      throw new SyntaxError(`Unexpected token ${token._tag}. Expected ${type}.`)
    }

    this._lookahead = this.getNextToken()

    return token as Extract<Token, { readonly _tag: T }>
  }

  protected getNextToken(): Token | null {
    const { value, done } = this._tokenStream.next()

    if (done) {
      return null
    }

    console.log('Next Token', value)

    return value
  }
}

export class Template {
  readonly type = 'template'

  constructor(readonly nodes: readonly Node[]) {}
}

export type Node = ElementNode | SelfClosingElementNode | TextOnlyElement | TextNode | NodePart

export class ElementNode {
  readonly type = 'element'
  constructor(
    readonly tagName: string,
    readonly attributes: Attribute[],
    readonly children: Node[],
  ) {}
}

export class NodePart {
  readonly type = 'node'
  constructor(readonly index: number) {}
}

export class SelfClosingElementNode {
  readonly type = 'self-closing-element'
  constructor(readonly tagName: string, readonly attributes: Attribute[]) {}
}

export class TextOnlyElement {
  readonly type = 'text-only-element'
  constructor(
    readonly tagName: string,
    readonly attributes: Attribute[],
    readonly children: ReadonlyArray<Text>,
  ) {}
}

export type Attribute =
  | AttributeNode
  | AttrPartNode
  | SparseAttrNode
  | BooleanNode
  | ClassNameNode
  | SparseClassNameNode
  | DataNode
  | EventNode
  | PropertyNode
  | RefNode
  | TextNode

export class AttributeNode {
  readonly type = 'attribute' as const
  constructor(readonly name: string, readonly value: string) {}
}

export class AttrPartNode {
  readonly type = 'attr' as const
  constructor(readonly name: string, readonly index: number) {}
}

export class SparseAttrNode {
  readonly type = 'sparse-attr' as const
  constructor(readonly name: string, readonly nodes: ReadonlyArray<AttrPartNode | TextNode>) {}
}

export class BooleanNode {
  readonly type = 'boolean' as const
  constructor(readonly name: string, readonly index: Option.Option<number>) {}
}

export type ClassNameNode = ClassNameTextNode | ClassNamePartNode

export class ClassNameTextNode {
  readonly type = 'className-text' as const
  constructor(readonly value: string) {}
}

export class ClassNamePartNode {
  readonly type = 'className-part' as const
  constructor(readonly index: number) {}
}

export class SparseClassNameNode {
  readonly type = 'sparseClassName' as const

  constructor(readonly nodes: ClassNameNode[]) {}
}

export class DataNode {
  readonly type = 'data' as const

  constructor(readonly index: number) {}
}

export class EventNode {
  readonly type = 'event' as const

  constructor(readonly name: string, readonly index: number) {}
}

export class PropertyNode {
  readonly type = 'property' as const

  constructor(readonly name: string, readonly index: number) {}
}

export class RefNode {
  readonly type = 'ref' as const

  constructor(readonly index: number) {}
}

export type Text = TextNode | TextPartNode

export class TextNode {
  readonly type = 'text' as const

  constructor(readonly value: string) {}
}

export class TextPartNode {
  readonly type = 'text-part' as const

  constructor(readonly index: number) {}
}
