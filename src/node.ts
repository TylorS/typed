/**
 * @typed/fp/node is a place to place implementations of environment from other modules that require or
 * are best used with implementations specifically for node.js.
 * @since 0.9.4
 */
import * as Ei from 'fp-ts/Either'
import * as fs from 'fs'
import fetch from 'node-fetch'

import * as D from './Disposable'
import { HistoryEnv, LocationEnv } from './dom'
import * as E from './Env'
import { fromPromiseK } from './EnvEither'
import * as http from './http'
import * as R from './Resume'

/**
 * @category Environment
 * @since 0.9.4
 */
export const HttpEnv: http.HttpEnv = { http: E.fromResumeK(httpFetchRequest) }

function httpFetchRequest(
  uri: string,
  options: http.HttpOptions = {},
): R.Resume<Ei.Either<Error, http.HttpResponse>> {
  return R.async((cb) => {
    const { method = 'GET', headers = {}, body } = options

    const disposable = D.settable()
    const abortController = new AbortController()

    disposable.addDisposable({
      dispose: () => abortController.abort(),
    })

    const init = {
      method,
      headers: Object.entries(headers).map(([key, value = '']) => [key, value]),
      body: body ?? undefined,
      credentials: 'include',
      signal: abortController.signal,
    }

    async function makeRequest() {
      const response = await fetch(uri, init)

      const headers: Record<string, string | undefined> = {}
      response.headers.forEach((value, key) => {
        headers[key] = value
      })

      const httpResponse: http.HttpResponse = {
        status: response.status,
        body: await response.json().catch(() => response.text()),
        headers,
      }

      if (!disposable.isDisposed()) {
        disposable.addDisposable(cb(Ei.right(httpResponse)))
      }
    }

    makeRequest().catch((error) => {
      if (!disposable.isDisposed()) {
        disposable.addDisposable(cb(Ei.left(error)))
      }
    })

    return disposable
  })
}

/**
 * @category FS
 * @since 0.13.1
 */
export const chmod = fromPromiseK(fs.promises.chmod)

/**
 * @category FS
 * @since 0.13.1
 */
export const copyFile = fromPromiseK(fs.promises.copyFile)

/**
 * @category FS
 * @since 0.13.1
 */
export const link = fromPromiseK(fs.promises.link)

/**
 * @category FS
 * @since 0.13.1
 */
export const mkdir = fromPromiseK(fs.promises.mkdir)

/**
 * @category FS
 * @since 0.13.1
 */
export const read = fromPromiseK(fs.promises.read)

/**
 * @category FS
 * @since 0.13.1
 */
export const readFile = fromPromiseK(fs.promises.readFile)

/**
 * @category FS
 * @since 0.13.1
 */
export const readdir = fromPromiseK(fs.promises.readdir)

/**
 * @category FS
 * @since 0.13.1
 */
export const rm = fromPromiseK(fs.promises.rm)

/**
 * @category FS
 * @since 0.13.1
 */
export const rmdir = fromPromiseK(fs.promises.rmdir)

/**
 * @category FS
 * @since 0.13.1
 */
export const stat = fromPromiseK(fs.promises.stat)

/**
 * @category FS
 * @since 0.13.1
 */
export const symlink = fromPromiseK(fs.promises.symlink)

/**
 * @category FS
 * @since 0.13.1
 */
export const unlink = fromPromiseK(fs.promises.unlink)

/**
 * @category FS
 * @since 0.13.1
 */
export const write = fromPromiseK(fs.promises.write)

/**
 * @category FS
 * @since 0.13.1
 */
export const writeFile = fromPromiseK(fs.promises.writeFile)

/**
 * An in-memory implementation of `History`.
 * @category In-Memory Mock
 * @since 0.13.2
 */
export class ServerHistory implements History {
  // Does not affect behavior
  public scrollRestoration: ScrollRestoration = 'auto'

  // ServerHistory specific
  // tslint:disable-next-line:variable-name
  private _states: { state: any; url: string }[]
  // tslint:disable-next-line:variable-name
  private _index = 0
  private location: Location

  constructor(location: Location) {
    this.location = location
    this._states = [{ state: null, url: this.location.pathname }]
  }

  private set index(value: number) {
    this._index = value

    const { url } = this._states[this._index]

    this.location.replace(url)
  }

  private get index(): number {
    return this._index
  }

  get length(): number {
    return this._states.length
  }

  get state(): any {
    const { state } = this._states[this.index]

    return state
  }

  public go(quanity = 0): void {
    if (quanity === 0) {
      return void 0
    }

    const minIndex = 0
    const maxIndex = this.length - 1

    this.index = Math.max(minIndex, Math.min(maxIndex, this.index + quanity))
  }

  public back(): void {
    this.go(-1)
  }

  public forward(): void {
    this.go(1)
  }

