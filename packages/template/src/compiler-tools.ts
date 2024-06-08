/**
 * A collection of tools utilized by @typed/compiler to setup templates imperatively.
 * This is not intended for direct usage by end-users and the API surface is not guaranteed
 * to have the same stabilitiy as the rest of the library.
 *
 * @since 1.0.0
 */

import type { Option } from "effect"
import type * as Cause from "effect/Cause"
import type * as Chunk from "effect/Chunk"
import type * as Effect from "effect/Effect"
import type * as Scope from "effect/Scope"
import type * as internalHydrateContext from "./internal/HydrateContext.js"
import * as utils from "./internal/utils.js"
import * as hydrationTemplate from "./internal/v2/hydration-template.js"
import * as render from "./internal/v2/render.js"
import type { Placeholder } from "./Placeholder.js"
import type { Renderable } from "./Renderable.js"
import type { RenderContext } from "./RenderContext.js"
import type { RenderQueue } from "./RenderQueue.js"
import type * as Template from "./Template.js"

/**
 * @since 1.0.0
 */
export interface TemplateContext extends render.TemplateContext {}

/**
 * @since 1.0.0
 */
export interface HydrateContext extends internalHydrateContext.HydrateContext {}

/**
 * @since 1.0.0
 */
export interface HydrationTemplate extends hydrationTemplate.HydrationTemplate {}

/**
 * @since 1.0.0
 */
export type HydrationNode = hydrationTemplate.HydrationNode

/**
 * @since 1.0.0
 */
export interface HydrationHole extends hydrationTemplate.HydrationHole {}

/**
 * @since 1.0.0
 */
export interface HydrationMany extends hydrationTemplate.HydrationMany {}

/**
 * @since 1.0.0
 */
export interface HydrationElement extends hydrationTemplate.HydrationElement {}

/**
 * @since 1.0.0
 */
export interface HydrationLiteral extends hydrationTemplate.HydrationLiteral {}

/**
 * @since 1.0.0
 */
export const makeTemplateContext: <Values extends ReadonlyArray<Renderable<any, any>>>(
  document: Document,
  renderContext: RenderContext,
  values: ReadonlyArray<Renderable<any, any>>,
  onCause: (cause: Cause.Cause<Placeholder.Error<Values[number]>>) => Effect.Effect<unknown, never, never>
) => Effect.Effect<TemplateContext, never, Scope.Scope | RenderQueue | Placeholder.Context<Values[number]>> =
  render.makeTemplateContext

/**
 * @since 1.0.0
 */
export const setupAttrPart: (
  { index, name }: Pick<Template.AttrPartNode, "index" | "name">,
  element: HTMLElement | SVGElement,
  ctx: TemplateContext,
  renderable: Renderable<any, any>
) => Effect.Effect<void, any, any> | null = render.setupAttrPart

/**
 * @since 1.0.0
 */
export const setupBooleanPart: (
  { index, name }: Pick<Template.BooleanPartNode, "index" | "name">,
  element: HTMLElement | SVGElement,
  ctx: TemplateContext,
  renderable: Renderable<any, any>
) => Effect.Effect<void, any, any> | null = render.setupBooleanPart

/**
 * @since 1.0.0
 */
export const setupClassNamePart: (
  { index }: Pick<Template.ClassNamePartNode, "index">,
  element: HTMLElement | SVGElement,
  ctx: TemplateContext,
  renderable: Renderable<any, any>
) => Effect.Effect<void, any, any> | null = render.setupClassNamePart

/**
 * @since 1.0.0
 */
export const setupCommentPart: (
  { index }: Pick<Template.CommentPartNode, "index">,
  comment: Comment,
  ctx: render.TemplateContext,
  renderable: Renderable<any, any>
) => Effect.Effect<void, any, any> | null = render.setupCommentPart

/**
 * @since 1.0.0
 */
export const setupDataPart: (
  { index }: Pick<Template.DataPartNode, "index">,
  element: HTMLElement | SVGElement,
  ctx: TemplateContext,
  renderable: Renderable<any, any>
) => Effect.Effect<void, any, any> | null = render.setupDataPart

