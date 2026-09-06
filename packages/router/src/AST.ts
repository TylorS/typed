import type { Cause } from "effect/Cause";
import { succeedSome } from "effect/Effect";
import type { Top } from "effect/Schema";
import type { Transformation } from "effect/SchemaTransformation";
import type { Fx } from "@typed/fx/Fx";
import type { RefSubject } from "@typed/fx/RefSubject";
import type { Guard } from "@typed/guard";
import type { AnyLayer, Layout as LayoutType, MatchHandler } from "./Matcher.js";

/**
 * The union of path, parameter, wildcard, slash, and query AST nodes.
 *
 * @remarks
 * ## Why
 * One explicit syntax tree feeds formatting, schema derivation, and matcher compilation.
 *
 * ## Ownership and lifetime
 * `PathAst` describes plain readonly AST data. Routes and Matchers retain the concrete nodes they receive by reference; the type itself owns no resource.
 *
 * @since 1.0.0
 * @category Path syntax
 */
export type PathAst =
  | PathAst.Literal
  | PathAst.Parameter
  | PathAst.Slash
  | PathAst.Wildcard
  | PathAst.QueryParams;

export declare namespace PathAst {
  /**
   * An exact literal path or query-value AST node.
   *
   * @remarks
   * ## Why
   * Literal nodes constrain matching without adding decoded parameters.
   *
   * ## Ownership and lifetime
   * `Literal` describes plain readonly AST data. Routes and Matchers retain the concrete nodes they receive by reference; the type itself owns no resource.
   *
   * @since 1.0.0
   * @category Path syntax
   */
  export type Literal = {
    /**
     * Discriminates an exact literal node.
     *
     * @remarks
     * ## Why
     * Formatters and match compilers can branch without hidden classes.
     *
     * ## Ownership and lifetime
     * The string literal is stored directly on the plain AST object for that object's lifetime.
     *
     * @since 1.0.0
     * @category Path syntax
     */
    type: "literal";
    /**
     * Exact source text required by this node.
     *
     * @remarks
     * ## Why
     * Literal matching and formatting must preserve the same spelling.
     *
     * ## Ownership and lifetime
     * The node retains the immutable string value and acquires no matcher resource.
     *
     * @since 1.0.0
     * @category Path syntax
     */
    value: string;
  };
  /**
   * A named path parameter with optionality and an optional regular expression.
   *
   * @remarks
   * ## Why
   * Parameter constraints stay available to both matcher registration and schema derivation.
   *
   * ## Ownership and lifetime
   * `Parameter` describes plain readonly AST data. Routes and Matchers retain the concrete nodes they receive by reference; the type itself owns no resource.
   *
   * @since 1.0.0
   * @category Path syntax
   */
  export type Parameter = {
    /**
     * Discriminates a named parameter node.
     *
     * @remarks
     * ## Why
     * Schema derivation and matcher compilation must recognize captured segments identically.
     *
     * ## Ownership and lifetime
     * The literal tag remains on the plain node for its lifetime and owns no resource.
     *
     * @since 1.0.0
     * @category Path syntax
     */
    type: "parameter";
    /**
     * Name assigned to the decoded parameter field.
     *
     * @remarks
     * ## Why
     * Duplicate decoded names can be rejected before matcher execution.
     *
     * ## Ownership and lifetime
     * The node retains the immutable name; decoded values are owned by the selected route's params
     * RefSubject, not by this AST.
     *
     * @since 1.0.0
     * @category Path syntax
     */
    name: string;
    /**
     * Whether this segment may be absent.
     *
     * @remarks
     * ## Why
     * Optionality controls both matcher syntax and optional schema fields.
     *
     * ## Ownership and lifetime
     * The flag is immutable metadata retained with the node and creates no fallback value itself.
     *
     * @since 1.0.0
     * @category Path syntax
     */
    optional?: boolean;
    /**
     * Optional source pattern constraining the captured segment.
     *
     * @remarks
     * ## Why
     * Constrained and generic parameters can compile to distinct matcher path shapes.
     *
     * ## Ownership and lifetime
     * The node retains the pattern string. Matcher compilation interprets it later and can surface
     * invalid registration syntax as `RouteDecodeError`.
     *
     * @since 1.0.0
     * @category Path syntax
     */
    regex?: string;
  };