  public pushState(state: any, _: string | null, url: string) {
    this._states = this._states.slice(0, this.index).concat({ state, url })
    this.index = this._states.length - 1
  }

  public replaceState(state: any, _: string | null, url: string) {
    this._states[this.index] = { state, url }
  }
}

const HTTPS_PROTOCOL = 'https:'
const HTTPS_DEFAULT_PORT = '443'
const HTTP_DEFAULT_PORT = '80'

/**
 * An in-memory implementation of `Location`.
 * @category In-Memory Mock
 * @since 0.13.2
 */
export class ServerLocation implements Location {
  get ancestorOrigins(): DOMStringList {
    return [] as any as DOMStringList
  }

  get hash(): string {
    return parseValue('hash', this)
  }

  set hash(value: string) {
    const hash = value.startsWith('#') ? value : '#' + value

    replace('hash', hash, this)
  }

  get host(): string {
    return parseValue('host', this)
  }

  set host(value: string) {
    replace('host', value, this)
  }

  get hostname(): string {
    return parseValue('hostname', this)
  }

  set hostname(value: string) {
    replace('hostname', value, this)
  }

  get pathname(): string {
    return parseValue('pathname', this)
  }

  set pathname(value: string) {
    replace('pathname', value, this)
  }

  get port(): string {
    const { href } = this
    const { port, protocol } = parseHref(href)

    if (port) {
      return port
    }

    return protocol === HTTPS_PROTOCOL ? HTTPS_DEFAULT_PORT : HTTP_DEFAULT_PORT
  }

  set port(value: string) {
    replace('port', value, this)
  }

  get protocol(): string {
    return parseValue('protocol', this) || 'http:'
  }

  set protocol(value: string) {
    replace('protocol', value, this)
  }

  get search(): string {
    return parseValue('search', this)
  }

  set search(value: string) {
    const search = value.startsWith('?') ? value : '?' + value

    replace('search', search, this)
  }

  get origin(): string {
    return this.protocol + '//' + this.host
  }
  public href!: string

  public history?: History

  constructor(url: string) {
    this.updateHref(url)
  }

  public assign(url: string): void {
    this.updateHref(url)

    if (this.history) {
      this.history.pushState(null, '', this.href)
    }
  }

  public reload(): void {
    // Does not have defined behavior outside of browser
  }

  public replace(url: string): void {
    this.updateHref(url)

    if (this.history) {
      this.history.replaceState(null, '', this.href)
    }
  }

  public toString(): string {
    return this.href
  }

  // ServerLocation Specific
  public setHistory(history: History) {
    this.history = history

    return this
  }

  private updateHref(url: string) {
    const parsed = parseHref(url)
    const { host, relative } = parsed
    let href = parsed.href

    if (this.host && !host) {
      href = this.host + href
    }

    const { protocol } = parseHref(href)

    if (href !== relative && this.protocol && !protocol) {
      href = this.protocol + '//' + href
    }

    this.href = href
  }
}

function replace(key: keyof ParsedHref, value: string, location: ServerLocation) {
  const { href } = location

  const currentValue = parseHref(href)[key]
  const updateHref = href.replace(currentValue, value)

  location.replace(updateHref)

  if (location.history) {
    location.history.pushState(null, '', location.href)
  }
}

function parseValue(key: keyof ParsedHref, location: ServerLocation): string {
  return parseHref(location.href)[key] as string
}

const HREF_REGEX =
  /^(?:([^:/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:/?#]*)(?::(\d*))?))?((((?:[^?#/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/

/**
 * ParsedHref JSON data structure
 * @name ParsedHref
 * @category Model
 * @since 0.13.2
 */
export type ParsedHref = {
  readonly href: string
  readonly protocol: string
  readonly host: string
  readonly userInfo: string
  readonly username: string
  readonly password: string
  readonly hostname: string
  readonly port: string
  readonly relative: string
  readonly pathname: string
  readonly directory: string
  readonly file: string
  readonly search: string
  readonly hash: string
}

/**
 * Parses an href into JSON.
 * @category Parser
 * @since 0.13.2
 * */
export function parseHref(href: string): ParsedHref {
  const matches = HREF_REGEX.exec(href) as RegExpExecArray

  const parsedHref = {} as Record<keyof ParsedHref, string>

  for (let i = 0; i < keyCount; ++i) {
    const key = keys[i]
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

    parsedHref[key] = value
  }

  return parsedHref
}

const keys: ReadonlyArray<keyof ParsedHref> = [
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

const keyCount = keys.length

/**
 * Create A History Environment that works in browser and non-browser environments
 * @param href :: initial href to use
 * @category Environment
 * @since 0.13.2
 */
export function createHistoryEnv(href = '/'): HistoryEnv & LocationEnv {
  const serverLocation = new ServerLocation(href)
  const serverHistory = new ServerHistory(serverLocation)
  serverLocation.setHistory(serverHistory)

  return {
    location: serverLocation,
    history: serverHistory,
  }
}
