import { constVoid } from '@fp-ts/data/Function'

export interface Disposable {
  readonly dispose: () => void
}

export function Disposable(dispose: Disposable['dispose']): Disposable {
  return { dispose }
}

export namespace Disposable {
  export const unit: Disposable = Disposable(constVoid)

  export interface Queue extends Disposable {
    readonly size: () => number
    readonly isDisposed: () => boolean
    readonly offer: (disposable: Disposable) => Disposable
  }
}