  /**
   * A Route that captures an unconstrained remainder.
   *
   * @remarks
   * ## Why
   * Catch-all matching is explicit and can be ordered after constrained routes.
   *
   * ## Ownership and lifetime
   * `Wildcard` describes plain readonly AST data. Routes and Matchers retain the concrete nodes they receive by reference; the type itself owns no resource.
   *
   * @since 1.0.0
   * @category Path syntax
   */
  export type Wildcard = {
    /**
     * Discriminates a terminal wildcard node.
     *
     * @remarks
     * ## Why
     * Catch-all path matching stays explicit in compilation and formatting.
     *
     * ## Ownership and lifetime
     * The literal tag is the node's only state and owns no captured path value.
     *
     * @since 1.0.0
     * @category Path syntax
     */
    type: "wildcard";
  };

  /**
   * The root slash Route.
   *
   * @remarks
   * ## Why
   * Root matching remains an explicit route value rather than an empty sentinel.
   *
   * ## Ownership and lifetime
   * `Slash` describes plain readonly AST data. Routes and Matchers retain the concrete nodes they receive by reference; the type itself owns no resource.
   *
   * @since 1.0.0
   * @category Path syntax
   */
  export type Slash = {
    /**
     * Discriminates the explicit root slash node.
     *
     * @remarks
     * ## Why
     * Root formatting does not depend on an empty or missing AST sentinel.
     *
     * ## Ownership and lifetime
     * The literal tag is immutable plain data and acquires no resource.
     *
     * @since 1.0.0
     * @category Path syntax
     */
    type: "slash";
  };

  /**
   * A collection of declared query-parameter AST nodes.
   *
   * @remarks
   * ## Why
   * Only declared query keys participate in matching and decoding; undeclared keys are ignored.
   *
   * ## Ownership and lifetime
   * `QueryParams` describes plain readonly AST data. Routes and Matchers retain the concrete nodes they receive by reference; the type itself owns no resource.
   *
   * @since 1.0.0
   * @category Path syntax
   */
  export type QueryParams = {
    /**
     * Discriminates the query-declaration collection.
     *
     * @remarks
     * ## Why
     * Query parsing begins only for explicitly declared query nodes.
     *
     * ## Ownership and lifetime
     * The literal tag is retained with this plain node and owns no URL state.
     *
     * @since 1.0.0
     * @category Path syntax
     */
    type: "query-params";
    /**
     * Query declarations in source order.
     *
     * @remarks
     * ## Why
     * Formatting and schema-field derivation preserve declaration order.
     *
     * ## Ownership and lifetime
     * The node retains the supplied readonly array by reference; callers must not mutate it after
     * constructing the AST.
     *
     * @since 1.0.0
     * @category Path syntax
     */
    value: ReadonlyArray<PathAst.QueryParam>;
  };

  /**
   * One named query key and its literal or parameter value AST.
   *
   * @remarks
   * ## Why
   * Query constraints and decoded values use the same route-language representation.
   *
   * ## Ownership and lifetime
   * `QueryParam` describes plain readonly AST data. Routes and Matchers retain the concrete nodes they receive by reference; the type itself owns no resource.
   *
   * @since 1.0.0
   * @category Path syntax
   */
  export type QueryParam = {
    /**
     * Discriminates one named query declaration.
     *
     * @remarks
     * ## Why
     * Query keys and their value grammar remain one structural unit.
     *
     * ## Ownership and lifetime
     * The literal tag is retained with the plain node and owns no request URL.
     *
     * @since 1.0.0
     * @category Path syntax
     */
    type: "query-param";
    /**
     * Input query-string key.
     *
     * @remarks
     * ## Why
     * Only named declarations are copied from URL search parameters into decoding input.
     *
     * ## Ownership and lifetime
     * The node retains this immutable string; request-specific values are created during matching.
     *
     * @since 1.0.0
     * @category Path syntax
     */
    name: string;
    /**
     * Literal, parameter, or wildcard grammar for the query value.
     *
     * @remarks
     * ## Why
     * Literal constraints and decoded query fields use the same Path AST vocabulary.
     *
     * ## Ownership and lifetime
     * The child AST is retained by reference and remains owned by the route tree containing it.
     *
     * @since 1.0.0
     * @category Path syntax
     */
    value: PathAst;
  };
}

