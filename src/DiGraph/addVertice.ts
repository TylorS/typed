import { pipe } from 'fp-ts/function'
import { uniq } from 'fp-ts/ReadonlyArray'

import { DiGraph } from './DiGraph'

export function addVertice<A>(vertice: A, graph: DiGraph<A>): DiGraph<A> {
  return {
    ...graph,
    vertices: pipe([...graph.vertices, vertice], uniq(graph)),
  }
}
