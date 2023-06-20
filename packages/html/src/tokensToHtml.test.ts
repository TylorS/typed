import { deepStrictEqual } from 'assert'

import { describe, it } from 'vitest'

import { hashForTemplateStrings } from './hashForTemplateStrings.js'
import { tokenizeTemplateStrings } from './tokenizer/tokenizer.js'
import { tokensToHtml } from './tokensToHtml.js'

describe.skip(tokensToHtml.name, () => {
  describe('single root element', () => {
    const template = h`<div id=${'foo'} class=${'bar'} @click=${null} ontouchdown=${null}><p>${'text'}</p></div>`
    const tokens = Array.from(tokenizeTemplateStrings(template))
    const templateIndex = 0

    it('renders tokens to html and returns state to continue rendering', () => {
      const step1 = tokensToHtml(tokens, templateIndex)

      deepStrictEqual(step1.html, `<div data-typed="${templateIndex}" id="`)
      deepStrictEqual(step1.state.depth, 1)
      deepStrictEqual(step1.state.partIndex, 0)

      const step2 = tokensToHtml(step1.remaining, templateIndex, undefined, step1.state)

      deepStrictEqual(step2.html, [`" `, `class=`, `"`].join(''))
      deepStrictEqual(step2.state.depth, 1)
      deepStrictEqual(step2.state.partIndex, 1)

      // @click doesn't render to html
      const step3 = tokensToHtml(step2.remaining, templateIndex, undefined, step2.state)

      deepStrictEqual(step3.html, `"`)
      deepStrictEqual(step3.state.depth, 1)
      deepStrictEqual(step3.state.partIndex, 2)

      // ontouchdown doesn't render to html
      const step4 = tokensToHtml(step3.remaining, templateIndex, undefined, step3.state)

      deepStrictEqual(step4.html, ``)
      deepStrictEqual(step4.state.depth, 1)
      deepStrictEqual(step4.state.partIndex, 3)

      const step5 = tokensToHtml(step4.remaining, templateIndex, undefined, step4.state)

      deepStrictEqual(step5.html, `><p>`)
      deepStrictEqual(step5.state.depth, 2)
      deepStrictEqual(step5.state.partIndex, 4)

      const step6 = tokensToHtml(step5.remaining, templateIndex, undefined, step5.state)

      deepStrictEqual(step6.html, `</p><!--attr0--><!--attr1--><!--attr2--><!--attr3--></div>`)
      deepStrictEqual(step6.state.depth, 0)
      // There is no more parts to process
      deepStrictEqual(step6.state.partIndex, -1)
    })
  })

  describe('multiple root elements', () => {
    const template = h`<div>${'foo'}</div><div>${'bar'}</div>`
    const tokens = Array.from(tokenizeTemplateStrings(template))
    const templateIndex = 0

    it('renders tokens to html and returns state to continue rendering', () => {
      const step1 = tokensToHtml(tokens, templateIndex)

      deepStrictEqual(step1.html, `<div data-typed="${templateIndex}">`, 'step1.html')
      deepStrictEqual(step1.state.depth, 1, 'step1.state.depth')
      deepStrictEqual(step1.state.partIndex, 0, 'step1.state.partIndex')

      const step2 = tokensToHtml(step1.remaining, templateIndex, undefined, step1.state)

      deepStrictEqual(step2.html, `</div><div data-typed="${templateIndex}">`, 'step2.html')
      deepStrictEqual(step2.state.depth, 1, 'step2.state.depth')
      deepStrictEqual(step2.state.partIndex, 1, 'step2.state.partIndex')

      const step3 = tokensToHtml(step2.remaining, templateIndex, undefined, step2.state)

      deepStrictEqual(step3.html, `</div>`, 'step3.html')
      deepStrictEqual(step3.state.depth, 0, 'step3.state.depth')
      deepStrictEqual(step3.state.partIndex, -1, 'step3.state.partIndex')
    })
  })

  describe('sparse attributes', () => {
    const template = h`<div class="${'foo'} ${'bar'} ${'baz'}"></div>`
    const tokens = Array.from(tokenizeTemplateStrings(template))
    const templateIndex = 0

    it('renders tokens to html and returns state to continue rendering', () => {
      const step1 = tokensToHtml(tokens, templateIndex)

      deepStrictEqual(
        step1.html,
        ['<div data-typed="', templateIndex, `" `, `class=`, `"`].join(''),
      )
      deepStrictEqual(step1.state.depth, 1)
      deepStrictEqual(step1.state.partIndex, 0)

      const step2 = tokensToHtml(step1.remaining, templateIndex, undefined, step1.state)

      deepStrictEqual(step2.html, ` `)
      deepStrictEqual(step2.state.depth, 1)
      deepStrictEqual(step2.state.partIndex, 1)

      const step3 = tokensToHtml(step2.remaining, templateIndex, undefined, step2.state)

      deepStrictEqual(step3.html, ` `)
      deepStrictEqual(step3.state.depth, 1)
      deepStrictEqual(step3.state.partIndex, 2)

      const step4 = tokensToHtml(step3.remaining, templateIndex, undefined, step3.state)

      deepStrictEqual(step4.html, ['"', `><!--attr0--><!--attr1--><!--attr2--></div>`].join(''))
      deepStrictEqual(step4.state.depth, 0)
      deepStrictEqual(step4.state.partIndex, -1)
    })
  })

  it('adds typed-start and typed-end comments to root template', () => {
    const template = h`<div></div>`
    const tokens = Array.from(tokenizeTemplateStrings(template))
    const templateIndex = -1
    const { html } = tokensToHtml(tokens, templateIndex)

    deepStrictEqual(html, '<!--typed-start--><div data-typed="-1"></div><!--typed-end-->')
  })

  it('utilizes the provide template hash', () => {
    const template = h`<div></div>`
    const tokens = Array.from(tokenizeTemplateStrings(template))
    const hash = hashForTemplateStrings(template)
    const { html } = tokensToHtml(tokens, -1, hash)

    deepStrictEqual(html, `<!--typed-start--><div data-typed="${hash}"></div><!--typed-end-->`)
  })
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function h<Values extends readonly any[]>(template: TemplateStringsArray, ..._: Values) {
  return template
}
