/**
 * Extensions to RefSubject for working with Graph values
 * @since 1.18.0
 */

import type * as Effect from "effect/Effect";
import { equals } from "effect/Equal";
import { dual } from "effect/Function";
import * as Graph from "effect/Graph";
import type * as Scope from "effect/Scope";
import type * as Fx from "../Fx/index.js";
import * as RefSubject from "./RefSubject.js";

/**
 * A RefGraph is a RefSubject specialized over a Graph.
 * @remarks
 * ## Why
 *
 * Defines graph state with the same current-read, pushed-update, and synchronized-write contract
 * as RefSubject.
 *
 * ## Ownership and lifetime
 *
 * RefGraph is a contract and performs no acquisition. Implementations retain the errors, services,
 * interruption, and Scope requirements expressed by its members.
 *
 * @since 1.18.0
 * @category State models
 */
export interface RefGraph<
  in out N,
  in out E,
  T extends Graph.Kind = "directed",
  in out Err = never,
  out R = never,
> extends RefSubject.RefSubject<Graph.Graph<N, E, T>, Err, R> {}

/**
 * Creates a new `RefGraph` from a Graph, `Effect`, or `Fx`.
 * @remarks
 * ## Why
 *
 * Creates graph state with equality suited to that Effect data type, so unchanged values do not
 * produce redundant pushed updates.
 *
 * ## Ownership and lifetime
 *
 * The creation Effect requires Scope. It owns initializer acquisition, live source subscriptions,
 * and cleanup; source failures and services stay on reads and pushes.
 *
 * @since 1.18.0
 * @category Constructors
 */
export function make<N, E, T extends Graph.Kind, Err = never, R = never>(
  initial:
    | Graph.Graph<N, E, T>
    | Effect.Effect<Graph.Graph<N, E, T>, Err, R>
    | Fx.Fx<Graph.Graph<N, E, T>, Err, R>,
): Effect.Effect<RefGraph<N, E, T, Err>, never, R | Scope.Scope> {
  return RefSubject.make(initial, { eq: equals });
}

/**
 * Creates a new empty directed RefGraph.
 * @remarks
 * ## Why
 *
 * Creates a new empty directed RefGraph. The operation remains attached to the RefSubject's
 * versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * Running directed performs one serialized graph transition and resolves with its committed value.
 * It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category Constructors
 */
export function directed<N, E, Err = never, R = never>(): Effect.Effect<
  RefGraph<N, E, "directed", Err>,
  never,
  R | Scope.Scope
> {
  return RefSubject.make(Graph.directed<N, E>(), { eq: equals });
}

/**
 * Creates a new empty undirected RefGraph.
 * @remarks
 * ## Why
 *
 * Creates a new empty undirected RefGraph. The operation remains attached to the RefSubject's
 * versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * Running undirected performs one serialized graph transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category Constructors
 */
export function undirected<N, E, Err = never, R = never>(): Effect.Effect<
  RefGraph<N, E, "undirected", Err>,
  never,
  R | Scope.Scope
> {
  return RefSubject.make(Graph.undirected<N, E>(), { eq: equals });
}

// ========================================
// Combinators
// ========================================

