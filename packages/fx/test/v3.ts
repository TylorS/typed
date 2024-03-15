import * as ArrayFormatter from "@effect/schema/ArrayFormatter"
import * as Schema from "@effect/schema/Schema"
import * as Form from "@typed/fx/Form"
import * as Fx from "@typed/fx/Fx"
import * as core from "@typed/fx/internal/core"
import * as diff from "@typed/fx/internal/diff"
import * as RefSubject from "@typed/fx/RefSubject"
import * as Sink from "@typed/fx/Sink"
import * as Subject from "@typed/fx/Subject"
import { ComputedTypeId, FilteredTypeId, RefSubjectTypeId } from "@typed/fx/TypeId"
import { deepEqual, deepStrictEqual, ok } from "assert"
import { Effect, Either, Fiber, Option, TestClock, TestContext } from "effect"

describe("V3", () => {
  describe("Fx", () => {
    it("filter + map + loop fusion", async () => {
      const fx = core.fromArray([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).pipe(
        (x) => core.filter(x, (x) => x % 2 === 0),
        (x) => core.map(x, (x) => x + 1),
        (x) => core.loop(x, 0, (acc, x) => [acc * 2, acc + x]),
        (x) => core.filter(x, (x) => x % 2 === 0),
        (x) => core.map(x, (x) => x + 1),
        (x) => core.loop(x, 0, (acc, x) => [acc * 3, acc + x])
      )

      // Verify Fx has been fused into a single ProducerSyncTransformer
      // @ts-ignore
      expect(core.isProducerSyncTransformer(fx)).toBe(true)

      const test = fx.pipe(core.toReadonlyArray, Effect.timed)

      const [time, values] = await Effect.runPromise(test)

      console.log(time.toString())

      deepStrictEqual(values, [0, 3, 24, 75, 168])
    })

    describe("switchMap", () => {
      it("fromArray + switchMap", async () => {
        const fx = core.fromArray([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).pipe(
          (x) => core.switchMap(x, (x) => core.fromArray([x, x + 1, x + 2]))
        )
        const test = Effect.scoped(core.toReadonlyArray(fx))

        deepStrictEqual(await Effect.runPromise(test), [10, 11, 12])
      })

      it("fromEffect + switchMap", async () => {
        const fx = core.fromEffect(Effect.succeed(10)).pipe(
          (x) => core.switchMap(x, (x) => core.fromArray([x, x + 1, x + 2]))
        )
        const test = Effect.scoped(core.toReadonlyArray(fx))

        deepStrictEqual(await Effect.runPromise(test), [10, 11, 12])
      })

      it("switchMap favors the latest inner Fx", async () => {
        const test = core.toReadonlyArray(core.switchMap(
          core.make<number>((sink) =>
            Effect.gen(function*(_) {
              yield* _(sink.onSuccess(1))
              yield* _(sink.onSuccess(2))
              yield* _(sink.onSuccess(3))
            })
          ),
          (x) => core.succeed(String(x + 1))
        ))

        const array = await Effect.runPromise(Effect.scoped(test))

        expect(array).toEqual(["4"])
      })

      it("manages the scopes of inner Fx", async () => {
        const test = Effect.gen(function*(_) {
          const finalized: Array<number> = []

          const fx = core.switchMap(
            core.mergeAll(
              [
                core.succeed(1),
                core.debounce(core.succeed(2), 10),
                core.debounce(core.succeed(3), 20)
              ]
            ),
            (x) =>
              core.scoped(core.fromFxEffect(
                Effect.gen(function*(_) {
                  yield* _(Effect.addFinalizer(() => Effect.sync(() => finalized.push(x))))
                  return core.succeed(x)
                })
              ))
          )

          yield* _(core.toReadonlyArray(fx))

          expect(finalized).toEqual([1, 2, 3])
        })

        await Effect.runPromise(Effect.scoped(test))
      })
    })

    it("exhaustMap favors the first inner Fx", async () => {
      const test = core.toReadonlyArray(core.exhaustMap(
        core.make<number>((sink) =>
          Effect.gen(function*(_) {
            yield* _(sink.onSuccess(1))
            yield* _(sink.onSuccess(2))
            yield* _(sink.onSuccess(3))
          })
        ),
        (x) => core.succeed(String(x + 1))
      ))

      const array = await Effect.runPromise(Effect.scoped(test))

      expect(array).toEqual(["2"])
    })

    it("exhaustMapLatest favors the first and last inner Fx", async () => {
      const test = core.toReadonlyArray(core.exhaustMapLatest(
        core.make<number>((sink) =>
          Effect.gen(function*(_) {
            yield* _(sink.onSuccess(1))
            yield* _(sink.onSuccess(2))
            yield* _(sink.onSuccess(3))
          })
        ),
        (x) => core.succeed(String(x + 1))
      ))

      const array = await Effect.runPromise(Effect.scoped(test))

      expect(array).toEqual(["2", "4"])
    })

    describe("hold", () => {
      it("shares a value with replay of the last", async () => {
        let i = 0
        const delay = 10
        const iterator = Effect.sync(() => i++)

        const sut = Fx.periodic(iterator, delay).pipe(
          Fx.take(5),
          Fx.hold,
          Fx.toReadonlyArray
        )

        const test = Effect.gen(function*(_) {
          // start first fiber
          const a = yield* _(Effect.fork(sut))

          // Allow 1 event to occur
          yield* _(TestClock.adjust(delay * 1.5))

          // Start the second
          const b = yield* _(Effect.fork(sut))

          yield* _(TestClock.adjust(delay * 3))

          // Validate the outputs
          expect(yield* _(Fiber.join(a))).toEqual([0, 1, 2, 3, 4])
          expect(yield* _(Fiber.join(b))).toEqual([1, 2, 3, 4])
        }).pipe(Effect.scoped, Effect.provide(TestContext.TestContext))

        await Effect.runPromise(test)
      })
    })

    describe("Fx.keyed", () => {
      it("allow keeping a reference to a running stream", async () => {
        const test = Effect.gen(function*($) {
          const inputs = Fx.mergeAll([
            Fx.succeed([1, 2, 3]),
            Fx.at([3, 2, 1], 100),
            Fx.at([4, 5, 6, 1], 200)
          ])

          let calls = 0

          const fx = Fx.keyed(
            inputs,
            {
              getKey: (x) => x,
              onValue: (x) => {
                calls++
                return x
              }
            }
          )

          const events = yield* $(Fx.toReadonlyArray(fx))

          expect(events).toEqual([
            [1, 2, 3],
            [3, 2, 1],
            [4, 5, 6, 1]
          ])

          // Should only be called once for each unique value
          expect(calls).toEqual(6)
        })

        await Effect.runPromise(Effect.scoped(test))
      })

      it("allow providing a debounce", async () => {
        const test = Effect.gen(function*($) {
          const inputs = Fx.mergeAll([
            Fx.succeed([1, 2, 3]),
            Fx.at([3, 2, 1], 50),
            Fx.at([4, 5, 6, 1], 150)
          ])

          let calls = 0

          const fx = Fx.keyed(
            inputs,
            {
              getKey: (x) => x,
              onValue: (x) => {
                calls++
                return x
              },
              debounce: 50
            }
          )

          const events = yield* $(Fx.toReadonlyArray(fx))

          expect(events).toEqual([
            [3, 2, 1],
            [4, 5, 6, 1]
          ])

          // Should only be called once for each unique value
          expect(calls).toEqual(6)
        })

        await Effect.runPromise(Effect.scoped(test))
      })
    })

    describe("Fx.withKey", () => {
      it("creates stable references to another Fx", async () => {
        type Foo = {
          id: string
          value: number
        }

        const a0: Foo = {
          id: "a",
          value: 0
        }
        const a1: Foo = {
          id: "a",
          value: 1
        }
        const b0: Foo = {
          id: "b",
          value: 2
        }
        const c0: Foo = {
          id: "c",
          value: 3
        }
        const c1: Foo = {
          id: "c",
          value: 4
        }

        const foos = [a0, a1, b0, c0, c1]

        const source = Fx.mergeAll(foos.map((foo, i) => Fx.at(foo, i * 10)))

        let calls = 0

        const test = source.pipe(
          Fx.withKey({
            getKey: (f) => f.id,
            onValue: (ref) => {
              calls++
              return Fx.map(ref, (x): Foo => {
                return ({ ...x, value: x.value + 1 })
              })
            }
          }),
          Fx.toReadonlyArray,
          Effect.scoped
        )

        const actual = await Effect.runPromise(test)
        const expected = [
          { ...a0, value: a0.value + 1 },
          { ...a1, value: a1.value + 1 },
          { ...b0, value: b0.value + 1 },
          { ...c0, value: c0.value + 1 },
          { ...c1, value: c1.value + 1 }
        ]

        expect(actual).toEqual(expected)
        expect(calls).toEqual(3)
      })
    })
  })

  describe("RefSubject", () => {
    it("allows managing state via Effect", async () => {
      const test = Effect.gen(function*(_) {
        const ref = yield* _(RefSubject.make(Effect.succeed(0)))

        yield* _(ref)
        yield* _(RefSubject.update(ref, (x) => x + 1))
        yield* _(RefSubject.delete(ref))
        yield* _(ref)

        deepStrictEqual(yield* _(ref), 0)
        deepStrictEqual(yield* _(RefSubject.update(ref, (x) => x + 1)), 1)
        deepStrictEqual(yield* _(RefSubject.delete(ref)), Option.some(1))
        deepStrictEqual(yield* _(ref), 0)
      }).pipe(Effect.scoped)

      await Effect.runPromise(test)
    })

    it("allows managing state via Fx", async () => {
      const test = Effect.gen(function*(_) {
        const ref = yield* _(RefSubject.make(core.succeed(0)))

        yield* _(ref)
        yield* _(RefSubject.update(ref, (x) => x + 1))
        yield* _(RefSubject.delete(ref))
        yield* _(ref)

        deepStrictEqual(yield* _(ref), 0)
        deepStrictEqual(yield* _(RefSubject.update(ref, (x) => x + 1)), 1)
        deepStrictEqual(yield* _(RefSubject.delete(ref)), Option.some(1))
        deepStrictEqual(yield* _(ref), 0)
      }).pipe(Effect.scoped)

      await Effect.runPromise(test)
    })

    describe("runUpdate", () => {
      it("allows changing the value of a ref multiple times withing a single workflow", async () => {
        const test = Effect.gen(function*(_) {
          const ref = yield* _(RefSubject.of(1))
          const fiber = yield* _(core.toReadonlyArray(core.take(ref, 10)), Effect.fork)

          // Allow fiber to start
          yield* _(Effect.sleep(0))

          yield* _(
            ref.runUpdates(({ get, set }) =>
              Effect.gen(function*(_) {
                // Preserves ordering of asynchonous updates
                yield* _(Effect.sleep(100))
                expect(yield* _(get)).toEqual(1)
                expect(yield* _(set(2))).toEqual(2)
                expect(yield* _(set(2))).toEqual(2) // prevents duplicates
                expect(yield* _(set(3))).toEqual(3)
                expect(yield* _(set(4))).toEqual(4)
                expect(yield* _(set(5))).toEqual(5)

                return 42
              })
            ),
            Effect.fork
          )

          yield* _(
            ref.runUpdates(({ get, set }) =>
              Effect.gen(function*(_) {
                expect(yield* _(get)).toEqual(5)
                expect(yield* _(set(6))).toEqual(6)
                expect(yield* _(set(7))).toEqual(7)
                expect(yield* _(set(8))).toEqual(8)
                expect(yield* _(set(9))).toEqual(9)
                expect(yield* _(set(10))).toEqual(10)

                return 99
              })
            ),
            Effect.fork
          )

          const values = yield* _(Effect.fromFiber(fiber))

          expect(values).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
        }).pipe(Effect.scoped)

        await Effect.runPromise(test)
      })
    })

    it("allows subscribing to those state changes", async () => {
      const test = Effect.gen(function*(_) {
        const ref = yield* _(RefSubject.of(0))

        const fiber = yield* _(Effect.fork(Fx.toReadonlyArray(Fx.take(ref, 3))))

        // Allow fiber to start
        yield* _(Effect.sleep(1))

        yield* _(RefSubject.set(ref, 1))
        yield* _(RefSubject.set(ref, 2))

        expect(yield* _(Fiber.join(fiber))).toEqual([0, 1, 2])
      }).pipe(Effect.scoped)

      await Effect.runPromise(test)
    })

    it("allow transforming inputs with Sink", async () => {
      const test = Effect.gen(function*(_) {
        const ref = yield* _(RefSubject.of(0))
        const sink = Sink.map(ref, (x: string) => x.length)

        yield* _(sink.onSuccess("a"))

        expect(yield* _(ref)).toEqual(1)

        yield* _(sink.onSuccess("ab"))

        expect(yield* _(ref)).toEqual(2)

        yield* _(sink.onSuccess("abc"))

        expect(yield* _(ref)).toEqual(3)
      }).pipe(Effect.scoped)

      await Effect.runPromise(test)
    })

    it("can be combined in tuple", async () => {
      const test = Effect.gen(function*(_) {
        const a = yield* _(RefSubject.of(0))
        const b = yield* _(RefSubject.of(""))
        const c = yield* _(RefSubject.of(false))
        const ref = RefSubject.tuple([a, b, c])

        ok(ComputedTypeId in ref)
        ok(RefSubjectTypeId in ref)
        ok(!(FilteredTypeId in ref))

        expect(yield* _(ref)).toEqual([0, "", false])

        yield* _(RefSubject.set(a, 1))

        expect(yield* _(ref)).toEqual([1, "", false])

        yield* _(RefSubject.set(ref, [2, "hello", true]))

        expect(yield* _(ref)).toEqual([2, "hello", true])

        expect(yield* _(a)).toEqual(2)
        expect(yield* _(b)).toEqual("hello")
        expect(yield* _(c)).toEqual(true)
      }).pipe(Effect.scoped)

      await Effect.runPromise(test)
    })

    it("can be combined in a struct", async () => {
      const test = Effect.gen(function*(_) {
        const a = yield* _(RefSubject.of(0))
        const b = yield* _(RefSubject.of(""))
        const c = yield* _(RefSubject.of(false))
        const ref = RefSubject.struct({ a, b, c })

        ok(ComputedTypeId in ref)
        ok(RefSubjectTypeId in ref)
        ok(!(FilteredTypeId in ref))

        expect(yield* _(ref)).toEqual({ a: 0, b: "", c: false })

        yield* _(RefSubject.set(a, 1))

        expect(yield* _(ref)).toEqual({ a: 1, b: "", c: false })

        yield* _(RefSubject.set(ref, { a: 2, b: "hello", c: true }))

        expect(yield* _(ref)).toEqual({ a: 2, b: "hello", c: true })

        expect(yield* _(a)).toEqual(2)
        expect(yield* _(b)).toEqual("hello")
        expect(yield* _(c)).toEqual(true)
      }).pipe(Effect.scoped)

      await Effect.runPromise(test)
    })
  })

  describe("Computed", () => {
    it("allows mapping values from a RefSubject", async () => {
      const test = Effect.gen(function*(_) {
        const ref = yield* _(RefSubject.of(0))
        const computed = RefSubject.map(ref, (x) => x + 1)

        expect(yield* _(computed)).toEqual(1)

        yield* _(RefSubject.update(ref, (x) => x + 1))

        expect(yield* _(computed)).toEqual(2)
      }).pipe(Effect.scoped)

      await Effect.runPromise(test)
    })

    it("allows mapping values from a Computed", async () => {
      const test = Effect.gen(function*(_) {
        const ref = yield* _(RefSubject.of(0))

        let middleCalls = 0
        let computedCalls = 0

        const middle = RefSubject.map(ref, (x) => {
          middleCalls++
          return x + 1
        })
        const computed = RefSubject.map(middle, (x) => {
          computedCalls++
          return x + 1
        })

        expect(yield* _(computed)).toEqual(2)
        expect(middleCalls).toEqual(1)
        expect(computedCalls).toEqual(1)

        yield* _(RefSubject.update(ref, (x) => x + 1))

        expect(yield* _(computed)).toEqual(3)
        expect(middleCalls).toEqual(2)
        expect(computedCalls).toEqual(2)
      }).pipe(Effect.scoped)

      await Effect.runPromise(test)
    })

    it("allows subscribing to those state changes", async () => {
      const test = Effect.gen(function*(_) {
        const ref = yield* _(RefSubject.of(0))
        const computed = RefSubject.map(ref, (x) => x + 1)

        ok(ComputedTypeId in computed)
        ok(!(RefSubjectTypeId in computed))
        ok(!(FilteredTypeId in computed))

        const fiber = yield* _(Effect.fork(Fx.toReadonlyArray(Fx.take(computed, 3))))

        // Allow fiber to start
        yield* _(Effect.sleep(0))

        yield* _(RefSubject.set(ref, 1))
        yield* _(RefSubject.set(ref, 2))

        expect(yield* _(Fiber.join(fiber))).toEqual([1, 2, 3])
      }).pipe(Effect.scoped)

      await Effect.runPromise(test)
    })

    it("avoids recomputing when source has not changed", async () => {
      const test = Effect.gen(function*(_) {
        const ref = yield* _(RefSubject.of(0))
        let called = 0
        const computed = RefSubject.map(ref, (x) => {
          called++
          return x + 1
        })

        expect(yield* _(computed)).toEqual(1)
        expect(called).toEqual(1)

        yield* _(RefSubject.set(ref, 1))

        expect(yield* _(computed)).toEqual(2)
        expect(called).toEqual(2)

        // Skips duplicates
        expect(yield* _(computed)).toEqual(2)
        expect(called).toEqual(2)
      }).pipe(Effect.scoped)

      await Effect.runPromise(test)
    })

    it("can be combined in tuple", async () => {
      const test = Effect.gen(function*(_) {
        const source = yield* _(RefSubject.of(0))
        const a = RefSubject.map(source, (x) => x + 1)
        const b = RefSubject.map(source, (x) => x * 2)
        const c = RefSubject.map(source, (x) => x - 1)
        const computed = RefSubject.tuple([a, b, c])

        expect(yield* _(computed)).toEqual([1, 0, -1])

        yield* _(RefSubject.set(source, 1))

        expect(yield* _(computed)).toEqual([2, 2, 0])

        yield* _(RefSubject.set(source, 2))

        expect(yield* _(computed)).toEqual([3, 4, 1])
      }).pipe(Effect.scoped)

      await Effect.runPromise(test)
    })

    it("can be combined in struct", async () => {
      const test = Effect.gen(function*(_) {
        const source = yield* _(RefSubject.of(0))
        const a = RefSubject.map(source, (x) => x + 1)
        const b = RefSubject.map(source, (x) => x * 2)
        const c = RefSubject.map(source, (x) => x - 1)
        const computed = RefSubject.struct({ a, b, c })

        expect(yield* _(computed)).toEqual({ a: 1, b: 0, c: -1 })

        yield* _(RefSubject.set(source, 1))

        expect(yield* _(computed)).toEqual({ a: 2, b: 2, c: 0 })

        yield* _(RefSubject.set(source, 2))

        expect(yield* _(computed)).toEqual({ a: 3, b: 4, c: 1 })
      }).pipe(Effect.scoped)

      await Effect.runPromise(test)
    })

    it("late subscribers to derived Computed values will receive the latest value", async () => {
      const test = Effect.gen(function*(_) {
        const source = yield* _(RefSubject.of(0))
        const a = RefSubject.map(source, (x) => x + 1)
        const b = RefSubject.map(a, (x) => x * 2)
        const c = RefSubject.map(b, (x) => x - 1)

        // Create a subscriber
        const fiber1 = yield* _(Fx.toReadonlyArray(c), Effect.fork)
        // Let the fiber start
        yield* _(Effect.sleep(0))

        // Update the source
        yield* _(RefSubject.set(source, 1))

        // Create a second subscriber
        const fiber2 = yield* _(Fx.toReadonlyArray(c), Effect.fork)
        // Let the fiber start
        yield* _(Effect.sleep(0))

        // Update the source
        yield* _(RefSubject.set(source, 2))

        // Create a third subscriber
        const fiber3 = yield* _(Fx.toReadonlyArray(c), Effect.fork)
        // Let the fiber start
        yield* _(Effect.sleep(0))

        // Update the source
        yield* _(RefSubject.set(source, 3))

        // Interrupt source RefSubject
        yield* _(source.interrupt)

        // Validate the outputs
        const [one, two, three] = yield* _(Effect.all([Fiber.join(fiber1), Fiber.join(fiber2), Fiber.join(fiber3)]))

        expect(one).toEqual([1, 3, 5, 7])
        expect(two).toEqual([3, 5, 7])
        expect(three).toEqual([5, 7])
      }).pipe(Effect.scoped)

      await Effect.runPromise(test)
    })
  })

  describe("Filtered,Effect.optionFromOptional", () => {
    describe("filterMap to filtered values", () => {
      it("returns Cause.NoSuchElementException when filtered", async () => {
        const test = Effect.gen(function*(_) {
          const ref = yield* _(RefSubject.of(0))
          const filtered = RefSubject.filterMap(ref, Option.liftPredicate((x) => x % 2 === 0))

          expect(yield* _(Effect.optionFromOptional(filtered))).toEqual(Option.some(0))

          yield* _(RefSubject.set(ref, 1))

          expect(yield* _(Effect.optionFromOptional(filtered))).toEqual(Option.none())

          yield* _(RefSubject.set(ref, 2))

          expect(yield* _(Effect.optionFromOptional(filtered))).toEqual(Option.some(2))
        }).pipe(Effect.scoped)

        await Effect.runPromise(test)
      })

      it("can be combined in tuple", async () => {
        const test = Effect.gen(function*(_) {
          const source = yield* _(RefSubject.of(0))
          const a = RefSubject.filterMap(source, Option.liftPredicate((x) => x % 2 === 0))
          const b = RefSubject.map(source, (x) => x * 2)
          const c = RefSubject.map(source, (x) => x - 1)
          const filtered = RefSubject.tuple([a, b, c])

          ok(!(ComputedTypeId in filtered))
          ok(!(RefSubjectTypeId in filtered))
          ok(FilteredTypeId in filtered)

          expect(yield* _(filtered, Effect.optionFromOptional)).toEqual(Option.some([0, 0, -1]))

          yield* _(RefSubject.set(source, 1))

          expect(yield* _(filtered, Effect.optionFromOptional)).toEqual(Option.none())

          yield* _(RefSubject.set(source, 2))

          expect(yield* _(filtered, Effect.optionFromOptional)).toEqual(Option.some([2, 4, 1]))
        }).pipe(Effect.scoped)

        await Effect.runPromise(test)
      })
    })
  })

  describe("Subject", () => {
    it("can map the input values using Sink combinators", async () => {
      const subject = Subject.unsafeMake<never, number>()
      const sink = subject.pipe(Sink.map((x: string) => x.length))
      const test = Effect.gen(function*(_) {
        const fiber = yield* _(core.toReadonlyArray(core.take(subject, 3)), Effect.fork)

        // Allow fiber to start
        yield* _(Effect.sleep(0))

        yield* _(sink.onSuccess("a"))
        yield* _(sink.onSuccess("ab"))
        yield* _(sink.onSuccess("abc"))

        expect(yield* _(Fiber.join(fiber))).toEqual([1, 2, 3])
      }).pipe(Effect.scoped)

      await Effect.runPromise(test)
    })
  })

  describe("internal / diff", () => {
    const makeSimpleDiffer = () => {
      return <A extends PropertyKey>(
        old: ReadonlyArray<A>,
        newValue: ReadonlyArray<A>,
        expected: ReadonlyArray<diff.Diff<A, A>>
      ) => {
        const actual = diff.diff(old, newValue)

        try {
          expect(actual).toEqual(expected)
        } catch (error) {
          console.error("old", old)
          console.error("new", newValue)
          console.error("expected", expected)
          console.error("actual", actual)

          throw error
        }
      }
    }

    it("diffs 2 arrays", () => {
      const test = makeSimpleDiffer()

      test([1, 2, 3], [1, 2, 3], [])
      test([1, 2, 3], [1, 2, 3, 4], [diff.add(4, 3, 4)])
      test([1, 2, 3], [1, 2, 4], [diff.remove(3, 2, 3), diff.add(4, 2, 4)])
      test([1, 2, 3], [1, 2, 4, 5], [diff.remove(3, 2, 3), diff.add(4, 2, 4), diff.add(5, 3, 5)])
      test([1, 2, 3], [1, 2, 3, 4, 5], [diff.add(4, 3, 4), diff.add(5, 4, 5)])
      test([1, 2, 3], [1, 2, 3, 4, 5, 6], [diff.add(4, 3, 4), diff.add(5, 4, 5), diff.add(6, 5, 6)])
      test([1, 2, 3], [3], [diff.remove(1, 0, 1), diff.remove(2, 1, 2), diff.moved(3, 2, 0, 3)])
      test([1, 2, 3], [4, 1, 2], [
        diff.remove(3, 2, 3),
        diff.add(4, 0, 4),
        diff.moved(1, 0, 1, 1),
        diff.moved(2, 1, 2, 2)
      ])
      test([1, 2, 3], [3, 2, 1], [diff.moved(1, 0, 2, 1), diff.moved(3, 2, 0, 3)])
    })
  })

  describe.concurrent("Form", () => {
    describe(Form.derive, () => {
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

          yield* _(timestamp, RefSubject.set("asdf"))

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

          yield* _(id, RefSubject.set(""))

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

          yield* _(id, RefSubject.set("abcdefghijklmnopqrstuvwxyx"))

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

          yield* _(timestamp, RefSubject.set(date.toISOString()))

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

          yield* _(timestamp, RefSubject.set(date.toISOString()))

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

          yield* _(a, RefSubject.set(42))
          yield* _(b, RefSubject.set(false))

          deepStrictEqual(yield* _(form), { quux: { a: 42, b: false } })
        }).pipe(Effect.scoped)

        await Effect.runPromise(test)
      })
    })

    describe(Form.deriveInput, () => {
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

      const makeFooForm = Form.deriveInput(Foo)

      it("allows deriving form state from a source", async () => {
        const test = Effect.gen(function*(_) {
          const form = yield* _(makeFooForm(Effect.succeed(initialFooInput)))
          const id = form.get("id")
          const timestamp = form.get("timestamp")

          deepStrictEqual(yield* _(form), initialFooInput)
          deepStrictEqual(yield* _(form.decoded), initialFooOutput)

          yield* _(timestamp, RefSubject.set("asdf"))

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

          yield* _(id, RefSubject.set(""))

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

          yield* _(id, RefSubject.set("abcdefghijklmnopqrstuvwxyx"))

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
          const ref = yield* _(RefSubject.of(initialFooInput))
          const form = yield* _(makeFooForm(ref))
          const timestamp = form.get("timestamp")

          deepStrictEqual(yield* _(form), initialFooInput)
          deepStrictEqual(yield* _(form.decoded), initialFooOutput)

          const date = new Date()
          const dateString = date.toISOString()

          yield* _(timestamp, RefSubject.set(dateString))

          deepStrictEqual(yield* _(timestamp), dateString)
          deepStrictEqual(yield* _(ref), initialFooInput)

          yield* _(form.persist)

          deepStrictEqual(yield* _(ref), { ...initialFooInput, timestamp: dateString })
        }).pipe(Effect.scoped, Effect.timed)

        const [duration] = await Effect.runPromise(test)

        console.log("RefSubject.persist", duration.toString())
      })

      it("allows persisting form state to a RefSubject from the context", async () => {
        const ref = RefSubject.tagged<FooInput>()("TestRef")

        const test = Effect.gen(function*(_) {
          const form = yield* _(makeFooForm(ref))

          const timestamp = form.get("timestamp")

          deepStrictEqual(yield* _(form), initialFooInput)
          deepStrictEqual(yield* _(form.decoded), initialFooOutput)

          const date = new Date()

          yield* _(timestamp, RefSubject.set(date.toISOString()))

          deepStrictEqual(yield* _(timestamp), date.toISOString())
          deepStrictEqual(yield* _(ref), initialFooInput)

          yield* _(form.persist)

          deepStrictEqual(yield* _(ref), { ...initialFooInput, timestamp: date.toISOString() })
        }).pipe(Effect.provide(ref.make(Effect.succeed(initialFooInput))), Effect.scoped)

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

          yield* _(a, RefSubject.set(42))
          yield* _(b, RefSubject.set(false))

          deepStrictEqual(yield* _(form), { quux: { a: 42, b: false } })
        }).pipe(Effect.scoped)

        await Effect.runPromise(test)
      })
    })
  })
})
