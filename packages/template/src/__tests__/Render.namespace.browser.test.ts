import { Effect } from "effect";
import { Fx } from "@typed/fx";
import { assert, describe, it } from "vitest";
import { DomRenderTemplate, html, render } from "../index.js";

const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
const MATHML_NAMESPACE = "http://www.w3.org/1998/Math/MathML";
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const XLINK_NAMESPACE = "http://www.w3.org/1999/xlink";

describe("DOM namespace construction", () => {
  it("constructs SVG and MathML elements and attributes in their platform namespaces", () =>
    Effect.gen(function* () {
      const host = document.createElement("div");
      document.body.append(host);
      yield* Effect.addFinalizer(() => Effect.sync(() => host.remove()));

      const view = html`<main>
        <svg id="icon" viewBox=${"0 0 10 10"}>
          <defs>
            <linearGradient id="paint"><stop offset="50%" /></linearGradient>
          </defs>
          <use id="static-use" xlink:href="#shape" />
          <use id="dynamic-use" xlink:href=${"#shape"} />
          <foreignObject><section id="html-in-svg">HTML</section></foreignObject>
        </svg>
        <math id="formula"
          ><mrow><mi>x</mi><mo>+</mo><mn>1</mn></mrow></math
        >
      </main>`;

      yield* render(view, host).pipe(
        Fx.provide(DomRenderTemplate.using(document)),
        Fx.take(1),
        Fx.drain,
      );

      const svg = host.querySelector("#icon");
      const gradient = host.querySelector("linearGradient");
      const staticUse = host.querySelector("#static-use");
      const dynamicUse = host.querySelector("#dynamic-use");
      const foreignObject = host.querySelector("foreignObject");
      const htmlInSvg = host.querySelector("#html-in-svg");
      const math = host.querySelector("#formula");
      const mrow = host.querySelector("mrow");
      assert(
        svg && gradient && staticUse && dynamicUse && foreignObject && htmlInSvg && math && mrow,
      );

      assert.strictEqual(svg.namespaceURI, SVG_NAMESPACE);
      assert.strictEqual(svg.getAttributeNode("viewBox")?.name, "viewBox");
      assert.strictEqual(gradient.namespaceURI, SVG_NAMESPACE);
      assert.strictEqual(gradient.localName, "linearGradient");
      assert.strictEqual(staticUse.getAttributeNode("xlink:href")?.namespaceURI, XLINK_NAMESPACE);
      assert.strictEqual(dynamicUse.getAttributeNode("xlink:href")?.namespaceURI, XLINK_NAMESPACE);
      assert.strictEqual(foreignObject.namespaceURI, SVG_NAMESPACE);
      assert.strictEqual(htmlInSvg.namespaceURI, HTML_NAMESPACE);
      assert.strictEqual(math.namespaceURI, MATHML_NAMESPACE);
      assert.strictEqual(mrow.namespaceURI, MATHML_NAMESPACE);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("uses HTML parsing integration points inside foreign content", () =>
    Effect.gen(function* () {
      const host = document.createElement("div");
      document.body.append(host);
      yield* Effect.addFinalizer(() => Effect.sync(() => host.remove()));

      const view = html`<div>
        <svg>
          <desc><span id="html-in-desc">description</span></desc>
        </svg>
        <math>
          <mtext><span id="html-in-mtext">label</span></mtext>
          <annotation-xml encoding="text/html"
            ><div id="html-in-annotation">note</div></annotation-xml
          >
        </math>
      </div>`;

      yield* render(view, host).pipe(
        Fx.provide(DomRenderTemplate.using(document)),
        Fx.take(1),
        Fx.drain,
      );

      assert.strictEqual(host.querySelector("#html-in-desc")?.namespaceURI, HTML_NAMESPACE);
      assert.strictEqual(host.querySelector("#html-in-mtext")?.namespaceURI, HTML_NAMESPACE);
      assert.strictEqual(host.querySelector("#html-in-annotation")?.namespaceURI, HTML_NAMESPACE);
    }).pipe(Effect.scoped, Effect.runPromise));
});

describe("namespace-sensitive attributes", () => {
  it("keeps prefixed attributes unnamespaced and case-normalized on HTML elements", () =>
    Effect.gen(function* () {
      const host = document.createElement("div");
      document.body.append(host);
      yield* Effect.addFinalizer(() => Effect.sync(() => host.remove()));
      const view = html`<div
        id="html-attributes"
        DATA-CUSTOM="value"
        xlink:href="#shape"
        xml:lang="en"
        xmlns:xlink="http://www.w3.org/1999/xlink"
      ></div>`;

      yield* render(view, host).pipe(
        Fx.provide(DomRenderTemplate.using(document)),
        Fx.take(1),
        Fx.drain,
      );
      const element = host.querySelector("#html-attributes");
      assert(element);
      assert.strictEqual(element.namespaceURI, HTML_NAMESPACE);
      assert.strictEqual(element.getAttributeNode("data-custom")?.name, "data-custom");
      assert.strictEqual(element.getAttributeNode("xlink:href")?.namespaceURI, null);
      assert.strictEqual(element.getAttributeNode("xml:lang")?.namespaceURI, null);
      assert.strictEqual(element.getAttributeNode("xmlns:xlink")?.namespaceURI, null);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("canonicalizes MathML definitionURL", () =>
    Effect.gen(function* () {
      const host = document.createElement("div");
      document.body.append(host);
      yield* Effect.addFinalizer(() => Effect.sync(() => host.remove()));

      yield* render(html`<math><semantics definitionurl="urn:example" /></math>`, host).pipe(
        Fx.provide(DomRenderTemplate.using(document)),
        Fx.take(1),
        Fx.drain,
      );
      const semantics = host.querySelector("semantics");
      assert(semantics);
      assert.strictEqual(semantics.getAttributeNode("definitionURL")?.name, "definitionURL");
    }).pipe(Effect.scoped, Effect.runPromise));
});