/**
 * @since 1.0.0
 */
export const setupEventPart: (
  { index, name }: Pick<Template.EventPartNode, "index" | "name">,
  element: HTMLElement | SVGElement,
  ctx: TemplateContext,
  renderable: Renderable<any, any>
) => Effect.Effect<unknown, unknown, unknown> | null = render.setupEventPart

/**
 * @since 1.0.0
 */
export const setupNodePart: (
  { index }: Template.NodePart,
  comment: Comment,
  ctx: TemplateContext,
  text: Text | null,
  nodes: Array<Node>
) => Effect.Effect<void, any, any> | null = render.setupNodePart

/**
 * @since 1.0.0
 */
export const setupHydratedNodePart: (
  part: Template.NodePart,
  hole: hydrationTemplate.HydrationHole,
  ctx: render.HydrateTemplateContext
) => Effect.Effect<void, any, any> | null = render.setupHydratedNodePart

/**
 * @since 1.0.0
 */
export const setupPropertyPart: (
  { index, name }: Pick<Template.PropertyPartNode, "index" | "name">,
  element: HTMLElement | SVGElement,
  ctx: TemplateContext,
  renderable: Renderable<any, any>
) => Effect.Effect<void, any, any> | null = render.setupPropertyPart

/**
 * @since 1.0.0
 */
export const setupRefPart: (
  { index }: Pick<Template.RefPartNode, "index">,
  element: HTMLElement | SVGElement,
  renderable: Renderable<any, any>
) => Effect.Effect<void, any, any> | null = render.setupRefPart

/**
 * @since 1.0.0
 */
export const setupPropertiesPart: (
  element: HTMLElement | SVGElement,
  ctx: render.TemplateContext,
  renderable: Renderable<any, any>
) => Effect.Effect<Array<void>, any, any> | null = render.setupPropertiesPart

/**
 * @since 1.0.0
 */
export const setupSparseAttrPart: (
  { name, nodes }: Pick<Template.SparseAttrNode, "name" | "nodes">,
  element: HTMLElement | SVGElement,
  ctx: render.TemplateContext
) => Effect.Effect<void, any, any> = render.setupSparseAttrPart

/**
 * @since 1.0.0
 */
export const setupSparseClassNamePart: (
  { nodes }: Pick<Template.SparseClassNameNode, "nodes">,
  element: HTMLElement | SVGElement,
  ctx: render.TemplateContext
) => Effect.Effect<void, any, any> = render.setupSparseClassNamePart

/**
 * @since 1.0.0
 */
export const setupSparseCommentPart: (
  { nodes }: Template.SparseCommentNode,
  comment: Comment,
  ctx: render.TemplateContext
) => Effect.Effect<void, any, any> = render.setupSparseCommentPart

/**
 * @since 1.0.0
 */
export const setupTextPart: (
  { index }: Template.TextPartNode,
  comment: Comment,
  ctx: render.TemplateContext
) => Effect.Effect<void, any, any> | null = render.setupTextPart

/**
 * @since 1.0.0
 */
export const findHydrationHole: (
  nodes: Array<hydrationTemplate.HydrationNode>,
  index: number
) => hydrationTemplate.HydrationHole | null = hydrationTemplate.findHydrationHole

/**
 * @since 1.0.0
 */
export const getChildNodes: (node: hydrationTemplate.HydrationNode) => Array<hydrationTemplate.HydrationNode> =
  hydrationTemplate.getChildNodes

/**
 * @since 1.0.0
 */
export const findHydratePath: (node: hydrationTemplate.HydrationNode, path: Chunk.Chunk<number>) => Node =
  utils.findHydratePath

/**
 * @since 1.0.0
 */
export const attemptHydration: (
  ctx: TemplateContext,
  hash: string
) => Option.Option<
  {
    readonly where: HydrationTemplate
    readonly hydrateCtx: HydrateContext
  }
> = render.attemptHydration
