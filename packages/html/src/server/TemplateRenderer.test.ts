import { deepStrictEqual } from 'assert'

import { flow, pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import * as Fx from '@typed/fx'
import { describe, it } from 'vitest'

import { RenderContext, makeRenderContext } from '../RenderContext.js'
import { RenderTemplate, html, renderTemplate } from '../RenderTemplate.js'
import { TemplateResult } from '../TemplateResult.js'
import { TEXT_START, TYPED_ATTR, TYPED_HOLE } from '../meta.js'

import { renderToHtmlStream } from './TemplateRenderer.js'

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
      'id="foo bar baz"',
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
})

function provideResources<R, E, A>(effect: Effect.Effect<R, E, A>) {
  return pipe(
    effect,
    RenderContext.provide(makeRenderContext('test')),
    RenderTemplate.provide({ renderTemplate }),
    Effect.scoped,
  )
}

async function testHtmlChunks(
  template: Fx.Fx<RenderTemplate, never, TemplateResult>,
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
