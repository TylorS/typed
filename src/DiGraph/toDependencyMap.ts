import { Eq } from 'fp-ts/Eq'
import { pipe } from 'fp-ts/function'
import { getOrElse } from 'fp-ts/Option'
import * as RA from 'fp-ts/ReadonlyArray'
import * as RM from 'fp-ts/ReadonlyMap'

import { DiGraph, Edge } from './DiGraph'

export type DependencyMap<A> = ReadonlyMap<A, ReadonlyArray<A>>

export function toDependencyMap<A>(graph: DiGraph<A>, eq: Eq<A> = graph): DependencyMap<A> {
  return pipe(graph.edges, RA.reduce(new Map<A, ReadonlyArray<A>>(), applyEdge(eq)))
}

function applyEdge<A>(eq: Eq<A>) {
  const lookup = RM.lookup(eq)
  const insertAt = RM.insertAt(eq)

  return (map: DependencyMap<A>, edge: Edge<A>): DependencyMap<A> => {
    const [from, to] = edge

    return pipe(
      map,
      insertAt(
        from,
        pipe(
          RA.snoc(
            pipe(
              map,
              lookup(from),
              getOrElse((): readonly A[] => []),
            ),
            to,
          ),
          RA.uniq(eq),
        ),
      ),
    )
  }
}
