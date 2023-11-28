/**
 * @since 1.0.0
 */
import * as tokenizer from "./internal/tokenizer.js"
import type { Token } from "./Token.js"

/**
 * @since 1.0.0
 */
export const tokenize: (template: ReadonlyArray<string>) => Iterable<Token> = tokenizer.tokenize
