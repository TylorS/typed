import { pipe } from 'fp-ts/function'
import { getOrElse } from 'fp-ts/Option'
import { lookup } from 'fp-ts/ReadonlyMap'

import { DiGraph } from './DiGraph'
import { DependentMap, toDependentMap } from './toDependentGraph'

export function getDependents<A>(
  vertice: A,
  graph: DiGraph<A>,
  dependents: DependentMap<A> = toDependentMap(graph),
): ReadonlyArray<A> {
  return pipe(
    dependents,
    lookup(graph)(vertice),
    getOrElse((): ReadonlyArray<A> => []),
  )
}
