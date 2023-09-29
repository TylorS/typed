import { globalValue } from "effect/GlobalValue"
import * as Template from "@typed/template/Template"
import type { Token } from "@typed/template/Token"
import { tokenize } from "@typed/template/Tokenizer"

export interface Parser {
  parse(template: ReadonlyArray<string>, tokenStream?: Iterator<Token>): Template.Template
}

const iterator = <A>(iterable: Iterable<A>): Iterator<A> => iterable[Symbol.iterator]()

class ParserImpl {
  protected _template: ReadonlyArray<string> = []
  protected _tokenStream!: Iterator<Token>
  protected _lookahead!: Token | null
  protected _stack!: Array<number>
  protected _parts!: Array<[Template.PartNode | Template.SparsePartNode, ReadonlyArray<number>]>
  protected _skipWhitespace!: boolean

  parse(
    template: ReadonlyArray<string>,
    tokenStream: Iterator<Token> = iterator(tokenize(template))
  ): Template.Template {
    this._template = template
    this._tokenStream = tokenStream
    this._lookahead = this.getNextToken()
    this._stack = []
    this._parts = []
    this._skipWhitespace = true

    const ast = this.Template(templateHash(template))

    return ast
  }

  protected Template(hash: string): Template.Template {
    const template = new Template.Template(this.Children(), hash, this._parts)

    return template
  }

  protected Node(): Template.Node | null {
    const token = this.findTokenOfType(
      "opening-tag",
      "text",
      "comment",
      "comment-start",
      "part-token",
      "closing-tag"
    )

    if (token._tag === "closing-tag") return null

    if (token._tag === "text") {
      if (this._skipWhitespace && token.value.trim() === "") return null

      return new Template.TextNode(token.value)
    }

    if (token._tag === "comment") {
      return new Template.CommentNode(token.value)
    }

    if (token._tag === "comment-start") {
      const node = this.Comment("")
      return node
    }

    // Some annoyances here for generating the correct path for node parts
    if (token._tag === "part-token") {
      this._skipWhitespace = false
      return this.addPartWithoutCurrent(new Template.NodePart(token.index))
    }

    this._skipWhitespace = true

    if (token.isSelfClosing) {
      return this.SelfClosingElementNode(token.name)
    } else if (token.textOnly) {
      return this.TextOnlyElement(token.name)
    } else {
      return this.ElementNode(token.name)
    }
  }

  protected ElementNode(tagName: string): Template.ElementNode {
    const attrs: Array<Template.Attribute> = []
    const children: Array<Template.Node> = []
    const element = new Template.ElementNode(tagName, attrs, children)

    this.Attributes(attrs)
    this.Children(children)

    return element
  }

  protected SelfClosingElementNode(tagName: string): Template.SelfClosingElementNode {
    const attrs: Array<Template.Attribute> = []
    const element = new Template.SelfClosingElementNode(tagName, attrs)

    this.Attributes(attrs)

    return element
  }

  protected TextOnlyElement(tagName: string): Template.TextOnlyElement {
    const attrs: Array<Template.Attribute> = []
    const children: Array<Template.Text> = []
    const element = new Template.TextOnlyElement(tagName, attrs, children)

    this.Attributes(attrs)
    this.TextChildren(children)

    return element
  }

  protected Attributes(attributes: Array<Template.Attribute> = []): Array<Template.Attribute> {
    while (this._lookahead !== null) {
      if (this._lookahead._tag === "opening-tag-end") {
        this._lookahead = this.getNextToken()
        break
      } else {
        const attr = this.Attribute()
        if (attr) {
          attributes.push(attr)
        } else {
          break
        }
      }
    }

    return attributes
  }

