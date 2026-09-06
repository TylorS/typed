const byteToHex: Array<string> = [];

for (let i = 0; i < 256; ++i) {
  byteToHex.push((i + 0x100).toString(16).slice(1));
}

/**
 * Formats the first 16 bytes of a seed as a lowercase hyphenated UUID string.
 * @remarks
 * ## Why
 * This published low-level helper centralizes UUID byte layout formatting but deliberately does not validate length, version, or variant bits.
 * ## Ownership and lifetime
 * This pure function acquires no resources, does not mutate or retain the seed, and returns a new string.
 * @example
 * ```ts
 * import { uuidStringify } from "@typed/id/_uuid-stringify"
 * const text = uuidStringify(new Uint8Array(16))
 * ```
 * @category Formatting
 * @since 1.0.0
 */
export function uuidStringify(seed: Uint8Array): string {
  return [
    byteToHex[seed[0]],
    byteToHex[seed[1]],
    byteToHex[seed[2]],
    byteToHex[seed[3]],
    "-",
    byteToHex[seed[4]],
    byteToHex[seed[5]],
    "-",
    byteToHex[seed[6]],
    byteToHex[seed[7]],
    "-",
    byteToHex[seed[8]],
    byteToHex[seed[9]],
    "-",
    byteToHex[seed[10]],
    byteToHex[seed[11]],
    byteToHex[seed[12]],
    byteToHex[seed[13]],
    byteToHex[seed[14]],
    byteToHex[seed[15]],
  ].join("");
}
