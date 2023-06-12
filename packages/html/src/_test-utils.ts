import { deepStrictEqual, ok } from 'assert'

import { millis } from '@effect/data/Duration'
import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import * as Scope from '@effect/io/Scope'
import { DomServices, GlobalThis, makeDomServices } from '@typed/dom'
import * as Fx from '@typed/fx'
import * as happyDom from 'happy-dom'

import { RenderContext, makeRenderContext } from './RenderContext.js'
import { RenderTemplate, renderTemplate } from './RenderTemplate.js'
import { TemplateResult } from './TemplateResult.js'
import { hydrate } from './hydrate.js'
import { makeServerWindow } from './makeServerWindow.js'
import { stripHoleComments } from './parseTemplate.js'
import { renderedToHtml } from './part/templateHelpers.js'
import { Rendered, render } from './render.js'
import {
  END_COMMENT,
  HtmlEvent,
  START_COMMENT,
  renderToHtml,
  renderToHtmlStream,
} from './renderHtml.js'

export const testRenderTemplate = <R, E, Y extends Effect.EffectGen<any, any, any>, O>(
  template: Fx.Fx<R, E, TemplateResult>,
  f: (
    $: Effect.Adapter,
    rendered: Rendered,
    sendEvent: (config: {
      event: string
      init?: EventInit
    }) => Effect.Effect<GlobalThis, never, void>,
  ) => Generator<Y, O>,
  environment: RenderContext['environment'] = 'browser',
) => {
  const window = makeServerWindow({ url: 'https://example.com' })
  const { context } = RenderTemplate.build({ renderTemplate })
    .mergeContext(makeDomServices(window, window))
    .merge(RenderContext.build(makeRenderContext(environment)))

  return pipe(
    template,
    render(window.document.body),
    Fx.take(1),
    Fx.toArray,
    Effect.map((x) => x[0]),
    Effect.flatMap((rendered) =>
      Effect.gen(($) =>
        f($, rendered, ({ event, init }) =>
          GlobalThis.withEffect((globalThis) =>
            Effect.gen(function* ($) {
              ok(rendered instanceof globalThis.HTMLElement)

              // Allow for event handlers to be registered
              yield* $(Effect.sleep(millis(1)))

              rendered.dispatchEvent(new globalThis.Event(event, init))

              // Allow for event handlers to be called
              yield* $(Effect.sleep(millis(1)))
            }),
          ),
        ),
      ),
    ),
    Effect.provideSomeContext(context),
    Effect.scoped,
  )
}

export const testHtmlEvents = <R, E>(
  template: Fx.Fx<R, E, TemplateResult>,
  expected: readonly HtmlEvent[],
  environment: RenderContext['environment'] = 'browser',
): Effect.Effect<
  Exclude<Exclude<R, RenderContext | Scope.Scope | RenderTemplate | DomServices>, Scope.Scope>,
  E,
  readonly HtmlEvent[]
> => {
  const window = makeServerWindow({ url: 'https://example.com' })
  const scope = Effect.runSync(Scope.make())
  const { context } = RenderTemplate.build({ renderTemplate })
    .mergeContext(makeDomServices(window, window))
    .merge(RenderContext.build(makeRenderContext(environment)))
    .add(Scope.Scope, scope)

  return pipe(
    renderToHtmlStream(template),
    Fx.toReadonlyArray,
    Effect.provideSomeContext(context),
    Effect.scoped,
    Effect.map((events) => {
      try {
        deepStrictEqual(events.map(trimHtmlEvent), expected.map(trimHtmlEvent))
      } catch (error) {
        console.log(`Actual:`, ...events.map(trimHtmlEvent))
        console.log(`Expected:`, ...expected.map(trimHtmlEvent))
      }

      return events
    }),
  )
}

export function trimHtmlEvent(event: HtmlEvent) {
  return {
    ...event,
    html: trimHtml(event.html),
  }
}

export function trimHtml(html: string) {
  return stripHoleComments(
    html
      .replace(/\s+/g, ' ')
      .replace(new RegExp(START_COMMENT, 'g'), '')
      .replace(new RegExp(END_COMMENT, 'g'), '')
      .replace(/>\s+/g, '>')
      .replace(/\s+</g, '<'),
  ).trim()
}

export const testHtml = <R, E>(
  template: Fx.Fx<R, E, TemplateResult>,
  environment: RenderContext['environment'] = 'browser',
): Effect.Effect<
  Exclude<R, RenderContext | Scope.Scope | RenderTemplate | DomServices>,
  E,
  string
> => {
  const window = makeServerWindow({ url: 'https://example.com' })
  const scope = Effect.runSync(Scope.make())
  const { context } = RenderTemplate.build({ renderTemplate })
    .mergeContext(makeDomServices(window, window))
    .merge(RenderContext.build(makeRenderContext(environment)))
    .add(Scope.Scope, scope)

  return Effect.provideSomeContext(Effect.map(renderToHtml(template), trimHtml), context)
}