  protected Attribute(): Template.Attribute | null {
    const token = this.findTokenOfType(
      "attribute",
      "attribute-start",
      "boolean-attribute",
      "boolean-attribute-start",
      "className-attribute-start",
      "data-attribute-start",
      "event-attribute-start",
      "property-attribute-start",
      "ref-attribute-start",
      "text"
    )

    switch (token._tag) {
      case "attribute":
        return new Template.AttributeNode(token.name, token.value)
      case "attribute-start":
        return this.SparseAttrNode(token.name)
      case "boolean-attribute":
        return new Template.BooleanNode(token.name)
      case "boolean-attribute-start":
        return this.BooleanNode(token.name)
      case "className-attribute-start":
        return this.SparseClassNameNode()
      case "data-attribute-start":
        return this.DataNode()
      case "event-attribute-start":
        return this.EventNode(token.name)
      case "property-attribute-start":
        return this.PropertyNode(token.name)
      case "ref-attribute-start":
        return this.RefNode()
      case "text":
        return null
    }
  }

  protected SparseAttrNode(name: string): Template.SparseAttrNode | Template.AttrPartNode | Template.BooleanNode {
    const nodes: Array<Template.AttrPartNode | Template.TextNode> = []

    while (this._lookahead !== null) {
      const token = this.findTokenOfType("text", "part-token", "attribute-end")

      if (token._tag === "text") {
        if (token.value === "") continue
        nodes.push(new Template.TextNode(token.value))
      } else if (token._tag === "part-token") {
        nodes.push(new Template.AttrPartNode(name, token.index))
      } else {
        if (nodes.length === 0) {
          return new Template.BooleanNode(name)
        }

        break
      }
    }

    if (nodes.length === 1) {
      return this.addPart(nodes[0] as Template.AttrPartNode)
    }

    if (nodes.length === 0) {
      return new Template.BooleanNode(name)
    }

    return this.addPart(new Template.SparseAttrNode(name, nodes))
  }

  protected BooleanNode(name: string): Template.BooleanPartNode {
    // We know that the next token MUST be a part-token
    const part = this.predictNextToken("part-token")

    // We don't need to do anything with a boolean-attribute-end token, skip it
    this.skipIfNextToken("boolean-attribute-end")

    return this.addPart(new Template.BooleanPartNode(name, part.index))
  }

  protected SparseClassNameNode(): Template.SparseClassNameNode | Template.ClassNameNode {
    const nodes: Array<Template.ClassNameNode> = []

    while (this._lookahead !== null) {
      const token = this.findTokenOfType("text", "part-token", "className-attribute-end")

      if (token._tag === "text") {
        if (token.value.trim() === "") continue
        nodes.push(new Template.TextNode(token.value))
      } else if (token._tag === "part-token") {
        nodes.push(new Template.ClassNamePartNode(token.index))
      } else {
        break
      }
    }

    if (nodes.length === 0) {
      throw new SyntaxError("Expected at least one node in class name attribute")
    }

    if (nodes.length === 1) {
      return this.addPart(nodes[0] as Template.ClassNamePartNode)
    }

    return this.addPart(new Template.SparseClassNameNode(nodes))
  }

  protected DataNode(): Template.DataPartNode {
    const part = this.predictNextToken("part-token")

    // We don't need to do anything with a data-attribute-end token, skip it
    this.skipIfNextToken("data-attribute-end")

    return this.addPart(new Template.DataPartNode(part.index))
  }

  protected EventNode(name: string): Template.EventPartNode {
    const part = this.predictNextToken("part-token")

    // We don't need to do anything with a event-attribute-end token, skip it
    this.skipIfNextToken("event-attribute-end")

    return this.addPart(new Template.EventPartNode(name, part.index))
  }

  protected PropertyNode(name: string): Template.PropertyPartNode {
    const part = this.predictNextToken("part-token")

    // We don't need to do anything with a property-attribute-end token, skip it
    this.skipIfNextToken("property-attribute-end")

    return this.addPart(new Template.PropertyPartNode(name, part.index))
  }

  protected RefNode(): Template.RefPartNode {
    const part = this.predictNextToken("part-token")

    // We don't need to do anything with a ref-attribute-end token, skip it
    this.skipIfNextToken("ref-attribute-end")

    return this.addPart(new Template.RefPartNode(part.index))
  }

