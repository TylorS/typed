import * as _ from "@typed/compiler"
import { ElementNode, NodePart, Template, TextNode } from "@typed/template/Template"
import { Chunk } from "effect"
import { readdirSync } from "fs"
import path from "path"

const rootDirectory = path.dirname(import.meta.dirname)
const testDirectory = path.join(rootDirectory, "test")
const fixturesDirectory = path.join(testDirectory, "fixtures")
const fixtures = readdirSync(fixturesDirectory).map((name) => path.join(fixturesDirectory, name))

function makeCompiler() {
  const compiler = new _.Compiler(rootDirectory, "tsconfig.test.json")
  const files = Object.fromEntries(
    fixtures.map((
      fixture
    ) => [path.relative(fixturesDirectory, fixture), compiler.project.addFile(fixture)])
  )

  return {
    compiler,
    files
  }
}

describe("Compiler", () => {
  const { compiler, files } = makeCompiler()

  it("Static <div> with text", () => {
    const templates = compiler.parseTemplates(files["static-div-with-text.ts"])
    expect(templates).toHaveLength(1)
    const [div] = templates
    const expected = new Template([new ElementNode("div", [], [new TextNode("Hello World")])], ``, [])

    equalTemplates(div.template, expected)
    expect(div.parts).toEqual([])
  })

  it("<div> with interpolated text", () => {
    const templates = compiler.parseTemplates(files["div-with-interpolated-text.ts"])
    expect(templates).toHaveLength(1)
    const [div] = templates
    const nodePart = new NodePart(0)
    const expected = new Template([new ElementNode("div", [], [nodePart])], ``, [[nodePart, Chunk.of(0)]])

    equalTemplates(div.template, expected)
    equalParts(div.parts, { index: 0, kind: "primitive" })
  })

  it("<div> with interpolated bigint", () => {
    const templates = compiler.parseTemplates(files["div-with-interpolated-bigint.ts"])
    expect(templates).toHaveLength(1)
    const [div] = templates
    const nodePart = new NodePart(0)
    const expected = new Template([new ElementNode("div", [], [nodePart])], ``, [[nodePart, Chunk.of(0)]])

    equalTemplates(div.template, expected)
    equalParts(div.parts, { index: 0, kind: "primitive" })
  })

  it("<div> with interpolated null", () => {
    const templates = compiler.parseTemplates(files["div-with-interpolated-null.ts"])
    expect(templates).toHaveLength(1)
    const [div] = templates
    const nodePart = new NodePart(0)
    const expected = new Template([new ElementNode("div", [], [nodePart])], ``, [[nodePart, Chunk.of(0)]])

    equalTemplates(div.template, expected)
    equalParts(div.parts, { index: 0, kind: "primitive" })
  })

  it("<div> with interpolated number", () => {
    const templates = compiler.parseTemplates(files["div-with-interpolated-number.ts"])
    expect(templates).toHaveLength(1)
    const [div] = templates
    const nodePart = new NodePart(0)
    const expected = new Template([new ElementNode("div", [], [nodePart])], ``, [[nodePart, Chunk.of(0)]])

    equalTemplates(div.template, expected)
    equalParts(div.parts, { index: 0, kind: "primitive" })
  })

  it("<div> with interpolated undefined", () => {
    const templates = compiler.parseTemplates(files["div-with-interpolated-undefined.ts"])
    expect(templates).toHaveLength(1)
    const [div] = templates
    const nodePart = new NodePart(0)
    const expected = new Template([new ElementNode("div", [], [nodePart])], ``, [[nodePart, Chunk.of(0)]])

    equalTemplates(div.template, expected)
    equalParts(div.parts, { index: 0, kind: "primitive" })
  })

  it("<div> with interpolated void", () => {
    const templates = compiler.parseTemplates(files["div-with-interpolated-void.ts"])
    expect(templates).toHaveLength(1)
    const [div] = templates
    const nodePart = new NodePart(0)
    const expected = new Template([new ElementNode("div", [], [nodePart])], ``, [[nodePart, Chunk.of(0)]])

    equalTemplates(div.template, expected)
    equalParts(div.parts, { index: 0, kind: "primitive" })
  })

  it("<div> with interpolated effect", () => {
    const templates = compiler.parseTemplates(files["div-with-interpolated-effect.ts"])
    expect(templates).toHaveLength(1)
    const [div] = templates
    const nodePart = new NodePart(0)
    const expected = new Template([new ElementNode("div", [], [nodePart])], ``, [[nodePart, Chunk.of(0)]])

    equalTemplates(div.template, expected)
    equalParts(div.parts, { index: 0, kind: "effect" })
  })

  it("<div> with interpolated fx", () => {
    const templates = compiler.parseTemplates(files["div-with-interpolated-fx.ts"])
    expect(templates).toHaveLength(1)
    const [div] = templates
    const nodePart = new NodePart(0)
    const expected = new Template([new ElementNode("div", [], [nodePart])], ``, [[nodePart, Chunk.of(0)]])

    equalTemplates(div.template, expected)
    equalParts(div.parts, { index: 0, kind: "fx" })
  })

  it("<div> with interpolated RefSubject", () => {
    const templates = compiler.parseTemplates(files["div-with-interpolated-refsubject.ts"])
    expect(templates).toHaveLength(1)
    const [div] = templates
    const nodePart = new NodePart(0)
    const expected = new Template([new ElementNode("div", [], [nodePart])], ``, [[nodePart, Chunk.of(0)]])

    equalTemplates(div.template, expected)
    equalParts(div.parts, { index: 0, kind: "fxEffect" })
  })

  it("<div> with interpolated Directive", () => {
    const templates = compiler.parseTemplates(files["div-with-interpolated-directive.ts"])
    expect(templates).toHaveLength(1)
    const [div] = templates
    const nodePart = new NodePart(0)
    const expected = new Template([new ElementNode("div", [], [nodePart])], ``, [[nodePart, Chunk.of(0)]])

    equalTemplates(div.template, expected)
    equalParts(div.parts, { index: 0, kind: "directive" })
  })

  it("nested template", () => {
    const templates = compiler.parseTemplates(files["nested-templates.ts"])

    expect(templates).toHaveLength(2)

    const [p, div] = templates
    const expectedP = new Template([new ElementNode("p", [], [new TextNode("Hello World")])], "", [])
    const nodePart = new NodePart(0)
    const expectedDiv = new Template([new ElementNode("div", [], [nodePart])], "", [[nodePart, Chunk.of(0)]])

    equalTemplates(p.template, expectedP)
    equalTemplates(div.template, expectedDiv)
  })
})

function equalTemplates(actual: Template, expected: Template) {
  expect(actual.nodes).toEqual(expected.nodes)
  expect(actual.parts).toEqual(expected.parts)
}

function equalParts(actual: ReadonlyArray<_.ParsedPart>, ...expected: ReadonlyArray<Omit<_.ParsedPart, "type">>) {
  actual.forEach((p, i) => {
    expect(p.index).toEqual(expected[i].index)
    expect(p.kind).toEqual(expected[i].kind)
  })
}
