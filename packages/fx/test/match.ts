import * as Fx from "@typed/fx/Fx"
import * as Guard from "@typed/fx/Guard"
import * as Match from "@typed/fx/Match"
import { deepStrictEqual } from "assert"
import { Effect, Option } from "effect"

describe(import.meta.url, () => {
  const values = Fx.mergeAll([
    Fx.succeed("bar"),
    Fx.delay(Fx.succeed("foo"), 10),
    Fx.delay(Fx.succeed("baz"), 20)
  ])

  const fooGuard = Guard.liftPredicate((s): s is "foo" => s === "foo")
  const barGuard = Guard.liftPredicate((s): s is "bar" => s === "bar")

  it("TypeMatcher", async () => {
    const matcher = Match.type<string>().to(fooGuard, "hello, foo!").to(barGuard, "hello, bar!")
    const test = Effect.scoped(Fx.toReadonlyArray(matcher.run(values)))
    const actual = await Effect.runPromise(test)

    deepStrictEqual(actual, [
      Option.some("hello, bar!"),
      Option.some("hello, foo!"),
      Option.none()
    ])
  })

  it("ValueMatcher", async () => {
    const matcher = Match.value(values).to(fooGuard, "hello, foo!").to(barGuard, "hello, bar!")
    const test = Effect.scoped(Fx.toReadonlyArray(matcher))
    const actual = await Effect.runPromise(test)

    deepStrictEqual(actual, [
      Option.some("hello, bar!"),
      Option.some("hello, foo!"),
      Option.none()
    ])
  })
})
