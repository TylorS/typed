import { describe, expect, it } from 'vitest'

import { TYPED_HASH } from '../meta.js'
import * as parser from '../parser/parser.js'

import {
  HtmlChunk,
  PartChunk,
  SparsePartChunk,
  TextChunk,
  templateToHtmlChunks,
} from './templateToHtmlChunks.js'

const _parser = new parser.Parser()

const noOp = () => ''

describe(templateToHtmlChunks.name, () => {
  it('converts single element template to html chunks', () => {
    testChunks(h`<div>hello</div>`, ({ hash }) => [
      new TextChunk(`<div ${TYPED_HASH(hash)}>hello</div>`),
    ])
  })

  it('converts single element template with attributes to html chunks', () => {
    testChunks(h`<div id="foo" class="bar">hello</div>`, ({ hash }) => [
      new TextChunk(`<div ${TYPED_HASH(hash)} id="foo" class="bar">hello</div>`),
    ])
  })

  it('converts template with multiple root elements to html chunks', () => {
    testChunks(h`<div>hello</div><div>world</div>`, ({ hash }) => [
      new TextChunk(`<div ${TYPED_HASH(hash)}>hello</div><div ${TYPED_HASH(hash)}>world</div>`),
    ])
  })

  it('converts template parts to html chunks', () => {
    testChunks(h`<div>${'hello'}</div>`, ({ hash }) => [
      new TextChunk(`<div ${TYPED_HASH(hash)}>`),
      new PartChunk(new parser.NodePart(0), noOp),
      new TextChunk('</div>'),
    ])
  })

  it('converts template parts with attributes to html chunks', () => {
    testChunks(h`<div id="${'foo'}">${'hello'}</div>`, ({ hash }) => [
      new TextChunk(`<div ${TYPED_HASH(hash)}`),
      new PartChunk(new parser.AttrPartNode('id', 0), noOp),
      new TextChunk(`>`),
      new PartChunk(new parser.NodePart(1), noOp),
      new TextChunk(`</div>`),
    ])
  })

  it('converts boolean attributes and self-closing elements', () => {
    testChunks(h`<input disabled />`, ({ hash }) => [
      new TextChunk(`<input ${TYPED_HASH(hash)} disabled/>`),
    ])
  })

  it('converts boolean parts', () => {
    testChunks(h`<input ?disabled="${true}" />`, ({ hash }) => [
      new TextChunk(`<input ${TYPED_HASH(hash)}`),
      new PartChunk(new parser.BooleanPartNode('disabled', 0), noOp),
      new TextChunk(`/>`),
    ])
  })

  it('converts sparse attributes', () => {
    testChunks(h`<div class="${'foo'} bar ${'baz'}"></div>`, ({ hash, parts }) => {
      return [
        new TextChunk(`<div ${TYPED_HASH(hash)}`),
        new SparsePartChunk(parts[0][0] as parser.SparseAttrNode, noOp),
        new TextChunk(`></div>`),
      ]
    })
  })

  it(`converts empty template`, () => {
    testChunks(h``, () => [])
  })

  it(`convert template with only text`, () => {
    testChunks(h`hello world`, () => [new TextChunk(`hello world`)])
  })

  it(`converts template with only parts`, () => {
    testChunks(h`${'hello'} ${'world'}`, () => [
      new PartChunk(new parser.NodePart(0), noOp),
      new TextChunk(` `),
      new PartChunk(new parser.NodePart(1), noOp),
    ])
  })
})

function testChunks(
  template: TemplateStringsArray,
  expectedChunks: (input: parser.Template) => HtmlChunk[],
) {
  const t = _parser.parse(template)
  const actual = templateToHtmlChunks(t).map(toComparable)
  const expected = expectedChunks(t).map(toComparable)

  try {
    expect(actual).toEqual(expected)
  } catch (e) {
    console.log('actual', actual)
    console.log('expected', expected)
    throw e
  }
}

function toComparable(chunk: HtmlChunk) {
  switch (chunk.type) {
    case 'part':
      return [chunk.type, chunk.node]
    case 'sparse-part':
      return [chunk.type, chunk.node.nodes]
    case 'text':
      return [chunk.type, chunk.value]
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function h<Values extends readonly any[]>(template: TemplateStringsArray, ..._: Values) {
  return template
}
