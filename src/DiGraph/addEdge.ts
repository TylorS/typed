import { createDiGraph, DiGraph, Edge } from './DiGraph'

export function addEdge<A>(edge: Edge<A>, graph: DiGraph<A>): DiGraph<A> {
  return createDiGraph([...graph.edges, edge], graph)
}
