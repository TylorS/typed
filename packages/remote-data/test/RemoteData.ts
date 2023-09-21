import { ok } from "assert"

import * as Either from "@effect/data/Either"
import * as Equal from "@effect/data/Equal"
import * as Cause from "@effect/io/Cause"
import * as Effect from "@effect/io/Effect"
import { describe, expect, it } from "vitest"

import * as RemoteData from "@typed/remote-data"

describe("RemoteData", () => {
  describe("Subtype of Effect", () => {
    describe(RemoteData.succeed.name, () => {
      it("returns provided a value", async () => {
        const test = RemoteData.succeed(1)

        expect(await Effect.runPromise(test)).toEqual(1)
      })
    })

    describe(RemoteData.fail.name, () => {
      it("returns the expected error", async () => {
        const test = RemoteData.fail(1).pipe(Effect.either)

        expect(await Effect.runPromise(test)).toEqual(Either.left(1))
      })
    })

    describe("NoData", () => {
      it("returns Cause.NoSuchElementException", async () => {
        const test = RemoteData.noData.pipe(Effect.either)

        expect(await Effect.runPromise(test)).toEqual(Either.left(Cause.NoSuchElementException()))
      })
    })

    describe("Loading", () => {
      it("returns LoadingException", async () => {
        const test = RemoteData.loading.pipe(Effect.either)

        expect(await Effect.runPromise(test)).toEqual(Either.left(RemoteData.LoadingException()))
      })
    })
  })

  describe("equality", () => {
    const testCases: Array<[
      RemoteData.RemoteData<number, number>,
      RemoteData.RemoteData<number, number>,
      boolean
    ]> = [
      [RemoteData.succeed(1), RemoteData.succeed(1), true],
      [RemoteData.succeed(1), RemoteData.succeed(2), false],
      [RemoteData.fail(1), RemoteData.fail(1), true],
      [RemoteData.fail(1), RemoteData.fail(2), false],
      [RemoteData.noData, RemoteData.noData, true],
      [RemoteData.loading, RemoteData.loading, true],
      [RemoteData.succeed(1), RemoteData.fail(1), false],
      [RemoteData.succeed(1), RemoteData.noData, false],
      [RemoteData.succeed(1), RemoteData.loading, false],
      [RemoteData.fail(1), RemoteData.noData, false],
      [RemoteData.fail(1), RemoteData.loading, false],
      [RemoteData.succeed(1, true), RemoteData.succeed(1, false), false],
      [RemoteData.fail(1, true), RemoteData.fail(1, true), true],
      [RemoteData.fail(1, true), RemoteData.fail(1, false), false]
    ]

    testCases.forEach(([a, b, expected]) => {
      it(`${a} === ${b} => ${expected}`, () => {
        expect(Equal.equals(a, b)).toEqual(expected)
      })
    })
  })

  describe(RemoteData.map.name, () => {
    it("allows transforming a success value", () => {
      const test = RemoteData.succeed(1).pipe(RemoteData.map((n) => n + 1))

      ok(Equal.equals(test, RemoteData.succeed(2)))
    })
  })

  describe(RemoteData.mapError.name, () => {
    it("allows transforming a failure value", () => {
      const test = RemoteData.fail(1).pipe(RemoteData.mapError((n) => n + 1))

      ok(Equal.equals(test, RemoteData.fail(2)))
    })
  })

  describe(RemoteData.flatMap.name, () => {
    it("allows transforming a success value", () => {
      const test = RemoteData.succeed(1).pipe(RemoteData.flatMap((n) => RemoteData.succeed(n + 1)))

      ok(Equal.equals(test, RemoteData.succeed(2)))
    })

    it("does not transform a failure case", () => {
      const test = RemoteData.fail(1).pipe(
        RemoteData.flatMap((n: number) => RemoteData.succeed(n + 1))
      )

      ok(Equal.equals(test, RemoteData.fail(1)))
    })

    it("does not transform a noData case", () => {
      const test = RemoteData.noData.pipe(
        RemoteData.flatMap((n: number) => RemoteData.succeed(n + 1))
      )

      ok(Equal.equals(test, RemoteData.noData))
    })

    it("does not transform a loading case", () => {
      const test = RemoteData.loading.pipe(
        RemoteData.flatMap((n: number) => RemoteData.succeed(n + 1))
      )

      ok(Equal.equals(test, RemoteData.loading))
    })
  })

  describe(RemoteData.zip.name, () => {
    it("favors noData over success and loading", () => {
      ok(Equal.equals(RemoteData.zip(RemoteData.noData, RemoteData.succeed(1)), RemoteData.noData))
      ok(Equal.equals(RemoteData.zip(RemoteData.succeed(1), RemoteData.noData), RemoteData.noData))
      ok(Equal.equals(RemoteData.zip(RemoteData.noData, RemoteData.loading), RemoteData.noData))
    })

    it("favors loading over success", () => {
      ok(
        Equal.equals(RemoteData.zip(RemoteData.loading, RemoteData.succeed(1)), RemoteData.loading)
      )
      ok(
        Equal.equals(RemoteData.zip(RemoteData.succeed(1), RemoteData.loading), RemoteData.loading)
      )
    })

    it("combines failures", () => {
      ok(
        Equal.equals(
          RemoteData.zip(RemoteData.fail(1), RemoteData.fail(2)),
          RemoteData.failCause(Cause.sequential(Cause.fail(1), Cause.fail(2)))
        )
      )
    })
  })

  describe(RemoteData.unwrapEffect.name, () => {
    it("converts Effect<R, Cause.NoSuchElementException, A> -> Effect<R, never, RemoteData<never, A>>", async () => {
      const test = Effect.succeedNone.pipe(Effect.flatten, RemoteData.unwrapEffect)

      expect(await Effect.runPromise(test)).toEqual(RemoteData.noData)
    })

    it("converts Effect<R, LoadingException, A> ->  Effect<R, never, RemoteData<never, A>>", async () => {
      const test = Effect.fail(RemoteData.LoadingException()).pipe(RemoteData.unwrapEffect)

      expect(await Effect.runPromise(test)).toEqual(RemoteData.loading)
    })

    it("converts Effect<R, E, A> ->  Effect<R, never, RemoteData<E, A>>", async () => {
      ok(
        Equal.equals(
          await Effect.fail(1).pipe(RemoteData.unwrapEffect, Effect.runPromise),
          RemoteData.failCause(Cause.fail(1))
        )
      )

      ok(
        Equal.equals(
          await Effect.succeed(1).pipe(RemoteData.unwrapEffect, Effect.runPromise),
          RemoteData.succeed(1)
        )
      )
    })

    it("converts empty Cause to noData", async () => {
      expect(
        await Effect.failCause(Cause.empty).pipe(RemoteData.unwrapEffect, Effect.runPromise)
      ).toEqual(RemoteData.noData)

      expect(
        await Effect.failCause(Cause.sequential(Cause.empty, Cause.empty)).pipe(
          RemoteData.unwrapEffect,
          Effect.runPromise
        )
      ).toEqual(RemoteData.noData)

      expect(
        await Effect.failCause(Cause.parallel(Cause.empty, Cause.empty)).pipe(
          RemoteData.unwrapEffect,
          Effect.runPromise
        )
      ).toEqual(RemoteData.noData)
    })
  })
})