/**
 * Constructs an exact literal Path AST node.
 *
 * @remarks
 * ## Why
 * Runtime route builders need the same explicit literal representation used by formatting and matching.
 *
 * ## Ownership and lifetime
 * `literal` returns a fresh plain AST node immediately and retains any supplied child nodes or arrays by reference; it acquires no external resource.
 *
 * @since 1.0.0
 * @category Path syntax
 */
export const literal = (value: string): PathAst.Literal => ({ type: "literal", value });
/**
 * Constructs a named parameter Path AST node with optional and regex constraints.
 *
 * @remarks
 * ## Why
 * Runtime builders retain constraints for matcher registration and schema derivation.
 *
 * ## Ownership and lifetime
 * `parameter` returns a fresh plain AST node immediately and retains any supplied child nodes or arrays by reference; it acquires no external resource.
 *
 * @since 1.0.0
 * @category Path syntax
 */
export const parameter = (name: string, optional?: boolean, regex?: string): PathAst.Parameter => ({
  type: "parameter",
  name,
  ...(optional ? { optional } : {}),
  ...(regex ? { regex } : {}),
});
/**
 * Constructs a terminal wildcard Path AST node.
 *
 * @remarks
 * ## Why
 * Catch-all syntax remains explicit and orderable among other route cases.
 *
 * ## Ownership and lifetime
 * `wildcard` returns a fresh plain AST node immediately and retains any supplied child nodes or arrays by reference; it acquires no external resource.
 *
 * @since 1.0.0
 * @category Path syntax
 */
export const wildcard = (): PathAst.Wildcard => ({ type: "wildcard" });
/**
 * Constructs a root slash Path AST node.
 *
 * @remarks
 * ## Why
 * Root syntax is represented without an empty or nullable sentinel.
 *
 * ## Ownership and lifetime
 * `slash` returns a fresh plain AST node immediately and retains any supplied child nodes or arrays by reference; it acquires no external resource.
 *
 * @since 1.0.0
 * @category Path syntax
 */
export const slash = (): PathAst.Slash => ({ type: "slash" });
/**
 * Constructs a query-parameter collection Path AST node.
 *
 * @remarks
 * ## Why
 * Declared query keys remain grouped for matcher input and schema analysis.
 *
 * ## Ownership and lifetime
 * `queryParams` returns a fresh plain AST node immediately and retains any supplied child nodes or arrays by reference; it acquires no external resource.
 *
 * @since 1.0.0
 * @category Path syntax
 */
export const queryParams = (value: ReadonlyArray<PathAst.QueryParam>): PathAst.QueryParams => ({
  type: "query-params",
  value,
});
/**
 * Constructs one named query-parameter AST node.
 *
 * @remarks
 * ## Why
 * Literal and decoded query policies share the same value AST representation.
 *
 * ## Ownership and lifetime
 * `queryParam` returns a fresh plain AST node immediately and retains any supplied child nodes or arrays by reference; it acquires no external resource.
 *
 * @since 1.0.0
 * @category Path syntax
 */
export const queryParam = (name: string, value: PathAst): PathAst.QueryParam => ({
  type: "query-param",
  name,
  value,
});

/**
 * The union of path, schema-transform, and joined route nodes.
 *
 * @remarks
 * ## Why
 * Route composition preserves transformations instead of flattening them into an untyped string.
 *
 * ## Ownership and lifetime
 * `RouteAst` describes plain readonly AST data. Routes and Matchers retain the concrete nodes they receive by reference; the type itself owns no resource.
 *
 * @since 1.0.0
 * @category Path syntax
 */
