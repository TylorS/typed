import { deepStrictEqual } from 'assert'

import { flow, pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import * as Scope from '@effect/io/Scope'
import * as Fx from '@typed/fx'
import { describe, it } from 'vitest'

import {
  attrDirective,
  booleanDirective,
  classNameDirective,
  dataDirective,
  eventDirective,
  propertyDirective,
  refDirective,
} from '../Directive.js'
import { EventHandler } from '../EventHandler.js'
import { RenderContext } from '../RenderContext.js'
import { RenderEvent } from '../RenderEvent.js'
import { RenderTemplate, html } from '../RenderTemplate.js'
import { many } from '../many.js'
import { TEXT_START, TYPED_HOLE } from '../meta.js'
import { counter } from '../test_components.test.js'

import { server } from './layer.js'
import { renderToHtml, renderToHtmlStream } from './renderToHtml.js'

describe(renderToHtmlStream.name, () => {
  it.concurrent('renders a simple template', async () => {
    await testHtmlChunks(html`<div>Hello, world!</div>`, [
      '<div data-typed="...">Hello, world!</div>',
    ])
  })

  it.concurrent('renders a template with a value', async () => {
    await testHtmlChunks(html`<div>${'Hello, world!'}</div>`, [
      '<div data-typed="...">',
      `${TEXT_START}Hello, world!`,
      TYPED_HOLE(0),
      '</div>',
    ])
  })

  it.concurrent('renders a template with attributes', async () => {
    await testHtmlChunks(html`<div class="foo" id="bar"></div>`, [
      '<div data-typed="..." class="foo" id="bar"></div>',
    ])
  })

  it.concurrent('renders a template with a attribute parts', async () => {
    // Static
    await testHtmlChunks(html`<div class="${'foo'}"></div>`, [
      '<div data-typed="..."',
      'class="foo"',
      `></div>`,
    ])
  })

  it.concurrent('renders a template with sparse attribute parts', async () => {
    await testHtmlChunks(html`<div id="${'foo'} ${'bar'} ${'baz'}"></div>`, [
      '<div data-typed="..."',
      'id="foo bar baz"',
      `></div>`,
    ])
  })

  it.concurrent('renders a template with sparse class name parts', async () => {
    await testHtmlChunks(html`<div class="${'foo'} ${'bar'} ${'baz'}"></div>`, [
      '<div data-typed="..."',
      'class="foo bar baz"',
      `></div>`,
    ])
  })

  it.concurrent('renders interpolated templates', async () => {
    await testHtmlChunks(html`<div>${html`<span>Hello, world!</span>`}</div>`, [
      '<div data-typed="...">',
      `<span data-typed="...">Hello, world!</span>`,
      TYPED_HOLE(0),
      '</div>',
    ])
  })

  it.concurrent('renders interpolated templates with interpolations', async () => {
    await testHtmlChunks(html`<div>${html`<span>${'Hello, world!'}</span>`}</div>`, [
      '<div data-typed="...">',
      '<span data-typed="...">',
      TEXT_START + 'Hello, world!',
      TYPED_HOLE(0),
      '</span>',
      TYPED_HOLE(0),
      '</div>',
    ])
  })

  it.concurrent('renders boolean attributes', async () => {
    await testHtmlChunks(html`<div ?hidden=${true}></div>`, [
      '<div data-typed="..."',
      'hidden',
      `></div>`,
    ])

    await testHtmlChunks(html`<div ?hidden=${false}></div>`, ['<div data-typed="..."', `></div>`])
  })

  it.concurrent('renders comments', async () => {
    await testHtmlChunks(html`<div><!-- Hello, world! --></div>`, [
      '<div data-typed="..."><!-- Hello, world! --></div>',
    ])
  })

  it.concurrent('renders comments with interpolations', async () => {
    await testHtmlChunks(html`<div><!-- ${'Hello, world!'} --></div>`, [
      '<div data-typed="...">',
      '<!-- Hello, world! -->',
      '</div>',
    ])

    await testHtmlChunks(html`<div><!-- ${Effect.succeed('Hello, world!')} --></div>`, [
      '<div data-typed="...">',
      '<!-- Hello, world! -->',
      '</div>',
    ])

    await testHtmlChunks(html`<div><!-- ${Fx.succeed('Hello, world!')} --></div>`, [
      '<div data-typed="...">',
      '<!-- Hello, world! -->',
      '</div>',
    ])
  })

  it.concurrent('renders data attributes', async () => {
    await testHtmlChunks(html`<div data-foo=${'bar'}></div>`, [
      '<div data-typed="..."',
      'data-foo="bar"',
      `></div>`,
    ])

    await testHtmlChunks(html`<div .data=${Fx.succeed({ foo: 'bar' })}></div>`, [
      '<div data-typed="..."',
      'data-foo="bar"',
      `></div>`,
    ])
  })

  it.concurrent('renders with event attributes', async () => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    await testHtmlChunks(html`<div @click=${() => {}}></div>`, [`<div data-typed="..."></div>`])
  })

  it.concurrent('renders with property attributes', async () => {
    await testHtmlChunks(html`<input .value=${'foo'} />`, [
      `<input data-typed="..."`,
      `value="foo"`,
      `/>`,
    ])
  })

  it.concurrent('renders with ref attributes', async () => {
    await testHtmlChunks(html`<input ref=${null} />`, [`<input data-typed="..."/>`])
  })

  it.concurrent('renders text-only templates', async () => {
    await testHtmlChunks(
      html`<script>
        console.log('hello, world!')
      </script>`,
      [`<script data-typed="...">\n        console.log('hello, world!')\n      </script>`],
    )
  })

  it.concurrent('remove attributes with undefined values', async () => {
    await testHtmlChunks(html`<div class=${undefined}></div>`, [`<div data-typed="..."`, `></div>`])
  })

  it.concurrent('remove attributes with null values', async () => {
    await testHtmlChunks(html`<div class=${null}></div>`, [`<div data-typed="..."`, `></div>`])
  })

  it.concurrent(`renders with attribute directives`, async () => {
    await testHtmlChunks(html`<div id=${attrDirective((part) => part.update('foo'))}></div>`, [
      `<div data-typed="..."`,
      `id="foo"`,
      `></div>`,
    ])
  })

  it.concurrent(`rendered with boolean directives`, async () => {
    // True
    await testHtmlChunks(
      html`<div ?hidden=${booleanDirective((part) => part.update(true))}></div>`,
      [`<div data-typed="..."`, `hidden`, `></div>`],
    )

    // False
    await testHtmlChunks(
      html`<div ?hidden=${booleanDirective((part) => part.update(false))}></div>`,
      [`<div data-typed="..."`, `></div>`],
    )
  })

  it.concurrent(`renders with class name directives`, async () => {
    await testHtmlChunks(
      html`<div class=${classNameDirective((part) => part.update('foo'))}></div>`,
      [`<div data-typed="..."`, `class="foo"`, `></div>`],
    )
  })

  it.concurrent(`renders with data directives`, async () => {
    await testHtmlChunks(
      html`<div .data=${dataDirective((part) => part.update({ foo: 'bar' }))}></div>`,
      [`<div data-typed="..."`, `data-foo="bar"`, `></div>`],
    )
  })

  it.concurrent(`renders with event directives`, async () => {
    await testHtmlChunks(
      html`<div
        @click=${eventDirective((part) => part.update(EventHandler(() => Effect.unit())))}
      ></div>`,
      [`<div data-typed="..."></div>`],
    )
  })

  it.concurrent(`renders with property directives`, async () => {
    await testHtmlChunks(
      html`<input .value=${propertyDirective((part) => part.update('foo'))} />`,
      [`<input data-typed="..."`, `value="foo"`, `/>`],
    )
  })

  it.concurrent(`renders with ref directives`, async () => {
    await testHtmlChunks(html`<input ref=${refDirective((part) => part.update(null))} />`, [
      `<input data-typed="..."/>`,
    ])
  })

  it.concurrent(`renders with sparse attribute directives`, async () => {
    await testHtmlChunks(
      html`<div
        id="${attrDirective((part) => part.update('foo'))} ${attrDirective((part) =>
          part.update('bar'),
        )} ${attrDirective((part) => part.update('baz'))}"
      ></div>`,
      [`<div data-typed="..."`, `id="foo bar baz"`, `></div>`],
    )
  })

  it.concurrent('renders components with wires', async () => {
    await testHtmlChunks(Fx.scoped(counter), [
      `<button data-typed="..." id="decrement">-</button><span data-typed="..." id="count">`,
      `${TEXT_START}0`,
      TYPED_HOLE(1),
      `</span><button data-typed="..." id="increment">+</button>`,
    ])
  })

  const counterOfCounters = Fx.scoped(
    Fx.gen(function* ($) {
      const count = yield* $(Fx.makeRef(Effect.succeed(1)))
      const increment = count.update((n) => n + 1)
      const decrement = count.update((n) => n - 1)

      return html`<button @click=${decrement}>-</button>
        <span>Number of counters: ${count}</span>
        <button @click=${increment}>+</button>
        <ul>
          ${many(
            count.map((n) => Array.from({ length: n }, (_, i) => i)),
            () => html`<div>${counter}</div>`,
            (i) => i,
          )}
        </ul>`
    }),
  )

  it.concurrent('renders components with arrays', async () => {
    await testHtmlChunks(counterOfCounters, [
      `<button data-typed="...">-</button><span data-typed="...">Number of counters:`,
      `${TEXT_START}1`,
      TYPED_HOLE(1),
      `</span><button data-typed="...">+</button><ul data-typed="...">`,
      `<div data-typed="...">`,
      `<button data-typed="..." id="decrement">-</button><span data-typed="..." id="count">`,
      `${TEXT_START}0`,
      TYPED_HOLE(1),
      `</span><button data-typed="..." id="increment">+</button>`,
      TYPED_HOLE(0),
      `</div>`,
      TYPED_HOLE(3),
      `</ul>`,
    ])
  })

  it.concurrent.only('runs fassstt', async () => {
    let total = 0
    const iterations = 100

    const test = provideResources(renderToHtml(counterOfCounters))

    for (let i = 0; i < iterations; i++) {
      const start = Date.now()
      await Effect.runPromise(test)
      const end = Date.now()
      total += end - start
    }

    const average = total / iterations

    console.log(`Average render time: ${average}ms`)
  })
})

