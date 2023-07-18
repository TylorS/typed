import { SchemaStorage, Storage } from '@typed/dom'
import * as Schema from '@effect/schema/Schema'
import * as Effect from '@effect/io/Effect'

const storage = SchemaStorage({
  foo: Schema.string,
  bar: Schema.NumberFromString,
})

const program = Effect.gen(function* (_) {
  yield* _(storage.set('foo', 'hello world'))
  yield* _(storage.set('bar', 42))

  const foo = yield* _(storage.get('foo'), Effect.flatten)
  const bar = yield* _(storage.get('bar'), Effect.flatten)

  return foo.length + bar
})

const main = program.pipe(
  Storage.provide(localStorage),
)

Effect.runPromise(main).then(console.log, console.error)
