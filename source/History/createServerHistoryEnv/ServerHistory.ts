/**
 * An implementation of the `History` interface.
 * @name ServerHistory
 */
export class ServerHistory implements History {
  // Does not affect behavior
  public scrollRestoration: ScrollRestoration = 'auto'

  // ServerHistory specific
  private _states: { state: unknown; url: string }[]
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

  public pushState(state: unknown, _: string | null, url: string): void {
    this._states = this._states.slice(0, this.index).concat({ state, url })
    this.index = this._states.length - 1
  }

  public replaceState(state: unknown, _: string | null, url: string): void {
    this._states[this.index] = { state, url }
  }
}
