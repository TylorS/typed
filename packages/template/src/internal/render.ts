import * as Fx from "@typed/fx/Fx"
import { TypeId } from "@typed/fx/TypeId"
import type { Rendered } from "@typed/wire"
import { persistent } from "@typed/wire"
import { Effect } from "effect"
import type { Cause } from "effect/Cause"
import type { Chunk } from "effect/Chunk"
import * as Context from "effect/Context"
import { Scope } from "effect/Scope"
import type { Directive } from "../Directive.js"
import { isDirective } from "../Directive.js"
import * as ElementRef from "../ElementRef.js"
import * as ElementSource from "../ElementSource.js"
import type { BrowserEntry } from "../Entry.js"
import * as EventHandler from "../EventHandler.js"
import type { Part } from "../Part.js"
import type { Placeholder } from "../Placeholder.js"
import type { ToRendered } from "../Render.js"
import type { Renderable } from "../Renderable.js"
import type { RenderContext } from "../RenderContext.js"
import type { RenderEvent } from "../RenderEvent.js"
import { DomRenderEvent } from "../RenderEvent.js"
import type { RenderTemplate } from "../RenderTemplate.js"
import type * as Template from "../Template.js"
import { makeRenderNodePart } from "./browser.js"
import { type EventSource, makeEventSource } from "./EventSource.js"
import { HydrateContext } from "./HydrateContext.js"
import type { IndexRefCounter2 } from "./indexRefCounter.js"
import { indexRefCounter2 } from "./indexRefCounter.js"
import { parse } from "./parser.js"
import {
  AttributePartImpl,
  BooleanPartImpl,
  ClassNamePartImpl,
  CommentPartImpl,
  DataPartImpl,
  PropertyPartImpl,
  RefPartImpl,
  TextPartImpl
} from "./parts.js"
import type { ParentChildNodes } from "./utils.js"
import { findHoleComment, findPath } from "./utils.js"

// TODO: We need to add support for hydration of templates
// TODO: We need to re-think hydration for dynamic lists, probably just markers should be fine
// TODO: We need to make Parts synchronous

/**
 * @internal
 */
export type RenderPartContext = {
  readonly context: Context.Context<Scope>
  readonly document: Document
  readonly eventSource: EventSource
  readonly refCounter: IndexRefCounter2
  readonly renderContext: RenderContext
  readonly values: ReadonlyArray<Renderable<any, any>>
  readonly onCause: (cause: Cause<any>) => Effect.Effect<never, never, void>

  readonly makeHydrateContext?: (index: number) => HydrateContext

  expected: number
}

type RenderPartMap = {
  readonly [K in Template.PartNode["_tag"] | Template.SparsePartNode["_tag"]]: (
    part: Extract<Template.PartNode | Template.SparsePartNode, { _tag: K }>,
    node: Node,
    ctx: RenderPartContext
  ) => null | Effect.Effect<any, any, void> | Array<Effect.Effect<any, any, void>>
}

