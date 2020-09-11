import { Eq } from 'fp-ts/Eq'
import { pipe } from 'fp-ts/function'
import * as O from 'fp-ts/Option'
import * as RA from 'fp-ts/ReadonlyArray'

export const diff = <A>(eq: Eq<A>) => {
  return (current: ReadonlyArray<A>, updated: ReadonlyArray<A>) => {
    const added = new Set<readonly [A, number]>()
    const removed = new Set<readonly [A, number]>()

    for (let i = 0; i < current.length; ++i) {
      const value = current[i]
      const option = pipe(
        updated,
        RA.findFirst((a) => eq.equals(a, value)),
      )

      if (O.isNone(option)) {
        removed.add([value, i])
      }
    }

    for (let i = 0; i < updated.length; ++i) {
      const value = updated[i]
      const option = pipe(
        current,
        RA.findFirst((a) => eq.equals(a, value)),
      )

      if (O.isNone(option)) {
        added.add([value, i])
      }
    }

    return {
      added: RA.fromArray(Array.from(added)),
      removed: RA.fromArray(Array.from(removed)),
    } as const
  }
}