export type RouteAst = RouteAst.Path | RouteAst.Transform | RouteAst.Join;

export declare namespace RouteAst {
  /**
   * A Route AST node containing one Path AST atom.
   *
   * @remarks
   * ## Why
   * Atomic syntax can be joined or schema-transformed without losing structure.
   *
   * ## Ownership and lifetime
   * `Path` describes plain readonly AST data. Routes and Matchers retain the concrete nodes they receive by reference; the type itself owns no resource.
   *
   * @since 1.0.0
   * @category Route structure
   */
  export interface Path {
    /**
     * The discriminant identifying this AST variant.
     *
     * @remarks
     * ## Why
     * Exhaustive switches can interpret syntax without instanceof checks or hidden classes.
     *
     * ## Ownership and lifetime
     * `Path` describes plain readonly AST data. Routes and Matchers retain the concrete nodes they receive by reference; the type itself owns no resource.
     *
     * @since 1.0.0
     * @category Route structure
     */
    type: "path";
    /**
     * Constructs a Route AST node from one Path AST atom.
     *
     * @remarks
     * ## Why
     * Path syntax can participate in route joins and schema transformations without reparsing strings.
     *
     * ## Ownership and lifetime
     * `RouteAst.Path` retains the child `PathAst` by reference; formatting and compilation read that
     * same node without reparsing or copying it.
     *
     * @since 1.0.0
     * @category Route structure
     */
    path: PathAst;
  }

  /**
   * A Route AST node carrying an Effect Schema transformation.
   *
   * @remarks
   * ## Why
   * Schema-backed parameters can change decoded types while retaining their encoded route shape.
   *
   * ## Ownership and lifetime
   * `Transform` describes plain readonly AST data. Routes and Matchers retain the concrete nodes they receive by reference; the type itself owns no resource.
   *
   * @since 1.0.0
   * @category Route structure
   */
  export interface Transform {
    /**
     * The discriminant identifying this AST variant.
     *
     * @remarks
     * ## Why
     * Exhaustive switches can interpret syntax without instanceof checks or hidden classes.
     *
     * ## Ownership and lifetime
     * `Transform` describes plain readonly AST data. Routes and Matchers retain the concrete nodes they receive by reference; the type itself owns no resource.
     *
     * @since 1.0.0
     * @category Route structure
     */
    type: "transform";
    /**
     * The encoded Route AST consumed by a schema transformation.
     *
     * @remarks
     * ## Why
     * The executor can decode from the path-shaped representation before producing the transformed type.
     *
     * ## Ownership and lifetime
     * `RouteAst.Transform` retains the encoded child Route AST by reference for later schema
     * projection and decoding.
     *
     * @since 1.0.0
     * @category Route structure
     */
    from: RouteAst;
    /**
     * The target Effect Schema for transformed route parameters.
     *
     * @remarks
     * ## Why
     * The route carries the exact decoded type and its service requirements.
     *
     * ## Ownership and lifetime
     * The containing `Transform` node retains its `to` Schema by reference; services are acquired only when that Schema runs.
     *
     * @since 1.0.0
     * @category Route structure
     */
    to: Top;
    /**
     * The Effect Schema transformation applied to route parameters.
     *
     * @remarks
     * ## Why
     * Decode and encode behavior, errors, and service requirements remain in the schema contract.
     *
     * ## Ownership and lifetime
     * The transformation object is retained by reference. Any services it requires are acquired by
     * the Effect that later runs the derived Schema.
     *
     * @since 1.0.0
     * @category Route structure
     */
    transformation: Transformation<any, any, any, any>;
  }