/**
 * Add a node to the graph.
 * @remarks
 * ## Why
 *
 * Add a node to the graph. The operation remains attached to the RefSubject's versioned state
 * boundary.
 *
 * ## Ownership and lifetime
 *
 * Running add node performs one serialized graph transition and resolves with its committed value.
 * It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const addNode: {
  <N>(
    data: N,
  ): <E, T extends Graph.Kind, Err, R>(
    ref: RefGraph<N, E, T, Err, R>,
  ) => Effect.Effect<Graph.Graph<N, E, T>, Err, R>;
  <N, E, T extends Graph.Kind, Err, R>(
    ref: RefGraph<N, E, T, Err, R>,
    data: N,
  ): Effect.Effect<Graph.Graph<N, E, T>, Err, R>;
} = dual(2, function addNode<
  N,
  E,
  T extends Graph.Kind,
  Err,
  R,
>(ref: RefGraph<N, E, T, Err, R>, data: N) {
  return RefSubject.update(ref, (g) => {
    const mutable = Graph.beginMutation(g);
    Graph.addNode(mutable, data);
    return Graph.endMutation(mutable);
  });
});

/**
 * Remove a node from the graph.
 * @remarks
 * ## Why
 *
 * Applies remove node to the committed graph value and publishes only the result, preserving its
 * element order and equality rules.
 *
 * ## Ownership and lifetime
 *
 * Running remove node performs one serialized graph transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const removeNode: {
  (
    nodeIndex: Graph.NodeIndex,
  ): <N, E, T extends Graph.Kind, Err, R>(
    ref: RefGraph<N, E, T, Err, R>,
  ) => Effect.Effect<Graph.Graph<N, E, T>, Err, R>;
  <N, E, T extends Graph.Kind, Err, R>(
    ref: RefGraph<N, E, T, Err, R>,
    nodeIndex: Graph.NodeIndex,
  ): Effect.Effect<Graph.Graph<N, E, T>, Err, R>;
} = dual(2, function removeNode<
  N,
  E,
  T extends Graph.Kind,
  Err,
  R,
>(ref: RefGraph<N, E, T, Err, R>, nodeIndex: Graph.NodeIndex) {
  return RefSubject.update(ref, (g) => {
    const mutable = Graph.beginMutation(g);
    Graph.removeNode(mutable, nodeIndex);
    return Graph.endMutation(mutable);
  });
});

/**
 * Update a node's data.
 * @remarks
 * ## Why
 *
 * Keeps update node atomic with respect to competing RefSubject writes instead of splitting the
 * read and replacement into separate effects.
 *
 * ## Ownership and lifetime
 *
 * Running update node performs one serialized graph transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const updateNode: {
  <N>(
    nodeIndex: Graph.NodeIndex,
    f: (data: N) => N,
  ): <E, T extends Graph.Kind, Err, R>(
    ref: RefGraph<N, E, T, Err, R>,
  ) => Effect.Effect<Graph.Graph<N, E, T>, Err, R>;
  <N, E, T extends Graph.Kind, Err, R>(
    ref: RefGraph<N, E, T, Err, R>,
    nodeIndex: Graph.NodeIndex,
    f: (data: N) => N,
  ): Effect.Effect<Graph.Graph<N, E, T>, Err, R>;
} = dual(3, function updateNode<
  N,
  E,
  T extends Graph.Kind,
  Err,
  R,
>(ref: RefGraph<N, E, T, Err, R>, nodeIndex: Graph.NodeIndex, f: (data: N) => N) {
  return RefSubject.update(ref, (g) => {
    const mutable = Graph.beginMutation(g);
    Graph.updateNode(mutable, nodeIndex, f);
    return Graph.endMutation(mutable);
  });
});

/**
 * Add an edge to the graph.
 * @remarks
 * ## Why
 *
 * Add an edge to the graph. The operation remains attached to the RefSubject's versioned state
 * boundary.
 *
 * ## Ownership and lifetime
 *
 * Running add edge performs one serialized graph transition and resolves with its committed value.
 * It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const addEdge: {
  <E>(
    source: Graph.NodeIndex,
    target: Graph.NodeIndex,
    data: E,
  ): <N, T extends Graph.Kind, Err, R>(
    ref: RefGraph<N, E, T, Err, R>,
  ) => Effect.Effect<Graph.Graph<N, E, T>, Err, R>;
  <N, E, T extends Graph.Kind, Err, R>(
    ref: RefGraph<N, E, T, Err, R>,
    source: Graph.NodeIndex,
    target: Graph.NodeIndex,
    data: E,
  ): Effect.Effect<Graph.Graph<N, E, T>, Err, R>;
} = dual(4, function addEdge<
  N,
  E,
  T extends Graph.Kind,
  Err,
  R,
>(ref: RefGraph<N, E, T, Err, R>, source: Graph.NodeIndex, target: Graph.NodeIndex, data: E) {
  return RefSubject.update(ref, (g) => {
    const mutable = Graph.beginMutation(g);
    Graph.addEdge(mutable, source, target, data);
    return Graph.endMutation(mutable);
  });
});

/**
 * Remove an edge from the graph.
 * @remarks
 * ## Why
 *
 * Applies remove edge to the committed graph value and publishes only the result, preserving its
 * element order and equality rules.
 *
 * ## Ownership and lifetime
 *
 * Running remove edge performs one serialized graph transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const removeEdge: {
  (
    edgeIndex: Graph.EdgeIndex,
  ): <N, E, T extends Graph.Kind, Err, R>(
    ref: RefGraph<N, E, T, Err, R>,
  ) => Effect.Effect<Graph.Graph<N, E, T>, Err, R>;
  <N, E, T extends Graph.Kind, Err, R>(
    ref: RefGraph<N, E, T, Err, R>,
    edgeIndex: Graph.EdgeIndex,
  ): Effect.Effect<Graph.Graph<N, E, T>, Err, R>;
} = dual(2, function removeEdge<
  N,
  E,
  T extends Graph.Kind,
  Err,
  R,
>(ref: RefGraph<N, E, T, Err, R>, edgeIndex: Graph.EdgeIndex) {
  return RefSubject.update(ref, (g) => {
    const mutable = Graph.beginMutation(g);
    Graph.removeEdge(mutable, edgeIndex);
    return Graph.endMutation(mutable);
  });
});

/**
 * Update an edge's data.
 * @remarks
 * ## Why
 *
 * Keeps update edge atomic with respect to competing RefSubject writes instead of splitting the
 * read and replacement into separate effects.
 *
 * ## Ownership and lifetime
 *
 * Running update edge performs one serialized graph transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const updateEdge: {
  <E>(
    edgeIndex: Graph.EdgeIndex,
    f: (data: E) => E,
  ): <N, T extends Graph.Kind, Err, R>(
    ref: RefGraph<N, E, T, Err, R>,
  ) => Effect.Effect<Graph.Graph<N, E, T>, Err, R>;
  <N, E, T extends Graph.Kind, Err, R>(
    ref: RefGraph<N, E, T, Err, R>,
    edgeIndex: Graph.EdgeIndex,
    f: (data: E) => E,
  ): Effect.Effect<Graph.Graph<N, E, T>, Err, R>;
} = dual(3, function updateEdge<
  N,
  E,
  T extends Graph.Kind,
  Err,
  R,
>(ref: RefGraph<N, E, T, Err, R>, edgeIndex: Graph.EdgeIndex, f: (data: E) => E) {
  return RefSubject.update(ref, (g) => {
    const mutable = Graph.beginMutation(g);
    Graph.updateEdge(mutable, edgeIndex, f);
    return Graph.endMutation(mutable);
  });
});

/**
 * Map all node data.
 * @remarks
 * ## Why
 *
 * Applies `mapNodes` through `RefSubject.update` and publishes one coherent graph replacement;
 * this is a mutation, not a read-only Computed projection.
 *
 * ## Ownership and lifetime
 *
 * The Effect starts when run, participates in the source ref's serialized update boundary, and
 * acquires no resource. It returns the committed graph and retains the ref's E and R channels.
 * @since 1.18.0
 * @category State updates
 */
