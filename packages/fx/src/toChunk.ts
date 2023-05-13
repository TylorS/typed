import type { Chunk } from "@effect/data/Chunk"
import {
  append,
  empty,
  fromIterable,
  of,
  unsafeFromArray,
} from "@effect/data/Chunk"
import type { Effect } from "@effect/io/Effect"
import { gen, map, succeed } from "@effect/io/Effect"
import type { Scope } from "@effect/io/Scope"
import { Empty } from "@typed/fx/empty"
import { FromArray } from "@typed/fx/fromArray"
import { FromEffect } from "@typed/fx/fromEffect"
import { FromIterable } from "@typed/fx/fromIterable"

import type { Fx } from "./Fx"
import { observeSync } from "./observe"

export function toChunk<R, E, A>(
  fx: Fx<R, E, A>,
): Effect<R | Scope, E, Chunk<A>> {
  if (fx.instanceof(Empty)) {
    return succeed(empty<A>()).traced(fx.trace)
  } else if (fx.instanceof(FromEffect)) {
    return map(fx.effect as Effect<R, E, A>, of).traced(fx.trace)
  } else if (fx.instanceof(FromArray)) {
    return succeed(unsafeFromArray(fx.iterable as Array<A>)).traced(fx.trace)
  } else if (fx.instanceof(FromIterable)) {
    return succeed(fromIterable(fx.iterable as Iterable<A>)).traced(fx.trace)
  } else {
    return gen(function* ($) {
      let chunk = empty<A>()

      yield* $(observeSync(fx, (a) => (chunk = append(chunk, a))))

      return chunk
    })
  }
}
