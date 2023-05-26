import { flow, pipe } from '@effect/data/Function'
import * as Option from '@effect/data/Option'
import * as Effect from '@effect/io/Effect'
import * as Layer from '@effect/io/Layer'
import { Location, History, Window, Storage, addWindowListener } from '@typed/dom'
import * as Fx from '@typed/fx'

import { Navigation } from './Navigation.js'
import { onHistoryEvent, patchHistory } from './history.js'
import { makeIntent } from './intent.js'
import { NavigationEventJson } from './json.js'
import { makeModel } from './model.js'

export type NavigationServices = Window | Location | History | Storage

export const dom: Layer.Layer<NavigationServices, never, Navigation> = Navigation.layerScoped(
  Effect.gen(function* ($) {
    const model = yield* $(makeModel)
    const intent = makeIntent(model)
    const lock = Effect.unsafeMakeSemaphore(1).withPermits(1)
    const context = yield* $(Effect.context<NavigationServices>())
    const history = yield* $(History)

    const provideLocked = <E, A>(effect: Effect.Effect<NavigationServices, E, A>) =>
      Effect.provideContext(lock(effect), context)

    const navigation: Navigation = {
      entries: model.entries,
      currentEntry: model.currentEntry,
      canGoBack: model.canGoBack,
      back: provideLocked(intent.back(false)),
      canGoForward: model.canGoForward,
      forward: provideLocked(intent.forward(false)),
      reload: provideLocked(intent.reload),
      onNavigation: intent.onNavigation,
      navigate: flow(intent.navigate, provideLocked),
      goTo: flow(intent.goTo, provideLocked),
    }

    const historyEvents = yield* $(patchHistory)

    // Listen to history events and keep track of entries
    yield* $(
      Fx.mergeAll(
        pipe(
          historyEvents,
          Fx.flatMapEffect((event) => lock(onHistoryEvent(event, intent))),
        ),
        pipe(
          addWindowListener('hashchange', { capture: true }),
          Fx.flatMapEffect((ev) => lock(intent.push(ev.newURL, { state: history.state }, true))),
        ),
        pipe(
          addWindowListener('popstate'),
          Fx.map((ev) => {
            if (!ev.state || !ev.state.event) {
              return Option.none()
            }

            const navigation = ev.state.event as NavigationEventJson

            return Option.some(lock(intent.goTo(navigation.destination.key)))
          }),
          Fx.compact,
          Fx.flattenEffect,
        ),
      ),
      Fx.drain,
      Effect.forkScoped,
    )

    return navigation
  }),
)
