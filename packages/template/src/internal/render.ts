import * as Fx from "@typed/fx/Fx"
import * as Subject from "@typed/fx/Subject"
import { TypeId } from "@typed/fx/TypeId"
import type { Rendered } from "@typed/wire"
import { persistent } from "@typed/wire"
import { Effect } from "effect"
import type { Cause } from "effect/Cause"
import { replace } from "effect/ReadonlyArray"
import type { Scope } from "effect/Scope"
import { isDirective } from "../Directive.js"
import * as ElementRef from "../ElementRef.js"
import type { BrowserEntry } from "../Entry.js"
import * as EventHandler from "../EventHandler.js"
import type {
  AttributePart,
  ClassNamePart,
  CommentPart,
  Part,
  Parts,
  PropertiesPart,
  SparsePart,
  StaticText
} from "../Part.js"
import type { Placeholder } from "../Placeholder.js"
import type { ToRendered } from "../Render.js"
import type { Renderable } from "../Renderable.js"
import type { RenderContext } from "../RenderContext.js"
import type { RenderEvent } from "../RenderEvent.js"
import { DomRenderEvent } from "../RenderEvent.js"
import type { RenderTemplate } from "../RenderTemplate.js"
import type * as Template from "../Template.js"
import { TemplateInstance } from "../TemplateInstance.js"
import { makeRenderNodePart } from "./browser.js"
import { HydrateContext } from "./HydrateContext.js"
import type { IndexRefCounter } from "./indexRefCounter.js"
import { indexRefCounter } from "./indexRefCounter.js"
import { parse } from "./parser.js"
import {
  AttributePartImpl,
  BooleanPartImpl,
  ClassNamePartImpl,
  CommentPartImpl,
  DataPartImpl,
  EventPartImpl,
  PropertiesPartImpl,
  PropertyPartImpl,
  RefPartImpl,
  SparseAttributePartImpl,
  SparseClassNamePartImpl,
  SparseCommentPartImpl,
  StaticTextImpl,
  TextPartImpl
} from "./parts.js"
import type { ParentChildNodes } from "./utils.js"
import { findPath } from "./utils.js"

/**
 * Here for "standard" browser rendering, a TemplateInstance is effectively a live
 * view into the contents rendered by the Template.
 */
export const renderTemplate: (document: Document, ctx: RenderContext) => RenderTemplate =
  (document, ctx) =>
  <Values extends ReadonlyArray<Renderable<any, any>>, T extends Rendered = Rendered>(
    templateStrings: TemplateStringsArray,
    values: Values,
    providedRef?: ElementRef.ElementRef<T>
  ) =>
    Effect.gen(function*(_) {
      const elementRef = providedRef || (yield* _(ElementRef.make<T>()))
      const events = Fx.map(elementRef, DomRenderEvent)
      const errors = Subject.unsafeMake<Placeholder.Error<Values[number]>, never>()
      const entry = getBrowserEntry(document, ctx, templateStrings)
      const content = document.importNode(entry.content, true) // Clone our template

      yield* _(Effect.addFinalizer(() => errors.interrupt))

      const parts = yield* _(buildParts(document, ctx, entry.template, content, elementRef, errors.onFailure, false)) // Build runtime-variant of parts with our content.

      // If there are parts we need to render them before constructing our Wire
      if (parts.length > 0) {
        const refCounter = yield* _(indexRefCounter(parts.length))

        // Do the work
        yield* _(renderValues(values, parts, refCounter, errors.onFailure))

        // Wait for initial work to be completed
        yield* _(refCounter.wait)
      }

      // Set the element when it is ready
      yield* _(ElementRef.set(elementRef, persistent(content) as T))

      // Return the Template instance
      return TemplateInstance(
        Fx.merge(
          events,
          errors
        ),
        elementRef
      )
    })

