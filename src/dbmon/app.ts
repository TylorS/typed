import * as Effect from '@effect/core/io/Effect'
import { millis } from '@tsplus/stdlib/data/Duration'
import { pipe } from '@tsplus/stdlib/data/Function'
import * as Fx from '@typed/fx'

import { Document } from '../DOM/Document.js'
import { RenderContext, drainInto, html } from '../HTML/index.js'

import { Database } from './types.js'

const { renderRate } = Monitoring
const { timeout } = ENV

export const DbMonster = Fx.fromFxGen(function* ($) {
  const databases = yield* $(
    Fx.makeRefSubject<readonly Database[]>(() => ENV.generateData().toArray()),
  )

  const update = Effect.suspendSucceed(() =>
    pipe(
      databases.set(ENV.generateData().toArray()),
      Effect.tap(() => Effect.sync(() => renderRate.ping())),
    ),
  )

  yield* $(pipe(update, Effect.delay(millis(timeout as any)), Effect.forever, Effect.fork))

  return html`<table class="table table-striped latest-data">
    <tbody>
      ${pipe(
        databases,
        Fx.map((dbs) => dbs.map(databaseView)),
      )}
    </tbody>
  </table>`
})

const databaseView = (db: Database) => {
  const { dbname, lastSample } = db
  const { countClassName, nbQueries, topFiveQueries } = lastSample

  return html.simple`<tr>
    <td class="dbname">${dbname}</td>
    <td class="query-count"><span class="${countClassName}">${nbQueries}</span></td>
    ${topFiveQueries.map((q) => {
      const { elapsedClassName, formatElapsed, query } = q

      return html.simple`<td class="${elapsedClassName}">
          <span>${formatElapsed}</span>
          <div class="popover left">
            <div class="popover-content">${query}</div>
            <div class="arrow"></div>
          </div>
        </td>`
    })}
  </tr>`
}

pipe(
  DbMonster,
  drainInto(document.getElementById('app-container') as HTMLElement),
  RenderContext.provide,
  Document.provide(document),
  Effect.unsafeRunAsync,
)