  /**
   * A Route AST node containing ordered child routes.
   *
   * @remarks
   * ## Why
   * Composition retains child schema boundaries and parameter ownership.
   *
   * ## Ownership and lifetime
   * `Join` describes plain readonly AST data. Routes and Matchers retain the concrete nodes they receive by reference; the type itself owns no resource.
   *
   * @since 1.0.0
   * @category Route structure
   */
  export interface Join {
    /**
     * The discriminant identifying this AST variant.
     *
     * @remarks
     * ## Why
     * Exhaustive switches can interpret syntax without instanceof checks or hidden classes.
     *
     * ## Ownership and lifetime
     * `Join` describes plain readonly AST data. Routes and Matchers retain the concrete nodes they receive by reference; the type itself owns no resource.
     *
     * @since 1.0.0
     * @category Route structure
     */
    type: "join";
    /**
     * The ordered child Route AST nodes in a join.
     *
     * @remarks
     * ## Why
     * Formatting and schema merging preserve declaration order and detect duplicate decoded names.
     *
     * ## Ownership and lifetime
     * The join node retains the supplied readonly array and child nodes by reference; callers must
     * not mutate the array after construction.
     *
     * @since 1.0.0
     * @category Route structure
     */
    parts: ReadonlyArray<RouteAst>;
  }
}

/**
 * Constructs a Route AST node from one Path AST atom.
 *
 * @remarks
 * ## Why
 * Path syntax can participate in route joins and schema transformations without reparsing strings.
 *
 * ## Ownership and lifetime
 * `path` returns a fresh plain AST node immediately and retains any supplied child nodes or arrays by reference; it acquires no external resource.
 *
 * @since 1.0.0
 * @category Route structure
 */
export const path = (path: PathAst): RouteAst.Path => ({ type: "path", path });
/**
 * Constructs a schema-transforming Route AST node.
 *
 * @remarks
 * ## Why
 * The encoded route shape and decoded Effect Schema type remain linked.
 *
 * ## Ownership and lifetime
 * `transform` returns a fresh plain AST node immediately and retains any supplied child nodes or arrays by reference; it acquires no external resource.
 *
 * @since 1.0.0
 * @category Route structure
 */
export const transform = (
  from: RouteAst,
  to: Top,
  transformation: Transformation<any, any, any, any>,
): RouteAst.Transform => ({
  type: "transform",
  from,
  to,
  transformation,
});
/**
 * Constructs an ordered joined Route AST node.
 *
 * @remarks
 * ## Why
 * Nested route schemas and parameter ownership remain visible after composition.
 *
 * ## Ownership and lifetime
 * `join` returns a fresh plain AST node immediately and retains any supplied child nodes or arrays by reference; it acquires no external resource.
 *
 * @since 1.0.0
 * @category Route structure
 */
export const join = (parts: ReadonlyArray<RouteAst>): RouteAst.Join => ({ type: "join", parts });

/**
 * The union of route, dependency, layout, prefix, and catch matcher nodes.
 *
 * @remarks
 * ## Why
 * Matcher composition remains inspectable before runtime compilation.
 *
 * ## Ownership and lifetime
 * `MatchAst` describes plain readonly AST data. Routes and Matchers retain the concrete nodes they receive by reference; the type itself owns no resource.
 *
 * @since 1.0.0
 * @category Route structure
 */
export type MatchAst =
  | MatchAst.Route
  | MatchAst.Layer
  | MatchAst.Layout
  | MatchAst.Prefixed
  | MatchAst.Catch;