export function renderValues<Values extends ReadonlyArray<Renderable<any, any>>>(
  values: Values,
  parts: Parts,
  refCounter: IndexRefCounter,
  onCause: (cause: Cause<Placeholder.Error<Values[number]>>) => Effect.Effect<never, never, unknown>,
  makeHydrateContext?: (index: number) => HydrateContext
): Effect.Effect<Placeholder.Context<Values[number]> | Scope, never, void> {
  return Effect.all(parts.map((part, index) => {
    switch (part._tag) {
      case "sparse/attribute":
      case "sparse/className":
      case "sparse/comment": {
        return renderSparsePart(values, part, refCounter)
      }
      default:
        return renderPart(
          values,
          part,
          refCounter,
          onCause,
          makeHydrateContext ? () => makeHydrateContext(index) : undefined
        )
    }
  })) as any
}

export function renderSparsePart(
  values: ReadonlyArray<Renderable<any, any>>,
  part: SparsePart,
  refCounter: IndexRefCounter
) {
  const indexes = part.parts.flatMap((p) => p._tag === "static/text" ? [] : [p.index])

  return Effect.forkScoped(
    Fx.observe(
      unwrapSparsePartRenderables(
        part.parts.map((p) => p._tag === "static/text" ? Fx.succeed(p.value) : values[p.index]),
        part
      ),
      (value) => Effect.tap(part.update(value as any), () => Effect.forEach(indexes, (a) => refCounter.release(a)))
    )
  )
}

export function renderPart<Values extends ReadonlyArray<Renderable<any, any>>>(
  values: Values,
  part: Part,
  refCounter: IndexRefCounter,
  onCause: (cause: Cause<Placeholder.Error<Values[number]>>) => Effect.Effect<never, never, unknown>,
  hydrateCtx?: () => HydrateContext
): Effect.Effect<any, never, void> {
  const partIndex = part.index
  const renderable = values[partIndex]

  if (renderable === null || renderable === undefined) return refCounter.release(partIndex)

  if (isDirective(renderable)) {
    return renderable(part).pipe(
      Effect.tap(() => refCounter.release(partIndex)),
      Effect.forkScoped
    )
  } else if (part._tag === "ref") {
    return refCounter.release(partIndex)
  } else if (part._tag === "event") {
    return Effect.uninterruptible(Effect.tap(
      part.update(
        getEventHandler(renderable, onCause) as EventHandler.EventHandler<
          Placeholder.Context<Values[number]>,
          never
        >
      ),
      () => refCounter.release(partIndex)
    ))
  } else if (part._tag === "node" && hydrateCtx) {
    return handlePart(
      renderable,
      (value) => Effect.tap(part.update(value), () => refCounter.release(partIndex))
    ).pipe(
      HydrateContext.provide(hydrateCtx()),
      Effect.forkScoped
    )
  } else if (part._tag === "properties") {
    return handlePropertiesPart(renderable, part, refCounter)
  } else {
    return handlePart(
      renderable,
      (value) => Effect.tap(part.update(value as any), () => refCounter.release(partIndex))
    )
  }
}

function handlePropertiesPart<R, E>(
  renderable: unknown,
  part: PropertiesPart,
  refCounter: IndexRefCounter
): Effect.Effect<R | Scope, E, void> {
  if (renderable && typeof renderable === "object") {
    return handlePart(
      Fx.struct(Object.fromEntries(Object.entries(renderable).map(([k, v]) => [k, unwrapRenderable(v)] as const))),
      (value) => Effect.tap(part.update(value as any), () => refCounter.release(part.index))
    )
  }

  return Effect.succeed(void 0)
}

function getEventHandler<R, E>(
  renderable: any,
  onCause: (cause: Cause<E>) => Effect.Effect<never, never, unknown>
): EventHandler.EventHandler<R, never> | null {
  if (renderable && typeof renderable === "object") {
    if (EventHandler.EventHandlerTypeId in renderable) {
      return EventHandler.make(
        (ev) => Effect.catchAllCause((renderable as EventHandler.EventHandler<R, E>).handler(ev), onCause),
        (renderable as EventHandler.EventHandler<R, E>).options
      )
    } else if (Effect.EffectTypeId in renderable) {
      return EventHandler.make(() => Effect.catchAllCause(renderable, onCause))
    }
  }

  return null
}

