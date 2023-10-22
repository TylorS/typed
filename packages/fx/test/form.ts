import * as ArrayFormatter from "@effect/schema/ArrayFormatter"
import * as Schema from "@effect/schema/Schema"
import { RefSubject } from "@typed/fx"
import * as Form from "@typed/fx/Form"
import type { FormEntry } from "@typed/fx/FormEntry"
import { deepEqual, deepStrictEqual, ok } from "assert"
import { Either } from "effect"
import * as Effect from "effect/Effect"

import { describe, it } from "vitest"

describe("Form", () => {
  describe("make", () => {
    const Foo = Schema.struct({
      id: Schema.string.pipe(
        Schema.minLength(1),
        Schema.message(() => "Cannot be empty ID"),
        Schema.maxLength(20),
        Schema.message(() => "ID cannot be longer than 20 characters")
      ),
      timestamp: Schema.dateFromString(Schema.string)
    })
    type FooInput = Schema.Schema.From<typeof Foo>
    type FooOutput = Schema.Schema.To<typeof Foo>

    const initialFooOutput: FooOutput = {
      id: "asdf",
      timestamp: new Date()
    }
    const initialFooInput: FooInput = Schema.encodeSync(Foo)(initialFooOutput)

    const makeFooForm = Form.make(Foo)

    it("allows deriving form state from a source", async () => {
      const test = Effect.gen(function*(_) {
        const form = yield* _(makeFooForm(Effect.succeed(initialFooOutput)))
        const id = form.fromKey("id")
        const timestamp = form.fromKey("timestamp")

        deepStrictEqual(yield* _(form), initialFooInput)
        deepStrictEqual(yield* _(form.decoded), initialFooOutput)

        yield* _(timestamp.set("asdf"))

        deepStrictEqual(yield* _(form), { ...initialFooInput, timestamp: "asdf" })

        let parseError = yield* _(Effect.either(form.decoded))

        ok(Either.isLeft(parseError))

        deepEqual(
          ArrayFormatter.formatErrors(parseError.left.errors),
          [{
            _tag: "Type",
            message: "Expected a valid Date, actual Invalid Date",
            path: ["timestamp"]
          }]
        )

        yield* _(id.set(""))

        parseError = yield* _(Effect.either(form.decoded))

        ok(Either.isLeft(parseError))

        deepEqual(
          ArrayFormatter.formatErrors(parseError.left.errors),
          [{
            _tag: "Type",
            message: "Cannot be empty ID",
            path: ["id"]
          }, {
            _tag: "Type",
            message: "Expected a valid Date, actual Invalid Date",
            path: ["timestamp"]
          }]
        )

        let idParseError = yield* _(Effect.either(id.decoded))

        ok(Either.isLeft(idParseError))

        deepEqual(
          ArrayFormatter.formatErrors(idParseError.left.errors),
          [{
            _tag: "Type",
            message: "Cannot be empty ID",
            path: []
          }]
        )

        const timestampParseError = yield* _(Effect.either(timestamp.decoded))

        ok(Either.isLeft(timestampParseError))

        deepEqual(
          ArrayFormatter.formatErrors(timestampParseError.left.errors),
          [{
            _tag: "Type",
            message: "Expected a valid Date, actual Invalid Date",
            path: []
          }]
        )

        yield* _(id.set("abcdefghijklmnopqrstuvwxyx"))

        idParseError = yield* _(Effect.either(id.decoded))

        ok(Either.isLeft(idParseError))

        deepEqual(
          ArrayFormatter.formatErrors(idParseError.left.errors),
          [{
            _tag: "Type",
            message: "ID cannot be longer than 20 characters",
            path: []
          }]
        )
      })

      await Effect.runPromise(test)
    })

    it("allows persisting form state to a RefSubject source", async () => {
      const test = Effect.gen(function*(_) {
        const ref = yield* _(RefSubject.of(initialFooOutput))
        const form = yield* _(makeFooForm(ref))

        const timestamp: FormEntry<never, never, string, Date> = form.fromKey("timestamp")

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

    it("allow deriving optional form states", async () => {
      const Bar = Schema.struct({
        baz: Schema.optional(Schema.string)
      })
      const makeBarForm = Form.make(Bar)

      const test = Effect.gen(function*(_) {
        const form = yield* _(makeBarForm(Effect.succeed({})))
        const baz = form.fromKey("baz")

        deepStrictEqual(yield* _(baz), undefined)

        yield* _(baz.set("asdf"))

        deepStrictEqual(yield* _(baz), "asdf")
      })

      await Effect.runPromise(test)
    })
  })
})
