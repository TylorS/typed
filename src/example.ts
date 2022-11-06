import * as Effect from '@effect/core/io/Effect'
import { millis } from '@tsplus/stdlib/data/Duration'
import { pipe } from '@tsplus/stdlib/data/Function'
import { Tag } from '@tsplus/stdlib/service/Tag'

import { Document } from './DOM/Document.js'
import { EventHandler } from './HTML/EventHandler.js'
import { RenderContext } from './HTML/RenderContext.js'
import { render } from './HTML/render.js'
import { html } from './HTML/tag.js'

const ConsoleTag = Tag<Console>()

const template = (name: string) =>
  html`<h1 onclick=${EventHandler((ev) => Effect.serviceWith(ConsoleTag, (c) => c.log(ev)))}>
    Hello, ${name}!
  </h1>`

const program = pipe(
  Effect.gen(function* ($) {
    const foo = yield* $(template('foo'))
    yield* $(render(document.body, foo))
    yield* $(Effect.sleep(millis((3 * 1000) as any)))
    const bar = yield* $(template('bar'))
    yield* $(render(document.body, bar))
  }),
  RenderContext.provide,
  Effect.provideService(ConsoleTag, console),
  Effect.provideService(Document.Tag, document),
)

Effect.unsafeRunAsync(program)