function provideResources<R, E, A>(effect: Effect.Effect<R, E, A>) {
  return pipe(effect, Effect.provideSomeLayer(server()), Effect.scoped)
}

async function testHtmlChunks(
  template: Fx.Fx<RenderTemplate | RenderContext | Scope.Scope, never, RenderEvent>,
  expected: string[],
): Promise<void> {
  const actual = (
    await pipe(
      template,
      renderToHtmlStream,
      Fx.map(flow(stripDataTyped, stripSelfClosingComment, (x) => x.trim())),
      Fx.toReadonlyArray,
      provideResources,
      Effect.runPromise,
    )
  ).slice(1, -1) // Remove TYPED_START + TYPED_END from actual

  try {
    deepStrictEqual(actual, expected)
  } catch (error) {
    console.log(`Actual:`, JSON.stringify(actual, null, 2))
    console.log(`Expected:`, JSON.stringify(expected, null, 2))
    throw error
  }
}

function stripDataTyped(s: string): string {
  return s.replace(/data-typed="[^"]+"/g, 'data-typed="..."')
}

function stripSelfClosingComment(s: string): string {
  return s.replace(/^<!--sx-[a-z0-9=]+-->/gi, '').replace(/<!--\/sx-[a-z0-9=]+-->$/gi, '')
}
