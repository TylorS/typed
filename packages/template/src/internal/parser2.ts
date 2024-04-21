/* eslint-disable @typescript-eslint/consistent-type-imports */
import { Chunk } from "effect"
import type { IToken } from "html5parser"
import { tokenize } from "html5parser"
import * as Template from "../Template.js"
import { convertCharacterEntities } from "./character-entities.js"
import { PART_REGEX, PART_STRING } from "./chunks.js"
import { PathStack, templateHash, unsafeParsePartIndex } from "./parser"
import { keyToPartType } from "./utils.js"

export { templateHash } from "./parser"

// Unfortunately these are compiled as `const enum` and cannot be exported
enum TokenKind {
  Literal = 0 as import("html5parser").TokenKind.Literal,
  OpenTag = 1 as import("html5parser").TokenKind.OpenTag,
  OpenTagEnd = 2 as import("html5parser").TokenKind.OpenTagEnd,
  CloseTag = 3 as import("html5parser").TokenKind.CloseTag,
  Whitespace = 4 as import("html5parser").TokenKind.Whitespace,
  AttrValueEq = 5 as import("html5parser").TokenKind.AttrValueEq,
  AttrValueNq = 6 as import("html5parser").TokenKind.AttrValueNq,
  AttrValueSq = 7 as import("html5parser").TokenKind.AttrValueSq,
  AttrValueDq = 8 as import("html5parser").TokenKind.AttrValueDq
}

/**
 * @since 1.0.0
 */
export const TEXT_ONLY_NODES_REGEX = new Set([
  "textarea",
  "script",
  "style",
  "title",
  "plaintext",
  "xmp"
])

/**
 * @since 1.0.0
 */
export const SELF_CLOSING_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "command",
  "embed",
  "hr",
  "img",
  "input",
  "keygen",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr"
])

class Parser {
  protected html!: string
  protected tokens!: Array<IToken>
  protected index: number = 0
  protected parts!: Array<readonly [part: Template.PartNode | Template.SparsePartNode, path: Chunk.Chunk<number>]>
  protected path!: PathStack

  parse(templateStrings: ReadonlyArray<string>): Template.Template {
    this.init(templateStrings)
    const hash = templateHash(templateStrings)
    return new Template.Template(this.parseNodes(), hash, this.parts)
  }

  private init(templateStrings: ReadonlyArray<string>) {
    this.html = templateWithParts(templateStrings)
    this.tokens = tokenize(this.html)
    this.index = 0
    this.parts = []
    this.path = new PathStack()
  }

  private peek(): IToken | undefined {
    return this.tokens[this.index]
  }

  private consumeNextTokenOfKind(kind: TokenKind) {
    const token = this.tokens[this.index]
    // @ts-expect-error
    if (token.type !== kind) {
      throw new Error(`Expected ${kind} but got ${token.type}`)
    }
    this.index++
    return token
  }

  private consumeWhitespace() {
    // @ts-expect-error
    while (this.tokens[this.index]?.type === TokenKind.Whitespace) {
      this.index++
    }
  }

  private consumeNextTokenOfKinds(...kinds: Array<TokenKind>) {
    const token = this.tokens[this.index]
    if (!kinds.includes(token.type as any)) {
      throw new Error(`Expected ${kinds.join(" or ")} but got ${token.type}`)
    }
    this.index++
    return token
  }

  private parseNodes(): Array<Template.Node> {
    const nodes: Array<Template.Node> = []

    while (this.index < this.tokens.length) {
      const token = this.peek()
      if (token === undefined) {
        break
      }

      // @ts-expect-error
      if (token.type === TokenKind.Literal) {
        nodes.push(...this.parseNodeParts())
        // @ts-expect-error
      } else if (token.type === TokenKind.OpenTag) {
        nodes.push(this.parseOpenTag())
        this.path.inc()
        // @ts-expect-error
      } else if (token.type === TokenKind.CloseTag) {
        this.index++
        this.consumeWhitespace()
        break
        // @ts-expect-error
      } else if (token.type === TokenKind.Whitespace) {
        if (nodes.length > 0) {
          this.path.inc()
          nodes.push(new Template.TextNode(token.value))
        }
        this.index++
      } else {
        throw new Error(`Unexpected token ${token.type}`)
      }
    }

    return nodes
  }

  private parseNodeParts(): Array<Template.Node> {
    const token = this.consumeNextTokenOfKind(TokenKind.Literal)
    const parts = parseTextAndParts(
      token.value,
      (index) => this.addPartWithPrevious(new Template.NodePart(index)),
      true
    )

    return parts
  }

