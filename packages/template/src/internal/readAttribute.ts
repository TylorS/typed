const PATTERN = /(\s*([^>\s]*))/g
const QUOTES = new Set(`"'`)

export type AttrChunk = {
  readonly length: number
  readonly value: string
}

/**
 * Extract an attribute from a chunk of text.
 */
export default function readAttribute(text: string, pos: number): AttrChunk | null {
  const quote = text.charAt(pos)
  const pos1 = pos + 1

  if (QUOTES.has(quote)) {
    const nextQuote = text.indexOf(quote, pos1)
    if (nextQuote === -1) {
      return null
    } else {
      return { length: nextQuote - pos + 1, value: text.substring(pos1, nextQuote) }
    }
  } else {
    PATTERN.lastIndex = pos
    const match = PATTERN.exec(text) || []
    return { length: match[1].length, value: match[2] }
  }
}
