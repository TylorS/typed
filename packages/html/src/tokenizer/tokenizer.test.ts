import { deepStrictEqual } from 'assert'

import { describe, it } from 'vitest'

import {
  Token,
  OpeningTagToken,
  OpeningTagEndToken,
  ClosingTagToken,
  PartToken,
  AttributeStartToken,
  AttributeEndToken,
  AttributeToken,
  ClassNameAttributeStartToken,
  ClassNameAttributeEndToken,
  TextToken,
  BooleanAttributeStartToken,
  BooleanAttributeEndToken,
  PropertyAttributeStartToken,
  PropertyAttributeEndToken,
  EventAttributeStartToken,
  EventAttributeEndToken,
  CommentToken,
  CommentStartToken,
  CommentEndToken,
  BooleanAttributeToken,
  RefAttributeStartToken,
  RefAttributeEndToken,
} from './Token.js'
import { PART_REGEX, tokenizeTemplateStrings } from './tokenizer.js'

type TestCase = {
  name: string
  template: ReadonlyArray<string>
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
      new ClassNameAttributeStartToken(),
      new PartToken(1),
      new ClassNameAttributeEndToken(),
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
      new ClassNameAttributeStartToken(),
      new PartToken(0),
      new TextToken(' '),
      new PartToken(1),
      new TextToken(' '),
      new PartToken(2),
      new ClassNameAttributeEndToken(),
      new OpeningTagEndToken('div', false),
      new ClosingTagToken('div'),
    ],
  },
  {
    name: 'parses single element with multiple sparse attributes interpolated with text',
    template: h`<div class="${'foo'} hello ${'bar'} world ${'baz'}"></div>`,
    expected: [
      new OpeningTagToken('div'),
      new ClassNameAttributeStartToken(),
      new PartToken(0),
      new TextToken(' hello '),
      new PartToken(1),
      new TextToken(' world '),
      new PartToken(2),
      new ClassNameAttributeEndToken(),
      new OpeningTagEndToken('div', false),
      new ClosingTagToken('div'),
    ],
  },
  {
    name: 'parses single element with multiple attributes interpolated with text at start',
    template: h`<div class="hello ${'foo'} ${'bar'} world ${'baz'}"></div>`,
    expected: [
      new OpeningTagToken('div'),
      new ClassNameAttributeStartToken(),
      new TextToken('hello '),
      new PartToken(0),
      new TextToken(' '),
      new PartToken(1),
      new TextToken(' world '),
      new PartToken(2),
      new ClassNameAttributeEndToken(),
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
      new ClassNameAttributeStartToken(),
      new PartToken(1),
      new ClassNameAttributeEndToken(),
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
    template: h`<script>console.log('foo')</script>`,
    expected: [
      new OpeningTagToken('script', false, true),
      new OpeningTagEndToken('script', false, true),
      new TextToken("console.log('foo')"),
      new ClosingTagToken('script', true),
    ],
  },
  {
    name: 'parses script tags with interpolated content as elements',
    template: h`<script>${'foo'}</script>`,
    expected: [
      new OpeningTagToken('script', false, true),
      new OpeningTagEndToken('script', false, true),
      new PartToken(0),
      new ClosingTagToken('script', true),
    ],
  },
  {
    name: 'parses style tags with with static content',
    template: h`<style>.foo{color:white;}</style>`,
    expected: [
      new OpeningTagToken('style', false, true),
      new OpeningTagEndToken('style', false, true),
      new TextToken('.foo{color:white;}'),
      new ClosingTagToken('style', true),
    ],
  },
  {
    name: 'parses style tags with interpolated content as elements',
    template: h`<style>${'foo'}</style>`,
    expected: [
      new OpeningTagToken('style', false, true),
      new OpeningTagEndToken('style', false, true),
      new PartToken(0),
      new ClosingTagToken('style', true),
    ],
  },
  {
    name: 'parses boolean attributes',
    template: h`<input ?disabled=${true} />`,
    expected: [
      new OpeningTagToken('input', true),
      new BooleanAttributeStartToken('disabled'),
      new PartToken(0),
      new BooleanAttributeEndToken('disabled'),
      new OpeningTagEndToken('input', true),
    ],
  },
  {
    name: 'parses property attributes',
    template: h`<input .disabled=${true} />`,
    expected: [
      new OpeningTagToken('input', true),
      new PropertyAttributeStartToken('disabled'),
      new PartToken(0),
      new PropertyAttributeEndToken('disabled'),
      new OpeningTagEndToken('input', true),
    ],
  },
  {
    name: 'parses event attributes with @ syntax',
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    template: h`<input @click=${() => {}} />`,
    expected: [
      new OpeningTagToken('input', true),
      new EventAttributeStartToken('click'),
      new PartToken(0),
      new EventAttributeEndToken('click'),
      new OpeningTagEndToken('input', true),
    ],
  },
  {
    name: 'parses event attributes with on syntax',
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    template: h`<input onclick=${() => {}} />`,
    expected: [
      new OpeningTagToken('input', true),
      new EventAttributeStartToken('click'),
      new PartToken(0),
      new EventAttributeEndToken('click'),
      new OpeningTagEndToken('input', true),
    ],
  },
  {
    name: 'parses namespaced attributes',
    template: h`<input xlink:href=${'foo'} />`,
    expected: [
      new OpeningTagToken('input', true),
      new AttributeStartToken('xlink:href'),
      new PartToken(0),
      new AttributeEndToken('xlink:href'),
      new OpeningTagEndToken('input', true),
    ],
  },
  {
    name: 'parses boolean attributes with namespaced syntax',
    template: h`<input ?xlink:href=${true} />`,
    expected: [
      new OpeningTagToken('input', true),
      new BooleanAttributeStartToken('xlink:href'),
      new PartToken(0),
      new BooleanAttributeEndToken('xlink:href'),
      new OpeningTagEndToken('input', true),
    ],
  },
  {
    name: 'parses property attributes with namespaced syntax',
    template: h`<input .xlink:href=${true} />`,
    expected: [
      new OpeningTagToken('input', true),
      new PropertyAttributeStartToken('xlink:href'),
      new PartToken(0),
      new PropertyAttributeEndToken('xlink:href'),
      new OpeningTagEndToken('input', true),
    ],
  },
  {
    name: 'parses event attributes with namespaced syntax + @* on self-closing elements',
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    template: h`<input @xlink:href=${() => {}} />`,
    expected: [
      new OpeningTagToken('input', true),
      new EventAttributeStartToken('xlink:href'),
      new PartToken(0),
      new EventAttributeEndToken('xlink:href'),
      new OpeningTagEndToken('input', true),
    ],
  },
  {
    name: 'parses event attributes with namespaced syntax + @*',
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    template: h`<div onclick=${() => {}}></div>`,
    expected: [
      new OpeningTagToken('div', false),
      new EventAttributeStartToken('click'),
      new PartToken(0),
      new EventAttributeEndToken('click'),
      new OpeningTagEndToken('div', false),
      new ClosingTagToken('div'),
    ],
  },
  {
    name: 'parses comment nodes',
    template: h`<div><!-- foo --></div>`,
    expected: [
      new OpeningTagToken('div'),
      new OpeningTagEndToken('div', false),
      new CommentToken(' foo '),
      new ClosingTagToken('div'),
    ],
  },
  {
    name: 'parses comment nodes with interpolated content',
    template: h`<div><!-- ${'foo'} --></div>`,
    expected: [
      new OpeningTagToken('div'),
      new OpeningTagEndToken('div', false),
      new CommentStartToken('<!--'),
      new TextToken(' '),
      new PartToken(0),
      new TextToken(' '),
      new CommentEndToken('-->'),
      new ClosingTagToken('div'),
    ],
  },
  {
    name: 'parses self-closing tags',
    template: h`<input disabled />`,
    expected: [
      new OpeningTagToken('input', true),
      new BooleanAttributeToken('disabled'),
      new OpeningTagEndToken('input', true),
    ],
  },
  {
    name: 'parses template with only parts',
    template: h`${'hello'} ${'world'}`,
    expected: [new PartToken(0), new TextToken(' '), new PartToken(1)],
  },
  {
    name: 'parses template with multiple attribute types',
    template: h`<div class="formgroup">
    <input
      ref=${null}
      ?disabled=${false}
      class="custom-input"
      onchange=${null}
    />
    <label class="custom-input-label" for="name">Name</label>
  </div>`,
    expected: [
      new OpeningTagToken('div'),
      new AttributeToken('class', 'formgroup'),
      new OpeningTagEndToken('div', false),
      new TextToken('\n    '),
      new OpeningTagToken('input', true),
      new RefAttributeStartToken(),
      new PartToken(0),
      new RefAttributeEndToken(),
      new BooleanAttributeStartToken('disabled'),
      new PartToken(1),
      new BooleanAttributeEndToken('disabled'),
      new AttributeToken('class', 'custom-input'),
      new EventAttributeStartToken('change'),
      new PartToken(2),
      new EventAttributeEndToken('change'),
      new OpeningTagEndToken('input', true),
      new TextToken('\n    '),
      new OpeningTagToken('label'),
      new AttributeToken('class', 'custom-input-label'),
      new AttributeToken('for', 'name'),
      new OpeningTagEndToken('label', false),
      new TextToken('Name'),
      new ClosingTagToken('label'),
      new TextToken('\n  '),
      new ClosingTagToken('div'),
    ],
  },
  {
    name: 'parses multi-line svg',
    template: splitTemplateByParts(`<svg
    class="{{__PART0__}}"
    fill="{{__PART1__}}"
    width="{{__PART2__}}"
    height="{{__PART3__}}"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M16 17C16.2652 17 16.5196 16.8946 16.7071 16.7071C16.8946 16.5196 17 16.2652 17 16V6.5C17 5.04131 16.4205 3.64236 15.3891 2.61091C14.3576 1.57946 12.9587 1 11.5 1C10.0413 1 8.64236 1.57946 7.61091 2.61091C6.57946 3.64236 6 5.04131 6 6.5V18C6 19.0609 6.42143 20.0783 7.17157 20.8284C7.92172 21.5786 8.93913 22 10 22C11.0609 22 12.0783 21.5786 12.8284 20.8284C13.5786 20.0783 14 19.0609 14 18V6.38C13.9974 5.7496 13.7458 5.14576 13.3 4.69999C12.8542 4.25423 12.2504 4.00263 11.62 4H11.38C10.7496 4.00263 10.1458 4.25423 9.69999 4.69999C9.25423 5.14576 9.00263 5.7496 9 6.38V16C9 16.2652 9.10536 16.5196 9.29289 16.7071C9.48043 16.8946 9.73478 17 10 17C10.2652 17 10.5196 16.8946 10.7071 16.7071C10.8946 16.5196 11 16.2652 11 16V6.38C11 6.27922 11.04 6.18256 11.1113 6.1113C11.1826 6.04004 11.2792 6 11.38 6H11.62C11.7208 6 11.8174 6.04004 11.8887 6.1113C11.96 6.18256 12 6.27922 12 6.38V18C12 18.5304 11.7893 19.0391 11.4142 19.4142C11.0391 19.7893 10.5304 20 10 20C9.46957 20 8.96086 19.7893 8.58579 19.4142C8.21071 19.0391 8 18.5304 8 18V6.5C8 5.57174 8.36875 4.6815 9.02513 4.02513C9.6815 3.36875 10.5717 3 11.5 3C12.4283 3 13.3185 3.36875 13.9749 4.02513C14.6313 4.6815 15 5.57174 15 6.5V16C15 16.2652 15.1054 16.5196 15.2929 16.7071C15.4804 16.8946 15.7348 17 16 17Z"
    />
  </svg>`),
    expected: [
      new OpeningTagToken('svg'),
      new ClassNameAttributeStartToken(),
      new PartToken(0),
      new ClassNameAttributeEndToken(),
      new AttributeStartToken('fill'),
      new PartToken(1),
      new AttributeEndToken('fill'),
      new AttributeStartToken('width'),
      new PartToken(2),
      new AttributeEndToken('width'),
      new AttributeStartToken('height'),
      new PartToken(3),
      new AttributeEndToken('height'),
      new AttributeToken('viewBox', '0 0 24 24'),
      new AttributeToken('xmlns', 'http://www.w3.org/2000/svg'),
      new OpeningTagEndToken('svg', false),
      new TextToken('\n    '),
      new OpeningTagToken('path'),
      new AttributeToken(
        'd',
        'M16 17C16.2652 17 16.5196 16.8946 16.7071 16.7071C16.8946 16.5196 17 16.2652 17 16V6.5C17 5.04131 16.4205 3.64236 15.3891 2.61091C14.3576 1.57946 12.9587 1 11.5 1C10.0413 1 8.64236 1.57946 7.61091 2.61091C6.57946 3.64236 6 5.04131 6 6.5V18C6 19.0609 6.42143 20.0783 7.17157 20.8284C7.92172 21.5786 8.93913 22 10 22C11.0609 22 12.0783 21.5786 12.8284 20.8284C13.5786 20.0783 14 19.0609 14 18V6.38C13.9974 5.7496 13.7458 5.14576 13.3 4.69999C12.8542 4.25423 12.2504 4.00263 11.62 4H11.38C10.7496 4.00263 10.1458 4.25423 9.69999 4.69999C9.25423 5.14576 9.00263 5.7496 9 6.38V16C9 16.2652 9.10536 16.5196 9.29289 16.7071C9.48043 16.8946 9.73478 17 10 17C10.2652 17 10.5196 16.8946 10.7071 16.7071C10.8946 16.5196 11 16.2652 11 16V6.38C11 6.27922 11.04 6.18256 11.1113 6.1113C11.1826 6.04004 11.2792 6 11.38 6H11.62C11.7208 6 11.8174 6.04004 11.8887 6.1113C11.96 6.18256 12 6.27922 12 6.38V18C12 18.5304 11.7893 19.0391 11.4142 19.4142C11.0391 19.7893 10.5304 20 10 20C9.46957 20 8.96086 19.7893 8.58579 19.4142C8.21071 19.0391 8 18.5304 8 18V6.5C8 5.57174 8.36875 4.6815 9.02513 4.02513C9.6815 3.36875 10.5717 3 11.5 3C12.4283 3 13.3185 3.36875 13.9749 4.02513C14.6313 4.6815 15 5.57174 15 6.5V16C15 16.2652 15.1054 16.5196 15.2929 16.7071C15.4804 16.8946 15.7348 17 16 17Z',
      ),
      new OpeningTagEndToken('path', false),
      new ClosingTagToken('path'),
      new TextToken('\n  '),
      new ClosingTagToken('svg'),
    ],
  },

  {
    name: 'parses a template with document fragments',
    template: splitTemplateByParts(`
      {{__PART0__}}

      <div
        class="{{__PART1__}}"
        onclick="{{__PART2__}}"
        ondragenter="{{__PART3__}}"
        ondragleave="{{__PART4__}}"
      >
        {{__PART5__}}
        {{__PART6__}}

        <main class="dashboard__content">
          <div
            class="{{__PART7__}}"
          >
            {{__PART8__}}
          </div>
          {{__PART9__}}
        </main>
      </div>

      <aside
        class="{{__PART10__}}"
        ondragover="{{__PART11__}}"
        ondragenter="{{__PART12__}}"
        ondragleave="{{__PART13__}}"
        ondragend="{{__PART14__}}"
        ondrop="{{__PART15__}}"
      >
        <div
          class="border-dashed border-white rounded-xl flex flex-col border-4 p-12 justify-center items-center lg:p-24"
        >
          {{__PART16__}}

          <p class="font-bold my-2 text-white text-[24px]">Drag & Drop</p>

          <p class="text-base text-white">
            your {{__PART17__}} files here to upload
          </p>
        </div>
      </aside>`),
    expected: [
      new TextToken('\n      '),
      new PartToken(0),
      new TextToken('\n\n      '),
      new OpeningTagToken('div'),
      new ClassNameAttributeStartToken(),
      new PartToken(1),
      new ClassNameAttributeEndToken(),
      new EventAttributeStartToken('click'),
      new PartToken(2),
      new EventAttributeEndToken('click'),
      new EventAttributeStartToken('dragenter'),
      new PartToken(3),
      new EventAttributeEndToken('dragenter'),
      new EventAttributeStartToken('dragleave'),
      new PartToken(4),
      new EventAttributeEndToken('dragleave'),
      new OpeningTagEndToken('div'),
      new TextToken('\n        '),
      new PartToken(5),
      new TextToken('\n        '),
      new PartToken(6),
      new TextToken('\n\n        '),
      new OpeningTagToken('main'),
      new AttributeToken('class', 'dashboard__content'),
      new OpeningTagEndToken('main'),
      new TextToken('\n          '),
      new OpeningTagToken('div'),
      new ClassNameAttributeStartToken(),
      new PartToken(7),
      new ClassNameAttributeEndToken(),
      new OpeningTagEndToken('div'),
      new TextToken('\n            '),
      new PartToken(8),
      new TextToken('\n          '),
      new ClosingTagToken('div'),
      new TextToken('\n          '),
      new PartToken(9),
      new TextToken('\n        '),
      new ClosingTagToken('main'),
      new TextToken('\n      '),
      new ClosingTagToken('div'),
      new TextToken('\n\n      '),
      new OpeningTagToken('aside'),
      new ClassNameAttributeStartToken(),
      new PartToken(10),
      new ClassNameAttributeEndToken(),
      new EventAttributeStartToken('dragover'),
      new PartToken(11),
      new EventAttributeEndToken('dragover'),
      new EventAttributeStartToken('dragenter'),
      new PartToken(12),
      new EventAttributeEndToken('dragenter'),
      new EventAttributeStartToken('dragleave'),
      new PartToken(13),
      new EventAttributeEndToken('dragleave'),
      new EventAttributeStartToken('dragend'),
      new PartToken(14),
      new EventAttributeEndToken('dragend'),
      new EventAttributeStartToken('drop'),
      new PartToken(15),
      new EventAttributeEndToken('drop'),
      new OpeningTagEndToken('aside'),
      new TextToken('\n        '),
      new OpeningTagToken('div'),
      new AttributeToken(
        'class',
        'border-dashed border-white rounded-xl flex flex-col border-4 p-12 justify-center items-center lg:p-24',
      ),
      new OpeningTagEndToken('div'),
      new TextToken('\n          '),
      new PartToken(16),
      new TextToken('\n\n          '),
      new OpeningTagToken('p'),
      new AttributeToken('class', 'font-bold my-2 text-white text-[24px]'),
      new OpeningTagEndToken('p'),
      new TextToken('Drag & Drop'),
      new ClosingTagToken('p'),
      new TextToken('\n\n          '),
      new OpeningTagToken('p'),
      new AttributeToken('class', 'text-base text-white'),
      new OpeningTagEndToken('p'),
      new TextToken('\n            '),
      new TextToken('your '),
      new PartToken(17),
      new TextToken(' files here to upload'),
      new TextToken('\n          '),
      new ClosingTagToken('p'),
      new TextToken('\n        '),
      new ClosingTagToken('div'),
      new TextToken('\n      '),
      new ClosingTagToken('aside'),
    ],
  },
]

describe(tokenizeTemplateStrings.name, () => {
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
  const actual: Token[] = Array.from(tokenizeTemplateStrings(test.template))

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

function splitTemplateByParts(template: string): string[] {
  const parts = template.split(PART_REGEX)
  const strings: string[] = []

  for (let i = 0; i < parts.length; ) {
    if (PART_REGEX.test(parts[i])) {
      i += 2 // Skip past the extra matched portion of PART number
    } else {
      strings.push(parts[i])
      i += 1
    }
  }

  return strings
}
