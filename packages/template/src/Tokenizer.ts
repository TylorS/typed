import * as tokenizer from "./internal/tokenizer"
import type { Token } from "./Token"

export const tokenize: (template: ReadonlyArray<string>) => Iterable<Token> = tokenizer.tokenize
