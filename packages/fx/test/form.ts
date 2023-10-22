import * as ArrayFormatter from "@effect/schema/ArrayFormatter"
import * as Schema from "@effect/schema/Schema"
import { RefSubject } from "@typed/fx"
import * as Form from "@typed/fx/Form"
import { deepEqual, deepStrictEqual, ok } from "assert"
import { Either } from "effect"
import * as Effect from "effect/Effect"

import { describe, it } from "vitest"

describe("Form", () => {
  describe("make", () => {
    const Foo = Schema.struct({
      id: Schema.string,
      timestamp: Schema.dateFromString(Schema.string)
    })
    type FooInput = Schema.Schema.From<typeof Foo>
    type FooOutput = Schema.Schema.To<typeof Foo>

    const initialFooOutput: FooOutput = {
      id: Math.random().toString(16),
      timestamp: new Date()
    }
    const initialFooInput: FooInput = Schema.encodeSync(Foo)(initialFooOutput)

    const makeFooForm = Form.make(Foo)

    it("allows deriving form state from a source", async () => {
      const test = Effect.gen(function*(_) {
        const form = yield* _(makeFooForm(Effect.succeed(initialFooOutput)))
        const timestamp = form.fromKey("timestamp")

        deepStrictEqual(yield* _(form), initialFooInput)
        deepStrictEqual(yield* _(form.decoded), initialFooOutput)

        yield* _(timestamp.set("asdf"))

        deepStrictEqual(yield* _(form), { ...initialFooInput, timestamp: "asdf" })

        const parseError = yield* _(Effect.either(form.decoded))

        ok(Either.isLeft(parseError))

        deepEqual(
          ArrayFormatter.formatErrors(parseError.left.errors),
          [{
            _tag: "Type",
            message: "Expected a valid Date, actual Invalid Date",
            path: ["timestamp"]
          }]
        )
      })

      await Effect.runPromise(test)
    })

    it("allows persisting form state to a RefSubject source", async () => {
      const test = Effect.gen(function*(_) {
        const ref = yield* _(RefSubject.of(initialFooOutput))
        const form = yield* _(makeFooForm(ref))

        const timestamp = form.fromKey("timestamp")

        deepStrictEqual(yield* _(form), initialFooInput)
        deepStrictEqual(yield* _(form.decoded), initialFooOutput)

        const date = new Date()

        yield* _(timestamp.set(date.toISOString()))

        deepStrictEqual(yield* _(timestamp), date.toISOString())
        deepStrictEqual(yield* _(ref), initialFooOutput)

        yield* _(form.persist)

        deepStrictEqual(yield* _(ref), { ...initialFooOutput, timestamp: date })
      }).pipe(Effect.scoped)

      await Effect.runPromise(test)
    })
  })
})