const RenderPartMap: RenderPartMap = {
  "attr": (templatePart, node, ctx) => {
    const { document, refCounter, renderContext, values } = ctx
    const element = node as HTMLElement | SVGElement
    const attr = createAttribute(document, element, templatePart.name)
    const renderable = values[templatePart.index]
    let isSet = true
    const setValue = (value: string | null | undefined) => {
      if (isNullOrUndefined(value)) {
        element.removeAttribute(templatePart.name)
        isSet = false
      } else {
        attr.value = String(value)
        if (isSet === false) {
          element.setAttributeNode(attr)
          isSet = true
        }
      }
    }

    return matchSettablePart(
      renderable,
      setValue,
      () => AttributePartImpl.browser(templatePart.index, element, templatePart.name, renderContext),
      (f) => Effect.zipRight(renderContext.queue.add(element, f), refCounter.release(templatePart.index)),
      () => ctx.expected++
    )
  },
  "boolean-part": (templatePart, node, ctx) => {
    const { refCounter, renderContext, values } = ctx
    const element = node as HTMLElement | SVGElement
    const renderable = values[templatePart.index]
    const setValue = (value: boolean | null | undefined) => {
      element.toggleAttribute(templatePart.name, isNullOrUndefined(value) ? false : Boolean(value))
    }

    return matchSettablePart(
      renderable,
      setValue,
      () => BooleanPartImpl.browser(templatePart.index, element, templatePart.name, renderContext),
      (f) => Effect.zipRight(renderContext.queue.add(element, f), refCounter.release(templatePart.index)),
      () => ctx.expected++
    )
  },
  "className-part": (templatePart, node, ctx) => {
    const { refCounter, renderContext, values } = ctx
    const element = node as HTMLElement | SVGElement
    const renderable = values[templatePart.index]
    let classNames: Set<string> = new Set()
    const setValue = (value: string | Array<string> | null | undefined) => {
      if (isNullOrUndefined(value)) {
        element.classList.remove(...classNames)
        classNames.clear()
      } else {
        const newClassNames = new Set(Array.isArray(value) ? value : [String(value)])
        const { added, removed } = diffClassNames(classNames, newClassNames)

        if (removed.length > 0) {
          element.classList.remove(...removed)
        }
        if (added.length > 0) element.classList.add(...added)

        classNames = newClassNames
      }
    }

    return matchSettablePart(
      renderable,
      setValue,
      () => ClassNamePartImpl.browser(templatePart.index, element, renderContext),
      (f) => Effect.zipRight(renderContext.queue.add(element, f), refCounter.release(templatePart.index)),
      () => ctx.expected++
    )
  },
  "comment-part": (templatePart, node, ctx) => {
    const { refCounter, renderContext, values } = ctx
    const comment = findHoleComment(node as Element, templatePart.index)
    const renderable = values[templatePart.index]
    const setValue = (value: string | null | undefined) => {
      comment.textContent = isNullOrUndefined(value) ? "" : String(value)
    }

    return matchSettablePart(
      renderable,
      setValue,
      () => CommentPartImpl.browser(templatePart.index, comment, renderContext),
      (f) => Effect.zipRight(renderContext.queue.add(comment, f), refCounter.release(templatePart.index)),
      () => ctx.expected++
    )
  },
  "data": (templatePart, node, ctx) => {
    const element = node as HTMLElement | SVGElement
    const renderable = ctx.values[templatePart.index]
    const previousKeys = new Set<string>(Object.keys(element.dataset))
    const setValue = (value: Record<string, string | undefined> | null | undefined) => {
      if (isNullOrUndefined(value)) {
        for (const key of previousKeys) {
          delete element.dataset[key]
        }
        previousKeys.clear()
      } else {
        for (const key of previousKeys) {
          if (!(key in value)) {
            delete element.dataset[key]
            previousKeys.delete(key)
          }
        }

        for (const key of Object.keys(value)) {
          if (!previousKeys.has(key)) {
            previousKeys.add(key)
          }
          element.dataset[key] = value[key] || ""
        }
      }
    }

    return matchSettablePart(
      renderable,
      setValue,
      () => DataPartImpl.browser(templatePart.index, element, ctx.renderContext),
      (f) => Effect.zipRight(ctx.renderContext.queue.add(element, f), ctx.refCounter.release(templatePart.index)),
      () => ctx.expected++
    )
  },
  "event": (templatePart, node, ctx) => {
    const element = node as HTMLElement | SVGElement
    const renderable = ctx.values[templatePart.index]
    const handler = getEventHandler(renderable, ctx.context, ctx.onCause)
    if (handler) {
      ctx.eventSource.addEventListener(element, templatePart.name, handler)
    }

    return null
  },
  "node": (templatePart, node, ctx) => {
    const makeHydrateContext = ctx.makeHydrateContext
    const part = makeRenderNodePart(
      templatePart.index,
      node as HTMLElement | SVGElement,
      ctx.renderContext,
      ctx.document,
      !!makeHydrateContext
    )

    ctx.expected++

    const handle = handlePart(
      ctx.values[templatePart.index],
      (value) => Effect.zipRight(part.update(value as any), ctx.refCounter.release(templatePart.index))
    )

    if (makeHydrateContext) {
      return Effect.provideService(handle, HydrateContext, makeHydrateContext(templatePart.index))
    } else {
      return handle
    }
  },
  "property": (templatePart, node, ctx) => {
    const element = node as HTMLElement | SVGElement
    const renderable = ctx.values[templatePart.index]
    const setValue = (value: string | null | undefined) => {
      if (isNullOrUndefined(value)) {
        delete (element as any)[templatePart.name]
      } else {
        ;(element as any)[templatePart.name] = value
      }
    }

    return matchSettablePart(
      renderable,
      setValue,
      () => PropertyPartImpl.browser(templatePart.index, element, templatePart.name, ctx.renderContext),
      (f) => Effect.zipRight(ctx.renderContext.queue.add(element, f), ctx.refCounter.release(templatePart.index)),
      () => ctx.expected++
    )
  },
  "properties": (templatePart, node, ctx) => {
    const renderable = ctx.values[templatePart.index] as any as Record<string, any>

    if (isNullOrUndefined(renderable)) return null
    else if (Fx.isFx(renderable) || Effect.isEffect(renderable)) {
      throw new Error(`Properties Part must utilize an Record of renderable values.`)
    } else if (typeof renderable === "object" && !Array.isArray(renderable)) {
      const element = node as HTMLElement | SVGElement

      const toggleBoolean = (key: string, value: unknown) => {
        element.toggleAttribute(key, isNullOrUndefined(value) ? false : Boolean(value))
      }
      const setAttribute = (key: string, value: unknown) => {
        if (isNullOrUndefined(value)) {
          element.removeAttribute(key)
        } else {
          element.setAttribute(key, String(value))
        }
      }
      const setProperty = (key: string, value: unknown) => {
        if (isNullOrUndefined(value)) {
          delete (element as any)[key]
        } else {
          ;(element as any)[key] = value
        }
      }

      const effects: Array<Effect.Effect<any, any, void>> = []

      // We need indexes to track async values that won't conflict
      // with any other Parts, we can start end of the current values.length
      // As there should only ever be exactly 1 properties part.
      let i = ctx.values.length

      loop:
      for (const [key, value] of Object.entries(renderable)) {
        const index = ++i

        switch (key[0]) {
          case "?": {
            const name = key.slice(1)
            const eff = matchSettablePart(
              value,
              (value) => toggleBoolean(name, value),
              () => BooleanPartImpl.browser(index, element, name, ctx.renderContext),
              (f) => Effect.zipRight(ctx.renderContext.queue.add(element, f), ctx.refCounter.release(index)),
              () => ctx.expected++
            )
            if (eff !== null) {
              effects.push(eff)
            }
            continue loop
          }
          case ".": {
            const name = key.slice(1)
            const eff = matchSettablePart(
              value,
              (value) => setProperty(name, value),
              () => PropertyPartImpl.browser(index, element, name, ctx.renderContext),
              (f) => Effect.zipRight(ctx.renderContext.queue.add(element, f), ctx.refCounter.release(index)),
              () => ctx.expected++
            )
            if (eff !== null) {
              effects.push(eff)
            }
            continue loop
          }
          case "@": {
            const name = key.slice(1)
            const handler = getEventHandler(value, ctx.context, ctx.onCause)
            if (handler) {
              ctx.eventSource.addEventListener(element, name, handler)
            }
            continue loop
          }
          case "o": {
            if (key[1] === "n") {
              const name = key.slice(2)
              const handler = getEventHandler(value, ctx.context, ctx.onCause)
              if (handler) {
                ctx.eventSource.addEventListener(element, name, handler)
              }
            }
            continue loop
          }
        }

        const eff = matchSettablePart(
          value,
          (value) => setAttribute(key, value),
          () => AttributePartImpl.browser(index, element, key, ctx.renderContext),
          (f) => Effect.zipRight(ctx.renderContext.queue.add(element, f), ctx.refCounter.release(index)),
          () => ctx.expected++
        )
        if (eff !== null) {
          effects.push(eff)
        }
      }

      return effects
    } else {
      return null
    }
  },
  "ref": (templatePart, node, ctx) => {
    const element = node as HTMLElement | SVGElement
    const renderable = ctx.values[templatePart.index]

    if (isDirective(renderable)) {
      return renderable(new RefPartImpl(ElementSource.fromElement(element), templatePart.index))
    } else if (ElementRef.isElementRef(renderable)) {
      return ElementRef.set(renderable, element)
    }

    return null
  },
  "sparse-attr": (templatePart, node, ctx) => {
    const values = Array.from({ length: templatePart.nodes.length }, (): string => "")
    const element = node as HTMLElement | SVGElement
    const attr = createAttribute(ctx.document, element, templatePart.name)

    const setValue = (value: string | null | undefined, index: number) =>
      Effect.suspend(() => {
        values[index] = value || ""
        return ctx.renderContext.queue.add(element, () => attr.value = values.join(""))
      })

    const effects: Array<Effect.Effect<any, any, void>> = []

    for (let i = 0; i < templatePart.nodes.length; ++i) {
      const node = templatePart.nodes[i]
      if (node._tag === "text") {
        values[i] = node.value
      } else {
        const renderable = ctx.values[node.index]
        const index = i
        const effect = matchSettablePart(
          renderable,
          (value) => setValue(value, index),
          () =>
            new AttributePartImpl(
              templatePart.name,
              node.index,
              ({ value }) => setValue(value, index),
              null
            ),
          (f) => Effect.zipRight(ctx.renderContext.queue.add(element, f), ctx.refCounter.release(node.index)),
          () => ctx.expected++
        )

        if (effect !== null) {
          effects.push(effect)
        }
      }
    }

    return effects
  },
  "sparse-class-name": (templatePart, node, ctx) => {
    const element = node as HTMLElement | SVGElement

    const effects = templatePart.nodes.flatMap((node) => {
      if (node._tag === "text") {
        const split = splitClassNames(node.value)
        if (split.length > 0) element.classList.add(...split)
        return []
      } else {
        const eff = RenderPartMap[node._tag](node, element, ctx)
        if (eff === null) return []
        return Array.isArray(eff) ? eff : [eff]
      }
    })

    return effects
  },
  "sparse-comment": (templatePart, node, ctx) => {
    const values = Array.from({ length: templatePart.nodes.length }, (): string => "")
    const comment = node as Comment

    const setValue = (value: string | null | undefined, index: number) =>
      Effect.suspend(() => {
        values[index] = value || ""
        return ctx.renderContext.queue.add(comment, () => comment.textContent = values.join(""))
      })

    const effects: Array<Effect.Effect<any, any, void>> = []

    for (let i = 0; i < templatePart.nodes.length; ++i) {
      const node = templatePart.nodes[i]
      if (node._tag === "text") {
        values[i] = node.value
      } else {
        const renderable = ctx.values[node.index]
        const index = i
        const effect = matchSettablePart(
          renderable,
          (value) => setValue(value, index),
          () =>
            new CommentPartImpl(
              node.index,
              ({ value }) => setValue(value, index),
              null
            ),
          (f) => Effect.zipRight(ctx.renderContext.queue.add(comment, f), ctx.refCounter.release(node.index)),
          () => ctx.expected++
        )

        if (effect !== null) {
          effects.push(effect)
        }
      }
    }

    return effects
  },
  "text-part": (templatePart, node, ctx) => {
    const part = TextPartImpl.browser(
      ctx.document,
      templatePart.index,
      node as HTMLElement | SVGElement,
      ctx.renderContext
    )

    ctx.expected++

    return handlePart(
      ctx.values[templatePart.index],
      (value) => Effect.zipRight(part.update(value as any), ctx.refCounter.release(templatePart.index))
    )
  }
}

