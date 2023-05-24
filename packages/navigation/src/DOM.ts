// import * as Effect from '@effect/io/Effect'
// import * as Layer from '@effect/io/Layer'
// import { Location, History, Window } from '@typed/dom'
// import { RefSubject, makeRef } from '@typed/fx'

// import { Destination, Navigation } from './Navigation.js'

// export const dom: Layer.Layer<Window | Location | History, never, Navigation> = Navigation.layer(
//   Effect.gen(function* ($) {
//     const window = yield* $(Window)
//     const location = yield* $(Location)
//     const history = yield* $(History)
//     const initial: Destination = {
//       key: history.state?.key || 'default',
//       url: location.href,
//       state: history.state?.state,
//     }
//     const entries = yield* $(makeRef(Effect.succeed([initial])))
//     const index = yield* $(makeRef(Effect.succeed(0)))
//     const canGoBack = index.map((i) => i > 0)
//     const back = Effect.gen(function* ($) {
//       const i = yield* $(index.update((i) => Math.max(i - 1, 0)))
//       const e = yield* $(entries)

//       history.back()

//       return e[i]
//     })
//     const canGoForward = RefSubject.tuple(index, entries).map(
//       ([i, entries]) => i < entries.length - 1,
//     )
//     const forward = Effect.gen(function* ($) {
//       const e = yield* $(entries)
//       const i = yield* $(index.update((i) => Math.min(i + 1, e.length - 1)))
//       history.forward()
//       return e[i]
//     })
//     const reload = Effect.gen(function* ($) {
//       const i = yield* $(index.get)
//       const e = yield* $(entries)
//       const entry = e[i]

//       location.reload()

//       return entry
//     })

//     const navigation: Navigation = {
//       entries,
//       canGoBack,
//       back,
//       canGoForward,
//       forward,
//       reload,
//     }

//     return navigation
//   }),
// )
