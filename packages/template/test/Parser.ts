import { deepStrictEqual } from "assert"

import { describe, expect, it } from "vitest"

import * as Parser2 from "@typed/template/internal/parser"
import { templateHash } from "@typed/template/Parser"

import {
  AttributeNode,
  AttrPartNode,
  BooleanNode,
  BooleanPartNode,
  ClassNamePartNode,
  CommentNode,
  CommentPartNode,
  DataPartNode,
  ElementNode,
  EventPartNode,
  NodePart,
  PropertyPartNode,
  RefPartNode,
  SelfClosingElementNode,
  SparseAttrNode,
  SparseClassNameNode,
  SparseCommentNode,
  Template,
  TextNode,
  TextOnlyElement,
  TextPartNode
} from "@typed/template/Template"
import * as Chunk from "effect/Chunk"
import { inspect } from "util"

// TODO: Port over Tokenizer-based tests to Parser2

describe("Parser2", () => {
  it("parses a simple template", () => {
    const template = h`<div></div>`
    const expected = new Template(
      [new ElementNode("div", [], [])],
      templateHash(template),
      []
    )

    expect(Parser2.parser.parse(template)).toEqual(expected)
  })

  it("parses a template with attributes", () => {
    const template = h`<div id="foo" class="bar"></div>`

    const element = new ElementNode("div", [], [])
    const id = new AttributeNode("id", "foo")
    const className = new AttributeNode("class", "bar")

    element.attributes.push(id, className)

    const expected = new Template([element], templateHash(template), [])
    const actual = Parser2.parser.parse(template)

    expect(actual).toEqual(expected)
  })

  it("parses a template with attributes with holes", () => {
    const template = h`<div id=${"foo"} class=${"bar"}></div>`
    const div = new ElementNode("div", [], [])
    const id = new AttrPartNode("id", 0)
    const className = new ClassNamePartNode(1)

    div.attributes.push(id, className)

    const expected = new Template([div], templateHash(template), [
      [id, Chunk.of(0)],
      [className, Chunk.of(0)]
    ])

    expect(Parser2.parser.parse(template)).toEqual(expected)
  })

  it("parses sparse attributes", () => {
    const template = h`<div id="${"foo"} ${"bar"} ${"baz"}"></div>`
    const div = new ElementNode("div", [], [])
    const id0 = new AttrPartNode("id", 0)
    const id1 = new AttrPartNode("id", 1)
    const id2 = new AttrPartNode("id", 2)
    const idText = new TextNode(" ")
    const idText2 = new TextNode(" ")
    const sparse = new SparseAttrNode("id", [id0, idText, id1, idText2, id2])

    div.attributes.push(sparse)

    const expected = new Template([div], templateHash(template), [[sparse, Chunk.of(0)]])
    const actual = Parser2.parser.parse(template)

    expect(actual).toEqual(expected)
  })

  it("parses sparse attributes with text", () => {
    const template = h`<div id="${"foo"} hello ${"bar"} world ${"baz"}"></div>`
    const div = new ElementNode("div", [], [])
    const id0 = new AttrPartNode("id", 0)
    const id1 = new AttrPartNode("id", 1)
    const id2 = new AttrPartNode("id", 2)
    const idText = new TextNode(" hello ")
    const idText2 = new TextNode(" world ")
    const sparse = new SparseAttrNode("id", [id0, idText, id1, idText2, id2])

    div.attributes.push(sparse)

    const expected = new Template([div], templateHash(template), [[sparse, Chunk.unsafeFromArray([0])]])

    deepStrictEqual(Parser2.parser.parse(template), expected)
  })

  it("parses boolean attributes", () => {
    const template = h`<div hidden></div>`
    const div = new ElementNode("div", [], [])
    const hidden = new BooleanNode("hidden")

    div.attributes.push(hidden)

    const expected = new Template([div], templateHash(template), [])

    expect(Parser2.parser.parse(template)).toEqual(expected)
  })

  it("parses boolean attributes with holes", () => {
    const template = h`<div ?hidden="${true}"></div>`
    const div = new ElementNode("div", [], [])
    const hidden = new BooleanPartNode("hidden", 0)

    div.attributes.push(hidden)

    const expected = new Template([div], templateHash(template), [[hidden, Chunk.of(0)]])

    expect(Parser2.parser.parse(template)).toEqual(expected)
  })

  it("parses class name attributes", () => {
    const template = h`<div class="foo bar baz"></div>`
    const div = new ElementNode("div", [], [])
    const className = new AttributeNode("class", "foo bar baz")

    div.attributes.push(className)

    const expected = new Template([div], templateHash(template), [])

    expect(Parser2.parser.parse(template)).toEqual(expected)
  })

  it("parses class name attributes with holes", () => {
    const template = h`<div class=${"foo"}></div>`
    const div = new ElementNode("div", [], [])
    const className = new ClassNamePartNode(0)

    div.attributes.push(className)

    const expected = new Template([div], templateHash(template), [[className, Chunk.of(0)]])

    expect(Parser2.parser.parse(template)).toEqual(expected)
  })

  it("parses sparse class name attributes", () => {
    const template = h`<div class="${"foo"} ${"bar"} ${"baz"}"></div>`
    const div = new ElementNode("div", [], [])

    const className0 = new ClassNamePartNode(0)
    const className1 = new ClassNamePartNode(1)
    const className2 = new ClassNamePartNode(2)
    const sparse = new SparseClassNameNode([className0, className1, className2])

    div.attributes.push(sparse)

    const expected = new Template([div], templateHash(template), [[sparse, Chunk.of(0)]])

    expect(Parser2.parser.parse(template)).toEqual(expected)
  })

  it("parses a template with children", () => {
    const template = h`<div><span></span></div>`
    const div = new ElementNode("div", [], [])
    const span = new ElementNode("span", [], [])

    div.children.push(span)

    const expected = new Template([div], templateHash(template), [])
    const actual = Parser2.parser.parse(template)

    expect(actual).toEqual(expected)
  })

  it("parses a template with children with holes", () => {
    const template = h`<div><span>${"foo"}</span></div>`
    const div = new ElementNode("div", [], [])
    const span = new ElementNode("span", [], [])
    const part = new NodePart(0)

    span.children.push(part)

    div.children.push(span)

    const expected = new Template([div], templateHash(template), [[part, Chunk.make(0, 0)]])

    expect(Parser2.parser.parse(template)).toEqual(expected)
  })

  it("parses a template with children with holes and attributes", () => {
    const template = h`<div id=${"foo"}><span>${"bar"}</span></div>`
    const div = new ElementNode("div", [], [])
    const id = new AttrPartNode("id", 0)
    const span = new ElementNode("span", [], [])
    const part = new NodePart(1)

    span.children.push(part)

    div.attributes.push(id)
    div.children.push(span)

    const expected = new Template([div], templateHash(template), [
      [id, Chunk.of(0)],
      [part, Chunk.make(0, 0)]
    ])

    expect(Parser2.parser.parse(template)).toEqual(expected)
  })

  it("parses a template with children with holes and attributes and class names", () => {
    const template = h`<div id=${"foo"} class=${"bar"}><span>${"baz"}</span></div>`

    const div = new ElementNode("div", [], [])
    const id = new AttrPartNode("id", 0)
    const className = new ClassNamePartNode(1)
    const span = new ElementNode("span", [], [])
    const part = new NodePart(2)

    span.children.push(part)

    div.attributes.push(id, className)
    div.children.push(span)

    const expected = new Template([div], templateHash(template), [
      [id, Chunk.of(0)],
      [className, Chunk.of(0)],
      [part, Chunk.make(0, 0)]
    ])

    expect(Parser2.parser.parse(template)).toEqual(expected)
  })

  it("parses a template with children with holes and attributes and class names and sparse attributes", () => {
    const template = h`<div id=${"foo"} class=${"bar"} ?hidden=${true}><span>${"baz"}</span></div>`
    const div = new ElementNode("div", [], [])
    const id = new AttrPartNode("id", 0)
    const className = new ClassNamePartNode(1)
    const hidden = new BooleanPartNode("hidden", 2)
    const span = new ElementNode("span", [], [])
    const part = new NodePart(3)

    span.children.push(part)

    div.attributes.push(id, className, hidden)
    div.children.push(span)

    const expected = new Template([div], templateHash(template), [
      [id, Chunk.of(0)],
      [className, Chunk.of(0)],
      [hidden, Chunk.of(0)],
      [part, Chunk.make(0, 0)]
    ])

    expect(Parser2.parser.parse(template)).toEqual(expected)
  })

  it("parser a template with data attributes", () => {
    const template = h`<div data-foo=${"bar"}></div>`
    const div = new ElementNode("div", [], [])
    const data = new AttrPartNode("data-foo", 0)

    div.attributes.push(data)

    const expected = new Template([div], templateHash(template), [[data, Chunk.of(0)]])

    expect(Parser2.parser.parse(template)).toEqual(expected)
  })

  it("parses a template with .data property", () => {
    const template = h`<div .data=${{ a: "1", b: "2" }}></div>`

    const div = new ElementNode("div", [], [])
    const data = new DataPartNode(0)

    div.attributes.push(data)

    const expected = new Template([div], templateHash(template), [[data, Chunk.of(0)]])

    expect(Parser2.parser.parse(template)).toEqual(expected)
  })

  it("parses a template with @ event attributes", () => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const template = h`<div @click=${() => {}}></div>`
    const div = new ElementNode("div", [], [])
    const event = new EventPartNode("click", 0)

    div.attributes.push(event)

    const expected = new Template([div], templateHash(template), [[event, Chunk.of(0)]])

    expect(Parser2.parser.parse(template)).toEqual(expected)
  })

  it("parses a template with event attributes with on* syntax", () => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const template = h`<div onclick=${() => {}}></div>`
    const div = new ElementNode("div", [], [])
    const event = new EventPartNode("click", 0)

    div.attributes.push(event)

    const expected = new Template([div], templateHash(template), [[event, Chunk.of(0)]])

    expect(Parser2.parser.parse(template)).toEqual(expected)
  })

  it("parses nested templates", () => {
    const template = h`<div>${h`<span></span>`}</div>`
    const div = new ElementNode("div", [], [])
    const part = new NodePart(0)

    div.children.push(part)

    const expected = new Template([div], templateHash(template), [[part, Chunk.of(0)]])

    expect(Parser2.parser.parse(template)).toEqual(expected)
  })

  it("parses properties", () => {
    const template = h`<div .foo=${"bar"}></div>`
    const div = new ElementNode("div", [], [])
    const property = new PropertyPartNode("foo", 0)

    div.attributes.push(property)

    const expected = new Template([div], templateHash(template), [[property, Chunk.of(0)]])

    expect(Parser2.parser.parse(template)).toEqual(expected)
  })

  it("parse ref attributes", () => {
    const template = h`<div ref=${"foo"}></div>`
    const div = new ElementNode("div", [], [])
    const ref = new RefPartNode(0)

    div.attributes.push(ref)

    const expected = new Template([div], templateHash(template), [[ref, Chunk.of(0)]])

    expect(Parser2.parser.parse(template)).toEqual(expected)
  })

  it("parses text-only nodes", () => {
    const template = h`<textarea>foo</textarea>`
    const textarea = new TextOnlyElement("textarea", [], [])
    const text = new TextNode("foo")

    textarea.children.push(text)

    const expected = new Template([textarea], templateHash(template), [])

    expect(Parser2.parser.parse(template)).toEqual(expected)
  })

  it("parses text-only nodes with holes", () => {
    const template = h`<textarea>${"foo"}</textarea>`
    const textarea = new TextOnlyElement("textarea", [], [])
    const part = new TextPartNode(0)

    textarea.children.push(part)

    const expected = new Template([textarea], templateHash(template), [[part, Chunk.of(0)]])

    expect(Parser2.parser.parse(template)).toEqual(expected)
  })

  it("parses self-closing elements", () => {
    const template = h`<input />`
    const expected = new Template(
      [new SelfClosingElementNode("input", [])],
      templateHash(template),
      []
    )

    expect(Parser2.parser.parse(template)).toEqual(expected)
  })

  it("parses self-closing elements with attributes", () => {
    const template = h`<input type=${"text"} />`
    const input = new SelfClosingElementNode("input", [])
    const type = new AttrPartNode("type", 0)

    input.attributes.push(type)

    const expected = new Template([input], templateHash(template), [[type, Chunk.of(0)]])

    expect(Parser2.parser.parse(template)).toEqual(expected)
  })

  it("parses self-closing elements with attributes and class names", () => {
    const template = h`<input type=${"text"} class=${"foo"} />`
    const input = new SelfClosingElementNode("input", [])
    const type = new AttrPartNode("type", 0)
    const className = new ClassNamePartNode(1)

    input.attributes.push(type)
    input.attributes.push(className)

    const expected = new Template([input], templateHash(template), [
      [type, Chunk.of(0)],
      [className, Chunk.of(0)]
    ])

    expect(Parser2.parser.parse(template)).toEqual(expected)
  })

  it("parses empty templates", () => {
    const template = h``
    const expected = new Template([], templateHash(template), [])

    expect(Parser2.parser.parse(template)).toEqual(expected)
  })

  it.only("determines the correct path for parts", () => {
    const template = h`
    <div>
      <p>test ${"test"}</p>
    </div>
    <div>
      <p>test ${"test"}</p>
    </div>
    <footer>
      <div>
        <p>test</p>
      </div>
      <div>
        <p>${"test"}</p>
      </div>
    </footer>`
    const part1 = new NodePart(0)
    const part2 = new NodePart(1)
    const part3 = new NodePart(2)
    const expected = new Template(
      [
        new ElementNode("div", [], [new ElementNode("p", [], [new TextNode("test "), part1])]),
        new ElementNode("div", [], [new ElementNode("p", [], [new TextNode("test "), part2])]),
        new ElementNode(
          "footer",
          [],
          [
            new ElementNode("div", [], [new ElementNode("p", [], [new TextNode("test")])]),
            new ElementNode("div", [], [new ElementNode("p", [], [part3])])
          ]
        )
      ],
      templateHash(template),
      [
        [part1, Chunk.make(0, 0)],
        [part2, Chunk.make(1, 0)],
        [part3, Chunk.make(2, 1, 0)]
      ]
    )

    const actual = Parser2.parser.parse(template)

    console.log("Actual:")
    log(actual.parts)
    console.log("\nExpected:")
    log(expected.parts)

    expect(actual).toEqual(expected)
  })

  it("parses comments", () => {
    const template = h`<!-- test -->`
    const expected = new Template([new CommentNode(" test ")], templateHash(template), [])

    expect(Parser2.parser.parse(template)).toEqual(expected)
  })

  it("parses comments with hole", () => {
    const template = h`<!-- ${"test"} -->`
    const part = new SparseCommentNode([new TextNode(" "), new CommentPartNode(0), new TextNode(" ")])
    const expected = new Template([part], templateHash(template), [[part, Chunk.of(0)]])

    expect(Parser2.parser.parse(template)).toEqual(expected)
  })

  it("parses template with only holes", () => {
    const template = h`${"test"} ${"test"}`
    const part1 = new NodePart(0)
    const part2 = new NodePart(1)
    const expected = new Template(
      [part1, new TextNode(" "), part2],
      templateHash(template),
      [
        [part1, Chunk.empty()],
        [part2, Chunk.empty()]
      ]
    )

    expect(Parser2.parser.parse(template)).toEqual(expected)
  })
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function h<Values extends ReadonlyArray<any>>(template: TemplateStringsArray, ..._: Values) {
  return template
}

function log(value: any) {
  console.log(inspect(value, false, Infinity))
}
