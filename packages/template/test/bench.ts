import { benchmark } from "@/test/benchmark"
import * as Effect from "effect/Effect"

import { PART_REGEX } from "@typed/template/internal/chunks"
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

const seasonedTemplate = splitTemplateByParts(`<section
    ref="{{__PART0__}}"
    class="seasoned-input-field {{__PART1__}}"
  >
    <div
      class={{__PART2__}}
    >
      {{__PART3__}}

      <textarea
        ref="{{__PART4__}}"
        class="seasoned-input-field__textarea"
        type="{{__PART5__}}"
        placeholder=" "
        ?disabled="{{__PART6__}}"
        id="{{__PART7__}}"
        name="{{__PART8__}}"
        .value="{{__PART9__}}"
        onchange="{{__PART10__}}"
        oninput="{{__PART11__}}"
        onkeydown={{__PART12__}}
        onfocus={{__PART13__}}
        onblur={{__PART14__}}
        tabindex="{{__PART15__}}"
        step="{{__PART16__}}"
        min="{{__PART17__}}"
        minlength="{{__PART18__}}"
        max="{{__PART19__}}"
        maxlength="{{__PART20__}}"
        rows="{{__PART21__}}"
      ></textarea>

      {{__PART22__}}
    </div>

    {{__PART23__}}
    {{__PART24__}}
  </section>`)

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
  .comparison("seasoned", [
    {
      name: "old",
      effect: Effect.sync(() => Old.parser.parse(seasonedTemplate))
    },
    {
      name: "new",
      effect: Effect.sync(() => New.parser.parse(seasonedTemplate))
    }
  ])
  .run()

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function h<Values extends ReadonlyArray<any>>(template: TemplateStringsArray, ..._: Values) {
  return template
}

// Helper for myself to extract compiled templates with errors in my apps to
// make test-cases against them.
function splitTemplateByParts(template: string): Array<string> {
  const parts = template.split(PART_REGEX)
  const strings: Array<string> = []

  for (let i = 0; i < parts.length;) {
    if (PART_REGEX.test(parts[i])) {
      i += 2 // Skip past the extra matched portion of PART number
    } else {
      strings.push(parts[i])
      i += 1
    }
  }

  return strings
}