export const mapNodes: {
  <N>(
    f: (data: N) => N,
  ): <E, T extends Graph.Kind, Err, R>(
    ref: RefGraph<N, E, T, Err, R>,
  ) => Effect.Effect<Graph.Graph<N, E, T>, Err, R>;
  <N, E, T extends Graph.Kind, Err, R>(
    ref: RefGraph<N, E, T, Err, R>,
    f: (data: N) => N,
  ): Effect.Effect<Graph.Graph<N, E, T>, Err, R>;
} = dual(2, function mapNodes<
  N,
  E,
  T extends Graph.Kind,
  Err,
  R,
>(ref: RefGraph<N, E, T, Err, R>, f: (data: N) => N) {
  return RefSubject.update(ref, (g) => {
    const mutable = Graph.beginMutation(g);
    Graph.mapNodes(mutable, f);
    return Graph.endMutation(mutable);
  });
});

/**
 * Map all edge data.
 * @remarks
 * ## Why
 *
 * Applies `mapEdges` through `RefSubject.update` and publishes one coherent graph replacement;
 * this is a mutation, not a read-only Computed projection.
 *
 * ## Ownership and lifetime
 *
 * The Effect starts when run, participates in the source ref's serialized update boundary, and
 * acquires no resource. It returns the committed graph and retains the ref's E and R channels.
 * @since 1.18.0
 * @category State updates
 */
