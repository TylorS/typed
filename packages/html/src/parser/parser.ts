import { hashForTemplateStrings } from '../hashForTemplateStrings.js'
import { Token, tokenizeTemplateStrings } from '../tokenizer/tokenizer.js'

export class Parser {
  protected _template: ReadonlyArray<string> = []
  protected _tokenStream!: Iterator<Token>
  protected _lookahead: Token | null = null
  protected _stack: Array<number> = []
  protected _parts: Array<[PartNode, ReadonlyArray<number>]> = []

  parse(template: ReadonlyArray<string>): Template {
    this._template = template
    this._tokenStream = tokenizeTemplateStrings(template)
    this._lookahead = this.getNextToken()

    const ast = this.Template(hashForTemplateStrings(template))

    this._stack = []
    this._parts = []

    return ast
  }

  protected Template(hash: string): Template {
    const nodes: Node[] = []
    const template = new Template(nodes, hash, this._parts)

    let i = 0
    while (this._lookahead !== null) {
      this._stack.push(i++)
      nodes.push(this.Node())
      this._stack.pop()
    }

    return template
  }

  protected Node(): Node {
    const token = this.findTokenOfType('opening-tag', 'text', 'part-token')

    if (token._tag === 'text') {
      return new TextNode(token.value)
    }

    // Some annoyances here for generating the correct path for node parts
    if (token._tag === 'part-token') {
      return this.addPartWithoutCurrent(new NodePart(token.index))
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
    const attrs: Attribute[] = []
    const children: Node[] = []
    const element = new ElementNode(tagName, attrs, children)

    this.Attributes(attrs)
    this.Children(children)

    return element
  }

  protected SelfClosingElementNode(tagName: string): SelfClosingElementNode {
    const attrs: Attribute[] = []
    const element = new SelfClosingElementNode(tagName, attrs)

    this.Attributes(attrs)

    return element
  }

  protected TextOnlyElement(tagName: string): TextOnlyElement {
    const attrs: Attribute[] = []
    const children: Text[] = []
    const element = new TextOnlyElement(tagName, attrs, children)

    this.Attributes(attrs)
    this.TextChildren(children)

    return element
  }

  protected Attributes(attributes: Attribute[] = []): Attribute[] {
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
          return new BooleanNode(name)
        }

        break
      }
    }

    if (nodes.length === 1) {
      return this.addPart(nodes[0] as AttrPartNode)
    }

    if (nodes.length === 0) {
      throw new SyntaxError(`Expected at least one part or text element in attribute ${name}`)
    }

    return this.addPart(new SparseAttrNode(name, nodes))
  }

  protected AttrNode(name: string): AttrPartNode {
    const token = this.findTokenOfType('part-token')

    return this.addPart(new AttrPartNode(name, token.index))
  }

  protected BooleanNode(name: string): BooleanNode {
    // We know that the next token MUST be a part-token
    const part = this.predictNextToken('part-token')

    // We don't need to do anything with a boolean-attribute-end token, skip it
    this.predictNextToken('boolean-attribute-end')

    return this.addPart(new BooleanPartNode(name, part.index))
  }

  protected SparseClassNameNode(): SparseClassNameNode | ClassNameNode {
    const nodes: Array<ClassNameNode> = []

    while (this._lookahead !== null) {
      const token = this.findTokenOfType('text', 'part-token', 'className-attribute-end')

      if (token._tag === 'text') {
        if (token.value.trim() === '') continue
        nodes.push(new TextNode(token.value))
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
      return this.addPart(nodes[0] as ClassNamePartNode)
    }

    return this.addPart(new SparseClassNameNode(nodes))
  }

  protected DataNode(): DataPartNode {
    const part = this.predictNextToken('part-token')

    // We don't need to do anything with a data-attribute-end token, skip it
    this.predictNextToken('data-attribute-end')

    return this.addPart(new DataPartNode(part.index))
  }

  protected EventNode(name: string): EventPartNode {
    const part = this.predictNextToken('part-token')

    // We don't need to do anything with a event-attribute-end token, skip it
    this.predictNextToken('event-attribute-end')

    return this.addPart(new EventPartNode(name, part.index))
  }

  protected PropertyNode(name: string): PropertyPartNode {
    const part = this.predictNextToken('part-token')

    // We don't need to do anything with a property-attribute-end token, skip it
    this.predictNextToken('property-attribute-end')

    return this.addPart(new PropertyPartNode(name, part.index))
  }

  protected RefNode(): RefPartNode {
    const part = this.predictNextToken('part-token')

    // We don't need to do anything with a ref-attribute-end token, skip it
    this.predictNextToken('ref-attribute-end')

    return this.addPart(new RefPartNode(part.index))
  }

  protected TextPartNode(): TextPartNode {
    const token = this.predictNextToken('part-token')

    return this.addPart(new TextPartNode(token.index))
  }

  protected Children(children: Node[] = []): Node[] {
    let i = 0
    while (this._lookahead) {
      if (this._lookahead._tag === 'closing-tag') {
        this._lookahead = this.getNextToken()
        break
      } else {
        this._stack.push(i++)
        const child = this.Node()
        this._stack.pop()

        if (child) {
          children.push(child)
        } else {
          break
        }
      }
    }

    return children
  }

  protected TextChildren(children: Text[] = []): Text[] {
    while (this._lookahead !== null) {
      const token = this.findTokenOfType('text', 'part-token', 'closing-tag')

      if (token._tag === 'text') {
        children.push(new TextNode(token.value))
      } else if (token._tag === `part-token`) {
        children.push(this.addPart(new TextPartNode(token.index)))
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

    return value
  }

  protected addPart<A extends PartNode>(part: A): A {
    this._parts.push([part, this._stack.slice()])

    return part
  }

  protected addPartWithoutCurrent<A extends PartNode>(part: A): A {
    const current = this._stack[this._stack.length - 1]
    this._stack.pop()
    this.addPart(part)
    this._stack.push(current)

    return part
  }
}

export class Template {
  readonly type = 'template'

  constructor(
    readonly nodes: readonly Node[],
    readonly hash: string,
    readonly parts: ReadonlyArray<readonly [PartNode, ReadonlyArray<number>]>,
  ) {}
}

export type ParentNode = ElementNode | SelfClosingElementNode | TextOnlyElement

export type Node = ElementNode | SelfClosingElementNode | TextOnlyElement | TextNode | NodePart

export type PartNode =
  | AttrPartNode
  | BooleanPartNode
  | ClassNamePartNode
  | DataPartNode
  | EventPartNode
  | NodePart
  | PropertyPartNode
  | RefPartNode
  | SparseAttrNode
  | SparseClassNameNode
  | TextPartNode

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
    readonly children: Text[],
  ) {}
}

