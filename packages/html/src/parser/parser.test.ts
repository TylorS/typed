import { describe, expect, it } from 'vitest'

import {
  ClosingTag,
  OpeningTag,
  OpeningTagEnd,
  Token,
  parseTemplateStrings,
  Text,
  AttributeStart,
  AttributeEnd,
} from './parser.js'

type TestCase = {
  name: string
  template: TemplateStringsArray
  expected: ReadonlyArray<Token>
}

describe(parseTemplateStrings.name, () => {
  const testCases: TestCase[] = [
    {
      name: 'parses single element with no interpolation',
      template: h`<div></div>`.template,
      expected: [new OpeningTag('div'), new OpeningTagEnd('div', false), new ClosingTag('div')],
    },
    {
      name: 'parses single element with text interpolation',
      template: h`<div>${'foo'}</div>`.template,
      expected: [new OpeningTag('div'), new OpeningTagEnd('div', false), new ClosingTag('div')],
    },
    {
      name: 'parses single element with attribute interpolation',
      template: h`<div id=${'foo'}></div>`.template,
      expected: [
        new OpeningTag('div'),
        new AttributeStart('id'),
        new AttributeEnd('id'),
        new OpeningTagEnd('div', false),
        new ClosingTag('div'),
      ],
    },
  ]

  for (const testCase of testCases) {
    it(testCase.name, () => {
      const actual = parseTemplateStrings(testCase.template)

      try {
        expect(actual).toEqual(testCase.expected)
      } catch (error) {
        console.log('Actual', JSON.stringify(actual, null, 2))
        console.log('Expected', JSON.stringify(testCase.expected, null, 2))

        throw error
      }
    })
  }
})

function h<Values extends readonly any[]>(template: TemplateStringsArray, ...values: Values) {
  return { template, values } as const
}