export const mapEdges: {
  <E>(
    f: (data: E) => E,
  ): <N, T extends Graph.Kind, Err, R>(
    ref: RefGraph<N, E, T, Err, R>,
  ) => Effect.Effect<Graph.Graph<N, E, T>, Err, R>;
  <N, E, T extends Graph.Kind, Err, R>(
    ref: RefGraph<N, E, T, Err, R>,
    f: (data: E) => E,
  ): Effect.Effect<Graph.Graph<N, E, T>, Err, R>;
} = dual(2, function mapEdges<
  N,
  E,
  T extends Graph.Kind,
  Err,
  R,
>(ref: RefGraph<N, E, T, Err, R>, f: (data: E) => E) {
  return RefSubject.update(ref, (g) => {
    const mutable = Graph.beginMutation(g);
    Graph.mapEdges(mutable, f);
    return Graph.endMutation(mutable);
  });
});

/**
 * Filter nodes.
 * @remarks
 * ## Why
 *
 * Applies `filterNodes` through `RefSubject.update` and publishes one coherent graph replacement;
 * this is a mutation, not a read-only Computed projection.
 *
 * ## Ownership and lifetime
 *
 * The Effect starts when run, participates in the source ref's serialized update boundary, and
 * acquires no resource. It returns the committed graph and retains the ref's E and R channels.
 * @since 1.18.0
 * @category State updates
 */
export const filterNodes: {
  <N>(
    predicate: (data: N) => boolean,
  ): <E, T extends Graph.Kind, Err, R>(
    ref: RefGraph<N, E, T, Err, R>,
  ) => Effect.Effect<Graph.Graph<N, E, T>, Err, R>;
  <N, E, T extends Graph.Kind, Err, R>(
    ref: RefGraph<N, E, T, Err, R>,
    predicate: (data: N) => boolean,
  ): Effect.Effect<Graph.Graph<N, E, T>, Err, R>;
} = dual(2, function filterNodes<
  N,
  E,
  T extends Graph.Kind,
  Err,
  R,
>(ref: RefGraph<N, E, T, Err, R>, predicate: (data: N) => boolean) {
  return RefSubject.update(ref, (g) => {
    const mutable = Graph.beginMutation(g);
    Graph.filterNodes(mutable, predicate);
    return Graph.endMutation(mutable);
  });
});

/**
 * Filter edges.
 * @remarks
 * ## Why
 *
 * Applies `filterEdges` through `RefSubject.update` and publishes one coherent graph replacement;
 * this is a mutation, not a read-only Computed projection.
 *
 * ## Ownership and lifetime
 *
 * The Effect starts when run, participates in the source ref's serialized update boundary, and
 * acquires no resource. It returns the committed graph and retains the ref's E and R channels.
 * @since 1.18.0
 * @category State updates
 */
export const filterEdges: {
  <E>(
    predicate: (data: E) => boolean,
  ): <N, T extends Graph.Kind, Err, R>(
    ref: RefGraph<N, E, T, Err, R>,
  ) => Effect.Effect<Graph.Graph<N, E, T>, Err, R>;
  <N, E, T extends Graph.Kind, Err, R>(
    ref: RefGraph<N, E, T, Err, R>,
    predicate: (data: E) => boolean,
  ): Effect.Effect<Graph.Graph<N, E, T>, Err, R>;
} = dual(2, function filterEdges<
  N,
  E,
  T extends Graph.Kind,
  Err,
  R,
>(ref: RefGraph<N, E, T, Err, R>, predicate: (data: E) => boolean) {
  return RefSubject.update(ref, (g) => {
    const mutable = Graph.beginMutation(g);
    Graph.filterEdges(mutable, predicate);
    return Graph.endMutation(mutable);
  });
});

