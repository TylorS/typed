import { ParsedUri, parseUri, Uri } from '@fp/Uri/exports'

const HTTPS_PROTOCOL = 'https:'
const HTTPS_DEFAULT_PORT = '443'
const HTTP_DEFAULT_PORT = '80'

/**
 * An in-memory implementation of `Location`. Optionally mirror Location changes
 * into a History instance with setHistory.
 */
export class ServerLocation implements Location {
  get ancestorOrigins(): DOMStringList {
    return ([] as unknown) as DOMStringList
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
    const { port, protocol } = parseUri(Uri.wrap(href))

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
  private history!: History

  constructor(uri: Uri) {
    this.replace(Uri.unwrap(uri))
  }

  public assign(url: string): void {
    this.replace(url)

    if (this.history) {
      this.history.pushState(null, '', this.href)
    }
  }

  // Does not have defined behavior outside of browser
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public reload(): void {}

  public replace(url: string): void {
    // eslint-disable-next-line prefer-const
    let { href, host, relative } = parseUri(Uri.wrap(url))

    if (this.host && !host) {
      href = this.host + href
    }

    const { protocol } = parseUri(Uri.wrap(href))

    if (href !== relative && this.protocol && !protocol) {
      href = this.protocol + '//' + href
    }

    this.href = href

    if (this.history) {
      this.history.replaceState(null, '', this.href)
    }
  }

  public toString(): string {
    return this.href
  }

  // ServerLocation Specific
  public setHistory(this: ServerLocation, history: History): ServerLocation {
    this.history = history

    return this
  }
}

function replace(key: keyof ParsedUri, value: string, location: ServerLocation) {
  const { href } = location

  const currentValue = parseUri(Uri.wrap(href))[key]
  const updateHref = href.replace(currentValue as string, value)

  location.replace(updateHref)
}

function parseValue(key: keyof ParsedUri, location: ServerLocation): string {
  return parseUri(Uri.wrap(location.href))[key] as string
}
