import * as tokenizer from "@typed/template/internal/tokenizer"
import type { Token } from "@typed/template/Token"

export const tokenize: (template: ReadonlyArray<string>) => Iterable<Token> = tokenizer.tokenize