/**
 * Reverse all edge directions.
 * @remarks
 * ## Why
 *
 * Derives the reordered graph through its Effect collection operation while retaining RefSubject
 * equality and version tracking.
 *
 * ## Ownership and lifetime
 *
 * Running reverse performs one serialized graph transition and resolves with its committed value.
 * It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const reverse = <N, E, T extends Graph.Kind, Err, R>(
  ref: RefGraph<N, E, T, Err, R>,
): Effect.Effect<Graph.Graph<N, E, T>, Err, R> =>
  RefSubject.update(ref, (g) => {
    const mutable = Graph.beginMutation(g);
    Graph.reverse(mutable);
    return Graph.endMutation(mutable);
  });

// ========================================
// Computed
// ========================================

/**
 * Get the node count.
 * @remarks
 * ## Why
 *
 * Get the node count. The operation remains attached to the RefSubject's versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The node count view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const nodeCount = <N, E, T extends Graph.Kind, Err, R>(
  ref: RefGraph<N, E, T, Err, R>,
): RefSubject.Computed<number, Err, R> => RefSubject.map(ref, Graph.nodeCount);

/**
 * Get the edge count.
 * @remarks
 * ## Why
 *
 * Get the edge count. The operation remains attached to the RefSubject's versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The edge count view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const edgeCount = <N, E, T extends Graph.Kind, Err, R>(
  ref: RefGraph<N, E, T, Err, R>,
): RefSubject.Computed<number, Err, R> => RefSubject.map(ref, Graph.edgeCount);

/**
 * Check if a node exists.
 * @remarks
 * ## Why
 *
 * Makes has node a live projection of the graph; consumers can sample it now or observe it without
 * copying the source state.
 *
 * ## Ownership and lifetime
 *
 * The has node view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category State predicates
 */
export const hasNode: {
  (
    nodeIndex: Graph.NodeIndex,
  ): <N, E, T extends Graph.Kind, Err, R>(
    ref: RefGraph<N, E, T, Err, R>,
  ) => RefSubject.Computed<boolean, Err, R>;
  <N, E, T extends Graph.Kind, Err, R>(
    ref: RefGraph<N, E, T, Err, R>,
    nodeIndex: Graph.NodeIndex,
  ): RefSubject.Computed<boolean, Err, R>;
} = dual(2, function hasNode<
  N,
  E,
  T extends Graph.Kind,
  Err,
  R,
>(ref: RefGraph<N, E, T, Err, R>, nodeIndex: Graph.NodeIndex) {
  return RefSubject.map(ref, Graph.hasNode(nodeIndex));
});

/**
 * Check if an edge exists.
 * @remarks
 * ## Why
 *
 * Makes has edge a live projection of the graph; consumers can sample it now or observe it without
 * copying the source state.
 *
 * ## Ownership and lifetime
 *
 * The has edge view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category State predicates
 */
export const hasEdge: {
  (
    source: Graph.NodeIndex,
    target: Graph.NodeIndex,
  ): <N, E, T extends Graph.Kind, Err, R>(
    ref: RefGraph<N, E, T, Err, R>,
  ) => RefSubject.Computed<boolean, Err, R>;
  <N, E, T extends Graph.Kind, Err, R>(
    ref: RefGraph<N, E, T, Err, R>,
    source: Graph.NodeIndex,
    target: Graph.NodeIndex,
  ): RefSubject.Computed<boolean, Err, R>;
} = dual(3, function hasEdge<
  N,
  E,
  T extends Graph.Kind,
  Err,
  R,
>(ref: RefGraph<N, E, T, Err, R>, source: Graph.NodeIndex, target: Graph.NodeIndex) {
  return RefSubject.map(ref, Graph.hasEdge(source, target));
});