const SPACE_REGEXP = /\s+/g

function splitClassNames(value: string) {
  return value.split(SPACE_REGEXP).flatMap((a) => {
    const trimmed = a.trim()
    return trimmed.length > 0 ? [trimmed] : []
  })
}

function isNullOrUndefined<T>(value: T | null | undefined): value is null | undefined {
  return value === null || value === undefined
}

function diffClassNames(oldClassNames: Set<string>, newClassNames: Set<string>) {
  const added: Array<string> = []
  const removed: Array<string> = []

  for (const className of oldClassNames) {
    if (!newClassNames.has(className)) {
      removed.push(className)
    }
  }

  for (const className of newClassNames) {
    if (!oldClassNames.has(className) && className.trim()) {
      added.push(className)
    }
  }

  return { added, removed }
}

/**
 * @internal
 */
export function renderPart2(
  part: Template.PartNode | Template.SparsePartNode,
  content: ParentChildNodes,
  path: Chunk<number>,
  ctx: RenderPartContext
): Effect.Effect<any, any, void> | Array<Effect.Effect<any, any, void>> | null {
  return RenderPartMap[part._tag](part as any, findPath(content, path), ctx)
}

/**
 * Here for "standard" browser rendering, a TemplateInstance is effectively a live
 * view into the contents rendered by the Template.
 */
