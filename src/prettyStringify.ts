const NEWLINE_REGEX = /(\r)?\n/g

export function prettyStringify(x: unknown, depth = 2): string {
  const replacement = '$1'.padEnd(1 + depth, ' ')

  return JSON.stringify(x, null, 2).replace(NEWLINE_REGEX, replacement)
}
