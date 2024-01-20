import * as Fx from "@typed/fx/Fx"
import * as Directive from "@typed/template/Directive"
import { make } from "@typed/template/EventHandler"
import { renderToHtml } from "@typed/template/Html"
import * as RenderContext from "@typed/template/RenderContext"
import type { RenderEvent } from "@typed/template/RenderEvent"
import type { RenderTemplate } from "@typed/template/RenderTemplate"
import { html } from "@typed/template/RenderTemplate"
import { counter, inputWithLabel } from "@typed/template/test/fixtures/test_components"
import { deepStrictEqual } from "assert"
import * as Effect from "effect/Effect"
import type { Scope } from "effect/Scope"

describe("Html", () => {
  it.concurrent("renders a simple template", async () => {
    await testHtmlChunks(html`<div>Hello, world!</div>`, [
      `<div>Hello, world!</div>`
    ])
  })

  it.concurrent("renders a template with a value", async () => {
    await testHtmlChunks(html`<div>${"Hello, world!"}</div>`, [
      "<div>",
      `Hello, world!`,
      "</div>"
    ])
  })

  it.concurrent("renders a template with attributes", async () => {
    await testHtmlChunks(html`<div class="foo" id="bar"></div>`, [
      "<div class=\"foo\" id=\"bar\"></div>"
    ])
  })

  it.concurrent("renders a template with a attribute parts", async () => {
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
      `<span>Hello, world!</span>`,
      "</div>"
    ])
  })

  it.concurrent("renders interpolated templates with interpolations", async () => {
    await testHtmlChunks(html`<div>${html`<span>${"Hello, world!"}</span>`}</div>`, [
      "<div>",
      "<span>",
      "Hello, world!",
      "</span>",
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
      "<div><!-- ",
      "Hello, world!",
      " --></div>"
    ])

    await testHtmlChunks(html`<div><!-- ${Effect.succeed("Hello, world!")} --></div>`, [
      "<div><!-- ",
      "Hello, world!",
      " --></div>"
    ])

    await testHtmlChunks(html`<div><!-- ${Fx.succeed("Hello, world!")} --></div>`, [
      "<div><!-- ",
      "Hello, world!",
      " --></div>"
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
    await testHtmlChunks(html`<div @click=${make(() => Effect.unit)}></div>`, [`<div></div>`])
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
    await testHtmlChunks(html`<div id=${Directive.attribute((part) => part.update("foo"))}></div>`, [
      `<div`,
      ` id="foo"`,
      `></div>`
    ])
  })

  it.concurrent(`rendered with boolean directives`, async () => {
    // True
    await testHtmlChunks(
      html`<div ?hidden=${Directive.boolean((part) => part.update(true))}></div>`,
      [`<div`, ` hidden`, `></div>`]
    )

    // False
    await testHtmlChunks(
      html`<div ?hidden=${Directive.boolean((part) => part.update(false))}></div>`,
      [`<div`, `></div>`]
    )
  })

  it.concurrent(`renders with class name directives`, async () => {
    await testHtmlChunks(
      html`<div class=${Directive.className((part) => part.update(["foo"]))}></div>`,
      [`<div`, ` class="foo"`, `></div>`]
    )
  })

  it.concurrent(`renders with data directives`, async () => {
    await testHtmlChunks(
      html`<div .data=${Directive.data((part) => part.update({ foo: "bar" }))}></div>`,
      [`<div`, ` data-foo="bar"`, `></div>`]
    )
  })

  it.concurrent(`renders with event directives`, async () => {
    await testHtmlChunks(
      html`<div
        @click=${Directive.event(() => Effect.unit)}
      ></div>`,
      [`<div></div>`]
    )
  })

  it.concurrent(`renders with property directives`, async () => {
    await testHtmlChunks(
      html`<input .value=${Directive.property((part) => part.update("foo"))} />`,
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
        id="${Directive.attribute((part) => part.update("foo"))} ${Directive.attribute((part) => part.update("bar"))} ${
        Directive.attribute((part) => part.update("baz"))
      }"
      ></div>`,
      [`<div`, ` id="foo bar baz"`, `></div>`]
    )
  })

  it.concurrent("renders components with wires", async () => {
    await testHtmlChunks(Fx.scoped(counter), [
      `<button id="decrement">-</button><span id="count">`,
      `0`,
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
      [`<html><head><title>@typed TodoMVC</title></head><meta charset="utf-8"/><meta name="description" content="@typed TodoMVC"/><meta name="viewport" content="width=device-width, initial-scale=1"/></html><body><h1>Hello, world!</h1><script async defer type="module" src="./index.ts"></script></body>`]
    )
  })
})

function provideResources<R, E, A>(effect: Effect.Effect<R, E, A>) {
  return effect.pipe(Effect.provide(RenderContext.static), Effect.scoped)
}

async function testHtmlChunks(
  template: Fx.Fx<RenderTemplate | RenderContext.RenderContext | Scope, never, RenderEvent>,
  expected: Array<string>
): Promise<void> {
  const actual = await template.pipe(
    renderToHtml,
    Fx.toReadonlyArray,
    provideResources,
    Effect.runPromise
  )

  try {
    deepStrictEqual(actual, expected)
  } catch (error) {
    console.log(`Actual:`, JSON.stringify(actual, null, 2))
    console.log(`Expected:`, JSON.stringify(expected, null, 2))
    throw error
  }
}
