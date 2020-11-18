import { createSchema } from '@typed/fp/io/exports'
import { isString } from '@typed/fp/logic/is'
import { getMonoid, iso, Newtype, prism } from 'newtype-ts'

export type Path = Newtype<'Path', string>

export const pathIso = iso<Path>()

export namespace Path {
  export const { wrap, unwrap } = pathIso

  export const schema = createSchema<Path>((t) =>
    t.newtype<Path>(t.string, pathPrism.getOption, 'Path'),
  )
}

export const pathPrism = prism<Path>((s: string) => s.length > 0 && s[0] === '/')

export const pathMonoid = getMonoid<Path>({
  empty: '/',
  concat: (a: string, b: string) => Path.unwrap(pathJoin([a, b])),
})

const DUPLICATE_PATH_SEPARATOR_REGEX = /\/{2,}/g
const PATH_SEPARATOR = `/`

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
