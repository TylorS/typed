import * as Equivalence from "@effect/schema/Equivalence"
import type { ParseError } from "@effect/schema/ParseResult"
import * as Schema from "@effect/schema/Schema"
import * as AsyncData from "@typed/async-data/AsyncData"
import * as AsyncDataSchema from "@typed/async-data/Schema"
import { ok } from "assert"
import { Effect } from "effect"
import { describe, it } from "vitest"

const equalAsyncData = <E, A>(
  a: AsyncData.AsyncData<E, A>,
  b: AsyncData.AsyncData<E, A>
) => {
  try {
    ok(AsyncData.dataEqual(a, b))
  } catch (error) {
    console.log("Actual", a)
    console.log("Expected", b)

    throw error
  }
}

describe("AsyncData", () => {
  it("isAsyncData", () => {
    ok(AsyncData.isAsyncData(AsyncData.noData()))
    ok(AsyncData.isAsyncData(AsyncData.loading()))
    ok(AsyncData.isAsyncData(AsyncData.fail(1)))
    ok(AsyncData.isAsyncData(AsyncData.success(1)))
    ok(AsyncData.isAsyncData(AsyncData.optimistic(AsyncData.noData(), 1)))
    ok(AsyncData.isAsyncData(AsyncData.optimistic(AsyncData.loading(), 1)))
    ok(AsyncData.isAsyncData(AsyncData.optimistic(AsyncData.fail(1), 1)))
    ok(AsyncData.isAsyncData(AsyncData.optimistic(AsyncData.success(1), 1)))
    ok(!AsyncData.isAsyncData({}))
    ok(!AsyncData.isAsyncData({ _tag: "NoData" }))
    ok(!AsyncData.isAsyncData({ _tag: "Loading" }))
    ok(!AsyncData.isAsyncData({ _tag: "Failure", cause: { _tag: "Fail", error: 1 } }))
    ok(!AsyncData.isAsyncData({ _tag: "Success", value: 1 }))
    ok(!AsyncData.isAsyncData({ _tag: "Optimistic", previous: { _tag: "NoData" }, value: 1 }))
    ok(!AsyncData.isAsyncData(null))
  })

  it("dataEqual", () => {
    equalAsyncData(AsyncData.noData(), AsyncData.noData())
    equalAsyncData(AsyncData.loading(), AsyncData.loading())
    equalAsyncData(AsyncData.fail(1), AsyncData.fail(1))
    equalAsyncData(AsyncData.success(1), AsyncData.success(1))

    equalAsyncData(AsyncData.optimistic(AsyncData.noData(), 1), AsyncData.optimistic(AsyncData.noData(), 1))
    equalAsyncData(AsyncData.optimistic(AsyncData.loading(), 1), AsyncData.optimistic(AsyncData.loading(), 1))
    equalAsyncData(AsyncData.optimistic(AsyncData.fail(1), 1), AsyncData.optimistic(AsyncData.fail(1), 1))
    equalAsyncData(AsyncData.optimistic(AsyncData.success(1), 1), AsyncData.optimistic(AsyncData.success(1), 1))
  })

  it(AsyncData.isLoading, () => {
    ok(AsyncData.isLoading(AsyncData.loading()))
    ok(!AsyncData.isLoading(AsyncData.noData()))
    ok(!AsyncData.isLoading(AsyncData.fail(1)))
    ok(!AsyncData.isLoading(AsyncData.success(1)))
    ok(!AsyncData.isLoading(AsyncData.optimistic(AsyncData.loading(), 1)))
  })

  it(AsyncData.isRefreshing, () => {
    ok(!AsyncData.isRefreshing(AsyncData.loading()))
    ok(!AsyncData.isRefreshing(AsyncData.noData()))
    ok(!AsyncData.isRefreshing(AsyncData.fail(1)))
    ok(!AsyncData.isRefreshing(AsyncData.success(1)))
    ok(!AsyncData.isRefreshing(AsyncData.optimistic(AsyncData.loading(), 1)))
    ok(AsyncData.isRefreshing(AsyncData.optimistic(AsyncData.startLoading(AsyncData.fail(1)), 1)))
  })

  it(AsyncData.isLoadingOrRefreshing, () => {
    ok(AsyncData.isLoadingOrRefreshing(AsyncData.loading()))
    ok(!AsyncData.isLoadingOrRefreshing(AsyncData.noData()))
    ok(!AsyncData.isLoadingOrRefreshing(AsyncData.fail(1)))
    ok(!AsyncData.isLoadingOrRefreshing(AsyncData.success(1)))
    ok(AsyncData.isLoadingOrRefreshing(AsyncData.optimistic(AsyncData.loading(), 1)))
    ok(AsyncData.isLoadingOrRefreshing(AsyncData.optimistic(AsyncData.startLoading(AsyncData.fail(1)), 1)))
  })

  it("map", () => {
    equalAsyncData(AsyncData.map(AsyncData.noData<number, string>(), (n) => n + 1), AsyncData.noData())
    equalAsyncData(AsyncData.map(AsyncData.loading<number, string>(), (n) => n + 1), AsyncData.loading())
    equalAsyncData(AsyncData.map(AsyncData.fail<number, string>("error"), (n) => n + 1), AsyncData.fail("error"))
    equalAsyncData(AsyncData.map(AsyncData.success<number, string>(1), (n) => n + 1), AsyncData.success(2))
    equalAsyncData(
      AsyncData.map(AsyncData.optimistic(AsyncData.noData(), 1), (n) => n + 1),
      AsyncData.optimistic(AsyncData.noData(), 2)
    )
    equalAsyncData(
      AsyncData.map(AsyncData.optimistic(AsyncData.loading(), 1), (n) => n + 1),
      AsyncData.optimistic(AsyncData.loading(), 2)
    )
    equalAsyncData(
      AsyncData.map(AsyncData.optimistic(AsyncData.fail("error"), 1), (n) => n + 1),
      AsyncData.optimistic(AsyncData.fail("error"), 2)
    )
    equalAsyncData(
      AsyncData.map(AsyncData.optimistic(AsyncData.success(1), 1), (n) => n + 1),
      AsyncData.optimistic(AsyncData.success(2), 2)
    )
  })

  it("flatMap", () => {
    equalAsyncData(
      AsyncData.flatMap(AsyncData.noData<number, string>(), (n) => AsyncData.success(n + 1)),
      AsyncData.noData()
    )
    equalAsyncData(
      AsyncData.flatMap(AsyncData.loading<number, string>(), (n) => AsyncData.success(n + 1)),
      AsyncData.loading()
    )
    equalAsyncData(
      AsyncData.flatMap(AsyncData.fail<number, string>("error"), (n) => AsyncData.success(n + 1)),
      AsyncData.fail("error")
    )
    equalAsyncData(
      AsyncData.flatMap(AsyncData.success<number, string>(1), (n) => AsyncData.success(n + 1)),
      AsyncData.success(2)
    )

    equalAsyncData(
      AsyncData.flatMap(AsyncData.optimistic(AsyncData.noData(), 1), (n) => AsyncData.success(n + 1)),
      AsyncData.success(2)
    )
    equalAsyncData(
      AsyncData.flatMap(AsyncData.optimistic(AsyncData.loading(), 1), (n) => AsyncData.success(n + 1)),
      AsyncData.success(2)
    )
    equalAsyncData(
      AsyncData.flatMap(AsyncData.optimistic(AsyncData.fail("error"), 1), (n) => AsyncData.success(n + 1)),
      AsyncData.success(2)
    )
    equalAsyncData(
      AsyncData.flatMap(AsyncData.optimistic(AsyncData.success(1), 1), (n) => AsyncData.success(n + 1)),
      AsyncData.success(2)
    )
  })

  describe(AsyncData.startLoading, () => {
    it("noData", () => {
      equalAsyncData(AsyncData.startLoading(AsyncData.noData()), AsyncData.loading())
    })

    it("loading", () => {
      equalAsyncData(AsyncData.startLoading(AsyncData.loading()), AsyncData.loading())
    })

    it("fail", () => {
      equalAsyncData(
        AsyncData.startLoading(AsyncData.fail("error")),
        AsyncData.fail("error", { refreshing: AsyncData.loading() })
      )
    })

    it("success", () => {
      equalAsyncData(
        AsyncData.startLoading(AsyncData.success(1)),
        AsyncData.success(1, { refreshing: AsyncData.loading() })
      )
    })

    it("optimistic", () => {
      equalAsyncData(
        AsyncData.startLoading(AsyncData.optimistic(AsyncData.noData(), 1)),
        AsyncData.optimistic(AsyncData.loading(), 1)
      )

      equalAsyncData(
        AsyncData.startLoading(AsyncData.optimistic(AsyncData.loading(), 1)),
        AsyncData.optimistic(AsyncData.loading(), 1)
      )

      equalAsyncData(
        AsyncData.startLoading(AsyncData.optimistic(AsyncData.fail("error"), 1)),
        AsyncData.optimistic(AsyncData.fail("error", { refreshing: AsyncData.loading() }), 1)
      )

      equalAsyncData(
        AsyncData.startLoading(AsyncData.optimistic(AsyncData.success(1), 1)),
        AsyncData.optimistic(AsyncData.success(1, { refreshing: AsyncData.loading() }), 1)
      )
    })
  })

  it("isExpired", () => {
    const now = Date.now()
    const ttl = 1000

    // NoData is always expired
    ok(AsyncData.isExpired(AsyncData.noData(), ttl, now))

    ok(!AsyncData.isExpired(AsyncData.loading({ timestamp: now }), ttl, now))
    ok(AsyncData.isExpired(AsyncData.loading({ timestamp: now - ttl }), ttl, now))

    ok(!AsyncData.isExpired(AsyncData.fail("error", { timestamp: now }), ttl, now))
    ok(AsyncData.isExpired(AsyncData.fail("error", { timestamp: now - ttl }), ttl, now))

    ok(!AsyncData.isExpired(AsyncData.success(1, { timestamp: now }), ttl, now))
    ok(AsyncData.isExpired(AsyncData.success(1, { timestamp: now - ttl }), ttl, now))

    ok(!AsyncData.isExpired(AsyncData.optimistic(AsyncData.noData(), 1), ttl, now))
    ok(AsyncData.isExpired(AsyncData.optimistic(AsyncData.noData(), 1, { timestamp: now - ttl }), ttl, now))

    ok(!AsyncData.isExpired(AsyncData.optimistic(AsyncData.loading(), 1), ttl, now))
    ok(AsyncData.isExpired(AsyncData.optimistic(AsyncData.loading(), 1, { timestamp: now - ttl }), ttl, now))
    ok(AsyncData.isExpired(AsyncData.optimistic(AsyncData.loading({ timestamp: now - ttl }), 1), ttl, now))

    ok(!AsyncData.isExpired(AsyncData.optimistic(AsyncData.fail("error"), 1), ttl, now))
    ok(AsyncData.isExpired(AsyncData.optimistic(AsyncData.fail("error"), 1, { timestamp: now - ttl }), ttl, now))
    ok(AsyncData.isExpired(AsyncData.optimistic(AsyncData.fail("error", { timestamp: now - ttl }), 1), ttl, now))
  })

  describe("Schema", () => {
    describe(AsyncDataSchema.asyncDataFromJson, () => {
      it("encodes/decodes AsyncData JSON", async () => {
        const schema = AsyncDataSchema.asyncDataFromJson(Schema.BigInt, Schema.NumberFromString)
        const timestamp = Date.now()

        const test = Effect.gen(function*(_) {
          yield* _(encodeDecodeAreDual(schema, { _tag: "NoData" }, { _tag: "NoData" }))
          yield* _(encodeDecodeAreDual(schema, { _tag: "Loading", timestamp }, { _tag: "Loading", timestamp }))
          yield* _(
            encodeDecodeAreDual(
              schema,
              { _tag: "Failure", cause: { _tag: "Fail", error: "1" }, timestamp },
              { _tag: "Failure", cause: { _tag: "Fail", error: 1 }, timestamp }
            )
          )
          yield* _(
            encodeDecodeAreDual(
              schema,
              { _tag: "Success", value: "1", timestamp },
              { _tag: "Success", value: 1n, timestamp }
            )
          )
          yield* _(
            encodeDecodeAreDual(
              schema,
              { _tag: "Optimistic", previous: { _tag: "NoData" }, timestamp, value: "1" },
              { _tag: "Optimistic", previous: { _tag: "NoData" }, timestamp, value: 1n }
            )
          )
        })

        await Effect.runPromise(test)
      })
    })

    describe(AsyncDataSchema.AsyncDataFromSelf, () => {
      it("encodes/decodes AsyncData values", async () => {
        const schema = AsyncDataSchema.AsyncDataFromSelf(Schema.BigInt, Schema.NumberFromString)
        const timestamp = Date.now()

        const test = Effect.gen(function*(_) {
          yield* _(encodeDecodeAreDual(schema, AsyncData.noData(), AsyncData.noData()))
          yield* _(encodeDecodeAreDual(schema, AsyncData.loading({ timestamp }), AsyncData.loading({ timestamp })))

          yield* _(
            encodeDecodeAreDual(
              schema,
              AsyncData.fail("1", { timestamp }),
              AsyncData.fail(1, { timestamp })
            )
          )

          yield* _(
            encodeDecodeAreDual(
              schema,
              AsyncData.success("1", { timestamp }),
              AsyncData.success(BigInt(1), { timestamp })
            )
          )
        })

        await Effect.runPromise(test)
      })
    })

    describe(AsyncDataSchema.AsyncData, () => {
      it("encodes/decodes AsyncData from JSON", async () => {
        const schema = AsyncDataSchema.AsyncData(Schema.BigInt, Schema.NumberFromString)
        const timestamp = Date.now()

        const test = Effect.gen(function*(_) {
          yield* _(encodeDecodeAreDual(schema, { _tag: "NoData" }, AsyncData.noData()))
          yield* _(encodeDecodeAreDual(schema, { _tag: "Loading", timestamp }, AsyncData.loading({ timestamp })))
          yield* _(
            encodeDecodeAreDual(
              schema,
              { _tag: "Failure", cause: { _tag: "Fail", error: "1" }, timestamp },
              AsyncData.fail(1, { timestamp })
            )
          )
          yield* _(
            encodeDecodeAreDual(
              schema,
              { _tag: "Success", value: "1", timestamp },
              AsyncData.success(BigInt(1), { timestamp })
            )
          )
          yield* _(
            encodeDecodeAreDual(
              schema,
              { _tag: "Optimistic", previous: { _tag: "NoData" }, timestamp, value: "1" },
              AsyncData.optimistic(AsyncData.noData(), BigInt(1), { timestamp })
            )
          )
        })

        await Effect.runPromise(test)
      })
    })
  })
})

function encodeDecodeAreDual<O, I, R>(
  schema: Schema.Schema<O, I, R>,
  input: I,
  output: O
): Effect.Effect<void, ParseError, R> {
  return Effect.gen(function*(_) {
    const encode = Schema.encode(schema)
    const decode = Schema.decode(schema)
    const decodeEquals = Equivalence.make(Schema.typeSchema(schema))
    const encodeEquals = Equivalence.make(Schema.encodedSchema(schema))
    const decoded = yield* _(decode(input))
    const encoded = yield* _(encode(output))

    try {
      ok(decodeEquals(decoded, output))
    } catch (error) {
      console.log("Failed to decode", input)
      console.log("Decoded", decoded)
      console.log("Expected", output)

      throw error
    }

    try {
      ok(encodeEquals(encoded, input))
    } catch (error) {
      console.log("Failed to encode", output)
      console.log("Encoded", encoded)
      console.log("Expected", input)

      throw error
    }
  })
}
