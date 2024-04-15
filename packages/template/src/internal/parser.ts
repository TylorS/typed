import * as Chunk from "effect/Chunk"
import { globalValue } from "effect/GlobalValue"
import * as Option from "effect/Option"
import * as Template from "../Template.js"
import type { TextChunk } from "./chunks.js"
import {
  getClosingTagName,
  getPart,
  getStrictPart,
  getTextUntilCloseBrace,
  getTextUntilPart,
  getWhitespace,
  PART_REGEX,
  PART_STRING
} from "./chunks.js"
import { convertCharacterEntities } from './character-entities.js'

// TODO: Consider ways to surface useful errors and warnings.
// TODO: Profile for performance optimization

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

const VALID_PROPS_NAMES = new Set([
  "props",
  "properties",
  // First "." will already be matched
  ".."
])

export interface Parser {
  parse(templateStrings: ReadonlyArray<string>): Template.Template
}

export function parse(templateStrings: ReadonlyArray<string>): Template.Template {
  return parser.parse(templateStrings)
}

const SPACE_REGEX = /\s/
const PART_START = "{{__PART"
const PART_END = "__}}"
const chars = {
  openBracket: "{",
  closeBracket: "}",
  underscore: "_",
  equals: "=",
  quote: `"`,
  singleQuote: "'",
  slash: "/",
  greaterThan: ">",
  lessThan: "<",
  hypen: "-",
  dot: "."
} as const

const isPartToken: TextPredicate = (input, pos) =>
  input[pos] === chars.openBracket && input.slice(pos, pos + 8) === PART_START
const isPartEndToken: TextPredicate = (input, pos) =>
  input[pos] === chars.underscore && input.slice(pos, pos + 4) === PART_END
const isElementOpenToken: TextPredicate = (input, pos) =>
  input[pos] === chars.lessThan && input[pos + 1] !== chars.slash
const isElementCloseToken: TextPredicate = (input, pos) =>
  input[pos] === chars.lessThan && input[pos + 1] === chars.slash
const isEqualsToken: TextPredicate = (input, pos) => input[pos] === chars.equals
const isQuoteToken: TextPredicate = (input, pos) => input[pos] === chars.quote
const isSingleQuoteToken: TextPredicate = (input, pos) => input[pos] === chars.singleQuote
const isWhitespaceToken: TextPredicate = (input, pos) => SPACE_REGEX.test(input[pos])
const isOpenTagEndToken: TextPredicate = (input, pos) => input[pos] === chars.greaterThan
const isSelfClosingTagEndToken: TextPredicate = (input, pos) =>
  input[pos] === chars.slash && input[pos + 1] === chars.greaterThan
const isCommentEndToken: TextPredicate = (input, pos) =>
  input[pos] === chars.hypen && input[pos + 1] === chars.hypen && input[pos + 2] === chars.greaterThan
const isGreaterThanToken: TextPredicate = (input, pos) => input[pos] === chars.greaterThan

type Context = "unknown" | "element"

type TextPredicate = (input: string, pos: number) => boolean

type LoopDecision<A> = Continue<A> | Break<A> | Skip

type Continue<A> = ["continue", A]
const Continue = <A>(a: A): Continue<A> => ["continue", a]

type Break<A> = ["break", Option.Option<A>]
const Break = <A>(a?: A): Break<A> => ["break", Option.fromNullable(a)]

type Skip = ["skip"]
const Skip: Skip = ["skip"]

type Predicates = {
  [key: string]: (char: string, pos: number) => boolean
}

const BREAK_ATTR = Break<Array<Template.Attribute>>()

const tagNameMatches = {
  whitespace: isWhitespaceToken,
  openTagEnd: isOpenTagEndToken,
  selfClosingTagEnd: isSelfClosingTagEndToken
}

const attributeMatches = {
  whitespace: isWhitespaceToken,
  equals: isEqualsToken,
  closingTag: isElementCloseToken,
  openTagEnd: isOpenTagEndToken,
  selfClosingTagEnd: isSelfClosingTagEndToken
} satisfies Predicates

