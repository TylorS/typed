import { describe, given, it } from '@typed/test'

import { fromDependencyMap } from './fromDependencyMap'
import { getEntrypoints } from './getEntrypoints'

export const test = describe(`getEntrypoints`, [
  given(`an acyclic DiGraph`, [
    it(`returns entrypoints`, ({ equal }) => {
      const graph = fromDependencyMap(
        new Map([
          ['a', ['b', 'e']],
          ['b', ['c']],
          ['c', ['d']],
        ]),
      )

      equal([{ type: 'acyclic', vertice: 'a' }], getEntrypoints(graph))
    }),
  ]),

  given(`a cyclic DiGraph`, [
    it(`returns all entrypoints`, ({ equal }) => {
      const graph = fromDependencyMap(
        new Map([
          ['a', ['b', 'e']],
          ['b', ['c', 'e']],
          ['c', ['d']],
          ['e', ['a']],
          ['f', ['c']],
        ]),
      )

      equal(
        [
          { type: 'cyclic', vertices: ['e', 'b', 'a'] },
          { type: 'acyclic', vertice: 'f' },
        ],
        getEntrypoints(graph),
      )
    }),
  ]),
])
