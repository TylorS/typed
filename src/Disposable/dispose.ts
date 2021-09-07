import { Disposable } from './Disposable'

export async function dispose(disposable: Disposable): Promise<void> {
  return await disposable.dispose()
}

export function disposeAll(disposables: readonly Disposable[]): Disposable {
  return {
    dispose: async () => {
      await Promise.all(disposables.map((d) => d.dispose()))
    },
  }
}
