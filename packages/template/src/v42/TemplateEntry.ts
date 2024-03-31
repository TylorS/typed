/**
 * @since 1.0.0
 */
import type { HtmlChunk } from "./HtmlChunk.js"
import type { ParsedTemplate } from "./ParsedTemplate.js"

/**
 * @since 1.0.0
 */
export type TemplateEntry = BrowserEntry | ServerEntry

/**
 * @since 1.0.0
 */
export interface BrowserEntry {
  readonly _tag: "Browser"
  readonly template: ParsedTemplate
  readonly content: DocumentFragment
}

/**
 * @since 1.0.0
 */
export interface ServerEntry {
  readonly _tag: "Server"
  readonly template: ParsedTemplate
  readonly chunks: ReadonlyArray<HtmlChunk>
}