const attributeValueMatches = {
  base: isWhitespaceToken,
  openTagEnd: isOpenTagEndToken,
  selfClosingTagEnd: isSelfClosingTagEndToken
} satisfies Predicates

const textChildMatches = {
  part: isPartToken,
  elementOpen: isElementOpenToken,
  elementClose: isElementCloseToken
}

export class PathStack {
  chunk: Chunk.Chunk<number> = Chunk.empty()
  count = 0

  inc() {
    this.count++
  }

  push(): void {
    this.chunk = this.toChunk()
    this.count = 0
  }

  pop(): void {
    this.count = Chunk.unsafeLast(this.chunk)
    this.chunk = Chunk.dropRight(this.chunk, 1)
  }

  toChunk(): Chunk.Chunk<number> {
    return Chunk.append(this.chunk, this.count)
  }

  previousChunk() {
    return this.chunk
  }
}

const predicatesCache = new WeakMap<Predicates, readonly [ReadonlyArray<string>, number]>()

function getPredicatesCache(predicates: Predicates) {
  const cached = predicatesCache.get(predicates)

  if (cached === undefined) {
    const keys = Object.keys(predicates)
    const length = keys.length
    const toCache = [keys, length] as const

    predicatesCache.set(predicates, toCache)

    return toCache
  } else {
    return cached
  }
}

class ParserImpl implements Parser {
  context!: Context
  input!: string
  length!: number
  parts!: Array<[Template.PartNode | Template.SparsePartNode, Chunk.Chunk<number>]>
  pos!: number
  path!: PathStack
  _skipWhitespace!: boolean

  parse(templateStrings: ReadonlyArray<string>): Template.Template {
    this.init(templateStrings)

    return this.parseTemplate(templateHash(templateStrings))
  }

  private parseTemplate(hash: string) {
    return new Template.Template(this.parseTemplateChildren(), hash, this.parts)
  }

  private parseTemplateChildren() {
    const nodes: Array<Template.Node> = []

    while (this.pos < this.length) {
      const node = this.parseNodeFromContext(this.context)

      if (node === undefined) {
        return nodes
      } else {
        nodes.push(...node)
      }
    }

    return nodes
  }

  protected parseNodeFromContext(ctx: Context): Array<Template.Node> | undefined {
    if (ctx === "element") {
      return [this.parseElement()]
    } else {
      return this.parseUnknown()
    }
  }

  private parseUnknown(): Array<Template.Node> | undefined {
    if (this.nextChar() === "<") { // Open tag / comment / self-closing tag
      return this.openBracket()
    } else {
      return this.unknownChunk()
    }
  }

  private openBracket() {
    this.consumeAmount(1)
    this.skipWhitespace()

    const nextChar = this.nextChar()

    if (nextChar === "!") { // Comment
      this.consumeAmount(1)

      const nextChar = this.nextChar()

      if (nextChar == "-") {
        this.consumeAmount(2)
        return [this.parseComment()]
      } else if (nextChar.toLowerCase() === "d") {
        return [this.parseDocType()]
      } else {
        throw new SyntaxError(`Unknown comment type ${nextChar}`)
      }
    } else if (nextChar === "/") { // Self-closing tag
      return this.selfClosingTagEnd()
    } else { // Elements
      return [this.parseElement()]
    }
  }

  private selfClosingTagEnd() {
    this.consumeAmount(1)
    this.parseTagName()
    this.skipWhitespace()
    this.consumeAmount(1)
    this.context = "unknown"
    return undefined
  }

