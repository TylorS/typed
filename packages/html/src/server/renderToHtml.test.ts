import { deepStrictEqual } from 'assert'

import { flow, pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
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
import { RenderContext, makeRenderContext } from '../RenderContext.js'
import { html } from '../RenderTemplate.js'
import { TemplateResult } from '../TemplateResult.js'
import { TEXT_START, TYPED_ATTR, TYPED_HOLE } from '../meta.js'

import { renderToHtmlStream } from './renderToHtml.js'

describe(renderToHtmlStream.name, () => {
  it('renders a simple template', async () => {
    await testHtmlChunks(html`<div>Hello, world!</div>`, [
      '<div data-typed="...">Hello, world!</div>',
    ])
  })

  it('renders a template with a value', async () => {
    await testHtmlChunks(html`<div>${'Hello, world!'}</div>`, [
      '<div data-typed="...">',
      `${TEXT_START}Hello, world!${TYPED_HOLE(0)}`,
      '</div>',
    ])
  })

  it('renders a template with attributes', async () => {
    await testHtmlChunks(html`<div class="foo" id="bar"></div>`, [
      '<div data-typed="..." class="foo" id="bar"></div>',
    ])
  })

  it('renders a template with a attribute parts', async () => {
    // Static
    await testHtmlChunks(html`<div class="${'foo'}"></div>`, [
      '<div data-typed="..."',
      ' class="foo"',
      `>${TYPED_ATTR(0)}</div>`,
    ])
  })

  it('renders a template with sparse attribute parts', async () => {
    await testHtmlChunks(html`<div id="${'foo'} ${'bar'} ${'baz'}"></div>`, [
      '<div data-typed="..."',
      ' id="foo bar baz"',
      `>${TYPED_ATTR(0)}${TYPED_ATTR(1)}${TYPED_ATTR(2)}</div>`,
    ])
  })

  it('renders a template with sparse class name parts', async () => {
    await testHtmlChunks(html`<div class="${'foo'} ${'bar'} ${'baz'}"></div>`, [
      '<div data-typed="..."',
      ' class="foo bar baz"',
      `>${TYPED_ATTR(0)}${TYPED_ATTR(1)}${TYPED_ATTR(2)}</div>`,
    ])
  })

  it('renders interpolated templates', async () => {
    await testHtmlChunks(html`<div>${html`<span>Hello, world!</span>`}</div>`, [
      '<div data-typed="...">',
      `<span data-typed="...">Hello, world!</span>`,
      TYPED_HOLE(0),
      '</div>',
    ])
  })

  it('renders interpolated templates with interpolations', async () => {
    await testHtmlChunks(html`<div>${html`<span>${'Hello, world!'}</span>`}</div>`, [
      '<div data-typed="...">',
      '<span data-typed="...">',
      TEXT_START + 'Hello, world!' + TYPED_HOLE(0),
      '</span>',
      TYPED_HOLE(0),
      '</div>',
    ])
  })

  it('renders boolean attributes', async () => {
    await testHtmlChunks(html`<div ?hidden=${true}></div>`, [
      '<div data-typed="..."',
      ' hidden',
      `>${TYPED_ATTR(0)}</div>`,
    ])

    await testHtmlChunks(html`<div ?hidden=${false}></div>`, [
      '<div data-typed="..."',
      `>${TYPED_ATTR(0)}</div>`,
    ])
  })

  it('renders comments', async () => {
    await testHtmlChunks(html`<div><!-- Hello, world! --></div>`, [
      '<div data-typed="..."><!-- Hello, world! --></div>',
    ])
  })

  it('renders comments with interpolations', async () => {
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

  it('renders data attributes', async () => {
    await testHtmlChunks(html`<div data-foo=${'bar'}></div>`, [
      '<div data-typed="..."',
      ' data-foo="bar"',
      `>${TYPED_ATTR(0)}</div>`,
    ])

    await testHtmlChunks(html`<div .data=${Fx.succeed({ foo: 'bar' })}></div>`, [
      '<div data-typed="..."',
      ' data-foo="bar"',
      `>${TYPED_ATTR(0)}</div>`,
    ])
  })

  it('renders with event attributes', async () => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    await testHtmlChunks(html`<div @click=${() => {}}></div>`, [
      `<div data-typed="...">${TYPED_ATTR(0)}</div>`,
    ])
  })

  it('renders with property attributes', async () => {
    await testHtmlChunks(html`<input .value=${'foo'} />`, [
      `<input data-typed="..."`,
      ` value="foo"`,
      `/>${TYPED_ATTR(0)}`,
    ])
  })

  it('renders with ref attributes', async () => {
    await testHtmlChunks(html`<input ref=${null} />`, [`<input data-typed="..."/>${TYPED_ATTR(0)}`])
  })

  it('renders text-only templates', async () => {
    await testHtmlChunks(
      html`<script>
        console.log('hello, world!')
      </script>`,
      [`<script data-typed="...">\n        console.log('hello, world!')\n      </script>`],
    )
  })

  it('remove attributes with undefined values', async () => {
    await testHtmlChunks(html`<div class=${undefined}></div>`, [
      `<div data-typed="..."`,
      `>${TYPED_ATTR(0)}</div>`,
    ])
  })

  it('remove attributes with null values', async () => {
    await testHtmlChunks(html`<div class=${null}></div>`, [
      `<div data-typed="..."`,
      `>${TYPED_ATTR(0)}</div>`,
    ])
  })

  it(`renders with attribute directives`, async () => {
    await testHtmlChunks(html`<div id=${attrDirective((part) => part.update('foo'))}></div>`, [
      `<div data-typed="..."`,
      ` id="foo"`,
      `>${TYPED_ATTR(0)}</div>`,
    ])
  })

  it(`rendered with boolean directives`, async () => {
    // True
    await testHtmlChunks(
      html`<div ?hidden=${booleanDirective((part) => part.update(true))}></div>`,
      [`<div data-typed="..."`, ` hidden`, `>${TYPED_ATTR(0)}</div>`],
    )

    // False
    await testHtmlChunks(
      html`<div ?hidden=${booleanDirective((part) => part.update(false))}></div>`,
      [`<div data-typed="..."`, `>${TYPED_ATTR(0)}</div>`],
    )
  })

  it(`renders with class name directives`, async () => {
    await testHtmlChunks(
      html`<div class=${classNameDirective((part) => part.update('foo'))}></div>`,
      [`<div data-typed="..."`, ` class="foo"`, `>${TYPED_ATTR(0)}</div>`],
    )
  })

  it(`renders with data directives`, async () => {
    await testHtmlChunks(
      html`<div .data=${dataDirective((part) => part.update({ foo: 'bar' }))}></div>`,
      [`<div data-typed="..."`, ` data-foo="bar"`, `>${TYPED_ATTR(0)}</div>`],
    )
  })

  it(`renders with event directives`, async () => {
    await testHtmlChunks(
      html`<div
        @click=${eventDirective((part) => part.update(EventHandler(() => Effect.unit())))}
      ></div>`,
      [`<div data-typed="...">${TYPED_ATTR(0)}</div>`],
    )
  })

  it(`renders with property directives`, async () => {
    await testHtmlChunks(
      html`<input .value=${propertyDirective((part) => part.update('foo'))} />`,
      [`<input data-typed="..."`, ` value="foo"`, `/>${TYPED_ATTR(0)}`],
    )
  })

  it(`renders with ref directives`, async () => {
    await testHtmlChunks(html`<input ref=${refDirective((part) => part.update(null))} />`, [
      `<input data-typed="..."/>${TYPED_ATTR(0)}`,
    ])
  })

  it(`renders with sparse attribute directives`, async () => {
    await testHtmlChunks(
      html`<div
        id="${attrDirective((part) => part.update('foo'))} ${attrDirective((part) =>
          part.update('bar'),
        )} ${attrDirective((part) => part.update('baz'))}"
      ></div>`,
      [
        `<div data-typed="..."`,
        ` id="foo bar baz"`,
        `>${TYPED_ATTR(0)}${TYPED_ATTR(1)}${TYPED_ATTR(2)}</div>`,
      ],
    )
  })
})

function provideResources<R, E, A>(effect: Effect.Effect<R, E, A>) {
  return pipe(effect, RenderContext.provide(makeRenderContext('test')), Effect.scoped)
}

async function testHtmlChunks(
  template: Fx.Fx<never, never, TemplateResult>,
  expected: string[],
): Promise<void> {
  const actual = (
    await pipe(
      template,
      renderToHtmlStream,
      Fx.toReadonlyArray,
      provideResources,
      Effect.runPromise,
    )
  ).map(flow(stripDataTyped, stripSelfClosingComment))

  try {
    // Remove TYPED_START + TYPED_END from actual
    deepStrictEqual(actual.slice(1, -1), expected)
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