export const renderTemplate: (document: Document, renderContext: RenderContext) => RenderTemplate =
  (document, renderContext) =>
  <Values extends ReadonlyArray<Renderable<any, any>>, T extends Rendered = Rendered>(
    templateStrings: TemplateStringsArray,
    values: Values
  ) => {
    const entry = getBrowserEntry(document, renderContext, templateStrings)
    if (values.length === 0) {
      return Fx.sync(() => DomRenderEvent(persistent(document.importNode(entry.content, true))))
    }

    return Fx.make<Scope | Placeholder.Context<Values[number]>, Placeholder.Error<Values[number]>, RenderEvent>((
      sink
    ) => {
      return Effect.gen(function*(_) {
        const content = document.importNode(entry.content, true)
        const context = yield* _(Effect.context<Scope>())
        const refCounter = yield* _(indexRefCounter2())
        const ctx: RenderPartContext = {
          context,
          document,
          eventSource: makeEventSource(),
          expected: 0,
          refCounter,
          renderContext,
          onCause: sink.onFailure as any,
          values
        }

        // Connect our interpolated values to our template parts
        const effects: Array<Effect.Effect<Scope | Placeholder.Context<Values[number]>, never, void>> = []
        for (const [part, path] of entry.template.parts) {
          const eff = renderPart2(part, content, path, ctx)
          if (eff !== null) {
            effects.push(
              ...(Array.isArray(eff) ? eff : [eff]) as Array<
                Effect.Effect<Scope | Placeholder.Context<Values[number]>, never, void>
              >
            )
          }
        }

        // Fork any effects necessary
        if (effects.length > 0) {
          yield* _(Effect.forkAll(effects))
        }

        // If there's anything to wait on and it's not already done, wait for an initial value
        // for all asynchronous sources.
        if (ctx.expected > 0 && (yield* _(refCounter.expect(ctx.expected)))) {
          yield* _(refCounter.wait)
        }

        // Create a persistent wire from our content
        const wire = persistent(content) as T

        // Set the element when it is ready
        yield* _(ctx.eventSource.setup(wire, Context.get(context, Scope)))

        // Emit our DomRenderEvent
        yield* _(sink.onSuccess(DomRenderEvent(wire)))

        // Ensure our templates last forever in the DOM environment
        // so event listeners are kept attached to the current Scope.
        yield* _(Effect.never)
      })
    })
  }

