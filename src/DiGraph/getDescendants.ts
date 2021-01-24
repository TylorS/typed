import { elem } from 'fp-ts/ReadonlyArray'

import { DiGraph } from './DiGraph'
import { getDependencies } from './getDependencies'
import { DependencyMap, toDependencyMap } from './toDependencyMap'

export function getDescendants<A>(
  vertice: A,
  graph: DiGraph<A>,
  dependencyMap: DependencyMap<A> = toDependencyMap(graph),
): ReadonlyArray<A> {
  const toVisit = [...getDependencies(vertice, graph, dependencyMap)]
  const dependencies: A[] = []
  const contains = elem(graph)

  for (const a of toVisit) {
    if (!contains(a, dependencies)) {
      dependencies.push(a)
      toVisit.push(
        ...getDependencies(a, graph, dependencyMap).filter((x) => !graph.equals(x, vertice)),
      )
    }
  }

  return dependencies
}
