import { deepStrictEqual } from 'assert'
import { fileURLToPath } from 'url'

import * as Duration from '@effect/data/Duration'
import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import * as Fx from '@typed/fx'
import escapeHTML from 'escape-html'
import { describe, it } from 'vitest'

import { attrDirective } from './Directive.js'
import { unsafeMakeElementRef } from './ElementRef.js'
import { FullHtml, PartialHtml } from './RenderEvent.js'
import { html } from './RenderTemplate.js'
import { testRenderEvents, testRenderHtml } from './_test-utils.js'

describe(fileURLToPath(import.meta.url), () => {
  it('renders basic template HTML', async () => {
    const test = testRenderEvents(html`<div>hello</div>`, [
      FullHtml(`<div data-typed="true">hello</div>`),
    ])

    await Effect.runPromise(test)
  })

  it('renders template with interpolated attributes', async () => {
    const test = Effect.gen(function* ($) {
      yield* $(
        testRenderEvents(html`<div class=${'test'}>hello</div>`, [
          PartialHtml(`<div data-typed="true" class="test">hello</div>`, true),
        ]),
      )

      yield* $(
        testRenderEvents(html`<div class=${Effect.succeed('test')}>hello</div>`, [
          PartialHtml(`<div data-typed="true" class="test">hello</div>`, true),
        ]),
      )

      yield* $(
        testRenderEvents(html`<div class=${Fx.succeed('test')}>hello</div>`, [
          PartialHtml(`<div data-typed="true" class="test">hello</div>`, true),
        ]),
      )
    })

    await Effect.runPromise(test)
  })

  it('renders template with interpolated templates', async () => {
    const test = testRenderEvents(html`<div class=${'test'}>${html`<span>hello</span>`}</div>`, [
      PartialHtml(`<div data-typed="true" class="test"`, false),
      PartialHtml(`><span data-typed="true">hello</span><!--hole1--></div>`, true),
    ])

    await Effect.runPromise(test)
  })

  it('render template with delayed attributes', async () => {
    const test = testRenderEvents(
      html`<div
        class="${Effect.delay(Effect.succeed('test'), Duration.millis(100))}"
        id="${Fx.mergeAll(Fx.succeed('foo'), Fx.succeed('bar'))}"
      >
        hello
      </div>`,
      [
        // Kind of weird, but for some reason my editor will keep trying to merge these 2 lines without using .join
        PartialHtml([`<div data-typed="true" class=`, `"`, `test`].join(''), false),
        PartialHtml(`" id="bar">hello</div>`, true),
      ],
    )

    await Effect.runPromise(test)
  })

  it('renders template with directives', async () => {
    const test = testRenderEvents(
      html`<div id=${attrDirective((part) => part.update('test'))}>hello</div>`,
      [PartialHtml(`<div data-typed="true" id="test">hello</div>`, true)],
    )

    await Effect.runPromise(test)
  })

  it('renders boolean attributes', async () => {
    const test = Effect.gen(function* ($) {
      yield* $(
        testRenderEvents(html`<div ?hidden=${Fx.succeed(true)}>hello</div>`, [
          PartialHtml(`<div data-typed="true" hidden>hello</div>`, true),
        ]),
      )

      yield* $(
        testRenderEvents(html`<div ?hidden=${Fx.succeed(false)}>hello</div>`, [
          PartialHtml(`<div data-typed="true">hello</div>`, true),
        ]),
      )
    })

    await Effect.runPromise(test)
  })

  it('renders className attribute', async () => {
    const test = Effect.gen(function* ($) {
      yield* $(
        testRenderEvents(html`<div className=${'test'}>hello</div>`, [
          PartialHtml(`<div data-typed="true" class="test">hello</div>`, true),
        ]),
      )

      yield* $(
        testRenderEvents(html`<div className=${Fx.succeed('test1 test2')}>hello</div>`, [
          PartialHtml(`<div data-typed="true" class="test1 test2">hello</div>`, true),
        ]),
      )

      // Take the first value of any given rendered + current part.
      yield* $(
        testRenderEvents(
          html`<div className=${Fx.merge(Fx.succeed('test1 test2'), Fx.succeed('test3'))}>
            hello
          </div>`,
          [PartialHtml(`<div data-typed="true" class="test1 test2">hello</div>`, true)],
        ),
      )

      // Will take updates if not the current part
      yield* $(
        testRenderEvents(
          html`<div
            id="${Fx.delay(Fx.succeed('test'), Duration.millis(10))}"
            className="${Fx.merge(Fx.succeed('test1 test2'), Fx.succeed('test3'))}"
          >
            hello
          </div>`,
          [
            PartialHtml(`<div data-typed="true" id="test`, false),
            PartialHtml(`" class="test3">hello</div>`, true),
          ],
        ),
      )
    })

    await Effect.runPromise(test)
  })

  it('renders data attributes', async () => {
    const test = Effect.gen(function* ($) {
      yield* $(
        testRenderEvents(html`<div data-test=${'test'}>hello</div>`, [
          PartialHtml(`<div data-typed="true" data-test="test">hello</div>`, true),
        ]),
      )

      yield* $(
        testRenderEvents(html`<div data-test=${Fx.succeed('test')}>hello</div>`, [
          PartialHtml(`<div data-typed="true" data-test="test">hello</div>`, true),
        ]),
      )

      yield* $(
        testRenderEvents(html`<div .data=${{ a: 1, b: 2 }}>hello</div>`, [
          PartialHtml(`<div data-typed="true" data-a="1" data-b="2">hello</div>`, true),
        ]),
      )
    })

    await Effect.runPromise(test)
  })

  it('renders properties as an escaped attribute', async () => {
    const value = { a: 1, b: 2 }
    const test = testRenderEvents(html`<div .prop=${value}>hello</div>`, [
      PartialHtml(
        `<div data-typed="true" prop="${escapeHTML(JSON.stringify(value))}">hello</div>`,
        true,
      ),
    ])

    await Effect.runPromise(test)
  })

  it('renders without references', async () => {
    const ref = unsafeMakeElementRef()
    const test = testRenderEvents(html`<div ref=${ref}>hello</div>`, [
      PartialHtml(`<div data-typed="true">hello</div>`, true),
    ])

    await Effect.runPromise(test)
  })

  it('renders without event listeners using @', async () => {
    const test = testRenderEvents(html`<div @click=${Effect.unit()}>hello</div>`, [
      PartialHtml(`<div data-typed="true">hello</div>`, true),
    ])

    await Effect.runPromise(test)
  })

  it('renders without event listeners using on', async () => {
    const test = testRenderEvents(html`<div onclick=${Effect.unit()}>hello</div>`, [
      PartialHtml(`<div data-typed="true">hello</div>`, true),
    ])

    await Effect.runPromise(test)
  })

  it('properly handles extra quotations hanging around', async () => {
    const ref = unsafeMakeElementRef()
    const test = testRenderEvents(
      html`<div class="test" ref="${ref}" onclick="${Effect.unit()}">hello</div>`,
      [
        PartialHtml(`<div data-typed="true" class="test" `, false),
        PartialHtml(`>hello</div>`, true),
      ],
    )

    await Effect.runPromise(test)
  })

  it('emits html with comments', async () => {
    const test = pipe(
      Effect.gen(function* ($) {
        const standardHtml = yield* $(
          testRenderHtml(html`<div>${html`<div>${'value'}</div>`}</div>`),
        )

        deepStrictEqual(
          standardHtml,
          `<div data-typed="true"><div data-typed="true">value<!--hole0--></div><!--hole0--></div>`,
        )

        const staticHtml = yield* $(testRenderHtml(html`<div>${'value'}</div>`, 'static'))

        deepStrictEqual(staticHtml, `<div>value</div>`)
      }),
    )

    await Effect.runPromise(test)
  })
})