function handlePart<R, E>(
  renderable: unknown,
  update: (u: unknown) => Effect.Effect<Scope, never, unknown>
): Effect.Effect<R | Scope, E, any> {
  switch (typeof renderable) {
    case "undefined":
    case "object": {
      if (renderable === null || renderable === undefined) return update(null)
      else if (Array.isArray(renderable)) {
        return renderable.length === 0
          ? update(null)
          : Effect.forkScoped(Fx.observe(Fx.tuple(renderable.map(unwrapRenderable)) as any, update))
      } else if (TypeId in renderable) {
        return Effect.forkScoped(Fx.observe(renderable as any, update))
      } else if (Effect.EffectTypeId in renderable) {
        return Effect.flatMap(renderable as Effect.Effect<R, E, any>, update)
      } else return update(renderable)
    }
    default:
      return update(renderable)
  }
}

function unwrapRenderable<R, E>(renderable: unknown): Fx.Fx<R, E, any> {
  switch (typeof renderable) {
    case "undefined":
    case "object": {
      if (renderable === null || renderable === undefined) return Fx.succeed(null)
      else if (Array.isArray(renderable)) {
        return renderable.length === 0 ? Fx.succeed(null) : Fx.tuple(renderable.map(unwrapRenderable)) as any
      } else if (TypeId in renderable) {
        return renderable as any
      } else if (Effect.EffectTypeId in renderable) {
        return Fx.fromFxEffect(Effect.map(renderable as any, unwrapRenderable<R, E>))
      } else return Fx.succeed(renderable as any)
    }
    default:
      return Fx.succeed(renderable)
  }
}

function unwrapSparsePartRenderables(
  renderables: ReadonlyArray<Renderable<any, any>>,
  part: SparsePart
) {
  return Fx.tuple(
    // @ts-ignore type too deep
    renderables.map((renderable, i) => {
      const p = part.parts[i]

      if (p._tag === "static/text") {
        return Fx.succeed(p.value)
      }

      if (isDirective(renderable)) {
        return Fx.fromEffect(Effect.map(renderable(p), () => p.value))
      }

      return Fx.mapEffect(
        unwrapRenderable(renderable),
        (u) => Effect.map(p.update(u), () => p.value)
      )
    })
  ) as any
}

export function attachRoot<T extends RenderEvent | null>(
  cache: RenderContext["renderCache"],
  where: HTMLElement,
  what: RenderEvent | null // TODO: Should we support HTML RenderEvents here too?
): Effect.Effect<never, never, ToRendered<T>> {
  return Effect.sync(() => {
    const wire = what?.valueOf() as ToRendered<T>
    const previous = cache.get(where)

    if (wire !== previous) {
      if (previous && !wire) removeChildren(where, previous)

      cache.set(where, wire || null)

      if (wire) replaceChildren(where, wire)

      return wire as ToRendered<T>
    }

    return previous as ToRendered<T>
  })
}

function removeChildren(where: HTMLElement, previous: Rendered) {
  for (const node of getNodes(previous)) {
    where.removeChild(node)
  }
}

function replaceChildren(where: HTMLElement, wire: Rendered) {
  where.replaceChildren(...getNodes(wire))
}

function getNodes(rendered: Rendered): Array<globalThis.Node> {
  const value = rendered.valueOf() as globalThis.Node | Array<globalThis.Node>
  return Array.isArray(value) ? value : [value]
}

export function getBrowserEntry(
  document: Document,
  ctx: RenderContext,
  templateStrings: TemplateStringsArray
): BrowserEntry {
  const cached = ctx.templateCache.get(templateStrings)

  if (cached === undefined || cached._tag === "Server") {
    const template = parse(templateStrings)
    const content = buildTemplate(document, template)
    const entry: BrowserEntry = {
      _tag: "Browser",
      template,
      content
    }

    ctx.templateCache.set(templateStrings, entry)

    return entry
  } else {
    return cached
  }
}

