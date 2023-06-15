/**
 * A list of tags which are self-closing in HTML.
 */
export const SELF_CLOSING_TAGS = new Set([
  'area',
  'base',
  'br',
  'col',
  'command',
  'embed',
  'hr',
  'img',
  'input',
  'keygen',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
])

/**
 * Determine whether a tag is a self-closing tag.
 */
export function isSelfClosing(tag: string): boolean {
  return SELF_CLOSING_TAGS.has(tag)
}
