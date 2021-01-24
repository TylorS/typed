import { pipe } from 'fp-ts/function'
import { getOrElse } from 'fp-ts/Option'
import { lookup } from 'fp-ts/ReadonlyMap'

import { DiGraph } from './DiGraph'
import { DependencyMap, toDependencyMap } from './toDependencyMap'

export function getDependencies<A>(
  vertice: A,
  graph: DiGraph<A>,
  dependencies: DependencyMap<A> = toDependencyMap(graph),
): ReadonlyArray<A> {
  return pipe(
    dependencies,
    lookup(graph)(vertice),
    getOrElse((): ReadonlyArray<A> => []),
  )
}