export declare namespace MatchAst {
  /**
   * A Match AST candidate containing one Route AST, Guard, and output handler.
   *
   * @remarks
   * ## Why
   * Decoding, guard selection, and output stay attached in declaration order.
   *
   * ## Ownership and lifetime
   * `Route` describes plain readonly AST data. Routes and Matchers retain the concrete nodes they receive by reference; the type itself owns no resource.
   *
   * @since 1.0.0
   * @category Matcher composition syntax
   */
  export interface Route {
    /**
     * The discriminant identifying this AST variant.
     *
     * @remarks
     * ## Why
     * Exhaustive switches can interpret syntax without instanceof checks or hidden classes.
     *
     * ## Ownership and lifetime
     * `Route` describes plain readonly AST data. Routes and Matchers retain the concrete nodes they receive by reference; the type itself owns no resource.
     *
     * @since 1.0.0
     * @category Matcher composition syntax
     */
    type: "route";
    /**
     * Constructs a route-case Match AST node with its guard and handler.
     *
     * @remarks
     * ## Why
     * Candidate order, decoding, guard selection, and output remain one inspectable registration unit.
     *
     * ## Ownership and lifetime
     * The Match AST retains the immutable Route AST by reference until the Matcher becomes
     * unreachable.
     *
     * @since 1.0.0
     * @category Matcher composition syntax
     */
    route: RouteAst;
    /**
     * The guard evaluated after parameter decoding and dependency preparation.
     *
     * @remarks
     * ## Why
     * A `Some` selects the candidate; `None` or failure can fall through without mounting its handler.
     *
     * ## Ownership and lifetime
     * The guard function is retained with the candidate. Its Effect and service requirements begin
     * only when the executor evaluates that candidate.
     *
     * @since 1.0.0
     * @category Matcher composition syntax
     */
    guard: Guard<any, any, any, any>;
    /**
     * The output producer mounted for a selected route.
     *
     * @remarks
     * ## Why
     * Values, Effect, Stream, and Fx all normalize to the same push-based Fx contract.
     *
     * ## Ownership and lifetime
     * The producer is retained with the candidate; the selected route Scope owns the Fx it returns
     * and interrupts that Fx on replacement.
     *
     * @since 1.0.0
     * @category Matcher composition syntax
     */
    handler: MatchHandler<any, any, any, any>;
  }

  /**
   * A Match AST boundary carrying route-local Effect Layers.
   *
   * @remarks
   * ## Why
   * Dependencies can be prepared, committed, rolled back, and finalized with candidate selection.
   *
   * ## Ownership and lifetime
   * `Layer` describes plain readonly AST data. Routes and Matchers retain the concrete nodes they receive by reference; the type itself owns no resource.
   *
   * @since 1.0.0
   * @category Matcher composition syntax
   */
  export interface Layer {
    /**
     * The discriminant identifying this AST variant.
     *
     * @remarks
     * ## Why
     * Exhaustive switches can interpret syntax without instanceof checks or hidden classes.
     *
     * ## Ownership and lifetime
     * `Layer` describes plain readonly AST data. Routes and Matchers retain the concrete nodes they receive by reference; the type itself owns no resource.
     *
     * @since 1.0.0
     * @category Matcher composition syntax
     */
    type: "layer";
    /**
     * The ordered child matcher nodes wrapped by this boundary.
     *
     * @remarks
     * ## Why
     * Order is preserved for candidate and guard fallthrough.
     *
     * ## Ownership and lifetime
     * The Layer boundary retains this ordered child array by reference so compilation preserves
     * same-path candidate fallthrough.
     *
     * @since 1.0.0
     * @category Matcher composition syntax
     */
    matches: ReadonlyArray<MatchAst>;
    /**
     * The Effect Layers attached to a matcher subtree.
     *
     * @remarks
     * ## Why
     * Candidate services and their failures stay explicit during preparation and rollback.
     *
     * ## Ownership and lifetime
     * Layer values are retained by identity. The executor's Layer manager, not the AST, owns their
     * acquired child Scopes and rollback.
     *
     * @since 1.0.0
     * @category Matcher composition syntax
     */
    deps: ReadonlyArray<AnyLayer>;
  }

