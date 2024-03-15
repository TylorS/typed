import * as ArrayFormatter from "@effect/schema/ArrayFormatter"
import * as Schema from "@effect/schema/Schema"
import { RefSubject } from "@typed/fx"
import * as Form from "@typed/fx/Form"
import { deepEqual, deepStrictEqual, ok } from "assert"
import { Either } from "effect"
import * as Effect from "effect/Effect"

import { describe, it } from "vitest"

describe.concurrent("Form", () => {
  describe("make", () => {
    const Foo = Schema.struct({
      id: Schema.string.pipe(
        Schema.minLength(1),
        Schema.message(() => "Cannot be empty ID"),
        Schema.maxLength(20),
        Schema.message(() => "ID cannot be longer than 20 characters")
      ),
      timestamp: Schema.compose(Schema.DateFromString, Schema.ValidDateFromSelf)
    })
    type FooInput = Schema.Schema.Encoded<typeof Foo>
    type FooOutput = Schema.Schema.Type<typeof Foo>

    const initialFooOutput: FooOutput = {
      id: "asdf",
      timestamp: new Date()
    }
    const initialFooInput: FooInput = Schema.encodeSync(Foo)(initialFooOutput)

    const makeFooForm = Form.derive(Foo)

    it("allows deriving form state from a source", async () => {
      const test = Effect.gen(function*(_) {
        const form = yield* _(makeFooForm(Effect.succeed(initialFooOutput)))
        const id = form.get("id")
        const timestamp = form.get("timestamp")

        deepStrictEqual(yield* _(form), initialFooInput)
        deepStrictEqual(yield* _(form.decoded), initialFooOutput)

        yield* _(RefSubject.set(timestamp, "asdf"))

        deepStrictEqual(yield* _(form), { ...initialFooInput, timestamp: "asdf" })

        let parseError = yield* _(Effect.either(form.decoded))

        ok(Either.isLeft(parseError))

        deepEqual(
          ArrayFormatter.formatIssue(parseError.left.error),
          [{
            _tag: "Type",
            message: "Expected ValidDateFromSelf (a valid Date instance), actual Invalid Date",
            path: ["timestamp"]
          }]
        )

        yield* _(RefSubject.set(id, ""))

        parseError = yield* _(Effect.either(form.decoded))

        ok(Either.isLeft(parseError))

        deepEqual(
          ArrayFormatter.formatIssue(parseError.left.error),
          [{
            _tag: "Refinement",
            message: "Cannot be empty ID",
            path: ["id"]
          }, {
            _tag: "Type",
            message: "Expected ValidDateFromSelf (a valid Date instance), actual Invalid Date",
            path: ["timestamp"]
          }]
        )

        let idParseError = yield* _(Effect.either(id.decoded))

        ok(Either.isLeft(idParseError))

        deepEqual(
          ArrayFormatter.formatIssue(idParseError.left.error),
          [{
            _tag: "Refinement",
            message: "Cannot be empty ID",
            path: []
          }]
        )

        const timestampParseError = yield* _(Effect.either(timestamp.decoded))

        ok(Either.isLeft(timestampParseError))

        deepEqual(
          ArrayFormatter.formatIssue(timestampParseError.left.error),
          [{
            _tag: "Type",
            message: "Expected ValidDateFromSelf (a valid Date instance), actual Invalid Date",
            path: []
          }]
        )

        yield* _(RefSubject.set(id, "abcdefghijklmnopqrstuvwxyx"))

        idParseError = yield* _(Effect.either(id.decoded))

        ok(Either.isLeft(idParseError))

        deepEqual(
          ArrayFormatter.formatIssue(idParseError.left.error),
          [{
            _tag: "Refinement",
            message: "ID cannot be longer than 20 characters",
            path: []
          }]
        )
      }).pipe(Effect.scoped)

      await Effect.runPromise(test)
    })

    it("allows persisting form state to a RefSubject source", async () => {
      const test = Effect.gen(function*(_) {
        const ref = yield* _(RefSubject.of(initialFooOutput))
        const form = yield* _(makeFooForm(ref))
        const timestamp = form.get("timestamp")

        deepStrictEqual(yield* _(form), initialFooInput)
        deepStrictEqual(yield* _(form.decoded), initialFooOutput)

        const date = new Date()

        yield* _(RefSubject.set(timestamp, date.toISOString()))

        deepStrictEqual(yield* _(timestamp), date.toISOString())
        deepStrictEqual(yield* _(ref), initialFooOutput)

        yield* _(form.persist)

        deepStrictEqual(yield* _(ref), { ...initialFooOutput, timestamp: date })
      }).pipe(Effect.scoped)

      await Effect.runPromise(test)
    })

    it("allows persisting form state to a RefSubject from the context", async () => {
      const ref = RefSubject.tagged<FooOutput>()("TestRef")

      const test = Effect.gen(function*(_) {
        const form = yield* _(makeFooForm(ref))
        const timestamp = form.get("timestamp")

        deepStrictEqual(yield* _(form), initialFooInput)
        deepStrictEqual(yield* _(form.decoded), initialFooOutput)

        const date = new Date()

        yield* _(RefSubject.set(timestamp, date.toISOString()))

        deepStrictEqual(yield* _(timestamp), date.toISOString())
        deepStrictEqual(yield* _(ref), initialFooOutput)

        yield* _(form.persist)

        deepStrictEqual(yield* _(ref), { ...initialFooOutput, timestamp: date })
      }).pipe(Effect.provide(ref.make(Effect.succeed(initialFooOutput))), Effect.scoped)

      await Effect.runPromise(test)
    })

    it("allow deriving optional form states", async () => {
      const Bar = Schema.struct({
        baz: Schema.optional(Schema.string)
      })
      const makeBarForm = Form.derive(Bar)

      const test = Effect.gen(function*(_) {
        const form = yield* _(makeBarForm(Effect.succeed({})))
        const baz = form.get("baz")

        deepStrictEqual(yield* _(baz), undefined)

        yield* _(RefSubject.set(baz, "asdf"))

        deepStrictEqual(yield* _(baz), "asdf")
      }).pipe(Effect.scoped)

      await Effect.runPromise(test)
    })

    it("allows nesting objects", async () => {
      const Baz = Schema.struct({
        quux: Schema.struct({
          a: Schema.number,
          b: Schema.boolean
        })
      })
      const makeBazForm = Form.derive(Baz)

      const test = Effect.gen(function*(_) {
        const form = yield* _(makeBazForm(Effect.succeed({ quux: { a: 1, b: true } })))
        const quux = form.get("quux")

        ok(Form.FormTypeId in quux)

        const a = quux.get("a")
        const b = quux.get("b")

        yield* _(RefSubject.set(a, 42))
        yield* _(RefSubject.set(b, false))

        deepStrictEqual(yield* _(form), { quux: { a: 42, b: false } })
      }).pipe(Effect.scoped)

      await Effect.runPromise(test)
    })
  })
})
