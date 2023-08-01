/**
 * Opening tag chunker function.
 */
export const getOpeningTag = chunker(/(<(([a-z0-9-]+:)?[a-z0-9-]+))/gi)

/**
 * Text node chunker function.
 */
export const getText = chunker(/([^<]+)/g)

/**
 * Text node chunker function.
 */
export const getAttributeTextEnd = chunker(/([^"]+)/g)

/**
 * Closing tag chunker function.
 */
export const getClosingTag = chunker(/(<\/(([a-z0-9-]+:)?[a-z0-9-]+)>)/gi)

/**
 * Comment content chunker function.
 */
export const getComment = chunker(/((<!--)(.+)(-->))/g)

/**
 * Comment open chunker function.
 */
export const getCommentOpen = chunker(/((<!--)(.+))/g)

/**
 * Comment content chunker function.
 */
export const getCommentEnd = chunker(/((.+)-->)/g)

/**
 * Script content chunker function.
 */
export const getScript = chunker(/(([\s\S]*?)<\/script>)/g)

/**
 * Style element chunker function.
 */
export const getStyle = chunker(/(([\s\S]*?)<\/style>)/g)

/**
 * End tag chunker function.
 */
export const getTagEnd = chunker(/(\s*(\/?>))/g)

/**
 * Attribute name chunker function.
 */
export const getAttributeName = chunker(/(\s+(([?.@a-z0-9\-_]+:)?[?.@a-z0-9\-_]+)(=)?)/gi)

export const getAttributeStart = chunker(/(\s+(([?.@a-z0-9\-_]+:)?[?.@a-z0-9\-_]+)(=))/gi)

/**
 * Whitespace chunker function.
 */
export const getWhitespace = chunker(/(\s+)/g)

export type Chunk = {
  readonly length: number
  readonly match: RegExpExecArray
}

function chunker(regex: RegExp) {
  return (str: string, pos: number): Chunk | undefined => {
    regex.lastIndex = pos
    const match = regex.exec(str)
    if (!match || match.index !== pos) {
      return
    } else {
      return {
        length: match[1].length,
        match,
      } as const
    }
  }
}