  /**
   * A function that wraps matched content using reactive params.
   *
   * @remarks
   * ## Why
   * Layout output, errors, and services compose in the surrounding Matcher type.
   *
   * ## Ownership and lifetime
   * `Layout` describes plain readonly AST data. Routes and Matchers retain the concrete nodes they receive by reference; the type itself owns no resource.
   *
   * @since 1.0.0
   * @category Matcher composition syntax
   */
  export interface Layout {
    /**
     * The discriminant identifying this AST variant.
     *
     * @remarks
     * ## Why
     * Exhaustive switches can interpret syntax without instanceof checks or hidden classes.
     *
     * ## Ownership and lifetime
     * `Layout` describes plain readonly AST data. Routes and Matchers retain the concrete nodes they receive by reference; the type itself owns no resource.
     *
     * @since 1.0.0
     * @category Matcher composition syntax
     */
    type: "layout";
    /**
     * The ordered child matcher nodes wrapped by this boundary.
     *
     * @remarks
     * ## Why
     * Order is preserved for candidate and guard fallthrough.
     *
     * ## Ownership and lifetime
     * The layout boundary retains this ordered child array by reference; it owns no child execution
     * Scope until the Matcher runs.
     *
     * @since 1.0.0
     * @category Matcher composition syntax
     */
    matches: ReadonlyArray<MatchAst>;
    /**
     * Constructs a Match AST boundary around a parameter-aware layout.
     *
     * @remarks
     * ## Why
     * Layout ownership and nesting remain explicit in the compiled matcher tree.
     *
     * ## Ownership and lifetime
     * The layout function is retained by identity so the executor can reuse its child Scope across
     * parameter-only transitions.
     *
     * @since 1.0.0
     * @category Matcher composition syntax
     */
    layout: LayoutType<any, any, any, any, any, any, any>;
  }

  /**
   * A Match AST node that structurally prefixes nested cases.
   *
   * @remarks
   * ## Why
   * Nested route tables can be mounted without rewriting each child route.
   *
   * ## Ownership and lifetime
   * `Prefixed` describes plain readonly AST data. Routes and Matchers retain the concrete nodes they receive by reference; the type itself owns no resource.
   *
   * @since 1.0.0
   * @category Matcher composition syntax
   */
  export interface Prefixed {
    /**
     * The discriminant identifying this AST variant.
     *
     * @remarks
     * ## Why
     * Exhaustive switches can interpret syntax without instanceof checks or hidden classes.
     *
     * ## Ownership and lifetime
     * `Prefixed` describes plain readonly AST data. Routes and Matchers retain the concrete nodes they receive by reference; the type itself owns no resource.
     *
     * @since 1.0.0
     * @category Matcher composition syntax
     */
    type: "prefixed";
    /**
     * The ordered child matcher nodes wrapped by this boundary.
     *
     * @remarks
     * ## Why
     * Order is preserved for candidate and guard fallthrough.
     *
     * ## Ownership and lifetime
     * The prefix boundary retains this ordered child array by reference and applies the prefix only
     * during structural compilation.
     *
     * @since 1.0.0
     * @category Matcher composition syntax
     */
    matches: ReadonlyArray<MatchAst>;
    /**
     * The Route AST prepended to nested matcher cases.
     *
     * @remarks
     * ## Why
     * Prefixing remains structural and participates in schema/path compilation.
     *
     * ## Ownership and lifetime
     * The prefix Route AST is retained by reference and owns no decoded parameter state.
     *
     * @since 1.0.0
     * @category Matcher composition syntax
     */
    prefix: RouteAst;
  }

  /**
   * A Match AST node defining a reactive cause boundary.
   *
   * @remarks
   * ## Why
   * Complete Effect causes remain available to fallback UI rather than collapsing to strings.
   *
   * ## Ownership and lifetime
   * `Catch` describes plain readonly AST data. Routes and Matchers retain the concrete nodes they receive by reference; the type itself owns no resource.
   *
   * @since 1.0.0
   * @category Matcher composition syntax
   */
  export interface Catch {
    /**
     * The discriminant identifying this AST variant.
     *
     * @remarks
     * ## Why
     * Exhaustive switches can interpret syntax without instanceof checks or hidden classes.
     *
     * ## Ownership and lifetime
     * `Catch` describes plain readonly AST data. Routes and Matchers retain the concrete nodes they receive by reference; the type itself owns no resource.
     *
     * @since 1.0.0
     * @category Matcher composition syntax
     */
    type: "catch";
    /**
     * The ordered child matcher nodes wrapped by this boundary.
     *
     * @remarks
     * ## Why
     * Order is preserved for candidate and guard fallthrough.
     *
     * ## Ownership and lifetime
     * The catch boundary retains this ordered child array by reference; active boundary Scopes are
     * created only when its Matcher runs.
     *
     * @since 1.0.0
     * @category Matcher composition syntax
     */
    matches: ReadonlyArray<MatchAst>;
    /**
     * The reactive complete-cause handler attached to a catch AST node.
     *
     * @remarks
     * ## Why
     * Fallback output can observe changing Effect causes while preserving typed Fx composition.
     *
     * ## Ownership and lifetime
     * The handler function is retained by identity. The catch manager owns its cause RefSubject and
     * fallback Fx in a child Scope while the boundary remains selected.
     *
     * @since 1.0.0
     * @category Matcher composition syntax
     */
    f: (cause: RefSubject<Cause<any>>) => Fx<any, any, any>;
  }
}