  private parseOpenTag(): Template.Node {
    const { value: name } = this.consumeNextTokenOfKind(TokenKind.OpenTag)

    // Comments
    if (name === "!--") {
      const node = this.parseCommentNode()
      this.path.inc()

      return node
    }

    // Doctype
    if (name === "!doctype") {
      this.consumeWhitespace()
      const next = this.peek()
      // @ts-expect-error
      if (next && next.type === TokenKind.AttrValueNq) {
        this.index++
        this.consumeWhitespace()
        this.consumeNextTokenOfKind(TokenKind.OpenTagEnd)
        return new Template.DocType(next.value)
      }
      this.consumeNextTokenOfKind(TokenKind.OpenTagEnd)
      return new Template.DocType("html")
    }

    // Self-closing tags
    if (SELF_CLOSING_TAGS.has(name)) {
      return this.parseSelfClosingElementNode(name)
    }

    // Text-only nodes, e.g. <script>, <style>, <textarea>
    if (TEXT_ONLY_NODES_REGEX.has(name)) {
      return this.parseTextOnlyElementNode(name)
    }

    const next = this.peek()

    if (next === undefined) {
      throw new Error(`Unexpected end of template at element node ${name}`)
    }

    // @ts-expect-error No Attributes
    if (next.type === TokenKind.OpenTagEnd) {
      this.index++
      this.path.push()
      const children = this.parseNodes()
      this.path.pop()

      return new Template.ElementNode(name, [], children)
    }

    this.consumeWhitespace()

    const attributes = this.parseAttributes()
    this.path.push()
    const children = this.parseNodes()
    this.path.pop()

    return new Template.ElementNode(name, attributes, children)
  }

  private parseCommentNode(): Template.Node {
    const { value } = this.consumeNextTokenOfKind(TokenKind.Literal)
    this.consumeNextTokenOfKind(TokenKind.OpenTagEnd)

    const parts = parseTextAndParts(
      value,
      (index) => new Template.CommentPartNode(index),
      false
    )

    if (parts.length === 1) {
      if (parts[0]._tag === "text") {
        return new Template.CommentNode(parts[0].value)
      } else {
        return this.addPart(parts[0])
      }
    }

    return this.addPart(new Template.SparseCommentNode(parts))
  }

  private parseSelfClosingElementNode(name: string): Template.Node {
    return new Template.SelfClosingElementNode(name, this.parseAttributes())
  }

  private parseTextOnlyElementNode(name: string): Template.Node {
    const attributes = this.parseAttributes()
    this.path.push()
    const children = this.parseTextOnlyChildren()
    this.path.pop()

    return new Template.TextOnlyElement(name, attributes, children)
  }

  private parseAttributes(): Array<Template.Attribute> {
    const attributes: Array<Template.Attribute> = []

    this.consumeWhitespace()

    while (this.index < this.tokens.length) {
      const token = this.peek()

      if (token === undefined) {
        throw new Error("Unexpected end of template in attributes")
      }

      if (
        // @ts-expect-error
        token.type === TokenKind.Whitespace
      ) {
        this.index++
        continue
      }

      if (
        // @ts-expect-error
        token.type === TokenKind.OpenTagEnd
      ) {
        this.index++
        break
      }

      if (
        // @ts-expect-error
        token.type === TokenKind.CloseTag
      ) {
        break
      }

      const [shouldContinue, attr] = this.parseAttribute()

      attributes.push(attr)

      if (shouldContinue === false) {
        break
      }
    }

    return attributes
  }

