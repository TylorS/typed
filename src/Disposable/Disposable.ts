import { constVoid } from 'fp-ts/function'

export interface Disposable {
  readonly dispose: () => void | Promise<void>
}

export const disposeNone: Disposable = {
  dispose: constVoid,
}