export function buildParts<T extends Rendered, E>(
  document: Document,
  ctx: RenderContext,
  template: Template.Template,
  content: ParentChildNodes,
  ref: ElementRef.ElementRef<T>,
  onCause: (cause: Cause<E>) => Effect.Effect<never, never, void>,
  isHydrating: boolean
): Effect.Effect<Scope, never, Parts> {
  return Effect.all(
    template.parts.map(([part, path]) =>
      buildPartWithNode(document, ctx, part, findPath(content, path), ref, onCause, isHydrating)
    )
  )
}

function buildPartWithNode<T extends Rendered, E>(
  document: Document,
  ctx: RenderContext,
  part: Template.PartNode | Template.SparsePartNode,
  node: Node,
  ref: ElementRef.ElementRef<T>,
  onCause: (cause: Cause<E>) => Effect.Effect<never, never, void>,
  isHydrating: boolean
): Effect.Effect<Scope, never, Part | SparsePart> {
  switch (part._tag) {
    case "attr":
      return Effect.succeed(AttributePartImpl.browser(part.index, node as Element, part.name, ctx))
    case "boolean-part":
      return Effect.succeed(BooleanPartImpl.browser(part.index, node as Element, part.name, ctx))
    case "className-part":
      return Effect.succeed(ClassNamePartImpl.browser(part.index, node as Element, ctx))
    case "comment-part":
      return Effect.succeed(CommentPartImpl.browser(part.index, node as Comment, ctx))
    case "data":
      return Effect.succeed(DataPartImpl.browser(part.index, node as HTMLElement | SVGElement, ctx))
    case "event":
      return EventPartImpl.browser(part.name, part.index, ref, node as HTMLElement | SVGElement, onCause) as any
    case "node":
      return Effect.succeed(
        makeRenderNodePart(part.index, node as HTMLElement | SVGElement, ctx, document, isHydrating)
      )
    case "property":
      return Effect.succeed(PropertyPartImpl.browser(part.index, node, part.name, ctx))
    case "properties":
      return Effect.succeed(PropertiesPartImpl.browser(part.index, node as HTMLElement | SVGElement, ctx))
    case "ref":
      return Effect.succeed(new RefPartImpl(ref.query(node as HTMLElement | SVGElement), part.index)) as any
    case "sparse-attr": {
      const parts: Array<AttributePart | StaticText> = Array(part.nodes.length)
      const sparse = SparseAttributePartImpl.browser(
        part.name,
        parts,
        node as HTMLElement | SVGElement,
        ctx
      )

      for (let i = 0; i < part.nodes.length; ++i) {
        const node = part.nodes[i]

        if (node._tag === "text") {
          parts.push(new StaticTextImpl(node.value))
          ;(sparse as any).value[i] = node.value
        } else {
          parts.push(
            new AttributePartImpl(
              node.name,
              node.index,
              ({ value }) => sparse.update(replace(sparse.value, i, value || "")),
              sparse.value[i]
            )
          )
        }
      }

      return Effect.succeed(sparse)
    }
    case "sparse-class-name": {
      const parts: Array<ClassNamePart | StaticText> = []
      const values: Array<string | Array<string>> = [] // TODO: Do this for all other sparse attrs
      const sparse = SparseClassNamePartImpl.browser(
        parts,
        node as HTMLElement | SVGElement,
        ctx,
        values
      )

      for (let i = 0; i < part.nodes.length; ++i) {
        const node = part.nodes[i]

        if (node._tag === "text") {
          parts.push(new StaticTextImpl(node.value))
          values.push(node.value)
        } else {
          values.push([])
          parts.push(
            new ClassNamePartImpl(
              node.index,
              ({ value }) => sparse.update(replace(sparse.value, i, value || "")),
              []
            )
          )
        }
      }

      return Effect.succeed(sparse)
    }
    case "sparse-comment": {
      const parts: Array<CommentPart | StaticText> = Array(part.nodes.length)
      const sparse = SparseCommentPartImpl.browser(
        node as Comment,
        parts,
        ctx
      )

      for (let i = 0; i < part.nodes.length; ++i) {
        const node = part.nodes[i]

        if (node._tag === "text") {
          parts.push(new StaticTextImpl(node.value))
          ;(sparse as any).value[i] = node.value
        } else {
          parts.push(
            new CommentPartImpl(
              node.index,
              ({ value }) => sparse.update(replace(sparse.value, i, value || "")),
              sparse.value[i]
            )
          )
        }
      }

      return Effect.succeed(sparse)
    }
    case "text-part":
      return Effect.succeed(TextPartImpl.browser(document, part.index, node as Element, ctx))
  }
}

