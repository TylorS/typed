import { elem } from 'fp-ts/ReadonlyArray'

import { DiGraph } from './DiGraph'
import { getDependents } from './getDependents'
import { DependencyMap } from './toDependencyMap'
import { toDependentMap } from './toDependentGraph'

export function getAncestors<A>(
  vertice: A,
  graph: DiGraph<A>,
  dependentMap: DependencyMap<A> = toDependentMap(graph),
): ReadonlyArray<A> {
  const toVisit = [...getDependents(vertice, graph, dependentMap)]
  const anscestors: A[] = []
  const contains = elem(graph)

  for (const a of toVisit) {
    if (!contains(a, anscestors)) {
      anscestors.push(a)
      toVisit.push(
        ...getDependents(a, graph, dependentMap).filter((x) => !graph.equals(x, vertice)),
      )
    }
  }

  return anscestors
}