  protected TextPartNode(): Template.TextPartNode {
    const token = this.predictNextToken("part-token")

    return this.addPart(new Template.TextPartNode(token.index))
  }

  protected Children(children: Array<Template.Node> = []): Array<Template.Node> {
    let i = 0
    while (this._lookahead) {
      if (this._lookahead._tag === "closing-tag") {
        this._lookahead = this.getNextToken()
        this._skipWhitespace = true

        break
      } else if (
        this._skipWhitespace &&
        this._lookahead._tag === "text" &&
        this._lookahead.value.trim() === ""
      ) {
        this._lookahead = this.getNextToken()
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

  protected TextChildren(children: Array<Template.Text> = []): Array<Template.Text> {
    while (this._lookahead !== null) {
      const token = this.findTokenOfType("text", "part-token", "closing-tag")

      if (token._tag === "text") {
        if (token.value) children.push(new Template.TextNode(token.value))
      } else if (token._tag === `part-token`) {
        children.push(this.addPart(new Template.TextPartNode(token.index)))
      } else {
        this._skipWhitespace = true
        break
      }
    }

    return children
  }

  protected Comment(before: string): Template.CommentPartNode {
    let after = ""
    let index: number

    while (this._lookahead !== null) {
      const token = this.findTokenOfType("part-token", "text", "comment-end")

      if (token._tag === "part-token") {
        index = token.index
      } else if (token._tag === "text") {
        // @ts-expect-error - We know that the token is a text token
        if (undefined === index) {
          before += token.value
        } else {
          after += token.value
        }
      } else {
        break
      }
    }

    return this.addPart(new Template.CommentPartNode(before, after, index!))
  }

  protected findTokenOfType<T extends ReadonlyArray<Token["_tag"]>>(
    ...tokenTypes: T
  ): Extract<Token, { readonly _tag: T[number] }> {
    const token = this._lookahead

    if (token === null) {
      throw new SyntaxError(
        `Unexpected end of template. Expected one of types ${tokenTypes.join(", ")}.`
      )
    }

    for (let i = 0; i < tokenTypes.length; i++) {
      if (token._tag === tokenTypes[i]) {
        this._lookahead = this.getNextToken()

        return token as Extract<Token, { readonly _tag: T[number] }>
      }
    }

    throw new SyntaxError(
      `Unexpected token ${token._tag}. Expected one of types ${tokenTypes.join(", ")}.`
    )
  }

  protected predictNextToken<T extends Token["_tag"]>(
    type: T
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

  protected skipIfNextToken<T extends Token["_tag"]>(type: T): boolean {
    const token = this._lookahead

    if (token === null) {
      return false
    }

    if (token._tag !== type) {
      return false
    }

    this._lookahead = this.getNextToken()

    return true
  }

  protected getNextToken(): Token | null {
    const { done, value } = this._tokenStream.next()

    if (done) {
      return null
    }

    return value
  }

  protected addPart<A extends Template.PartNode | Template.SparsePartNode>(part: A): A {
    this._parts.push([part, this._stack.slice(0)])

    return part
  }

  protected addPartWithoutCurrent<A extends Template.PartNode>(part: A): A {
    const current = this._stack[this._stack.length - 1]
    this._stack.pop()
    this.addPart(part)
    this._stack.push(current)

    return part
  }
}

export const parser: Parser = globalValue(Symbol.for("@typed/template/Parser"), () => new ParserImpl())

const digestSize = 2
const multiplier = 33
const fill = 5381

/**
 * Generates a hash for an ordered list of strings. Intended for the purposes
 * of server-side rendering with hydration.
 */
export function templateHash(strings: ReadonlyArray<string>) {
  const hashes = new Uint32Array(digestSize).fill(fill)

  for (let i = 0; i < strings.length; i++) {
    const s = strings[i]

    for (let j = 0; j < s.length; j++) {
      const key = j % digestSize

      hashes[key] = (hashes[key] * multiplier) ^ s.charCodeAt(j)
    }
  }

  return btoa(String.fromCharCode(...new Uint8Array(hashes.buffer)))
}