/**
 * Constructs a route-case Match AST node with its guard and handler.
 *
 * @remarks
 * ## Why
 * Candidate order, decoding, guard selection, and output remain one inspectable registration unit.
 *
 * ## Ownership and lifetime
 * `route` returns a fresh plain AST node immediately and retains any supplied child nodes or arrays by reference; it acquires no external resource.
 *
 * @since 1.0.0
 * @category Matcher composition syntax
 */
export const route = (
  route: RouteAst,
  handler: MatchHandler<any, any, any, any>,
  guard: Guard<any, any, any, any> = succeedSome,
): MatchAst.Route => ({ type: "route", route, guard, handler });

/**
 * Wraps Match AST nodes with Effect Layer dependencies.
 *
 * @remarks
 * ## Why
 * Candidate acquisition and rollback boundaries stay local to the wrapped route subtree.
 *
 * ## Ownership and lifetime
 * `layer` returns a fresh plain AST node immediately and retains any supplied child nodes or arrays by reference; it acquires no external resource.
 *
 * @since 1.0.0
 * @category Matcher composition syntax
 */
export const layer = (
  matches: ReadonlyArray<MatchAst>,
  deps: ReadonlyArray<AnyLayer>,
): MatchAst.Layer => ({ type: "layer", matches, deps });

/**
 * Constructs a Match AST boundary around a parameter-aware layout.
 *
 * @remarks
 * ## Why
 * Layout ownership and nesting remain explicit in the compiled matcher tree.
 *
 * ## Ownership and lifetime
 * `layout` returns a fresh plain AST node immediately and retains any supplied child nodes or arrays by reference; it acquires no external resource.
 *
 * @since 1.0.0
 * @category Matcher composition syntax
 */
export const layout = (
  matches: ReadonlyArray<MatchAst>,
  layout: LayoutType<any, any, any, any, any, any, any>,
): MatchAst.Layout => ({ type: "layout", matches, layout });

/**
 * Wraps Match AST nodes with a structural Route prefix.
 *
 * @remarks
 * ## Why
 * Nested tables can be mounted without rewriting child paths.
 *
 * ## Ownership and lifetime
 * `prefixed` returns a fresh plain AST node immediately and retains any supplied child nodes or arrays by reference; it acquires no external resource.
 *
 * @since 1.0.0
 * @category Matcher composition syntax
 */
export const prefixed = (
  matches: ReadonlyArray<MatchAst>,
  prefix: RouteAst,
): MatchAst.Prefixed => ({ type: "prefixed", matches, prefix });

/**
 * Constructs a Match AST complete-cause boundary.
 *
 * @remarks
 * ## Why
 * Fallback Fx output can observe full Effect causes without erasing defects or interruption.
 *
 * ## Ownership and lifetime
 * `catchCause` returns a fresh plain AST node immediately and retains any supplied child nodes or arrays by reference; it acquires no external resource.
 *
 * @since 1.0.0
 * @category Matcher composition syntax
 */
export const catchCause = (
  matches: ReadonlyArray<MatchAst>,
  f: (cause: RefSubject<Cause<any>>) => Fx<any, any, any>,
): MatchAst.Catch => ({ type: "catch", matches, f });
