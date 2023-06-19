import * as Option from '@effect/data/Option'
import { describe, expect, it } from 'vitest'

import { hashForTemplateStrings } from '../hashForTemplateStrings.js'

import {
  AttrPartNode,
  AttributeNode,
  BooleanNode,
  ClassNamePartNode,
  DataNode,
  ElementNode,
  EventNode,
  NodePart,
  Parser,
  PropertyNode,
  RefNode,
  SelfClosingElementNode,
  SparseAttrNode,
  SparseClassNameNode,
  Template,
  TextNode,
  TextOnlyElement,
  TextPartNode,
} from './parser.js'

describe(Parser.name, () => {
  const parser = new Parser()

  it('parses a simple template', () => {
    const template = h`<div></div>`
    const expected = new Template(
      [new ElementNode('div', [], [])],
      hashForTemplateStrings(template),
    )

    expect(parser.parse(template)).toEqual(expected)
  })

  it('parses a template with attributes', () => {
    const template = h`<div id="foo" class="bar"></div>`
    const expected = new Template(
      [
        new ElementNode(
          'div',
          [new AttributeNode('id', 'foo'), new AttributeNode('class', 'bar')],
          [],
        ),
      ],
      hashForTemplateStrings(template),
    )

    expect(parser.parse(template)).toEqual(expected)
  })

  it('parses a template with attributes with holes', () => {
    const template = h`<div id=${'foo'} class=${'bar'}></div>`
    const expected = new Template(
      [new ElementNode('div', [new AttrPartNode('id', 0), new ClassNamePartNode(1)], [])],
      hashForTemplateStrings(template),
    )

    expect(parser.parse(template)).toEqual(expected)
  })

  it('parses sparse attributes', () => {
    const template = h`<div id="${'foo'} ${'bar'} ${'baz'}}"></div>`
    const expected = new Template(
      [
        new ElementNode(
          'div',
          [
            new SparseAttrNode('id', [
              new AttrPartNode('id', 0),
              new AttrPartNode('id', 1),
              new AttrPartNode('id', 2),
            ]),
          ],
          [],
        ),
      ],
      hashForTemplateStrings(template),
    )
    expect(parser.parse(template)).toEqual(expected)
  })

  it('parses boolean attributes', () => {
    const template = h`<div hidden></div>`
    const expected = new Template(
      [new ElementNode('div', [new BooleanNode('hidden', Option.none())], [])],
      hashForTemplateStrings(template),
    )

    expect(parser.parse(template)).toEqual(expected)
  })

  it('parses boolean attributes with holes', () => {
    const template = h`<div ?hidden=${true}></div>`
    const expected = new Template(
      [new ElementNode('div', [new BooleanNode('hidden', Option.some(0))], [])],
      hashForTemplateStrings(template),
    )

    expect(parser.parse(template)).toEqual(expected)
  })

  it('parses class name attributes', () => {
    const template = h`<div class="foo bar baz"></div>`
    const expected = new Template(
      [new ElementNode('div', [new AttributeNode('class', 'foo bar baz')], [])],
      hashForTemplateStrings(template),
    )

    expect(parser.parse(template)).toEqual(expected)
  })

  it('parses class name attributes with holes', () => {
    const template = h`<div class=${'foo'}></div>`
    const expected = new Template(
      [new ElementNode('div', [new ClassNamePartNode(0)], [])],
      hashForTemplateStrings(template),
    )

    expect(parser.parse(template)).toEqual(expected)
  })

  it('parses sparse class name attributes', () => {
    const template = h`<div class="${'foo'} ${'bar'} ${'baz'}}"></div>`
    const expected = new Template(
      [
        new ElementNode(
          'div',
          [
            new SparseClassNameNode([
              new ClassNamePartNode(0),
              new ClassNamePartNode(1),
              new ClassNamePartNode(2),
            ]),
          ],
          [],
        ),
      ],
      hashForTemplateStrings(template),
    )
    expect(parser.parse(template)).toEqual(expected)
  })

  it('parses a template with children', () => {
    const template = h`<div><span></span></div>`
    const expected = new Template(
      [new ElementNode('div', [], [new ElementNode('span', [], [])])],
      hashForTemplateStrings(template),
    )

    expect(parser.parse(template)).toEqual(expected)
  })

  it('parses a template with children with holes', () => {
    const template = h`<div><span>${'foo'}</span></div>`
    const expected = new Template(
      [new ElementNode('div', [], [new ElementNode('span', [], [new NodePart(0)])])],
      hashForTemplateStrings(template),
    )

    expect(parser.parse(template)).toEqual(expected)
  })

  it('parses a template with children with holes and attributes', () => {
    const template = h`<div id=${'foo'}><span>${'bar'}</span></div>`
    const expected = new Template(
      [
        new ElementNode(
          'div',
          [new AttrPartNode('id', 0)],
          [new ElementNode('span', [], [new NodePart(1)])],
        ),
      ],
      hashForTemplateStrings(template),
    )

    expect(parser.parse(template)).toEqual(expected)
  })

  it('parses a template with children with holes and attributes and class names', () => {
    const template = h`<div id=${'foo'} class=${'bar'}><span>${'baz'}</span></div>`
    const expected = new Template(
      [
        new ElementNode(
          'div',
          [new AttrPartNode('id', 0), new ClassNamePartNode(1)],
          [new ElementNode('span', [], [new NodePart(2)])],
        ),
      ],
      hashForTemplateStrings(template),
    )

    expect(parser.parse(template)).toEqual(expected)
  })

  it('parses a template with children with holes and attributes and class names and sparse attributes', () => {
    const template = h`<div id=${'foo'} class=${'bar'} ?hidden=${true}><span>${'baz'}</span></div>`
    const expected = new Template(
      [
        new ElementNode(
          'div',
          [
            new AttrPartNode('id', 0),
            new ClassNamePartNode(1),
            new BooleanNode('hidden', Option.some(2)),
          ],
          [new ElementNode('span', [], [new NodePart(3)])],
        ),
      ],
      hashForTemplateStrings(template),
    )

    expect(parser.parse(template)).toEqual(expected)
  })

  it('parser a template with data attributes', () => {
    const template = h`<div data-foo=${'bar'}></div>`
    const expected = new Template(
      [new ElementNode('div', [new AttrPartNode('data-foo', 0)], [])],
      hashForTemplateStrings(template),
    )

    expect(parser.parse(template)).toEqual(expected)
  })

  it('parses a template with .data property', () => {
    const template = h`<div .data=${{ a: '1', b: '2' }}></div>`
    const expected = new Template(
      [new ElementNode('div', [new DataNode(0)], [])],
      hashForTemplateStrings(template),
    )

    expect(parser.parse(template)).toEqual(expected)
  })

  it('parses a template with @ event attributes', () => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const template = h`<div @click=${() => {}}></div>`
    const expected = new Template(
      [new ElementNode('div', [new EventNode('click', 0)], [])],
      hashForTemplateStrings(template),
    )

    expect(parser.parse(template)).toEqual(expected)
  })

  it('parses a template with event attributes with on* syntax', () => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const template = h`<div onclick=${() => {}}></div>`
    const expected = new Template(
      [new ElementNode('div', [new EventNode('click', 0)], [])],
      hashForTemplateStrings(template),
    )

    expect(parser.parse(template)).toEqual(expected)
  })

  it('parses nested templates', () => {
    const template = h`<div>${h`<span></span>`}</div>`
    const expected = new Template(
      [new ElementNode('div', [], [new NodePart(0)])],
      hashForTemplateStrings(template),
    )

    expect(parser.parse(template)).toEqual(expected)
  })

  it('parses properties', () => {
    const template = h`<div .foo=${'bar'}></div>`
    const expected = new Template(
      [new ElementNode('div', [new PropertyNode('foo', 0)], [])],
      hashForTemplateStrings(template),
    )

    expect(parser.parse(template)).toEqual(expected)
  })

  it('parse ref attributes', () => {
    const template = h`<div ref=${'foo'}></div>`
    const expected = new Template(
      [new ElementNode('div', [new RefNode(0)], [])],
      hashForTemplateStrings(template),
    )

    expect(parser.parse(template)).toEqual(expected)
  })

  it('parses text-only nodes', () => {
    const template = h`<textarea>foo</textarea>`
    const expected = new Template(
      [new TextOnlyElement('textarea', [], [new TextNode('foo')])],
      hashForTemplateStrings(template),
    )

    expect(parser.parse(template)).toEqual(expected)
  })

  it('parses text-only nodes with holes', () => {
    const template = h`<textarea>${'foo'}</textarea>`
    const expected = new Template(
      [new TextOnlyElement('textarea', [], [new TextPartNode(0)])],
      hashForTemplateStrings(template),
    )

    expect(parser.parse(template)).toEqual(expected)
  })

  it('parses self-closing elements', () => {
    const template = h`<input />`
    const expected = new Template(
      [new SelfClosingElementNode('input', [])],
      hashForTemplateStrings(template),
    )

    expect(parser.parse(template)).toEqual(expected)
  })

  it('parses self-closing elements with attributes', () => {
    const template = h`<input type=${'text'} />`
    const expected = new Template(
      [new SelfClosingElementNode('input', [new AttrPartNode('type', 0)])],
      hashForTemplateStrings(template),
    )

    expect(parser.parse(template)).toEqual(expected)
  })

  it('parses self-closing elements with attributes and class names', () => {
    const template = h`<input type=${'text'} class=${'foo'} />`
    const expected = new Template(
      [
        new SelfClosingElementNode('input', [
          new AttrPartNode('type', 0),
          new ClassNamePartNode(1),
        ]),
      ],
      hashForTemplateStrings(template),
    )

    expect(parser.parse(template)).toEqual(expected)
  })

  it.only('parses empty templates', () => {
    const template = h``
    const expected = new Template([], hashForTemplateStrings(template))

    expect(parser.parse(template)).toEqual(expected)
  })
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function h<Values extends readonly any[]>(template: TemplateStringsArray, ..._: Values) {
  return template
}