/**
 * Get neighbors of a node.
 * @remarks
 * ## Why
 *
 * Get neighbors of a node. The operation remains attached to the RefSubject's versioned state
 * boundary.
 *
 * ## Ownership and lifetime
 *
 * The neighbors view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const neighbors: {
  (
    nodeIndex: Graph.NodeIndex,
  ): <N, E, T extends Graph.Kind, Err, R>(
    ref: RefGraph<N, E, T, Err, R>,
  ) => RefSubject.Computed<Array<Graph.NodeIndex>, Err, R>;
  <N, E, T extends Graph.Kind, Err, R>(
    ref: RefGraph<N, E, T, Err, R>,
    nodeIndex: Graph.NodeIndex,
  ): RefSubject.Computed<Array<Graph.NodeIndex>, Err, R>;
} = dual(2, function neighbors<
  N,
  E,
  T extends Graph.Kind,
  Err,
  R,
>(ref: RefGraph<N, E, T, Err, R>, nodeIndex: Graph.NodeIndex) {
  return RefSubject.map(ref, Graph.neighbors(nodeIndex));
});

/**
 * Get directed neighbors of a node.
 * @remarks
 * ## Why
 *
 * Get directed neighbors of a node. The operation remains attached to the RefSubject's versioned
 * state boundary.
 *
 * ## Ownership and lifetime
 *
 * The neighbors directed view retains no independent state. An Effect read samples the source
 * once; Fx observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const neighborsDirected: {
  (
    nodeIndex: Graph.NodeIndex,
    direction: Graph.Direction,
  ): <N, E, Err, R>(
    ref: RefGraph<N, E, "directed", Err, R>,
  ) => RefSubject.Computed<Array<Graph.NodeIndex>, Err, R>;
  <N, E, Err, R>(
    ref: RefGraph<N, E, "directed", Err, R>,
    nodeIndex: Graph.NodeIndex,
    direction: Graph.Direction,
  ): RefSubject.Computed<Array<Graph.NodeIndex>, Err, R>;
} = dual(3, function neighborsDirected<
  N,
  E,
  Err,
  R,
>(ref: RefGraph<N, E, "directed", Err, R>, nodeIndex: Graph.NodeIndex, direction: Graph.Direction) {
  return RefSubject.map(ref, Graph.neighborsDirected(nodeIndex, direction));
});

/**
 * Check if the graph is acyclic.
 * @remarks
 * ## Why
 *
 * Check if the graph is acyclic. The operation remains attached to the RefSubject's versioned
 * state boundary.
 *
 * ## Ownership and lifetime
 *
 * The is acyclic view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category State predicates
 */
export const isAcyclic = <N, E, T extends Graph.Kind, Err, R>(
  ref: RefGraph<N, E, T, Err, R>,
): RefSubject.Computed<boolean, Err, R> => RefSubject.map(ref, Graph.isAcyclic);

/**
 * Check if the graph is bipartite (undirected only).
 * @remarks
 * ## Why
 *
 * Check if the graph is bipartite (undirected only). The operation remains attached to the
 * RefSubject's versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The is bipartite view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category State predicates
 */
export const isBipartite = <N, E, Err, R>(
  ref: RefGraph<N, E, "undirected", Err, R>,
): RefSubject.Computed<boolean, Err, R> => RefSubject.map(ref, Graph.isBipartite);

/**
 * Get connected components (undirected only).
 * @remarks
 * ## Why
 *
 * Get connected components (undirected only). The operation remains attached to the RefSubject's
 * versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The connected components view retains no independent state. An Effect read samples the source
 * once; Fx observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const connectedComponents = <N, E, Err, R>(
  ref: RefGraph<N, E, "undirected", Err, R>,
): RefSubject.Computed<Array<Array<Graph.NodeIndex>>, Err, R> =>
  RefSubject.map(ref, Graph.connectedComponents);

/**
 * Get strongly connected components.
 * @remarks
 * ## Why
 *
 * Get strongly connected components. The operation remains attached to the RefSubject's versioned
 * state boundary.
 *
 * ## Ownership and lifetime
 *
 * The strongly connected components view retains no independent state. An Effect read samples the
 * source once; Fx observation follows later pushes and its observing Scope owns subscription
 * cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const stronglyConnectedComponents = <N, E, Err, R>(
  ref: RefGraph<N, E, "directed", Err, R>,
): RefSubject.Computed<Array<Array<Graph.NodeIndex>>, Err, R> =>
  RefSubject.map(ref, Graph.stronglyConnectedComponents);

// ========================================
// Filtered
// ========================================

/**
 * Get a node's data.
 * @remarks
 * ## Why
 *
 * Models the possibly absent result of get node as Filtered state, so absence stays explicit while
 * later source versions can make a value available.
 *
 * ## Ownership and lifetime
 *
 * The get node view retains no independent value. Its Effect read fails with NoSuchElement
 * while absent; the observing Scope owns and finalizes its Fx subscription.
 *
 * @since 1.18.0
 * @category Optional queries
 */
export const getNode: {
  (
    nodeIndex: Graph.NodeIndex,
  ): <N, E, T extends Graph.Kind, Err, R>(
    ref: RefGraph<N, E, T, Err, R>,
  ) => RefSubject.Filtered<N, Err, R>;
  <N, E, T extends Graph.Kind, Err, R>(
    ref: RefGraph<N, E, T, Err, R>,
    nodeIndex: Graph.NodeIndex,
  ): RefSubject.Filtered<N, Err, R>;
} = dual(2, function getNode<
  N,
  E,
  T extends Graph.Kind,
  Err,
  R,
>(ref: RefGraph<N, E, T, Err, R>, nodeIndex: Graph.NodeIndex) {
  return RefSubject.filterMap(ref, Graph.getNode(nodeIndex));
});

