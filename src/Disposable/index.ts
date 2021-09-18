export interface Disposable {
  readonly dispose: () => unknown | Promise<unknown>
}
