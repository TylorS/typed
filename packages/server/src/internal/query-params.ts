export function parseQueryParameters(
  query: string,
  delimiters: ReadonlyArray<string> = []
): Readonly<Record<string, ReadonlyArray<string>>> {
  const output: Record<string, ReadonlyArray<string>> = {}
  const parts = query.split("&")

  for (const part of parts) {
    const [key, values] = parseQueryParam(part, delimiters)
    if (output[key] === undefined) {
      output[key] = values
    } else {
      output[key] = [...output[key], ...values]
    }
  }

  return output
}

export function parseQueryParam(
  part: string,
  delimiters: ReadonlyArray<string> = []
): readonly [key: string, value: ReadonlyArray<string>] {
  const [key, value] = part.split("=")

  for (const delimiter of delimiters) {
    if (value.includes(delimiter)) {
      return [key, value.split(delimiter)] as const
    }
  }
  return [key, [value]] as const
}
