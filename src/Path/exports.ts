import { eqString } from 'fp-ts/Eq'
import { Is } from 'io-ts'
import { getEq, getMonoid, iso, Newtype, prism } from 'newtype-ts'

export type Path = Newtype<{ readonly Path: unique symbol }, string>

export const pathIso = iso<Path>()

export namespace Path {
  export const { wrap, unwrap } = pathIso
}

export const pathPrism = prism<Path>((s: string) => s.length > 0 && s[0] === '/')

export const pathEq = getEq<Path>(eqString)

export const pathMonoid = getMonoid<Path>({
  empty: '/',
  concat: (a: string, b: string) => pathIso.unwrap(pathJoin([a, b])),
})

const DUPLICATE_PATH_SEPARATOR_REGEX = /\/{2,}/g
const PATH_SEPARATOR = `/`

const isString: Is<string> = (x): x is string => typeof x === 'string'

export function pathJoin(
  paths: ReadonlyArray<string | Path | undefined | null | void | boolean>,
  trailingSlash = false,
): Path {
  const path = `/${paths.filter(isString).join(PATH_SEPARATOR)}`.replace(
    DUPLICATE_PATH_SEPARATOR_REGEX,
    PATH_SEPARATOR,
  )

  return pathIso.wrap(!trailingSlash || path[path.length - 1] === '/' ? path : path + '/')
}
