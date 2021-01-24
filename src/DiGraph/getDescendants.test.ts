import { describe, given, it } from '@typed/test'

import { fromDependencyMap } from './fromDependencyMap'
import { getDescendants } from './getDescendants'

export const test = describe(`getDescendants`, [
  given(`vertice and an acyclic DiGraph`, [
    it(`returns expected descendants`, ({ equal }) => {
      const graph = fromDependencyMap(
        new Map([
          ['a', ['b', 'e']],
          ['b', ['c']],
          ['c', ['d']],
          ['f', ['c']],
        ]),
      )
      equal(['c', 'd'], getDescendants('b', graph))
    }),
  ]),

  given(`vertice and a cyclic DiGraph`, [
    it(`returns expected descendants`, ({ equal }) => {
      const graph = fromDependencyMap(
        new Map([
          ['a', ['b', 'e']],
          ['b', ['c', 'e']],
          ['c', ['d']],
          ['e', ['a']],
          ['f', ['c']],
        ]),
      )

      equal(['c', 'e', 'd', 'a'], getDescendants('b', graph))
    }),
  ]),
])
