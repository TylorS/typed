import * as Effect from '@effect/io/Effect'
import { setItem, getItem, Storage } from '@typed/dom'
import { catchNoSuchElement } from '@typed/error'

const FOO_KEY = 'foo'
const BAR_KEY = 'bar'

const program = Effect.gen(function* (_) {
  yield* _(setItem(FOO_KEY, 'hello'))
  yield* _(setItem(BAR_KEY, 'world'))

  const foo = yield* _(getItem(FOO_KEY), Effect.flatten) // getItem returns Effect<Storage, never, Option<string>>
  const bar = yield* _(getItem(BAR_KEY), Effect.flatten) // Effect.flatten turns it into Effect<Storage, Cause.NoSuchElementException, string>

  return `${foo} ${bar}!`
})

const main = program.pipe(
  // Provide the storage implementation to use for this effect.
  Storage.provide(localStorage),
  // Or with sessionStorage
  // Storage.provide(sessionStorage),
  // Turns Effect<R, E | Cause.NoSuchElementException, A> back into Effect<R, E, Option<A>>
  catchNoSuchElement,
)

Effect.runPromise(main).then(console.log, console.error)
