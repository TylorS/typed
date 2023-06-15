const digestSize = 2
const multiplier = 33
const fill = 5381

/**
 * Generates a hash for an ordered list of strings. Intended for the purposes
 * of server-side rendering with hydration.
 */
export function hashForTemplateStrings(strings: ReadonlyArray<string>) {
  const hashes = new Uint32Array(digestSize).fill(fill)

  for (let i = 0; i < strings.length; i++) {
    const s = strings[i]

    for (let j = 0; j < s.length; j++) {
      const key = j % digestSize

      hashes[key] = (hashes[key] * multiplier) ^ s.charCodeAt(j)
    }
  }

  return btoa(String.fromCharCode(...new Uint8Array(hashes.buffer)))
}