function getEventHandler<R, E>(
  renderable: any,
  ctx: Context.Context<any> | Context.Context<never>,
  onCause: (cause: Cause<E>) => Effect.Effect<never, never, unknown>
): EventHandler.EventHandler<never, never> | null {
  if (renderable && typeof renderable === "object") {
    if (EventHandler.EventHandlerTypeId in renderable) {
      return EventHandler.make(
        (ev) =>
          Effect.provide(
            Effect.catchAllCause((renderable as EventHandler.EventHandler<R, E>).handler(ev), onCause),
            ctx as any
          ),
        (renderable as EventHandler.EventHandler<R, E>).options
      )
    } else if (Effect.EffectTypeId in renderable) {
      return EventHandler.make(() => Effect.provide(Effect.catchAllCause(renderable, onCause), ctx))
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

function createAttribute(
  document: Document,
  element: HTMLElement | SVGElement,
  name: string
): Attr {
  return element.getAttributeNode(name) ?? document.createAttribute(name)
}

function matchSettablePart(
  renderable: Renderable<any, any>,
  setValue: (value: any) => void,
  makePart: () => Part,
  schedule: (f: () => void) => Effect.Effect<Scope, never, void>,
  expect: () => void
) {
  return matchRenderable(renderable, {
    Fx: (fx) => {
      expect()
      return Fx.observe(fx, (a) => schedule(() => setValue(a)))
    },
    Effect: (effect) => {
      expect()
      return Effect.flatMap(effect, (a) => schedule(() => setValue(a)))
    },
    Directive: (directive) => {
      expect()
      return directive(makePart())
    },
    Otherwise: (otherwise) => {
      setValue(otherwise)
      return null
    }
  })
}

function matchRenderable(renderable: Renderable<any, any>, matches: {
  Fx: (fx: Fx.Fx<any, any, any>) => Effect.Effect<any, any, void> | null
  Effect: (effect: Effect.Effect<any, any, any>) => Effect.Effect<any, any, void> | null
  Directive: (directive: Directive<any, any>) => Effect.Effect<any, any, void> | null
  Otherwise: (_: Renderable<any, any>) => Effect.Effect<any, any, void> | null
}): Effect.Effect<any, any, void> | null {
  if (Fx.isFx(renderable)) {
    return matches.Fx(renderable)
  } else if (Effect.isEffect(renderable)) {
    return matches.Effect(renderable)
  } else if (isDirective<any, any>(renderable)) {
    return matches.Directive(renderable)
  } else {
    return matches.Otherwise(renderable)
  }
}