export function buildTemplate(document: Document, { nodes }: Template.Template): DocumentFragment {
  const fragment = document.createDocumentFragment()

  for (let i = 0; i < nodes.length; ++i) {
    fragment.append(buildNode(document, nodes[i], false))
  }

  return fragment
}

function buildNode(document: Document, node: Template.Node, isSvgContext: boolean): globalThis.Node {
  switch (node._tag) {
    case "element":
    case "self-closing-element":
    case "text-only-element":
      return buildElement(document, node, isSvgContext)
    case "text":
      return document.createTextNode(node.value)
    case "comment":
      return document.createComment(node.value)
    case "sparse-comment":
      return document.createComment("")
    // Create placeholders for these elements
    case "comment-part":
    case "node":
      return document.createComment(`hole${node.index}`)
    case "doctype":
      return document.implementation.createDocumentType(
        node.name,
        docTypeNameToPublicId(node.name),
        docTypeNameToSystemId(node.name)
      )
  }
}

function docTypeNameToPublicId(name: string): string {
  switch (name) {
    case "html":
      return "-//W3C//DTD HTML 4.01//EN"
    case "svg":
      return "-//W3C//DTD SVG 1.1//EN"
    case "math":
      return "-//W3C//DTD MathML 2.0//EN"
    default:
      return ""
  }
}

function docTypeNameToSystemId(name: string): string {
  switch (name) {
    // HTML5
    case "html":
      return "http://www.w3.org/TR/html4/strict.dtd"
    case "svg":
      return "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"
    case "math":
      return "http://www.w3.org/Math/DTD/mathml2/mathml2.dtd"
    default:
      return ""
  }
}

const SVG_NAMESPACE = "http://www.w3.org/2000/svg"

function buildElement(
  document: Document,
  node: Template.ElementNode | Template.SelfClosingElementNode | Template.TextOnlyElement,
  isSvgContext: boolean
): Element {
  const { _tag, attributes, tagName } = node
  const isSvg = isSvgContext ? tagName !== "foreignObject" : tagName === "svg"
  const element = isSvg
    ? document.createElementNS(SVG_NAMESPACE, tagName)
    : document.createElement(tagName)

  for (let i = 0; i < attributes.length; ++i) {
    const attr = attributes[i]

    // We only handle static attributes here, parts are handled elsewhere
    if (attr._tag === "attribute") {
      element.setAttribute(attr.name, attr.value)
    } else if (attr._tag === "boolean") {
      element.toggleAttribute(attr.name, true)
    }
  }

  if (_tag === "element") {
    element.append(...node.children.map((child) => buildNode(document, child, isSvg)))
  } else if (_tag === "text-only-element") {
    element.append(...node.children.map((child) => buildTextChild(document, child)))
  }

  return element
}

function buildTextChild(document: Document, node: Template.Text): globalThis.Node {
  if (node._tag === "text") {
    return document.createTextNode(node.value)
  }

  return document.createComment(`hole${node.index}`)
}
