import { Disposable } from './Disposable'

export function disposeAll(...disposables: readonly Disposable[]): Disposable {
  return {
    dispose: async () => {
      await Promise.all(disposables.map((d) => d.dispose()))
    },
  }
}
