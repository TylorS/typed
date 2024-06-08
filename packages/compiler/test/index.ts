/// <reference types="vite/client" />
/// <reference types="vitest" />

import * as _ from "@typed/compiler"
import { AttributeNode, ElementNode, NodePart, Template, TextNode } from "@typed/template/Template"
import { Chunk } from "effect"
import * as path from "node:path"
import type ts from "typescript"

const rootDirectory = path.dirname(import.meta.dirname)
const testDirectory = path.join(rootDirectory, "test")
const fixturesDirectory = path.join(testDirectory, "fixtures")

function makeCompiler(target: _.CompilerTarget) {
  const compiler = new _.Compiler(rootDirectory, "tsconfig.test.json", target)

  const sourceFiles: {
    [k: string]: ts.SourceFile
  } = {}

  const files = new Proxy(sourceFiles, {
    get(target, key) {
      if (key in target) {
        return target[key as string]
      }

      const filePath = path.join(fixturesDirectory, key as string)
      const file = compiler.project.addFile(filePath)
      target[key as string] = file
      return file
    }
  })

  afterAll(() => {
    compiler.project.dispose()
  })

  return {
    compiler,
    files
  }
}

describe("Compiler", () => {
  describe("parseTemplates", () => {
    const { compiler, files } = makeCompiler("dom")
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

      const [div, inner] = templates
      const nodePart = new NodePart(0)
      const expectedDiv = new Template(
        [
          new ElementNode("div", [new AttributeNode("style", "border: 1px solid #000;")], [nodePart])
        ],
        "",
        [[
          nodePart,
          Chunk.of(0)
        ]]
      )
      const expectedP = new Template(
        [
          new ElementNode("p", [], [new TextNode("Hello")]),
          new ElementNode("b", [], [new TextNode("World")])
        ],
        "",
        []
      )

      equalTemplates(inner.template, expectedP)
      equalTemplates(div.template, expectedDiv)
      equalParts(div.parts, { index: 0, kind: "template" })
    })
  })

  describe("compileTemplates", () => {
    const { compiler, files } = makeCompiler("dom")

    it("optimizes nested templates for the DOM", () => {
      const nestedTemplates = compiler.compileTemplates(files["nested-templates.ts"])
      const text = getSnapshotText(nestedTemplates.js)
      const expected = `import * as Document from "@typed/dom/Document";
import * as RenderContext from "@typed/template/RenderContext";
import * as Context from "@typed/context";
import * as CompilerTools from "@typed/template/compiler-tools";
import * as RenderEvent from "@typed/template/RenderEvent";
import * as Effect from "effect/Effect";
import * as Scope from "effect/Scope";
import * as Fx from "@typed/fx";
export const render = Fx.make(function render(sink) { return Effect.gen(function* (_) {
    const context = yield* _(Effect.context());
    const document = Context.get(context, Document.Document);
    const renderContext = Context.get(context, RenderContext.RenderContext);
    const templateContext = yield* _(CompilerTools.makeTemplateContext(document, renderContext, [[]], sink.onFailure));
    const element0 = document.createElement("div");
    element0.setAttribute("style", "border: 1px solid #000;");
    const template0_element0 = document.createElement("p");
    const template0_text0 = document.createTextNode("Hello");
    template0_element0.appendChild(template0_text0);
    const template0_element1 = document.createElement("b");
    const template0_text1 = document.createTextNode("World");
    template0_element1.appendChild(template0_text1);
    element0.appendChild(template0_element0);
    element0.appendChild(template0_element1);
    if (templateContext.expected > 0 && (yield* _(templateContext.refCounter.expect(templateContext.expected))))
        yield* _(templateContext.refCounter.wait);
    yield* _(sink.onSuccess(RenderEvent.DomRenderEvent(element0)));
    yield* _(Effect.never, Effect.onExit(exit => Scope.close(templateContext.scope, exit)));
}); });
//# sourceMappingURL=nested-templates.js.map`

      expect(text).toEqual(expected)
    })

    it("optimizes interpolated templates for the DOM", () => {
      const divWithEffect = compiler.compileTemplates(files["div-with-interpolated-effect.ts"])
      const divWithRefSubject = compiler.compileTemplates(files["div-with-interpolated-refsubject.ts"])

      expect(getSnapshotText(divWithEffect.js)).toEqual(`import * as Document from "@typed/dom/Document";
import * as RenderContext from "@typed/template/RenderContext";
import * as Context from "@typed/context";
import * as CompilerTools from "@typed/template/compiler-tools";
import * as RenderEvent from "@typed/template/RenderEvent";
import * as Scope from "effect/Scope";
import * as Fx from "@typed/fx";
import * as Effect from "effect/Effect";
export const render = Fx.make(function render(sink) { return Effect.gen(function* (_) {
    const context = yield* _(Effect.context());
    const document = Context.get(context, Document.Document);
    const renderContext = Context.get(context, RenderContext.RenderContext);
    const templateContext = yield* _(CompilerTools.makeTemplateContext(document, renderContext, [Effect.succeed(42n)], sink.onFailure));
    const element0 = document.createElement("div");
    const nodePart0_comment = document.createComment("hole0");
    element0.appendChild(nodePart0_comment);
    const nodePart0 = CompilerTools.setupNodePart({ index: 0 }, nodePart0_comment, templateContext, null, []);
    if (nodePart0 !== null)
        yield* _(nodePart0, Effect.catchAllCause(sink.onFailure), Effect.forkIn(templateContext.scope));
    if (templateContext.expected > 0 && (yield* _(templateContext.refCounter.expect(templateContext.expected))))
        yield* _(templateContext.refCounter.wait);
    yield* _(sink.onSuccess(RenderEvent.DomRenderEvent(element0)));
    yield* _(Effect.never, Effect.onExit(exit => Scope.close(templateContext.scope, exit)));
}); });
//# sourceMappingURL=div-with-interpolated-effect.js.map`)

      expect(getSnapshotText(divWithRefSubject.js)).toEqual(`import * as Document from "@typed/dom/Document";
import * as RenderContext from "@typed/template/RenderContext";
import * as Context from "@typed/context";
import * as CompilerTools from "@typed/template/compiler-tools";
import * as Effect from "effect/Effect";
import * as RenderEvent from "@typed/template/RenderEvent";
import * as Scope from "effect/Scope";
import * as Fx from "@typed/fx";
import { RefSubject } from "@typed/core";
const ref = RefSubject.tagged()("ref");
export const render = Fx.make(function render(sink) { return Effect.gen(function* (_) {
    const context = yield* _(Effect.context());
    const document = Context.get(context, Document.Document);
    const renderContext = Context.get(context, RenderContext.RenderContext);
    const templateContext = yield* _(CompilerTools.makeTemplateContext(document, renderContext, [ref], sink.onFailure));
    const element0 = document.createElement("div");
    const nodePart0_comment = document.createComment("hole0");
    element0.appendChild(nodePart0_comment);
    const nodePart0 = CompilerTools.setupNodePart({ index: 0 }, nodePart0_comment, templateContext, null, []);
    if (nodePart0 !== null)
        yield* _(nodePart0, Effect.catchAllCause(sink.onFailure), Effect.forkIn(templateContext.scope));
    if (templateContext.expected > 0 && (yield* _(templateContext.refCounter.expect(templateContext.expected))))
        yield* _(templateContext.refCounter.wait);
    yield* _(sink.onSuccess(RenderEvent.DomRenderEvent(element0)));
    yield* _(Effect.never, Effect.onExit(exit => Scope.close(templateContext.scope, exit)));
}); });
//# sourceMappingURL=div-with-interpolated-refsubject.js.map`)
    })

    it("optimizes sparse classes", () => {
      const { compiler, files } = makeCompiler("dom")
      const divWithSparseClass = compiler.compileTemplates(files["div-with-sparse-class.ts"])
      expect(getSnapshotText(divWithSparseClass.js)).toEqual(`import * as Document from "@typed/dom/Document";
import * as RenderContext from "@typed/template/RenderContext";
import * as Context from "@typed/context";
import * as CompilerTools from "@typed/template/compiler-tools";
import * as Effect from "effect/Effect";
import * as RenderEvent from "@typed/template/RenderEvent";
import * as Scope from "effect/Scope";
import * as Fx from "@typed/fx";
export const render = Fx.make(function render(sink) { return Effect.gen(function* (_) {
    const context = yield* _(Effect.context());
    const document = Context.get(context, Document.Document);
    const renderContext = Context.get(context, RenderContext.RenderContext);
    const templateContext = yield* _(CompilerTools.makeTemplateContext(document, renderContext, [["foo", "bar"]], sink.onFailure));
    const element0 = document.createElement("div");
    const template0_element0 = document.createElement("div");
    const template0_element0_class = CompilerTools.setupSparseClassNamePart({ nodes: [{ _tag: "className-part", index: 0 }, { _tag: "text", value: " " }, { _tag: "className-part", index: 1 }] }, template0_element0, { ...templateContext, values: templateContext.values[0] });
    if (template0_element0_class !== null)
        yield* _(template0_element0_class, Effect.catchAllCause(sink.onFailure), Effect.forkIn(templateContext.scope));
    const template0_text0 = document.createTextNode("Hello World");
    template0_element0.appendChild(template0_text0);
    element0.appendChild(template0_element0);
    if (templateContext.expected > 0 && (yield* _(templateContext.refCounter.expect(templateContext.expected))))
        yield* _(templateContext.refCounter.wait);
    yield* _(sink.onSuccess(RenderEvent.DomRenderEvent(element0)));
    yield* _(Effect.never, Effect.onExit(exit => Scope.close(templateContext.scope, exit)));
}); });
//# sourceMappingURL=div-with-sparse-class.js.map`)
    })
  })
})

function getSnapshotText(snapshot: ts.IScriptSnapshot) {
  return snapshot.getText(0, snapshot.getLength())
}

function equalTemplates(actual: Template, expected: Template) {
  expect(actual.nodes).toEqual(expected.nodes)
  expect(actual.parts).toEqual(expected.parts)
}

function equalParts(
  actual: ReadonlyArray<_.ParsedPart>,
  ...expected: ReadonlyArray<Omit<_.ParsedPart, "type" | "node">>
) {
  actual.forEach((p, i) => {
    expect(p.index).toEqual(expected[i].index)
    expect(p.kind).toEqual(expected[i].kind)
  })
}