/**
 * Get an edge's data.
 * @remarks
 * ## Why
 *
 * Models the possibly absent result of get edge as Filtered state, so absence stays explicit while
 * later source versions can make a value available.
 *
 * ## Ownership and lifetime
 *
 * The get edge view retains no independent value. Its Effect read fails with NoSuchElement
 * while absent; the observing Scope owns and finalizes its Fx subscription.
 *
 * @since 1.18.0
 * @category Optional queries
 */
export const getEdge: {
  (
    edgeIndex: Graph.EdgeIndex,
  ): <N, E, T extends Graph.Kind, Err, R>(
    ref: RefGraph<N, E, T, Err, R>,
  ) => RefSubject.Filtered<Graph.Edge<E>, Err, R>;
  <N, E, T extends Graph.Kind, Err, R>(
    ref: RefGraph<N, E, T, Err, R>,
    edgeIndex: Graph.EdgeIndex,
  ): RefSubject.Filtered<Graph.Edge<E>, Err, R>;
} = dual(2, function getEdge<
  N,
  E,
  T extends Graph.Kind,
  Err,
  R,
>(ref: RefGraph<N, E, T, Err, R>, edgeIndex: Graph.EdgeIndex) {
  return RefSubject.filterMap(ref, (g) => Graph.getEdge(g, edgeIndex));
});

/**
 * Find a node matching a predicate.
 * @remarks
 * ## Why
 *
 * Models the possibly absent result of find node as Filtered state, so absence stays explicit
 * while later source versions can make a value available.
 *
 * ## Ownership and lifetime
 *
 * The find node view retains no independent value. Its Effect read fails with NoSuchElement
 * while absent; the observing Scope owns and finalizes its Fx subscription.
 *
 * @since 1.18.0
 * @category Optional queries
 */
export const findNode: {
  <N>(
    predicate: (data: N) => boolean,
  ): <E, T extends Graph.Kind, Err, R>(
    ref: RefGraph<N, E, T, Err, R>,
  ) => RefSubject.Filtered<Graph.NodeIndex, Err, R>;
  <N, E, T extends Graph.Kind, Err, R>(
    ref: RefGraph<N, E, T, Err, R>,
    predicate: (data: N) => boolean,
  ): RefSubject.Filtered<Graph.NodeIndex, Err, R>;
} = dual(2, function findNode<
  N,
  E,
  T extends Graph.Kind,
  Err,
  R,
>(ref: RefGraph<N, E, T, Err, R>, predicate: (data: N) => boolean) {
  return RefSubject.filterMap(ref, (g) => Graph.findNode(g, predicate));
});

/**
 * Find an edge matching a predicate.
 * @remarks
 * ## Why
 *
 * Models the possibly absent result of find edge as Filtered state, so absence stays explicit
 * while later source versions can make a value available.
 *
 * ## Ownership and lifetime
 *
 * The find edge view retains no independent value. Its Effect read fails with NoSuchElement
 * while absent; the observing Scope owns and finalizes its Fx subscription.
 *
 * @since 1.18.0
 * @category Optional queries
 */
export const findEdge: {
  <E>(
    predicate: (edge: E) => boolean,
  ): <N, T extends Graph.Kind, Err, R>(
    ref: RefGraph<N, E, T, Err, R>,
  ) => RefSubject.Filtered<Graph.EdgeIndex, Err, R>;
  <N, E, T extends Graph.Kind, Err, R>(
    ref: RefGraph<N, E, T, Err, R>,
    predicate: (edge: E) => boolean,
  ): RefSubject.Filtered<Graph.EdgeIndex, Err, R>;
} = dual(2, function findEdge<
  N,
  E,
  T extends Graph.Kind,
  Err,
  R,
>(ref: RefGraph<N, E, T, Err, R>, predicate: (edge: E) => boolean) {
  return RefSubject.filterMap(ref, (g) => Graph.findEdge(g, predicate));
});
