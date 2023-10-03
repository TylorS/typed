import { benchmark } from "@/test/benchmark"
import * as Effect from "effect/Effect"

import * as New from "@typed/template/internal/parser"
import * as Old from "@typed/template/Parser"

const simpleDivTemplate = h`<div></div>`

const simpleAttributesTemplate = h`<div id=${"foo"} class=${"bar"}></div>`

const nestedTemplate = h`
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

benchmark("Old vs New Parser")
  .comparison("simple", [{
    name: "old",
    effect: Effect.sync(() => Old.parser.parse(simpleDivTemplate))
  }, {
    name: "new",
    effect: Effect.sync(() => New.parser.parse(simpleDivTemplate))
  }])
  .comparison("simple with attributes", [
    {
      name: "old",
      effect: Effect.sync(() => Old.parser.parse(simpleAttributesTemplate))
    },
    {
      name: "new",
      effect: Effect.sync(() => New.parser.parse(simpleAttributesTemplate))
    }
  ])
  .comparison("nested", [
    {
      name: "old",
      effect: Effect.sync(() => Old.parser.parse(nestedTemplate))
    },
    {
      name: "new",
      effect: Effect.sync(() => New.parser.parse(nestedTemplate))
    }
  ])
  .run()

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function h<Values extends ReadonlyArray<any>>(template: TemplateStringsArray, ..._: Values) {
  return template
}
