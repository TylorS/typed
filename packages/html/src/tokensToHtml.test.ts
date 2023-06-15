import { deepStrictEqual } from 'assert'

import { describe, it } from 'vitest'

import { tokenizeTemplateStrings } from './tokenizer/tokenizer.js'
import { tokensToHtml } from './tokensToHtml.js'

describe(tokensToHtml.name, () => {
  describe('single root element', () => {
    const template = h`<div id=${'foo'} class=${'bar'} @click=${null} ontouchdown=${null}><p>${'text'}</p></div>`
    const tokens = tokenizeTemplateStrings(template)
    const templateIndex = 0

    it('renders tokens to html and returns state to continue rendering', () => {
      const step1 = tokensToHtml(tokens, templateIndex)

      deepStrictEqual(step1.html, `<div data-typed="${templateIndex}" id="`)
      deepStrictEqual(step1.depth, 1)
      deepStrictEqual(step1.partIndex, 0)

      const step2 = tokensToHtml(step1.remaining, templateIndex, step1.depth)

      deepStrictEqual(step2.html, [`" `, `class=`, `"`].join(''))
      deepStrictEqual(step2.depth, 1)
      deepStrictEqual(step2.partIndex, 1)

      // @click doesn't render to html
      const step3 = tokensToHtml(step2.remaining, templateIndex, step2.depth)

      deepStrictEqual(step3.html, `"`)
      deepStrictEqual(step3.depth, 1)
      deepStrictEqual(step3.partIndex, 2)

      // ontouchdown doesn't render to html
      const step4 = tokensToHtml(step3.remaining, templateIndex, step3.depth)

      deepStrictEqual(step4.html, ``)
      deepStrictEqual(step4.depth, 1)
      deepStrictEqual(step4.partIndex, 3)

      const step5 = tokensToHtml(step4.remaining, templateIndex, step4.depth)

      deepStrictEqual(step5.html, `><p>`)
      deepStrictEqual(step5.depth, 2)
      deepStrictEqual(step5.partIndex, 4)

      const step6 = tokensToHtml(step5.remaining, templateIndex, step5.depth)

      deepStrictEqual(step6.html, `</p></div>`)
      deepStrictEqual(step6.depth, 0)
      // There is no more parts to process
      deepStrictEqual(step6.partIndex, -1)
    })
  })

  describe('multiple root elements', () => {
    const template = h`<div>${'foo'}</div><div>${'bar'}</div>`
    const tokens = tokenizeTemplateStrings(template)
    const templateIndex = 0

    it('renders tokens to html and returns state to continue rendering', () => {
      const step1 = tokensToHtml(tokens, templateIndex)

      deepStrictEqual(step1.html, `<div data-typed="${templateIndex}">`)
      deepStrictEqual(step1.depth, 1)
      deepStrictEqual(step1.partIndex, 0)

      const step2 = tokensToHtml(step1.remaining, templateIndex, step1.depth)

      deepStrictEqual(step2.html, `</div><div data-typed="${templateIndex}">`)
      deepStrictEqual(step2.depth, 1)
      deepStrictEqual(step2.partIndex, 1)

      const step3 = tokensToHtml(step2.remaining, templateIndex, step2.depth)

      deepStrictEqual(step3.html, `</div>`)
      deepStrictEqual(step3.depth, 0)
      deepStrictEqual(step3.partIndex, -1)
    })
  })

  describe('sparse attributes', () => {
    const template = h`<div class="${'foo'} ${'bar'} ${'baz'}"></div>`
    const tokens = tokenizeTemplateStrings(template)
    const templateIndex = 0

    it('renders tokens to html and returns state to continue rendering', () => {
      const step1 = tokensToHtml(tokens, templateIndex)

      deepStrictEqual(
        step1.html,
        ['<div data-typed="', templateIndex, `" `, `class=`, `"`].join(''),
      )
      deepStrictEqual(step1.depth, 1)
      deepStrictEqual(step1.partIndex, 0)

      const step2 = tokensToHtml(step1.remaining, templateIndex, step1.depth)

      deepStrictEqual(step2.html, ` `)
      deepStrictEqual(step2.depth, 1)
      deepStrictEqual(step2.partIndex, 1)

      const step3 = tokensToHtml(step2.remaining, templateIndex, step2.depth)

      deepStrictEqual(step3.html, ` `)
      deepStrictEqual(step3.depth, 1)
      deepStrictEqual(step3.partIndex, 2)

      const step4 = tokensToHtml(step3.remaining, templateIndex, step3.depth)

      deepStrictEqual(step4.html, ['"', `></div>`].join(''))
      deepStrictEqual(step4.depth, 0)
      deepStrictEqual(step4.partIndex, -1)
    })
  })
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function h<Values extends readonly any[]>(template: TemplateStringsArray, ..._: Values) {
  return template
}
