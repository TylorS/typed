import { describe, given, it } from '@typed/test'

import { fromDependencyMap } from './fromDependencyMap'
import { getStronglyConnectedComponents } from './getStronglyConnectedComponents'

export const test = describe(`getStronglyConnectedComponents`, [
  given(`a DiGraph with no strongly connected components`, [
    it(`returns an Array of tuples with length of 1`, ({ equal }) => {
      const graph = fromDependencyMap(
        new Map([
          ['a', ['b', 'e']],
          ['b', ['c']],
          ['c', ['d']],
        ]),
      )
      const components = getStronglyConnectedComponents(graph)

      components.forEach((xs) => equal(1, xs.length))
    }),
  ]),

  given(`a DiGraph with no strongly connected components`, [
    it(`returns Array containing strongly connected components`, ({ equal }) => {
      const graph = fromDependencyMap(
        new Map([
          ['a', ['b', 'e']],
          ['b', ['c', 'e']],
          ['c', ['d']],
          ['e', ['a']],
        ]),
      )
      const components = getStronglyConnectedComponents(graph)

      equal([['d'], ['c'], ['e', 'b', 'a']], components)
    }),
  ]),
])