  private unknownChunk() {
    let next: TextChunk | undefined

    if ((next = this.chunk(getPart))) { // Parts
      this._skipWhitespace = false
      return [this.addPartWithPrevious(new Template.NodePart(parseInt(next.match[2], 10)))]
    } else if ((next = this.chunk(getWhitespace))) { // Whitespace
      return this._skipWhitespace ? [] : (this.path.inc(), [new Template.TextNode(convertCharacterEntities(next.match[1]))])
    } else if ((next = this.chunk(getTextUntilCloseBrace))) { // Text and parts
      return parseTextAndParts(next.match[1], (i) => this.addPartWithPrevious(new Template.NodePart(i)))
    } else {
      this.path.inc()
      return [new Template.TextNode(convertCharacterEntities(this.nextChar()))]
    }
  }

  private parseElement(): Template.ParentNode {
    const node = this.parseElementKind()
    this.path.inc()

    this.context = "unknown"
    this._skipWhitespace = true

    return node
  }

  private parseElementKind() {
    this.context = "element"

    const [tagName, matched] = this.parseTagName()

    if (matched === "whitespace") {
      this.skipWhitespace()
    }

    if (SELF_CLOSING_TAGS.has(tagName)) {
      return this.parseSelfClosingElement(tagName)
    } else if (TEXT_ONLY_NODES_REGEX.has(tagName)) {
      return this.parseTextOnlyElement(tagName)
    } else {
      const attributes = this.parseAttributes()
      this.path.push()
      const children = this.parseTemplateChildren()
      this.path.pop()
      const element = new Template.ElementNode(tagName, attributes, children)

      this.skipWhitespace()
      this.consumeClosingTag(tagName)

      return element
    }
  }

  private consumeClosingTag(tagName: string) {
    this.chunk(getClosingTagName(tagName))
  }

  private parseSelfClosingElement(tagName: string): Template.SelfClosingElementNode {
    const attributes = this.parseAttributes()

    return new Template.SelfClosingElementNode(tagName, attributes)
  }

  private parseTextOnlyElement(tagName: string): Template.TextOnlyElement {
    const attributes = this.parseAttributes()

    this.path.push()
    const children = this.parseTextChildren(tagName)
    this.path.pop()

    return new Template.TextOnlyElement(tagName, attributes, children || [])
  }

  private parseComment(): Template.Comment {
    const text = this.parseTextUntil(isCommentEndToken)
    this.consumeAmount(3)

    const textAndParts = parseTextAndParts(text, (i) => new Template.CommentPartNode(i))

    if (textAndParts.length === 1) {
      const part = textAndParts[0]

      if (part._tag === "text") {
        return new Template.CommentNode(part.value)
      } else {
        return this.addPart(new Template.CommentPartNode(part.index))
      }
    }

    return this.addPart(new Template.SparseCommentNode(textAndParts))
  }

  private parseDocType(): Template.DocType {
    this.parseTextUntil(isGreaterThanToken)
    this.consumeAmount(1)
    this.skipWhitespace()

    return new Template.DocType("html")
  }

  private parseTagName() {
    return this.parseTextUntilMany(tagNameMatches)
  }

  private parseAttributes(): Array<Template.Attribute> {
    return this.parseArray<Template.Attribute>(() => this.parseAttribute()) || []
  }

  private parseAttribute(): LoopDecision<Array<Template.Attribute>> {
    const [name, matched] = this.parseTextUntilMany(attributeMatches)

    switch (matched) {
      case null:
        return Skip
      case "whitespace":
        this.skipWhitespace()
        return Continue([this.parseBooleanNode(name)])
      case "equals": {
        this.consumeAmount(1)
        return Continue([this.parseAttributeValue(name)])
      }
      case "openTagEnd": {
        this.consumeAmount(1)
        this.context = "unknown"
        return Break<Array<Template.Attribute>>(name ? [this.parseBooleanNode(name)] : undefined)
      }
      case "selfClosingTagEnd": {
        this.consumeAmount(2)
        this.context = "unknown"

        return BREAK_ATTR
      }
      case "closingTag": {
        this.consumeAmount(name.length)
        this.context = "unknown"

        return BREAK_ATTR
      }
    }
  }

