// import { tokenize, TokenKind, IToken } from 'html5parser'
// import { PART_STRING } from './chunks.js'
// import { PartNode, SparsePartNode, Template } from '../Template.js'
// import { templateHash } from './parser'
// import { Chunk } from 'effect'

// /**
//  * @since 1.0.0
//  */
// export const TEXT_ONLY_NODES_REGEX = new Set([
//   "textarea",
//   "script",
//   "style",
//   "title",
//   "plaintext",
//   "xmp"
// ])

// /**
//  * @since 1.0.0
//  */
// export const SELF_CLOSING_TAGS = new Set([
//   "area",
//   "base",
//   "br",
//   "col",
//   "command",
//   "embed",
//   "hr",
//   "img",
//   "input",
//   "keygen",
//   "link",
//   "meta",
//   "param",
//   "source",
//   "track",
//   "wbr"
// ])


// class Parser {
//   protected html!: string 
//   protected tokens!: IToken[]
//   protected index: number = 0
//   protected parts!: Array<readonly [part: PartNode | SparsePartNode, path: Chunk.Chunk<number>]>
  
//   parse(templateStrings: ReadonlyArray<string>): Template { 
//     this.init(templateStrings)
//     const hash = templateHash(templateStrings)
//     return new Template(this.parseTemplateChildren(), hash, this.parts)
//   }

//   private init(templateStrings: ReadonlyArray<string>) { 
//     this.html = templateWithParts(templateStrings)
//     this.tokens = tokenize(this.html)
//     this.parts = []
//   }

//   private peek(): IToken | undefined { 
//     return this.tokens[this.index]
//   }

//   private consumeNextTokenOfKind(kind: TokenKind) { 
//     const token = this.tokens[this.index]
//     if (token.type !== kind) { 
//       throw new Error(`Expected ${kind} but got ${token.type}`)
//     }
//     this.index++
//     return token
//   }

//   private parseTemplateChildren(): Array<Node> { 
//     const nodes: Array<Node> = []

//     while (this.index < this.tokens.length) { 
//       const token = this.peek()
//       if (token === undefined) { 
//         break
//       }

//       if (token.type === TokenKind.Literal) { 
//         nodes.push(this.parseTextNode())
//       } else if (token.type === TokenKind.OpenTag) { 
//         nodes.push(this.parseElementNode())
//       } else { 
//         throw new Error(`Unexpected token ${token.type}`)
//       }
//     }

//     return nodes
//   }
// }

// const parser = new Parser()

// export function parse(template: ReadonlyArray<string>): Template { 
//  return parser.parse(template)
// }


// function templateWithParts(template: ReadonlyArray<string>): string {
//   const length = template.length
//   const lastIndex = length - 1

//   let output = ""

//   for (let i = 0; i < length; i++) {
//     const str = template[i]

//     if (i === lastIndex) {
//       output += str
//     } else {
//       output += str + PART_STRING(i)
//     }
//   }

//   return output
// }
