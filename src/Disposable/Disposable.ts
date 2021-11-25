export interface Disposable {
  readonly dispose: () => void | PromiseLike<void>
}
