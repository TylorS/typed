import * as Chunk from "@effect/data/Chunk"
import * as Effect from "@effect/io/Effect"
import type * as Request from "@effect/io/Request"
import * as Context from "@typed/context"

describe(__filename, () => {
  describe(Context.Tagged, () => {
    it("adds actions + provision methods", async () => {
      const tag = Context.Tagged<number>()("test")

      const test = tag.with((x) => x + 1).pipe(tag.provide(1))
      const result = await Effect.runPromise(test)

      expect(result).toBe(2)
    })
  })

  describe(Context.Ref, () => {
    it("allows creating a Ref in the effect context", async () => {
      const ref = Context.Ref<number>()("test")
      const test = ref.get.pipe(ref.provide(1))
      const result = await Effect.runPromise(test)

      expect(result).toBe(1)
    })
  })

  describe(Context.ScopedRef, () => {
    it("allows creating a ScopedRef in the effect context", async () => {
      const ref = Context.ScopedRef<number>()("test")
      const test = ref.get.pipe(ref.provide(1), Effect.scoped)
      const result = await Effect.runPromise(test)

      expect(result).toBe(1)
    })
  })

  describe(Context.SynchronizedRef, () => {
    it("allows creating a SynchronizedRef in the effect context", async () => {
      const ref = Context.SynchronizedRef<number>()("test")
      const test = ref.get.pipe(ref.provide(1))
      const result = await Effect.runPromise(test)

      expect(result).toBe(1)
    })
  })

  describe(Context.Model, () => {
    it("allows composing a set of Refs into a single Model", async () => {
      const A = Context.Ref<number>()("A")
      const B = Context.ScopedRef<number>()("B")
      const C = Context.SynchronizedRef<number>()("C")
      const model = Context.Model({ A, B, C })

      const test = Effect.gen(function*(_) {
        expect(yield* _(model.get)).toEqual({ A: 1, B: 2, C: 3 })

        yield* _(model.set({ A: 2, B: 3, C: 4 }))

        expect(yield* _(model.get)).toEqual({ A: 2, B: 3, C: 4 })

        const A = model.fromKey("A")
        const B = model.fromKey("B")
        const C = model.fromKey("C")

        expect(yield* _(A.get)).toBe(2)

        yield* _(A.set(3))

        expect(yield* _(A.get)).toBe(3)
        expect(yield* _(model.get)).toEqual({ A: 3, B: 3, C: 4 })

        expect(yield* _(B.get)).toBe(3)

        yield* _(B.set(Effect.succeed(4)))

        expect(yield* _(B.get)).toBe(4)
        expect(yield* _(model.get)).toEqual({ A: 3, B: 4, C: 4 })

        expect(yield* _(C.get)).toBe(4)

        yield* _(C.set(5))

        expect(yield* _(C.get)).toBe(5)
        expect(yield* _(model.get)).toEqual({ A: 3, B: 4, C: 5 })
      }).pipe(model.provide({ A: 1, B: 2, C: 3 }), Effect.scoped)

      await Effect.runPromise(test)
    })
  })

  describe("Request + RequestResolver", () => {
    it("allow utilizing Requests and RequestResolvers via the context", async () => {
      interface FooRequest extends Request.Request<never, number> {
        readonly _tag: "Foo"
      }
      const FooRequest = Context.Request.tagged<FooRequest>("Foo")("FooRequest")

      interface BarRequest extends Request.Request<never, number> {
        readonly _tag: "Bar"
      }
      const BarRequest = Context.Request.tagged<BarRequest>("Bar")("BarRequest")

      const FooBar = Context.RequestResolver({
        foo: FooRequest,
        bar: BarRequest
      })((_) => class FooBarResolver extends _("FooBar") {})

      const test = Effect.gen(function*(_) {
        const foo = yield* _(FooRequest.make())
        const bar = yield* _(FooBar.requests.bar())

        expect(foo).toBe(1)
        expect(bar).toBe(2)
      }).pipe(
        Effect.provideSomeLayer(FooBar.fromFunction((req) => req._tag === "Foo" ? 1 : 2))
      )

      await Effect.runPromise(test)
    })
  })

  describe(Context.Cache, () => {
    it("allows creating a Cache in the effect context", async () => {
      const cache = Context.Cache<string, never, number>()("test")
      const test = cache.get("foo").pipe(
        Effect.provideSomeLayer(cache.make({ capacity: 1, timeToLive: 1000, lookup: () => Effect.succeed(1) }))
      )
      const result = await Effect.runPromise(test)

      expect(result).toBe(1)
    })
  })

  describe(Context.Queue, () => {
    it("allows creating a Queue in the effect context", async () => {
      const queue = Context.Queue<number>()("test")
      const test = queue.offerAll([1, 2, 3]).pipe(
        Effect.flatMap(() => queue.takeAll),
        Effect.provideSomeLayer(queue.unbounded)
      )
      const result = await Effect.runPromise(test)

      expect(result).toEqual(Chunk.unsafeFromArray([1, 2, 3]))
    })
  })

  describe(Context.Hub, () => {
    it("allows creating a Hub in the effect context", async () => {
      const hub = Context.Hub<number>()("test")
      const test = hub.subscribe.pipe(
        Effect.tap(() => hub.publishAll([1, 2, 3])),
        Effect.flatMap((sub) => sub.takeAll()),
        Effect.provideSomeLayer(hub.unbounded),
        Effect.scoped
      )
      const result = await Effect.runPromise(test)

      expect(result).toEqual(Chunk.unsafeFromArray([1, 2, 3]))
    })
  })

  describe(Context.Dequeue, () => {
    it("allows creating a Dequeue from Queue", async () => {
      const queue = Context.Queue<number>()("test")
      const dequeue = Context.Dequeue<number>()("test-dequeue")
      const test = queue.offerAll([1, 2, 3]).pipe(
        Effect.flatMap(() => dequeue.takeAll),
        Effect.provideSomeLayer(dequeue.fromQueue(queue)),
        Effect.provideSomeLayer(queue.unbounded)
      )
      const result = await Effect.runPromise(test)

      expect(result).toEqual(Chunk.unsafeFromArray([1, 2, 3]))
    })

    it("allows creating a Dequeue from Hub", async () => {
      const hub = Context.Hub<number>()("test")
      const dequeue = Context.Dequeue<number>()("test-dequeue")
      const test = hub.subscribe.pipe(
        Effect.tap(() => hub.publishAll([1, 2, 3])),
        Effect.flatMap(() => dequeue.takeAll),
        Effect.provideSomeLayer(dequeue.fromHub(hub)),
        Effect.provideSomeLayer(hub.unbounded),
        Effect.scoped
      )
      const result = await Effect.runPromise(test)

      expect(result).toEqual(Chunk.unsafeFromArray([1, 2, 3]))
    })
  })

  describe(Context.Enqueue, () => {
    it("allows creating a Enqueue from Queue", async () => {
      const queue = Context.Queue<number>()("test")
      const enqueue = Context.Enqueue<number>()("test-enqueue")
      const test = enqueue.offerAll([1, 2, 3]).pipe(
        Effect.flatMap(() => queue.takeAll),
        Effect.provideSomeLayer(enqueue.fromQueue(queue)),
        Effect.provideSomeLayer(queue.unbounded)
      )
      const result = await Effect.runPromise(test)

      expect(result).toEqual(Chunk.unsafeFromArray([1, 2, 3]))
    })

    it("allows creating a Enqueue from Hub", async () => {
      const hub = Context.Hub<number>()("test")
      const enqueue = Context.Enqueue<number>()("test-enqueue")
      const test = hub.subscribe.pipe(
        Effect.tap(() => enqueue.offerAll([1, 2, 3])),
        Effect.flatMap((dequeue) => dequeue.takeAll()),
        Effect.provideSomeLayer(enqueue.fromHub(hub)),
        Effect.provideSomeLayer(hub.unbounded),
        Effect.scoped
      )
      const result = await Effect.runPromise(test)

      expect(result).toEqual(Chunk.unsafeFromArray([1, 2, 3]))
    })
  })
})
