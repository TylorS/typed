import { describe, given, it } from '@typed/test'

import { fromDependencyMap } from './fromDependencyMap'
import { getAncestors } from './getAncestors'

export const test = describe(`getAncestors`, [
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
      equal(['a'], getAncestors('b', graph))
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

      equal(['a', 'e'], getAncestors('b', graph))
    }),
  ]),
])
