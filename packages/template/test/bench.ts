import { benchmark } from "@/test/benchmark"
import * as Effect from "effect/Effect"

import * as New from "@typed/template/internal/parser"
import * as Old from "@typed/template/Parser"

const simpleDivTemplate = h`<div></div>`

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
  .test("simple (old", Effect.sync(() => Old.parser.parse(simpleDivTemplate)))
  .test("simple (new", Effect.sync(() => New.parser.parse(simpleDivTemplate)))
  .test("nested (old", Effect.sync(() => Old.parser.parse(nestedTemplate)))
  .test("nested (new", Effect.sync(() => New.parser.parse(nestedTemplate)))
  .run({
    iterations: 10_000
  })

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function h<Values extends ReadonlyArray<any>>(template: TemplateStringsArray, ..._: Values) {
  return template
}