  private parseAttributeValue(name: string): Template.Attribute {
    this.skipWhitespace()

    const nextChar = this.nextChar()

    const isDoubleQuoted = nextChar === `"`
    const isSingleQuoted = nextChar === "'"
    const isQuoted = isDoubleQuoted || isSingleQuoted

    if (isQuoted) {
      attributeValueMatches.base = isDoubleQuoted
        ? isQuoteToken
        : isSingleQuoteToken
      this.consumeAmount(1)
    } else {
      attributeValueMatches.base = isWhitespaceToken
    }

    const matched = this.parseTextUntilMany(attributeValueMatches)
    const text = matched[0]

    if (isQuoted) {
      this.consumeAmount(1)
    }

    this.skipWhitespace()

    if (text === "") {
      return this.parseBooleanNode(name)
    }

    switch (name[0]) {
      case "?":
        return this.addPart(new Template.BooleanPartNode(name.slice(1), unsafeParsePartIndex(text)))
      case ".": {
        const property = name.slice(1)

        if (property === "data") {
          return this.addPart(new Template.DataPartNode(unsafeParsePartIndex(text)))
        } else if (VALID_PROPS_NAMES.has(property)) {
          return this.addPart(new Template.PropertiesPartNode(unsafeParsePartIndex(text)))
        } else {
          return this.addPart(new Template.PropertyPartNode(property, unsafeParsePartIndex(text)))
        }
      }
      case "@":
        return this.addPart(new Template.EventPartNode(name.slice(1), unsafeParsePartIndex(text)))
      case "o": {
        if (name[1] === "n") {
          return this.addPart(new Template.EventPartNode(name.slice(2), unsafeParsePartIndex(text)))
        }
      }
    }

    const lowerCaseName = name.toLowerCase()

    if (lowerCaseName === "ref") {
      return this.addPart(new Template.RefPartNode(unsafeParsePartIndex(text)))
    }

    const isClass = lowerCaseName === "class" || lowerCaseName === "classname"
    const textAndParts = parseTextAndParts(
      text,
      (i) => isClass ? new Template.ClassNamePartNode(i) : new Template.AttrPartNode(name, i)
    )

    if (textAndParts.length === 1) {
      const part = textAndParts[0]

      if (part._tag === "text") {
        return new Template.AttributeNode(name, part.value)
      } else {
        return this.addPart(
          isClass ? new Template.ClassNamePartNode(part.index) : new Template.AttrPartNode(name, part.index)
        )
      }
    }

    return this.addPart(
      isClass
        ? new Template.SparseClassNameNode(
          // We don't need empty text spaces to generate the correct class namesq
          textAndParts.filter((t) => t._tag === "text" ? t.value.trim().length > 0 : true) as any
        )
        : new Template.SparseAttrNode(name, textAndParts as any)
    )
  }

  private parseBooleanNode(name: string) {
    if (isSpread(name)) {
      return this.addPart(new Template.PropertiesPartNode(unsafeParsePartIndex(name.slice(3))))
    } else {
      return new Template.BooleanNode(name)
    }
  }

  private parseTextChildren(tagName: string): Array<Template.Text> | null {
    return this.parseArray(() => this.parseTextChild(tagName))
  }

  private parseTextChild(tagName: string): LoopDecision<Array<Template.Text>> {
    const [parsed, matched] = this.parseTextUntilMany(textChildMatches)
    const text = parsed.trim()

    switch (matched) {
      case null:
        return Skip
      case "part": {
        this.consumeAmount(8)
        const part = this.parsePartToken((i) => this.addPartWithPrevious(new Template.TextPartNode(i)))

        return text === "" ? Continue([part]) : Continue([new Template.TextNode(convertCharacterEntities(text)), part])
      }
      case "elementClose": {
        this.consumeClosingTag(tagName)
        return Break(
          text ? [new Template.TextNode(convertCharacterEntities(text))] : undefined
        )
      }
      case "elementOpen": // In this case we make the assumption that you forgot to close this element
        return Break(
          text ? [new Template.TextNode(convertCharacterEntities(text))] : undefined
        )
    }
  }

