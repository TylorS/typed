import * as Fx from "@typed/fx/Fx"
import type { RenderQueue } from "@typed/template"
import * as Directive from "@typed/template/Directive"
import { make } from "@typed/template/EventHandler"
import { renderToHtml, serverLayer } from "@typed/template/Html"
import { TEXT_START, TYPED_HOLE_END, TYPED_HOLE_START } from "@typed/template/Meta"
import type * as RenderContext from "@typed/template/RenderContext"
import type { RenderEvent } from "@typed/template/RenderEvent"
import { DEFAULT_PRIORITY } from "@typed/template/RenderQueue"
import type { RenderTemplate } from "@typed/template/RenderTemplate"
import { html } from "@typed/template/RenderTemplate"
import { counter, inputWithLabel } from "@typed/template/test/fixtures/test_components"
import { deepStrictEqual } from "assert"
import * as Effect from "effect/Effect"
import type { Scope } from "effect/Scope"
import { stripTypedTemplateComments } from "../src/Test"

describe("Html", () => {
  it.concurrent("renders a simple template", async () => {
    await testHtmlChunks(html`<div>Hello, world!</div>`, [
      `<div>Hello, world!</div>`
    ])
  })

  it.concurrent("renders a template with a value", async () => {
    await testHtmlChunks(html`<div>${"Hello, world!"}</div>`, [
      "<div>",
      `${TYPED_HOLE_START(0)}${TEXT_START}Hello, world!${TYPED_HOLE_END(0)}`,
      "</div>"
    ])
  })

  it.concurrent("renders a template with attributes", async () => {
    await testHtmlChunks(html`<div class="foo" id="bar"></div>`, [
      "<div class=\"foo\" id=\"bar\"></div>"
    ])
  })

  it.concurrent("renders a template with attribute parts", async () => {
    // Static
    await testHtmlChunks(html`<div class="${"foo"}"></div>`, [
      "<div",
      " class=\"foo\"",
      `></div>`
    ])
  })

  it.concurrent("renders a template with sparse attribute parts", async () => {
    await testHtmlChunks(html`<div id="${"foo"} ${"bar"} ${"baz"}"></div>`, [
      "<div",
      " id=\"foo bar baz\"",
      `></div>`
    ])
  })

  it.concurrent("renders a template with sparse class name parts", async () => {
    await testHtmlChunks(html`<div class="${"foo"} ${"bar"} ${"baz"}"></div>`, [
      "<div",
      " class=\"foo bar baz\"",
      `></div>`
    ])
  })

  it.concurrent("renders interpolated templates", async () => {
    await testHtmlChunks(html`<div>${html`<span>Hello, world!</span>`}</div>`, [
      "<div>",
      `${TYPED_HOLE_START(0)}<span>Hello, world!</span>${TYPED_HOLE_END(0)}`,
      "</div>"
    ])
  })

  it.concurrent("renders interpolated templates with interpolations", async () => {
    await testHtmlChunks(html`<div>${html`<span>${"Hello, world!"}</span>`}</div>`, [
      "<div>",
      TYPED_HOLE_START(0) + "<span>",
      TYPED_HOLE_START(0) + TEXT_START + "Hello, world!" + TYPED_HOLE_END(0),
      "</span>" + TYPED_HOLE_END(0),
      "</div>"
    ])
  })

  it.concurrent("renders boolean attributes", async () => {
    await testHtmlChunks(html`<div ?hidden=${true}></div>`, [
      "<div",
      " hidden",
      `></div>`
    ])

    await testHtmlChunks(html`<div ?hidden=${false}></div>`, ["<div", `></div>`])
  })

  it.concurrent("renders comments", async () => {
    await testHtmlChunks(html`<div><!-- Hello, world! --></div>`, [
      "<div><!-- Hello, world! --></div>"
    ])
  })

  it.concurrent("renders comments with interpolations", async () => {
    await testHtmlChunks(html`<div><!-- ${"Hello, world!"} --></div>`, [
      "<div>",
      "<!--Hello, world!-->",
      "</div>"
    ])

    await testHtmlChunks(html`<div><!-- ${Effect.succeed("Hello, world!")} --></div>`, [
      "<div>",
      "<!--Hello, world!-->",
      "</div>"
    ])

    await testHtmlChunks(html`<div><!-- ${Fx.succeed("Hello, world!")} --></div>`, [
      "<div>",
      "<!--Hello, world!-->",
      "</div>"
    ])
  })

  it.concurrent("renders data attributes", async () => {
    await testHtmlChunks(html`<div data-foo=${"bar"}></div>`, [
      "<div",
      " data-foo=\"bar\"",
      `></div>`
    ])

    await testHtmlChunks(html`<div .data=${Fx.succeed({ foo: "bar" })}></div>`, [
      "<div",
      " data-foo=\"bar\"",
      `></div>`
    ])
  })

  it.concurrent("renders with event attributes", async () => {
    await testHtmlChunks(html`<div @click=${make(() => Effect.void)}></div>`, [`<div></div>`])
  })

  it.concurrent("renders with property attributes", async () => {
    await testHtmlChunks(html`<input .value=${"foo"} />`, [
      `<input`,
      ` value="foo"`,
      `/>`
    ])
  })

  it.concurrent("renders with ref attributes", async () => {
    await testHtmlChunks(html`<input ref=${null} />`, [`<input/>`])
  })

  it.concurrent("renders text-only templates", async () => {
    await testHtmlChunks(
      html`<script>
        console.log('hello, world!')
      </script>`,
      ["<script>console.log('hello, world!')</script>"]
    )
  })

  it.concurrent("remove attributes with undefined values", async () => {
    await testHtmlChunks(html`<div class=${undefined}></div>`, [`<div`, `></div>`])
  })

  it.concurrent("remove attributes with null values", async () => {
    await testHtmlChunks(html`<div class=${null}></div>`, [`<div`, `></div>`])
  })

  it.concurrent(`renders with attribute directives`, async () => {
    await testHtmlChunks(html`<div id=${Directive.attribute((part) => part.update("foo", DEFAULT_PRIORITY))}></div>`, [
      `<div`,
      ` id="foo"`,
      `></div>`
    ])
  })

  it.concurrent(`rendered with boolean directives`, async () => {
    // True
    await testHtmlChunks(
      html`<div ?hidden=${Directive.boolean((part) => part.update(true, DEFAULT_PRIORITY))}></div>`,
      [`<div`, ` hidden`, `></div>`]
    )

    // False
    await testHtmlChunks(
      html`<div ?hidden=${Directive.boolean((part) => part.update(false, DEFAULT_PRIORITY))}></div>`,
      [`<div`, `></div>`]
    )
  })

  it.concurrent(`renders with class name directives`, async () => {
    await testHtmlChunks(
      html`<div class=${Directive.className((part) => part.update(["foo"], DEFAULT_PRIORITY))}></div>`,
      [`<div`, ` class="foo"`, `></div>`]
    )
  })

  it.concurrent(`renders with data directives`, async () => {
    await testHtmlChunks(
      html`<div .data=${Directive.data((part) => part.update({ foo: "bar" }, DEFAULT_PRIORITY))}></div>`,
      [`<div`, ` data-foo="bar"`, `></div>`]
    )
  })

  it.concurrent(`renders with event directives`, async () => {
    await testHtmlChunks(
      html`<div
        @click=${Directive.event(() => Effect.void)}
      ></div>`,
      [`<div></div>`]
    )
  })

  it.concurrent(`renders with property directives`, async () => {
    await testHtmlChunks(
      html`<input .value=${Directive.property((part) => part.update("foo", DEFAULT_PRIORITY))} />`,
      [`<input`, ` value="foo"`, `/>`]
    )
  })

  it.concurrent(`renders with ref directives`, async () => {
    await testHtmlChunks(html`<input ref=${Directive.ref((part) => Effect.orDie(part.value))} />`, [
      `<input/>`
    ])
  })

  it.concurrent(`renders with sparse attribute directives`, async () => {
    await testHtmlChunks(
      html`<div
        id="${Directive.attribute((part) => part.update("foo", DEFAULT_PRIORITY))} ${
        Directive.attribute((part) => part.update("bar", DEFAULT_PRIORITY))
      } ${Directive.attribute((part) => part.update("baz", DEFAULT_PRIORITY))}"
      ></div>`,
      [`<div`, ` id="foo bar baz"`, `></div>`]
    )
  })

  it("renders components with wires", async () => {
    await testHtmlChunks(Fx.scoped(counter), [
      `<button id="decrement">-</button><span id="count">`,
      `${TYPED_HOLE_START(1)}${TEXT_START}0${TYPED_HOLE_END(1)}`,
      `</span><button id="increment">+</button>`
    ])
  })

  it.concurrent("renders components with multiple attribute types", async () => {
    await testHtmlChunks(inputWithLabel, [
      `<div class="formgroup"><input`,
      ` class="custom-input"/><label class="custom-input-label" for="name">Name</label></div>`
    ])
  })

  it.concurrent("renders script tags with no content", async () => {
    await testHtmlChunks(html`<script async defer type="module" src="./index.ts"></script>`, [
      "<script async defer type=\"module\" src=\"./index.ts\"></script>"
    ])
  })

  it.concurrent("renders full html template", async () => {
    await testHtmlChunks(
      html`<html>
    <head>
      <title>@typed TodoMVC</title>
      <meta charset="utf-8" />
      <meta name="description" content="@typed TodoMVC" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    </head>
    <body>
      <h1>Hello, world!</h1>

      <script async defer type="module" src="./index.ts"></script>
    </body>
  </html>`,
      ["<html><head><title>@typed TodoMVC</title><meta charset=\"utf-8\"/><meta name=\"description\" content=\"@typed TodoMVC\"/><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"/></head><body><h1>Hello, world!</h1><script async defer type=\"module\" src=\"./index.ts\"></script></body></html>"]
    )
  })

  it.concurrent("renders with fragments", async () => {
    await testHtmlChunks(html`<div>Hello, world!</div><div>Goodbye, world!</div>`, [
      "<div>Hello, world!</div><div>Goodbye, world!</div>"
    ])
  })

  it.concurrent("properly handles nested elements", async () => {
    await testHtmlChunks(
      html`<div class="home-page">
  <div class="banner">
    <div class="container">
      <h1 class="logo-font">conduit</h1>
      <p>A place to share your knowledge.</p>
    </div>
  </div>

  <div class="container page">
    <div class="row">
      <div class="col-md-9">
        <div class="feed-toggle">
          <ul class="outline-active nav nav-pills">
            <li class="nav-item">
              ${null}
            </li>
          </ul>
        </div>

        ${null}

        <ul class="pagination">
          <li class="page-item active">
            <a class="page-link" href="">1</a>
          </li>
          <li class="page-item">
            <a class="page-link" href="">2</a>
          </li>
        </ul>
      </div>

      <div class="col-md-3">
        <div class="sidebar">
          <p>Popular Tags</p>

          <div class="tag-list">
            ${null} 
          </div>
        </div>
      </div>
    </div>
  </div>
</div>`,
      [
        `<div class="home-page"><div class="banner"><div class="container"><h1 class="logo-font">conduit</h1><p>A place to share your knowledge.</p></div></div><div class="container page"><div class="row"><div class="col-md-9"><div class="feed-toggle"><ul class="outline-active nav nav-pills"><li class="nav-item">`,
        TYPED_HOLE_START(0) + TEXT_START + TYPED_HOLE_END(0),
        `</li></ul></div>`,
        TYPED_HOLE_START(1) + TEXT_START + TYPED_HOLE_END(1),
        `<ul class="pagination"><li class="page-item active"><a class="page-link" href="">1</a></li><li class="page-item"><a class="page-link" href="">2</a></li></ul></div><div class="col-md-3"><div class="sidebar"><p>Popular Tags</p><div class="tag-list">`,
        TYPED_HOLE_START(2) + TEXT_START + TYPED_HOLE_END(2),
        `</div></div></div></div></div></div>`
      ]
    )
  })

  it.concurrent("render this template", async () => {
    await testHtmlChunks(
      html`<li class="nav-item">
    <a
      onclick=${null} 
      class=${null}
      href=${null}
    >
      ${null}
    </a>
  </li>`,
      [
        `<li class="nav-item"><a`,
        `>`,
        TYPED_HOLE_START(3) + TEXT_START + TYPED_HOLE_END(3),
        `</a></li>`
      ]
    )
  })
})

function provideResources<R, E, A>(effect: Effect.Effect<R, E, A>) {
  return effect.pipe(Effect.provide(serverLayer), Effect.scoped)
}

async function testHtmlChunks(
  template: Fx.Fx<RenderEvent, never, RenderTemplate | RenderQueue.RenderQueue | RenderContext.RenderContext | Scope>,
  expected: Array<string>
): Promise<void> {
  const actual = await template.pipe(
    renderToHtml,
    Fx.toReadonlyArray,
    provideResources,
    Effect.runPromise
  )

  try {
    deepStrictEqual(actual.map(stripTypedTemplateComments), expected)
  } catch (error) {
    console.log(`Actual:`, JSON.stringify(actual, null, 2))
    console.log(`Expected:`, JSON.stringify(expected, null, 2))
    throw error
  }
}
