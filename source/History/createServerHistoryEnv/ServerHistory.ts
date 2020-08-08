/**
 * An implementation of the `History` interface.
 * @name ServerHistory
 */
export class ServerHistory implements History {
  // Does not affect behavior
  public scrollRestoration: ScrollRestoration = 'auto'

  // ServerHistory specific
  // tslint:disable-next-line:variable-name
  private _states: { state: any; url: string }[]
  // tslint:disable-next-line:variable-name
  private _index: number = 0
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

  public go(quanity: number = 0): void {
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
