/**
 * Type-level path joining
 *
 * @since 1.0.0
 */

/**
 * Composes other path parts into a single path
 * @category Type-level
 * @since 1.0.0
 */
export type PathJoin<A> = A extends readonly [
  infer Head extends string,
  ...infer Tail extends ReadonlyArray<string>
] ? `${FormatPart<Head>}${PathJoin<Tail>}`
  : ``

/**
 * Join together path parts
 * @category Combinator
 * @since 1.0.0
 */
export const pathJoin = <P extends ReadonlyArray<string>>(...parts: P): PathJoin<P> => {
  if (parts.length === 0) {
    return `` as PathJoin<P>
  }

  const [head, ...tail] = parts.map(formatPart)

  return `${head || "/"}${tail.join("")}` as PathJoin<P>
}

/**
 * Formats a piece of a path
 * @category Combinator
 * @since 1.0.0
 */
export const formatPart = (part: string) => {
  if (part.startsWith("{")) {
    return part
  }

  if (part.startsWith("\\?")) {
    return part
  }

  part = removeLeadingSlash(part)
  part = removeTrailingSlash(part)

  return part === "" ? "" : `/${part}`
}

/**
 * @category Type-level
 * @since 1.0.0
 */
export type FormatPart<P extends string> = `` extends P ? P
  : RemoveSlash<P> extends `\\?${infer _}` ? RemoveSlash<P>
  : P extends `{${infer _}` ? P
  : `/${RemoveSlash<P>}`

type RemoveSlash<T> = RemoveLeadingSlash<RemoveTrailingSlash<T>>

/**
 * Remove forward slashes prefixes recursively
 * @category Type-level
 * @since 1.0.0
 */
export type RemoveLeadingSlash<A> = A extends `/${infer R}` ? RemoveLeadingSlash<R> : A

/**
 * @category Combinator
 * @since 1.0.0
 */
export const removeLeadingSlash = <A extends string>(a: A): RemoveLeadingSlash<A> => {
  let s = a.slice()

  while (s.startsWith("/")) {
    s = s.slice(1)
  }

  return s as RemoveLeadingSlash<A>
}

/**
 * @category Combinator
 * @since 1.0.0
 */
export const removeTrailingSlash = <A extends string>(a: A): RemoveTrailingSlash<A> => {
  let s = a.slice()

  while (s.endsWith("/")) {
    s = s.slice(0, -1)
  }

  return s as RemoveTrailingSlash<A>
}

/**
 * Remove forward slashes postfixes recursively
 * @category Type-level
 * @since 1.0.0
 */
export type RemoveTrailingSlash<A> = A extends `${infer R}/` ? RemoveTrailingSlash<R> : A
