import { Disposable } from './Disposable'

export async function dispose<A>(disposable: Disposable<A>): Promise<A> {
  return await disposable.dispose()
}

export function disposeAll<A>(disposables: ReadonlyArray<Disposable<A>>): Disposable<readonly A[]> {
  return {
    dispose: async () => {
      return await Promise.all(disposables.map((d) => d.dispose()))
    },
  }
}
