import * as Fx from "@typed/fx/Fx"
import { benchmark } from "@typed/fx/test/helpers/benchmark"
import { describe } from "vitest"

describe(__filename, () => {
  benchmark("Fx")
    .test(
      "Fx.succeedAll([1, 2, 3]) |> Fx.drain",
      Fx.succeedAll([1, 2, 3]).pipe(Fx.drain)
    ).test(
      "Fx.succeedAll([0..1000]) |> Fx.drain",
      Fx.succeedAll(Array.from({ length: 1000 }, (_, i) => i)).pipe(Fx.drain)
    )
    .run({ iterations: 10_000, timeout: 30_000 })
})
