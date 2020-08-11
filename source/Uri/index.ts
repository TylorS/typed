import { Path } from '@typed/fp/Path'
import { eqString } from 'fp-ts/es6/Eq'
import { ReadonlyRecord } from 'fp-ts/es6/ReadonlyRecord'
import { getEq, iso, Newtype, prism } from 'newtype-ts'

export type Uri = Newtype<{ readonly Url: unique symbol }, string>

export const uriIso = iso<Uri>()
export const uriPrism = prism<Uri>((s: string) => s.length > 0 && s[0] === '/')
export const uriEq = getEq<Uri>(eqString)

export namespace Uri {
  export const { wrap, unwrap } = uriIso
}

export const URI_REGEX = /^(?:([^:/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:/?#]*)(?::(\d*))?))?((((?:[^?#/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/

/**
 * ParsedUri JSON data structure
 * @name ParsedUri
 * @type
 */
export type ParsedUri = {
  readonly href: string
  readonly protocol: string
  readonly host: string
  readonly userInfo: string
  readonly username: string
  readonly password: string
  readonly hostname: string
  readonly port: string
  readonly relative: string
  readonly pathname: Path
  readonly directory: string
  readonly file: string
  readonly search: string
  readonly hash: string
}

/**
 * Parses an URL into JSON.
 * @name parseUri(url: Uri): ParsedUri
 */
export function parseUri(url: Uri): ParsedUri {
  const matches = URI_REGEX.exec(uriIso.unwrap(url)) as RegExpExecArray
  const parsedUri = {} as Record<keyof ParsedUri, string | Path>

  for (let i = 0; i < parsedUriKeyCount; ++i) {
    const key = parsedUriKeys[i]
    let value = matches[i] || ''

    if (key === 'search' && value) {
      value = '?' + value
    }
    if (key === 'protocol' && value && !value.endsWith(':')) {
      value = value + ':'
    }

    if (key === 'hash') {
      value = '#' + value
    }

    if (key === 'pathname' && !value) {
      value = '/'
    }

    parsedUri[key] = value
  }

  return parsedUri as ParsedUri
}

const parsedUriKeys: ReadonlyArray<keyof ParsedUri> = [
  'href',
  'protocol',
  'host',
  'userInfo',
  'username',
  'password',
  'hostname',
  'port',
  'relative',
  'pathname',
  'directory',
  'file',
  'search',
  'hash',
]

const parsedUriKeyCount = parsedUriKeys.length

export type QueryParams = ReadonlyRecord<string, string | undefined>

export function addQueryParameters(url: Uri, queryParams: QueryParams): Uri
export function addQueryParameters(url: Uri): (queryParams: QueryParams) => Uri

/**
 * Append Query Parameters to a Url
 * @param url :: String
 * @param queryParams :: QueryParams
 * @returns string
 */
export function addQueryParameters(url: Uri, queryParams?: QueryParams) {
  if (queryParams === void 0) {
    return (queryParams: QueryParams) => __addQueryParameters(url, queryParams)
  }

  return __addQueryParameters(url, queryParams)
}

function __addQueryParameters(url: Uri, queryParams: QueryParams): Uri {
  const params = Object.keys(queryParams).sort().map(queryParam(queryParams)).join('&')

  return Uri.wrap(encodeURI(`${url}${params ? `?${params}` : ''}`))
}

function queryParam(queryParams: QueryParams) {
  return (key: keyof typeof queryParams): string => {
    const value = queryParams[key]

    return value === void 0 ? key : `${key}=${value}`
  }
}