  private parseAttribute(): [boolean, Template.Attribute] {
    const { value: rawName } = this.consumeNextTokenOfKind(TokenKind.AttrValueNq)

    if (rawName.startsWith("...")) {
      return [true, this.addPart(new Template.PropertiesPartNode(unsafeParsePartIndex(rawName.slice(3))))]
    }

    const [match, name] = keyToPartType(rawName)
    const next = this.peek()

    // @ts-expect-error
    if (next.type === TokenKind.AttrValueEq) {
      this.consumeNextTokenOfKind(TokenKind.AttrValueEq)
      const { type, value: rawValue } = this.consumeNextTokenOfKinds(
        TokenKind.AttrValueDq,
        TokenKind.AttrValueSq,
        TokenKind.AttrValueNq
      )

      // @ts-expect-error
      const value = type === TokenKind.AttrValueNq ? rawValue : rawValue.slice(1, -1)

      switch (match) {
        case "attr": {
          const parts = parseTextAndParts(value, (index) => new Template.AttrPartNode(name, index), false)
          if (parts.length === 1) {
            if (parts[0]._tag === "text") {
              return [true, new Template.AttributeNode(name, parts[0].value)]
            } else {
              return [true, this.addPart(new Template.AttrPartNode(name, parts[0].index))]
            }
          }

          return [true, this.addPart(new Template.SparseAttrNode(name, parts))]
        }
        case "boolean": {
          const parts = parseTextAndParts(value, (index) => new Template.BooleanPartNode(name, index), false)
          if (parts.length === 1) {
            if (parts[0]._tag === "text") {
              return [true, new Template.BooleanNode(name)]
            } else {
              return [true, this.addPart(parts[0])]
            }
          }

          throw new Error("Boolean attributes cannot have multiple parts")
        }
        case "class": {
          const parts = parseTextAndParts(value, (index) => new Template.ClassNamePartNode(index), false)
          if (parts.length === 1) {
            if (parts[0]._tag === "text") {
              return [true, new Template.AttributeNode("class", parts[0].value.trim())]
            } else {
              return [true, this.addPart(parts[0])]
            }
          }

          return [true, this.addPart(new Template.SparseClassNameNode(parts))]
        }
        case "data":
          return [true, this.addPart(new Template.DataPartNode(unsafeParsePartIndex(value)))]
        case "event":
          return [true, this.addPart(new Template.EventPartNode(name, unsafeParsePartIndex(value)))]
        case "properties":
          return [true, this.addPart(new Template.PropertiesPartNode(unsafeParsePartIndex(value)))]
        case "property":
          return [true, this.addPart(new Template.PropertyPartNode(name, unsafeParsePartIndex(value)))]
        case "ref":
          return [true, this.addPart(new Template.RefPartNode(unsafeParsePartIndex(value)))]
      }
      // @ts-expect-error
    } else if (next.type === TokenKind.Whitespace) {
      this.index++
      return [true, new Template.BooleanNode(name!)]
      // @ts-expect-error
    } else if (next.type === TokenKind.OpenTagEnd) {
      this.index++
      this.consumeWhitespace()
      return [false, new Template.BooleanNode(name!)]
    } else {
      if (next === undefined) {
        throw new Error(`Unexpected end of template at attribute ${name}`)
      }
      throw new Error(`Unexpected token ${TokenKind[next.type]} in place of attribute`)
    }
  }

  private parseTextOnlyChildren(): Array<Template.Text> {
    const { type, value } = this.consumeNextTokenOfKinds(TokenKind.Literal, TokenKind.CloseTag)

    // @ts-expect-error
    if (type === TokenKind.Literal) {
      this.consumeNextTokenOfKind(TokenKind.CloseTag)
      return parseTextAndParts(value, (index) => this.addPartWithPrevious(new Template.TextPartNode(index)), true)
    }
    this.consumeWhitespace()
    return []
  }

  private addPart<T extends Template.PartNode | Template.SparsePartNode>(part: T): T {
    this.parts.push([part, this.path.toChunk()])
    return part
  }

  private addPartWithPrevious<T extends Template.PartNode | Template.SparsePartNode>(part: T): T {
    this.parts.push([part, this.path.previousChunk()])
    this.path.inc() // Nodes will be inserted as a comment
    return part
  }
}

const parser = new Parser()

export function parse(template: ReadonlyArray<string>): Template.Template {
  return parser.parse(template)
}

function templateWithParts(template: ReadonlyArray<string>): string {
  const length = template.length
  const lastIndex = length - 1

  let output = ""

  for (let i = 0; i < length; i++) {
    const str = template[i]

    if (i === lastIndex) {
      output += str
    } else {
      output += str + PART_STRING(i)
    }
  }

  return output
}

function parseTextAndParts<T>(
  s: string,
  f: (index: number) => T,
  skipWhitespace: boolean
): Array<Template.TextNode | T> {
  const out: Array<Template.TextNode | T> = []
  const parts = (skipWhitespace ? s.trim() : s).split(PART_REGEX)
  const last = parts.length - 2

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]

    if (part[0] === "{" && part[1] === "{") {
      out.push(f(parseInt(parts[++i], 10)))
      // If we encounter a part, we should not skip whitespace
      skipWhitespace = i === last
    } else if (((skipWhitespace || i === 0) ? part.trim() : part) === "") {
      continue
    } else {
      out.push(new Template.TextNode(convertCharacterEntities(part)))
    }
  }

  return out
}