export const testHydrate = <I, R, E, Y extends Effect.EffectGen<any, any, any>, O>(
  template: Fx.Fx<R, E, TemplateResult>,
  setupDom: (_: ReturnType<typeof dom>, document: Document) => I,
  test: (
    $: Effect.Adapter,
    initial: I,
    rendered: Rendered,
    sendEvent: (config: {
      event: string
      init?: EventInit
    }) => Effect.Effect<GlobalThis, never, void>,
  ) => Generator<Y, O>,
  environment: RenderContext['environment'] = 'browser',
) => {
  const window = makeServerWindow({ url: 'https://example.com' })
  const scope = Effect.runSync(Scope.make())
  const { context } = RenderTemplate.build({ renderTemplate })
    .mergeContext(makeDomServices(window, window))
    .merge(RenderContext.build(makeRenderContext(environment)))
    .add(Scope.Scope, scope)

  return Effect.provideSomeContext(
    Effect.gen(function* ($) {
      const document = window.document

      document.body.append(document.createComment('typed-start'))

      const initial = setupDom(dom(document, document.body), document)

      document.body.append(document.createComment('typed-end'))

      return yield* $(
        template,
        hydrate(document.body),
        Fx.flatMapEffect((rendered) =>
          Effect.gen(($) => {
            console.log(renderedToHtml(rendered))

            return test($, initial, rendered, ({ event, init }) =>
              GlobalThis.withEffect((globalThis) =>
                Effect.gen(function* ($) {
                  ok(rendered instanceof globalThis.HTMLElement)

                  // Allow for event handlers to be registered
                  yield* $(Effect.sleep(millis(1)))

                  rendered.dispatchEvent(new globalThis.Event(event, init))

                  // Allow for event handlers to be called
                  yield* $(Effect.sleep(millis(1)))
                }),
              ),
            )
          }),
        ),
        Fx.take(1),
        Fx.toArray,
      )
    }),
    context,
  )
}

export function dom(document: Document, root: HTMLElement) {
  return {
    element: <
      const T extends keyof HTMLElementTagNameMap,
      const Attrs extends Readonly<Record<string, string>> = Record<never, never>,
    >(
      tag: T,
      attr: Attrs = {} as Attrs,
      id?: number,
    ) => {
      const rendered = elementWithAttr(document, tag, attr, String(id))

      root.append(rendered.node)

      return {
        ...rendered,
        ...dom(document, rendered.node),
      } as const
    },
    text: (text: string) => {
      const node = document.createTextNode(text)

      root.append(node)

      return node
    },
    comment: (text: string) => {
      const node = document.createComment(text)

      root.append(node)

      return node
    },
    hole: (index: number) => {
      const node = document.createComment(`hole${index}`)

      root.append(node)

      return node
    },
  }
}

function elementWithAttr<
  const T extends keyof HTMLElementTagNameMap,
  const Attrs extends Readonly<Record<string, string>>,
>(document: Document, tag: T, attr: Attrs, id?: string) {
  const node = document.createElement(tag)
  const attributes = Object.fromEntries(
    Object.entries(attr).map(([k, v]) => {
      if (k.startsWith('data-')) {
        node.dataset[k.slice(5)] = v

        return [k, v]
      } else {
        const attr = document.createAttributeNS(null, k)
        attr.nodeValue = v

        node.setAttributeNodeNS(attr)

        return [k, attr] as const
      }
    }),
  ) as {
    readonly [K in keyof Attrs]: K extends `data-${string}` ? string : Attr
  }

  if (id) {
    node.dataset.typed = id
  }

  return {
    node,
    attributes,
  } as const
}

export function makeTestDom(): {
  readonly window: Window & GlobalThis & Pick<happyDom.Window, 'happyDOM'>
  readonly document: Document
  readonly body: HTMLElement
  readonly render: <A>(
    f: (_: ReturnType<typeof dom>) => A,
  ) => readonly [A, { start: Comment; end: Comment }]
} {
  const window = makeServerWindow({ url: 'https://example.com' })

  function render<A>(f: (_: ReturnType<typeof dom>) => A): readonly [
    A,
    {
      start: Comment
      end: Comment
    },
  ] {
    const { document } = window

    document.body.innerHTML = ''

    const start = document.createComment('typed-start')
    const end = document.createComment('typed-end')

    document.body.appendChild(start)

    const a = f(dom(document, document.body))

    document.body.appendChild(end)

    return [a, { start, end }]
  }

  return {
    window,
    document: window.document,
    body: window.document.body,
    render,
  }
}
