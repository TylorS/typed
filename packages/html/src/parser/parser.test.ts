import { deepStrictEqual } from 'assert'

import { describe, it } from 'vitest'

import {
  ClosingTagToken,
  OpeningTagToken,
  OpeningTagEndToken,
  Token,
  parseTemplateStrings,
  AttributeStartToken,
  AttributeEndToken,
  PartToken,
  TextToken,
  AttributeToken,
} from './parser.js'

type TestCase = {
  name: string
  template: TemplateStringsArray
  expected: ReadonlyArray<Token>
  only?: boolean
  skip?: boolean
}

const testCases: TestCase[] = [
  {
    name: 'parses single element with no interpolation',
    template: h`<div></div>`,
    expected: [
      new OpeningTagToken('div'),
      new OpeningTagEndToken('div', false),
      new ClosingTagToken('div'),
    ],
  },
  {
    name: 'parses single element with text interpolation',
    template: h`<div>${'foo'}</div>`,
    expected: [
      new OpeningTagToken('div'),
      new OpeningTagEndToken('div', false),
      new PartToken(0),
      new ClosingTagToken('div'),
    ],
  },
  {
    name: 'parses single element with attribute interpolation',
    template: h`<div id=${'foo'}></div>`,
    expected: [
      new OpeningTagToken('div'),
      new AttributeStartToken('id'),
      new PartToken(0),
      new AttributeEndToken('id'),
      new OpeningTagEndToken('div', false),
      new ClosingTagToken('div'),
    ],
  },
  {
    name: 'parses single element with static attribute',
    template: h`<div id="foo"></div>`,
    expected: [
      new OpeningTagToken('div'),
      new AttributeToken('id', 'foo'),
      new OpeningTagEndToken('div', false),
      new ClosingTagToken('div'),
    ],
  },
  {
    name: 'parses single element with static attribute without quotes',
    template: h`<div id=foo></div>`,
    expected: [
      new OpeningTagToken('div'),
      new AttributeToken('id', 'foo'),
      new OpeningTagEndToken('div', false),
      new ClosingTagToken('div'),
    ],
  },
  {
    name: 'parses single element with multiple attributes interpolated',
    template: h`<div id=${'foo'} class=${'bar'} role=${'button'}></div>`,
    expected: [
      new OpeningTagToken('div'),
      new AttributeStartToken('id'),
      new PartToken(0),
      new AttributeEndToken('id'),
      new AttributeStartToken('class'),
      new PartToken(1),
      new AttributeEndToken('class'),
      new AttributeStartToken('role'),
      new PartToken(2),
      new AttributeEndToken('role'),
      new OpeningTagEndToken('div', false),
      new ClosingTagToken('div'),
    ],
  },
  {
    name: 'parses single element with multiple sparse attributes interpolated',
    template: h`<div class="${'foo'} ${'bar'} ${'baz'}"></div>`,
    expected: [
      new OpeningTagToken('div'),
      new AttributeStartToken('class'),
      new PartToken(0),
      new TextToken(' '),
      new PartToken(1),
      new TextToken(' '),
      new PartToken(2),
      new AttributeEndToken('class'),
      new OpeningTagEndToken('div', false),
      new ClosingTagToken('div'),
    ],
  },
  {
    name: 'parses single element with multiple attributes interpolated with text',
    template: h`<div id=${'foo'} class=${'bar'} role=${'button'}>${'baz'}</div>`,
    expected: [
      new OpeningTagToken('div'),
      new AttributeStartToken('id'),
      new PartToken(0),
      new AttributeEndToken('id'),
      new AttributeStartToken('class'),
      new PartToken(1),
      new AttributeEndToken('class'),
      new AttributeStartToken('role'),
      new PartToken(2),
      new AttributeEndToken('role'),
      new OpeningTagEndToken('div', false),
      new PartToken(3),
      new ClosingTagToken('div'),
    ],
  },
  {
    name: 'parses multiple elements',
    template: h`<div></div><span></span>`,
    expected: [
      new OpeningTagToken('div'),
      new OpeningTagEndToken('div', false),
      new ClosingTagToken('div'),
      new OpeningTagToken('span'),
      new OpeningTagEndToken('span', false),
      new ClosingTagToken('span'),
    ],
  },
  {
    name: 'parses multiple elements with text',
    template: h`<div></div>${'foo'}<span></span>`,
    expected: [
      new OpeningTagToken('div'),
      new OpeningTagEndToken('div', false),
      new ClosingTagToken('div'),
      new PartToken(0),
      new OpeningTagToken('span'),
      new OpeningTagEndToken('span', false),
      new ClosingTagToken('span'),
    ],
  },
  {
    name: 'parses multiple elements with attributes',
    template: h`<div id=${'foo'}></div><span id=${'bar'}></span>`,
    expected: [
      new OpeningTagToken('div'),
      new AttributeStartToken('id'),
      new PartToken(0),
      new AttributeEndToken('id'),
      new OpeningTagEndToken('div', false),
      new ClosingTagToken('div'),
      new OpeningTagToken('span'),
      new AttributeStartToken('id'),
      new PartToken(1),
      new AttributeEndToken('id'),
      new OpeningTagEndToken('span', false),
      new ClosingTagToken('span'),
    ],
  },
  {
    name: 'parses script tags with with static content',
    template: h`<script>consle.log('foo')</script>`,
    expected: [
      new OpeningTagToken('script', true),
      new OpeningTagEndToken('script', false, true),
      new TextToken("consle.log('foo')"),
      new ClosingTagToken('script', true),
    ],
  },
  {
    name: 'parses script tags with interpolated content as elements',
    template: h`<script>${'foo'}</script>`,
    expected: [
      new OpeningTagToken('script', true),
      new OpeningTagEndToken('script', false, true),
      new PartToken(0),
      new ClosingTagToken('script', true),
    ],
  },
  {
    name: 'parses style tags with with static content',
    template: h`<style>.foo{color:white;}</style>`,
    expected: [
      new OpeningTagToken('style', true),
      new OpeningTagEndToken('style', false, true),
      new TextToken('.foo{color:white;}'),
      new ClosingTagToken('style', true),
    ],
  },
  {
    name: 'parses style tags with interpolated content as elements',
    template: h`<style>${'foo'}</style>`,
    expected: [
      new OpeningTagToken('style', true),
      new OpeningTagEndToken('style', false, true),
      new PartToken(0),
      new ClosingTagToken('style', true),
    ],
  },
  {
    name: 'parses boolean attributes',
    template: h`<input ?disabled=${true} />`,
    expected: [
      new OpeningTagToken('input'),
      new AttributeStartToken('?disabled'),
      new PartToken(0),
      new AttributeEndToken('?disabled'),
      new OpeningTagEndToken('input', true),
    ],
  },
  {
    name: 'parses property attributes',
    template: h`<input .disabled=${true} />`,
    expected: [
      new OpeningTagToken('input'),
      new AttributeStartToken('.disabled'),
      new PartToken(0),
      new AttributeEndToken('.disabled'),
      new OpeningTagEndToken('input', true),
    ],
  },
  {
    name: 'parses event attributes with @ syntax',
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    template: h`<input @click=${() => {}} />`,
    expected: [
      new OpeningTagToken('input'),
      new AttributeStartToken('@click'),
      new PartToken(0),
      new AttributeEndToken('@click'),
      new OpeningTagEndToken('input', true),
    ],
  },
  {
    name: 'parses event attributes with on syntax',
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    template: h`<input onclick=${() => {}} />`,
    expected: [
      new OpeningTagToken('input'),
      new AttributeStartToken('onclick'),
      new PartToken(0),
      new AttributeEndToken('onclick'),
      new OpeningTagEndToken('input', true),
    ],
  },
]

describe(parseTemplateStrings.name, () => {
  for (const testCase of testCases) {
    setup(testCase)
  }
})

function setup(test: TestCase) {
  if (test.only) {
    it.concurrent.only(test.name, () => runTest(test))
  } else if (test.skip) {
    it.concurrent.skip(test.name, () => runTest(test))
  } else {
    it.concurrent(test.name, () => runTest(test))
  }
}

function runTest(test: TestCase) {
  const actual = parseTemplateStrings(test.template)

  try {
    deepStrictEqual(actual, test.expected)
  } catch (error) {
    console.log('Actual:', JSON.stringify(actual, null, 2))
    console.log('Expected:', JSON.stringify(test.expected, null, 2))
    throw error
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function h<Values extends readonly any[]>(template: TemplateStringsArray, ..._: Values) {
  return template
}
