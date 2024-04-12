import { PART_STRING } from "@typed/template/internal/chunks.js"
import { templateHash } from "@typed/template/v42/TemplateHash.js"
import { Chunk } from "effect"
import type { IToken } from "html5parser"
import { tokenize, TokenKind } from "html5parser"
import type { ParsedNode, PartNode, SparsePartNode } from "../ParsedTemplate.js"
import { ParsedTemplate } from "../ParsedTemplate.js"

let currentTokenIndex = 0
let tokens: Array<IToken> = []
let hash: string
let parts: Array<readonly [PartNode | SparsePartNode, Chunk.Chunk<number>]> = []
// let path: PathStack

function init(template: ReadonlyArray<string>) {
  const html = templateWithParts(template)
  hash = templateHash(template)
  tokens = tokenize(html)
  currentTokenIndex = 0
  parts = []
  // path = new PathStack()
}

export function parse(template: ReadonlyArray<string>): ParsedTemplate {
  init(template)

  return parseTemplate()
}

function parseTemplate(): ParsedTemplate {
  const nodes: Array<ParsedNode> = []
  while (currentTokenIndex < tokens.length) {
    nodes.push(parseNode())
  }

  return new ParsedTemplate(nodes, hash, parts)
}

function parseNode(): ParsedNode {
  const token = tokens[currentTokenIndex]

  switch (token.type) {
    case TokenKind.AttrValueDq:
    case TokenKind.AttrValueEq:
    case TokenKind.AttrValueNq:
    case TokenKind.AttrValueSq:
    case TokenKind.CloseTag:
    case TokenKind.Literal:
    case TokenKind.OpenTag:
    case TokenKind.OpenTagEnd:
    case TokenKind.Whitespace:
  }

  throw new Error("Unexpected token")
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

// class PathStack {
//   chunk: Chunk.Chunk<number> = Chunk.empty()
//   count = 0

//   inc() {
//     this.count++
//   }

//   push(): void {
//     this.chunk = this.toChunk()
//     this.count = 0
//   }

//   pop(): void {
//     this.count = Chunk.unsafeLast(this.chunk)
//     this.chunk = Chunk.dropRight(this.chunk, 1)
//   }

//   toChunk(): Chunk.Chunk<number> {
//     return Chunk.append(this.chunk, this.count)
//   }

//   previousChunk() {
//     return this.chunk
//   }
// }