export type Attribute =
  | AttributeNode
  | AttrPartNode
  | SparseAttrNode
  | BooleanNode
  | BooleanPartNode
  | ClassNameNode
  | SparseClassNameNode
  | DataPartNode
  | EventPartNode
  | PropertyPartNode
  | RefPartNode
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
  constructor(readonly name: string, readonly nodes: Array<AttrPartNode | TextNode>) {}
}

export class BooleanNode {
  readonly type = 'boolean' as const
  constructor(readonly name: string) {}
}

export class BooleanPartNode {
  readonly type = 'boolean' as const
  constructor(readonly name: string, readonly index: number) {}
}

export type ClassNameNode = TextNode | ClassNamePartNode

export class ClassNamePartNode {
  readonly type = 'className-part' as const
  constructor(readonly index: number) {}
}

export class SparseClassNameNode {
  readonly type = 'sparseClassName' as const

  constructor(readonly nodes: ClassNameNode[]) {}
}

export class DataPartNode {
  readonly type = 'data' as const

  constructor(readonly index: number) {}
}

export class EventPartNode {
  readonly type = 'event' as const

  constructor(readonly name: string, readonly index: number) {}
}

export class PropertyPartNode {
  readonly type = 'property' as const

  constructor(readonly name: string, readonly index: number) {}
}

export class RefPartNode {
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
