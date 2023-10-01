import {
  getAllTextUntilElementClose,
  getAttributeWithoutQuotes,
  getAttributeWithQuotes,
  getBooleanAttribute,
  getClosingTag,
  getComment,
  getOpeningTag,
  getOpeningTagEnd,
  getPart,
  getSelfClosingTagEnd,
  getTextUntilCloseBrace,
  getTextUntilPart,
  getWhitespace,
  PART_REGEX,
  PART_STRING
} from "@typed/template/internal/chunks"
import type { Chunk } from "@typed/template/internal/chunks"
import * as Token from "@typed/template/Token"

export function tokenize(template: ReadonlyArray<string>): Iterable<Token.Token> {
  return new Tokenizer(template)
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

class Tokenizer implements Iterable<Token.Token> {
  protected input: string = ""
  protected pos: number = 0
  protected context: "text" | "element" | "self-closing" | "text-only" = "text"
  protected currentTag: Stack<string> | null = null

  constructor(private readonly template: ReadonlyArray<string>) {}

  *[Symbol.iterator](): Generator<Token.Token> {
    this.init()

    // eslint-disable-next-line no-constant-condition
    while (this.pos < this.input.length) {
      switch (this.context) {
        case "element":
          yield* this.nextElementToken()
          break
        case "self-closing":
          yield* this.nextSelfClosingToken()
          break
        case "text-only":
          yield* this.nextTextOnlyToken()
          break
        default:
          yield* this.nextTextToken()
      }
    }
  }

  private init(): void {
    // Convert our template into a string for easier tokenization
    // Remove any whitespace at the beginning or end of the template since we don't care about it.
    this.input = this.template.length === 1 ? this.template[0] : templateWithParts(this.template)
  }

  private *nextTextToken(): Generator<Token.Token> {
    const char = this.nextChar()
    const isOpenBracket = char === "<"

    let next: Chunk | undefined

    if (isOpenBracket && (next = this.chunk(getOpeningTag))) {
      const name = next.match[2]

      this.pushTag(name)
      this.context = Token.SELF_CLOSING_TAGS.has(name)
        ? "self-closing"
        : Token.TEXT_ONLY_NODES_REGEX.test(name)
        ? "text-only"
        : "element"

      yield new Token.OpeningTagToken(name)
    } else if (isOpenBracket && (next = this.chunk(getClosingTag))) {
      yield new Token.ClosingTagToken(next.match[3])
      this.popTag()
    } else if (isOpenBracket && (next = this.chunk(getComment))) {
      yield* this.parseComment(next.match[2])
    } else if ((next = this.chunk(getPart))) {
      yield new Token.PartToken(parseInt(next.match[2], 10))
    } else if ((next = this.chunk(getWhitespace))) {
      yield new Token.TextToken(next.match[1])
    } else if ((next = this.chunk(getTextUntilCloseBrace))) {
      yield* parseTextAndParts(next.match[1])
    } else {
      yield new Token.TextToken(this.takeNextChar())
    }
  }

  private *nextElementToken(): Generator<Token.Token> {
    let next: Chunk | undefined

    if ((next = this.chunk(getAttributeWithQuotes))) {
      yield* this.parseAttribute(next.match[2], next.match[4])
    } else if ((next = this.chunk(getAttributeWithoutQuotes))) {
      yield* this.parseAttribute(next.match[2], next.match[4])
    } else if ((next = this.chunk(getOpeningTagEnd))) {
      this.context = "text"

      yield new Token.OpeningTagEndToken(this.currentTag!.value)
    } else if ((next = this.chunk(getSelfClosingTagEnd))) {
      yield new Token.OpeningTagEndToken(this.currentTag!.value, false)
      yield new Token.ClosingTagToken(this.currentTag!.value)
      this.popTag()
      this.context = "text"
    } else if ((next = this.chunk(getBooleanAttribute))) {
      yield new Token.BooleanAttributeToken(next.match[2])
    } else if ((next = this.chunk(getWhitespace))) {
      // Continue
    } else {
      this.invalidTemplate()
    }
  }

  private *nextSelfClosingToken(): Generator<Token.Token> {
    let next: Chunk | undefined

    if ((next = this.chunk(getAttributeWithQuotes))) {
      yield* this.parseAttribute(next.match[2], next.match[4])
    } else if ((next = this.chunk(getAttributeWithoutQuotes))) {
      yield* this.parseAttribute(next.match[2], next.match[4])
    } else if ((next = this.chunk(getSelfClosingTagEnd))) {
      yield new Token.OpeningTagEndToken(this.currentTag!.value, true)
      this.popTag()
      this.context = "text"
    } else if ((next = this.chunk(getBooleanAttribute))) {
      yield new Token.BooleanAttributeToken(next.match[2])
    } else {
      this.invalidTemplate()
    }
  }

  private *nextTextOnlyToken(): Generator<Token.Token> {
    let next: Chunk | undefined

    if ((next = this.chunk(getAttributeWithQuotes))) {
      yield* this.parseAttribute(next.match[2], next.match[4])
    } else if ((next = this.chunk(getAttributeWithoutQuotes))) {
      yield* this.parseAttribute(next.match[2], next.match[4])
    } else if ((next = this.chunk(getOpeningTagEnd))) {
      yield new Token.OpeningTagEndToken(this.currentTag!.value)
    } else if ((next = this.chunk(getClosingTag))) {
      yield new Token.ClosingTagToken(next.match[3])
      this.context = "text"
    } else if ((next = this.chunk(getAllTextUntilElementClose(this.currentTag!.value)))) {
      const text = next.match[1]

      if (PART_REGEX.test(text)) {
        yield* parseTextAndParts(text)
      } else {
        yield new Token.TextToken(text)
      }
      this.context = "text"
    } else {
      this.invalidTemplate()
    }
  }

  private *parseComment(comment: string): Generator<Token.Token> {
    const parts = Array.from(parseTextAndParts(comment))

    if (parts.length === 1 && parts[0]._tag === "text") {
      yield new Token.CommentToken(parts[0].value)
      return
    }

    yield new Token.CommentStartToken("<!--")

    for (const part of parts) {
      yield part
    }

    yield new Token.CommentEndToken("-->")
  }

  private *parseAttribute(name: string, value: string) {
    const parts = Array.from(parseTextAndParts(value))

    if (value === "") {
      yield new Token.BooleanAttributeToken(name)
      return
    }

    if (parts.length === 1 && parts[0]._tag === "text") {
      yield getAttributeToken(name, value)
      return
    }

    yield getAttributeTokenPartial(name, "start")

    for (const part of parts) {
      yield part
    }

    yield getAttributeTokenPartial(name, "end")
  }

  private nextChar(): string {
    return this.input.charAt(this.pos)
  }

  private takeNextChar(): string {
    const text = this.input.substring(this.pos, this.pos + 1)
    this.pos += 1

    return text
  }

  private chunk(f: (str: string, pos: number) => Chunk | undefined): Chunk | undefined {
    const chunk = f(this.input, this.pos)

    if (chunk) {
      this.pos += chunk.length
    }

    return chunk
  }

  private pushTag(name: string): void {
    this.currentTag = new Stack(name, this.currentTag)
  }

  private popTag(): void {
    if (this.currentTag) {
      this.currentTag = this.currentTag.previous
    }
  }

  protected invalidTemplate() {
    let message = `Invalid template ${this.input}`
    message += "\n\nFrom:\n\n"
    message += this.input.substring(this.pos)

    throw new SyntaxError(message)
  }
}

class Stack<A> {
  constructor(
    readonly value: A,
    readonly previous: Stack<A> | null
  ) {}
}

function* parseTextAndParts(s: string): Generator<Token.TextToken | Token.PartToken> {
  let next: Chunk | undefined
  let pos: number = 0

  while (pos < s.length) {
    if ((next = getPart(s, pos))) {
      yield new Token.PartToken(parseInt(next.match[2], 10))
      pos += next.length
    } else if ((next = getTextUntilPart(s, pos))) {
      yield new Token.TextToken(next.match[1])

      pos += next.length
    } else {
      yield new Token.TextToken(s.substring(pos))

      break
    }
  }
}

function getAttributeTokenPartial(name: string, ctx: "start" | "end") {
  switch (name[0]) {
    case "?":
      return ctx === "start"
        ? new Token.BooleanAttributeStartToken(name.substring(1))
        : new Token.BooleanAttributeEndToken(name.substring(1))
    case ".": {
      const propertyName = name.substring(1)

      switch (propertyName) {
        case "data":
          return ctx === "start"
            ? new Token.DataAttributeStartToken()
            : new Token.DataAttributeEndToken()
        default:
          return ctx === "start"
            ? new Token.PropertyAttributeStartToken(propertyName)
            : new Token.PropertyAttributeEndToken(propertyName)
      }
    }
    case "@":
      return ctx === "start"
        ? new Token.EventAttributeStartToken(name.substring(1))
        : new Token.EventAttributeEndToken(name.substring(1))
    case "o":
      if (name[1] === "n") {
        return ctx === "start"
          ? new Token.EventAttributeStartToken(name.substring(2))
          : new Token.EventAttributeEndToken(name.substring(2))
      }
  }

  switch (name.toLowerCase()) {
    case "class":
    case "classname":
      return ctx === "start"
        ? new Token.ClassNameAttributeStartToken()
        : new Token.ClassNameAttributeEndToken()
    case "ref":
      return ctx === "start" ? new Token.RefAttributeStartToken() : new Token.RefAttributeEndToken()
  }

  return ctx === "start" ? new Token.AttributeStartToken(name) : new Token.AttributeEndToken(name)
}

function getAttributeToken(name: string, value: string) {
  if (name[0] === "?") {
    return new Token.BooleanAttributeToken(name.substring(1))
  }

  return new Token.AttributeToken(name, value)
}