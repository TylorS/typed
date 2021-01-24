import { DiGraph } from './DiGraph'

export function removeVertice<A>(vertice: A, graph: DiGraph<A>): DiGraph<A> {
  return {
    ...graph,
    edges: graph.edges.filter((x) => !graph.equals(x[0], vertice) && !graph.equals(x[1], vertice)),
    vertices: graph.vertices.filter((x) => !graph.equals(x, vertice)),
  }
}
