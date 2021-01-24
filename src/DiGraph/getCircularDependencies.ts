import { ReadonlyNonEmptyArray } from 'fp-ts/ReadonlyNonEmptyArray'

import { DiGraph } from './DiGraph'
import { getStronglyConnectedComponents } from './getStronglyConnectedComponents'

export function getCircularDependencies<A>(
  graph: DiGraph<A>,
): ReadonlyArray<ReadonlyNonEmptyArray<A>> {
  return getStronglyConnectedComponents(graph).filter((x) => x.length > 1)
}
