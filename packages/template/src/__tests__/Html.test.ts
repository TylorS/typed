import { describe, expect, it } from "vitest";
import type { Scope } from "effect";
import { Effect, Schema } from "effect";
import { Fx, RefSubject } from "@typed/fx";
import {
  html,
  HtmlRenderEvent,
  many,
  renderToHtmlString,
  StaticHtmlRenderTemplate,
} from "../index.js";
import { escape } from "../internal/encoding.js";
import { getHtmlRenderEvents, getStaticHtml } from "./helpers/html-output.js";

describe("Html", () => {
  it("omits absent attributes without putting node markers in attribute values", () =>
    Effect.gen(function* () {
      const output = (yield* getHtmlRenderEvents(html`<div
        title=${undefined}
        aria-label=${Effect.succeed(undefined)}
        data-null=${null}
        ...${{ "aria-describedby": undefined, "data-effect": Effect.succeed(null) }}
        class="before ${undefined} after"
      >
        ${undefined}
      </div>`)).join("");
      expect(output).not.toContain("title=");
      expect(output).not.toContain("aria-label=");
      expect(output).not.toContain("aria-describedby=");
      expect(output).not.toContain("data-null=");
      expect(output).not.toContain("data-effect=");
      expect(output).toContain('class="before  after"');
      expect(output).toContain("<!--txt-->");
      expect(output).not.toContain("&lt;!--txt--&gt;");
    }).pipe(Effect.scoped, Effect.runPromise));

  it.each([undefined, null])("omits nullish property attributes in static and hydratable HTML: %s", (absent) =>
    Effect.gen(function* () {
      const view = html`<input .disabled=${absent} .value=${absent} />`;
      const staticOutput = yield* getStaticHtml(view);
      const hydratableOutput = (yield* getHtmlRenderEvents(view)).join("");
      for (const output of [staticOutput, hydratableOutput]) {
        expect(output).not.toContain("disabled");
        expect(output).not.toContain("value=");
      }
      const empty = html`<input .value=${""} />`;
      expect(yield* getStaticHtml(empty)).toContain('value=""');
      expect((yield* getHtmlRenderEvents(empty)).join("")).toContain('value=""');
      const present = html`<input .value=${"ready"} .disabled=${true} />`;
      for (const output of [yield* getStaticHtml(present), (yield* getHtmlRenderEvents(present)).join("")]) {
        expect(output).toContain('value="ready"');
        expect(output).toContain('disabled="true"');
      }
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders an array of RenderEvents without a hole-only template", () =>
    renderToHtmlString([html`<span>First</span>`, html`<span>Last</span>`]).pipe(
      Effect.provide(StaticHtmlRenderTemplate),
      Effect.scoped,
      Effect.map((output) => expect(output).toBe("<span>First</span><span>Last</span>")),
      Effect.runPromise,
    ));

  it("renders hydrated RefSubject metadata for interactive HTML", () =>
    Effect.gen(function* () {
      const count = yield* RefSubject.hydrate(Schema.Finite, 7);
      const output = (yield* getHtmlRenderEvents(
        html`<button ref=${count}>${count}</button>`,
      )).join("");

      expect(output).toContain(
        'data-typed-refsubject="{&quot;version&quot;:1,&quot;values&quot;:[7]}"',
      );
      expect(output).toContain("<!--n_1-->7<!--/n_1-->");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("omits hydrated RefSubject metadata for static HTML", () =>
    Effect.gen(function* () {
      const count = yield* RefSubject.hydrate(Schema.Finite, 7);
      const page = yield* RefSubject.hydrate(Schema.FiniteFromString, 3, { name: "page" });
      const output = yield* getStaticHtml(
        html`<button ref=${RefSubject.hydrateAll(count, page)}>${count}</button>`,
      );

      expect(output).not.toContain(RefSubject.HYDRATION_ATTRIBUTE);
      expect(output).not.toContain("data-page");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders grouped unnamed and scalar named hydration metadata", () =>
    Effect.gen(function* () {
      const first = yield* RefSubject.hydrate(Schema.Finite, 1);
      const page = yield* RefSubject.hydrate(Schema.FiniteFromString, 3, { name: "page" });
      const second = yield* RefSubject.hydrate(Schema.Finite, 2);
      const ref = RefSubject.hydrateAll(first, page, second);

      const output = (yield* getHtmlRenderEvents(html`<section ref=${ref}></section>`)).join("");

      expect(output).toContain(
        'data-typed-refsubject="{&quot;version&quot;:1,&quot;values&quot;:[1,2]}"',
      );
      expect(output).toContain('data-page="3"');
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders callable hydrated state through nested data and arrays", () =>
    Effect.gen(function* () {
      const count = yield* RefSubject.hydrate(Schema.Finite, 7);
      const output = yield* getStaticHtml(html`<div .data=${{ count }}>${[count]}</div>`);

      expect(output).toContain('data-count="7"');
      expect(output).toContain(">7</div>");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("keeps ordinary ref callbacks out of server HTML", () =>
    Effect.gen(function* () {
      const output = (yield* getHtmlRenderEvents(
        html`<button ref=${() => {}}>Click</button>`,
      )).join("");

      expect(output).not.toContain(RefSubject.HYDRATION_ATTRIBUTE);
      expect(output).toContain("<button>Click</button>");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("static template", () =>
    Effect.gen(function* () {
      expect(yield* getStaticHtml(html` <div>Hello, world!</div> `)).toMatchInlineSnapshot(
        `"<div>Hello, world!</div>"`,
      );
    }).pipe(Effect.scoped, Effect.runPromise));

  it("dynamic template for text", () =>
    Effect.gen(function* () {
      expect(yield* getStaticHtml(html`<div>Hello, ${"Typed"}!</div>`)).toMatchInlineSnapshot(
        `"<div>Hello, Typed!</div>"`,
      );
    }).pipe(Effect.scoped, Effect.runPromise));

  it("dynamic template for effect", () =>
    Effect.gen(function* () {
      expect(
        yield* getStaticHtml(html`<div>Hello, ${Effect.succeed("Typed")}!</div>`),
      ).toMatchInlineSnapshot(`"<div>Hello, Typed!</div>"`);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("dynamic template for fx only takes first value", () =>
    Effect.gen(function* () {
      expect(
        yield* getStaticHtml(
          html`<div>Hello, ${Fx.mergeAll(Fx.succeed("Typed"), Fx.succeed("Other"))}!</div>`,
        ),
      ).toMatchInlineSnapshot(`"<div>Hello, Typed!</div>"`);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("streams render events in order", () =>
    Effect.gen(function* () {
      const events = Fx.mergeAll(
        Fx.succeed(HtmlRenderEvent("Typ", false)),
        Fx.succeed(HtmlRenderEvent("ed", true)),
      );

      expect(yield* getStaticHtml(html`<div>Hello, ${events}!</div>`)).toMatchInlineSnapshot(
        `"<div>Hello, Typed!</div>"`,
      );
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders template with static attribute", () =>
    Effect.gen(function* () {
      expect(
        yield* getStaticHtml(html` <div data-foo="Hello, world!"></div> `),
      ).toMatchInlineSnapshot(`"<div data-foo="Hello, world!"></div>"`);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders template with primitive attribute interpolation", () =>
    Effect.gen(function* () {
      expect(
        yield* getStaticHtml(html`<div data-foo=${"Hello, world!"}></div>`),
      ).toMatchInlineSnapshot(`"<div data-foo="Hello, world!"></div>"`);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders template with Effect attribute", () =>
    Effect.gen(function* () {
      expect(
        yield* getStaticHtml(html`<div data-foo=${Effect.succeed("Hello, world!")}></div>`),
      ).toMatchInlineSnapshot(`"<div data-foo="Hello, world!"></div>"`);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders template with reactive Fx attribute", () =>
    Effect.gen(function* () {
      expect(
        yield* getStaticHtml(html`<div data-foo=${Fx.succeed("Hello, world!")}></div>`),
      ).toMatchInlineSnapshot(`"<div data-foo="Hello, world!"></div>"`);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders template with ?boolean attribute set to true", () =>
    Effect.gen(function* () {
      expect(yield* getStaticHtml(html`<div ?hidden=${true}></div>`)).toMatchInlineSnapshot(
        `"<div hidden></div>"`,
      );
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders template with ?boolean attribute set to false", () =>
    Effect.gen(function* () {
      expect(yield* getStaticHtml(html`<div ?hidden=${false}></div>`)).toMatchInlineSnapshot(
        `"<div></div>"`,
      );
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders template with ?boolean attribute set to Effect.succeed(true)", () =>
    Effect.gen(function* () {
      expect(
        yield* getStaticHtml(html`<div ?hidden=${Effect.succeed(true)}></div>`),
      ).toMatchInlineSnapshot(`"<div hidden></div>"`);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders template with ?boolean attribute set to Effect.succeed(false)", () =>
    Effect.gen(function* () {
      expect(
        yield* getStaticHtml(html`<div ?hidden=${Effect.succeed(false)}></div>`),
      ).toMatchInlineSnapshot(`"<div></div>"`);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders template with ?boolean attribute set to Fx.succeed(true)", () =>
    Effect.gen(function* () {
      expect(
        yield* getStaticHtml(html`<div ?hidden=${Fx.succeed(true)}></div>`),
      ).toMatchInlineSnapshot(`"<div hidden></div>"`);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders template with ?boolean attribute set to Fx.succeed(false)", () =>
    Effect.gen(function* () {
      expect(
        yield* getStaticHtml(html`<div ?hidden=${Fx.succeed(false)}></div>`),
      ).toMatchInlineSnapshot(`"<div></div>"`);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders template with a class name", () =>
    Effect.gen(function* () {
      expect(yield* getStaticHtml(html` <div class="foo"></div> `)).toMatchInlineSnapshot(
        `"<div class="foo"></div>"`,
      );
      expect(yield* getStaticHtml(html`<div class=${"foo"}></div>`)).toMatchInlineSnapshot(
        `"<div class="foo"></div>"`,
      );
      expect(
        yield* getStaticHtml(html`<div class=${Effect.succeed("foo")}></div>`),
      ).toMatchInlineSnapshot(`"<div class="foo"></div>"`);
      expect(
        yield* getStaticHtml(html`<div class=${Fx.succeed("foo")}></div>`),
      ).toMatchInlineSnapshot(`"<div class="foo"></div>"`);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders template with a class name interpolation", () =>
    Effect.gen(function* () {
      expect(yield* getStaticHtml(html`<div class=${"foo bar baz"}></div>`)).toMatchInlineSnapshot(
        `"<div class="foo bar baz"></div>"`,
      );
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders template with a class name interpolation with holes", () =>
    Effect.gen(function* () {
      expect(
        yield* getStaticHtml(
          html`<div class="${"foo"} ${Effect.succeed("bar")} ${Fx.succeed("baz")}"></div>`,
        ),
      ).toMatchInlineSnapshot(`"<div class="foo bar baz"></div>"`);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders template with data attributes", () =>
    Effect.gen(function* () {
      expect(
        yield* getStaticHtml(
          html`<div .data=${{ a: "a", b: Effect.succeed("b"), c: Fx.succeed("c") }} />`,
        ),
      ).toMatchInlineSnapshot(`"<div data-a="a" data-b="b" data-c="c"></div>"`);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders empty and one-key data records in static and interactive HTML", () =>
    Effect.gen(function* () {
      const empty = html`<div .data=${{}}></div>`;
      const one = html`<div .data=${{ only: "value" }}></div>`;
      for (const output of [
        yield* getStaticHtml(empty),
        (yield* getHtmlRenderEvents(empty)).join(""),
      ]) {
        expect(output).not.toContain("data-");
      }
      for (const output of [
        yield* getStaticHtml(one),
        (yield* getHtmlRenderEvents(one)).join(""),
      ]) {
        expect(output).toContain('data-only="value"');
      }
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders comments", () =>
    Effect.gen(function* () {
      expect(yield* getStaticHtml(html` <!--Hello, world!--> `)).toMatchInlineSnapshot(
        `"<!--Hello, world!-->"`,
      );
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders comments with holes", () =>
    Effect.gen(function* () {
      expect(yield* getStaticHtml(html`<!--${"Hello, world!"}-->`)).toMatchInlineSnapshot(
        `"<!--Hello, world!-->"`,
      );
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders comments with multiple holes", () =>
    Effect.gen(function* () {
      expect(
        yield* getStaticHtml(html`<!--${"Hello"}, ${Effect.succeed("world")}${Fx.succeed("!")}-->`),
      ).toMatchInlineSnapshot(`"<!--Hello, world!-->"`);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders template with property syntax", () =>
    Effect.gen(function* () {
      const x = {};
      expect(
        yield* getStaticHtml(html`<div .foo=${Effect.succeed(x)}></div>`),
      ).toMatchInlineSnapshot(`"<div foo="${escape(JSON.stringify(x))}"></div>"`);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("supports sparse attributes", () =>
    Effect.gen(function* () {
      expect(
        yield* getStaticHtml(html`<div attr="${"foo"} ${"bar"} ${"baz"}"></div>`),
      ).toMatchInlineSnapshot(`"<div attr="foo bar baz"></div>"`);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("supports text only elements", () =>
    Effect.gen(function* () {
      expect(
        yield* getStaticHtml(
          html`<script>console.log("${"Hello, world!"}");</script>`,
        ),
      ).toMatchInlineSnapshot(`"<script>console.log("Hello, world!");</script>"`);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("supports text only elements with multiple holes", () =>
    Effect.gen(function* () {
      expect(
        yield* getStaticHtml(
          html`<script>console.log("${"Hello"}, ${Effect.succeed("world")}${Fx.succeed("!")}");</script>`,
        ),
      ).toMatchInlineSnapshot(`
        "<script>console.log("Hello, world!");</script>"
      `);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("supports spread attributes", () =>
    Effect.gen(function* () {
      expect(
        yield* getStaticHtml(html`<div ...${{ foo: "bar", baz: "qux" }}></div>`),
      ).toMatchInlineSnapshot(`"<div foo="bar" baz="qux"></div>"`);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("omits the separator for an empty spread", () =>
    Effect.gen(function* () {
      expect(yield* getStaticHtml(html`<div ...${{}}></div>`)).toBe("<div></div>");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("interpolates primitive children", () =>
    Effect.gen(function* () {
      expect(yield* getStaticHtml(html`<div>${1}</div>`)).toMatchInlineSnapshot(`"<div>1</div>"`);
      expect(yield* getStaticHtml(html`<div>${"Hello, world!"}</div>`)).toMatchInlineSnapshot(
        `"<div>Hello, world!</div>"`,
      );
      expect(yield* getStaticHtml(html`<div>${true}</div>`)).toMatchInlineSnapshot(
        `"<div>true</div>"`,
      );
      expect(yield* getStaticHtml(html`<div>${BigInt(1)}</div>`)).toMatchInlineSnapshot(
        `"<div>1</div>"`,
      );
      expect(yield* getStaticHtml(html`<div>${Symbol("foo")}</div>`)).toMatchInlineSnapshot(
        `"<div>Symbol(foo)</div>"`,
      );
      expect(yield* getStaticHtml(html`<div>${undefined}</div>`)).toMatchInlineSnapshot(
        `"<div></div>"`,
      );
      expect(yield* getStaticHtml(html`<div>${null}</div>`)).toMatchInlineSnapshot(`"<div></div>"`);
      expect(
        yield* getStaticHtml(html`<div>${[1, " ", "Hello", " ", true]}</div>`),
      ).toMatchInlineSnapshot(`"<div>1 Hello true</div>"`);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("interpolates html render events", () =>
    Effect.gen(function* () {
      expect(
        yield* getStaticHtml(html`<div>${HtmlRenderEvent("<p>Hello, world!</p>", true)}</div>`),
      ).toMatchInlineSnapshot(`"<div><p>Hello, world!</p></div>"`);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("interpolates dom render events", () =>
    Effect.gen(function* () {
      expect(
        yield* getStaticHtml(html`<div>${html` <p>Hello, world!</p> `}</div>`),
      ).toMatchInlineSnapshot(`"<div><p>Hello, world!</p></div>"`);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("interpolates array of render events", () =>
    Effect.gen(function* () {
      expect(
        yield* getStaticHtml(html`<div>${[html` <p>A</p> `, html` <p>B</p> `]}</div>`),
      ).toMatchInlineSnapshot(`"<div><p>A</p><p>B</p></div>"`);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders nested templates", () =>
    Effect.gen(function* () {
      expect(
        yield* getStaticHtml(html`<div>${html`<span>${"nested"}</span>`}</div>`),
      ).toMatchInlineSnapshot(`"<div><span>nested</span></div>"`);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders complex nested structure", () =>
    Effect.gen(function* () {
      expect(
        yield* getStaticHtml(
          html`<div class="container">
            ${html`<header>${html`<h1>${"Title"}</h1>`}</header>`}${html`<main>
              ${html`<p>${"Content"}</p>`}
            </main>`}
          </div>`,
        ),
      ).toMatchInlineSnapshot(
        `"<div class="container"><header><h1>Title</h1></header><main><p>Content</p></main></div>"`,
      );
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders with mixed attribute types", () =>
    Effect.gen(function* () {
      expect(
        yield* getStaticHtml(
          html`<div
            id="test"
            class=${"dynamic"}
            ?hidden=${true}
            data-value=${Effect.succeed("effect")}
            ...${{
              "aria-label": "accessible",
            }}
          ></div>`,
        ),
      ).toMatchInlineSnapshot(
        `"<div id="test" class="dynamic" hidden data-value="effect" aria-label="accessible"></div>"`,
      );
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders self-closing tags", () =>
    Effect.gen(function* () {
      expect(
        yield* getStaticHtml(html`<img src=${"image.jpg"} alt=${"description"} />`),
      ).toMatchInlineSnapshot(`"<img src="image.jpg" alt="description"/>"`);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders void elements", () =>
    Effect.gen(function* () {
      expect(yield* getStaticHtml(html` <br /> `)).toMatchInlineSnapshot(`"<br/>"`);
      expect(yield* getStaticHtml(html` <hr class="separator" /> `)).toMatchInlineSnapshot(
        `"<hr class="separator"/>"`,
      );
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders with special characters in attributes", () =>
    Effect.gen(function* () {
      expect(
        yield* getStaticHtml(html`<div title=${'Hello & "world" <test>'}></div>`),
      ).toMatchInlineSnapshot(`"<div title="Hello &amp; &quot;world&quot; &lt;test&gt;"></div>"`);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders with special characters in text content", () =>
    Effect.gen(function* () {
      expect(yield* getStaticHtml(html`<div>Hello & "world" <test></div>`)).toMatchInlineSnapshot(
        `"<div>Hello & "world" <test></test></div>"`,
      );
    }).pipe(Effect.scoped, Effect.runPromise));
});

describe("Html Render Events", () => {
  it("renders html render events", () =>
    Effect.gen(function* () {
      const events = yield* getHtmlRenderEvents(html`<div>${html`<p>Hello, world!</p>`}</div>`);

      expect(events).toMatchInlineSnapshot(`
        [
          "<!--t_fqNjm/UcUg8=--><div>",
          "<!--n_0-->",
          "<!--t_1XMifUHMTBw=--><p>Hello, world!</p><!--/t_1XMifUHMTBw=-->",
          "<!--/n_0-->",
          "</div><!--/t_fqNjm/UcUg8=-->",
        ]
      `);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders a single reactive paragraph", (ctx) =>
    Effect.gen(function* () {
      const para = (n: Fx.Fx<number, never, Scope.Scope>) => html`<p>${n}</p>`;

      const events = yield* getHtmlRenderEvents(para(Fx.succeed(1)));

      ctx.expect(events).toMatchInlineSnapshot(`
        [
          "<!--t_KwZ/fKKViAs=--><p>",
          "<!--n_0-->",
          "1",
          "<!--/n_0-->",
          "</p><!--/t_KwZ/fKKViAs=-->",
        ]
      `);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders with array of templates", (ctx) =>
    Effect.gen(function* () {
      const para = (n: Fx.Fx<number, never, Scope.Scope>) => html`<p>${n}</p>`;
      const events = yield* getHtmlRenderEvents(
        html`<div>${[para(Fx.succeed(1)), para(Fx.succeed(2)), para(Fx.succeed(3))]}</div>`,
      );

      ctx.expect(events).toMatchInlineSnapshot(`
          [
            "<!--t_fqNjm/UcUg8=--><div>",
            "<!--n_0-->",
            "<!--t_KwZ/fKKViAs=--><p>",
            "<!--n_0-->",
            "1",
            "<!--/n_0-->",
            "</p><!--/t_KwZ/fKKViAs=-->",
            "<!--t_KwZ/fKKViAs=--><p>",
            "<!--n_0-->",
            "2",
            "<!--/n_0-->",
            "</p><!--/t_KwZ/fKKViAs=-->",
            "<!--t_KwZ/fKKViAs=--><p>",
            "<!--n_0-->",
            "3",
            "<!--/n_0-->",
            "</p><!--/t_KwZ/fKKViAs=-->",
            "<!--/n_0-->",
            "</div><!--/t_fqNjm/UcUg8=-->",
          ]
        `);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders many() list markers", (ctx) =>
    Effect.gen(function* () {
      const para = (n: Fx.Fx<number, never, Scope.Scope>) => html`<p>${n}</p>`;
      const events = yield* getHtmlRenderEvents(
        html`<div>${many(Fx.succeed([1, 2, 3]), (n) => n, para)}</div>`,
      );

      ctx.expect(events).toMatchInlineSnapshot(`
          [
            "<!--t_fqNjm/UcUg8=--><div>",
            "<!--n_0-->",
            "<!--t_KwZ/fKKViAs=--><p>",
            "<!--n_0-->",
            "1",
            "<!--/n_0-->",
            "</p><!--/t_KwZ/fKKViAs=-->",
            "<!--/m_v1_n.ADE-->",
            "<!--t_KwZ/fKKViAs=--><p>",
            "<!--n_0-->",
            "2",
            "<!--/n_0-->",
            "</p><!--/t_KwZ/fKKViAs=-->",
            "<!--/m_v1_n.ADI-->",
            "<!--t_KwZ/fKKViAs=--><p>",
            "<!--n_0-->",
            "3",
            "<!--/n_0-->",
            "</p><!--/t_KwZ/fKKViAs=-->",
            "<!--/m_v1_n.ADM-->",
            "<!--/n_0-->",
            "</div><!--/t_fqNjm/UcUg8=-->",
          ]
        `);
    }).pipe(Effect.scoped, Effect.runPromise));
});
