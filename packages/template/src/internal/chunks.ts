export type Chunk = {
  readonly length: number
  readonly match: RegExpExecArray
}

export const PART_STRING = (i: number) => `{{__PART${i}__}}`

export const PART_REGEX = /(\{\{__PART(\d+)__\}\})/g

export const getPart = chunker(PART_REGEX)

export const getOpeningTag = chunker(/(\s?<(([a-z0-9-]+:)?[a-z0-9-]+))\s?/gi)

export const getOpeningTagEnd = chunker(/((\s+)?>)/gi)

// Matches the closing of a tag
// Allows for whitespace between the tag name and the closing brackets
// allows for namespaced tags
export const getClosingTag = chunker(/(\s?<\/(\s+)?(([a-z0-9-]+:)?[a-z0-9-]+)(\s+)?>)/gi)

export const getSelfClosingTagEnd = chunker(/(\s+\/>)/gi)

export const getComment = chunker(/(<!--(.+)-->)/gu)

// Get all the text that does not lead to a Part
// Uses a negative lookahead to ensure to match all text that does not lead to a Part
export const getTextUntilPart = chunker(/((?:(?!{{__PART\d+__}}).)*)/gi)

// Get all the text that does not lead to a Part
// Uses a negative lookahead to ensure to match all text that does not lead to a brace
export const getTextUntilCloseBrace = chunker(/((?:(?!<).)*)/gi)

// Get an attribute and its value within quotes
export const getAttributeWithQuotes = chunker(
  /(\s+(([?.@a-z0-9\-_]+:)?[?.@a-z0-9\-_]+)="([^"]*)")/gi
)

// Get an attribute and its value without quotes up to the next whitespace
export const getAttributeWithoutQuotes = chunker(
  /(\s+(([?.@a-z0-9\-_]+:)?[?.@a-z0-9\-_]+)=([^\s>]*))/gi
)

// Get a boolean attribute up to the next whitespace

export const getBooleanAttribute = chunker(/(\s+(([?.@a-z0-9\-_]+:)?[?.@a-z0-9\-_]+)(?=[\s>]))/gi)

// Takes all text content until </ tagName > with optional whitespace
export const getAllTextUntilElementClose = (tagName: string) => {
  return chunker(new RegExp(`([^<]+)(\\s*<\\/${tagName}\\s*>)`, "gi"))
}

export const getWhitespace = chunker(/(\s+)/g)

function chunker(regex: RegExp) {
  return (str: string, pos: number): Chunk | undefined => {
    regex.lastIndex = pos
    const match = regex.exec(str)
    regex.lastIndex = 0

    if (!match || match.index !== pos) {
      return
    } else {
      return {
        length: match[1].length,
        match
      } as const
    }
  }
}