  private parsePartToken<T extends Template.PartNode>(f: (index: number) => T): T {
    const text = this.parseTextUntil(isPartEndToken)
    const index = Number(text)

    this.consumeAmount(4)

    return f(index)
  }

  private parseTextUntil(predicate: (char: string, pos: number) => boolean) {
    const start = this.pos
    let i = 0
    while (this.pos < this.length) {
      if (predicate(this.input, this.pos)) {
        break
      }

      i++
      this.consumeAmount(1)
    }

    return this.input.slice(start, start + i)
  }

  private parseTextUntilMany<const T extends Predicates>(
    predicates: T
  ): readonly [string, keyof T] | readonly [string, null] {
    const [keys, length] = getPredicatesCache(predicates)

    let text = ""
    let i = 0

    while (this.pos < this.length) {
      const char = this.nextChar()

      for (; i < length; i++) {
        if (predicates[keys[i]](this.input, this.pos)) {
          return [text, keys[i]] as const
        }
      }
      i = 0

      text += char
      this.consumeAmount(1)
    }

    return [text, null] as const
  }

  private parseArray<T>(parser: () => LoopDecision<Array<T>>): Array<T> | null {
    const children: Array<T> = []

    while (this.pos < this.length) {
      const [decision, value] = parser()

      if (decision === "continue") {
        children.push(...value)
      } else if (decision === "break") {
        if (Option.isSome(value)) {
          children.push(...value.value)
        }

        return children
      } else {
        return null
      }
    }

    return children
  }

  private skipWhitespace() {
    while (this.pos < this.length) {
      const char = this.nextChar()

      if (SPACE_REGEX.test(char)) {
        this.consumeAmount(1)
      } else {
        break
      }
    }
  }

  private nextChar() {
    return this.input[this.pos]
  }

  private consumeAmount(amount: number) {
    this.pos += amount
  }

  private chunk(f: (str: string, pos: number) => TextChunk | undefined): TextChunk | undefined {
    const chunk = f(this.input, this.pos)

    if (chunk) {
      this.pos += chunk.length
    }

    return chunk
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

  private init(templateStrings: ReadonlyArray<string>): void {
    this.context = "unknown"
    this.input = templateWithParts(templateStrings)
    this.length = this.input.length
    this.parts = []
    this.pos = 0
    this.path = new PathStack()
    this._skipWhitespace = true
  }
}

export function templateWithParts(template: ReadonlyArray<string>): string {
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

function unsafeParsePartIndex(text: string): number {
  const next = getStrictPart(text, 0)

  if (!next) {
    throw new SyntaxError(`Could not parse part index from ${text}`)
  }

  return parseInt(next.match[2], 10)
}

export function parseTextAndParts<T>(s: string, f: (index: number) => T): Array<Template.TextNode | T> {
  let next: TextChunk | undefined
  let pos: number = 0
  const out: Array<Template.TextNode | T> = []

  if (!PART_REGEX.test(s)) {
    return [new Template.TextNode(convertCharacterEntities(s))]
  }

  while (pos < s.length) {
    if ((next = getPart(s, pos))) {
      out.push(f(parseInt(next.match[2], 10)))
      pos += next.length
    } else if ((next = getTextUntilPart(s, pos))) {
      out.push(new Template.TextNode(convertCharacterEntities(next.match[1])))

      pos += next.length
    } else {
      break
    }
  }

  if (pos < s.length) {
    out.push(new Template.TextNode(convertCharacterEntities(s.slice(pos))))
  }

  return out
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
    const string = strings[i]

    for (let j = 0; j < string.length; j++) {
      const key = j % digestSize
      hashes[key] = hashes[key] * multiplier + string.charCodeAt(j)
    }
  }

  return btoa(String.fromCharCode(...new Uint8Array(hashes.buffer)))
}
function isSpread(str: string) {
  return str[0] === chars.dot && str[1] === chars.dot && str[2] === chars.dot
}
