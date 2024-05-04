import { CurrentUser } from "@realworld/services/CurrentUser"
import type { GetArticlesInput } from "@realworld/services/GetArticles"
import { defaultGetArticlesInput, GetArticles } from "@realworld/services/GetArticles"
import { GetTags } from "@realworld/services/GetTags"
import { layout } from "@realworld/ui/layout"
import * as home from "@realworld/ui/pages/home"
import * as AsyncData from "@typed/async-data/AsyncData"
import { Fx, RefSubject, Route, server } from "@typed/core"
import * as Navigation from "@typed/navigation"
import { withCurrentRoute } from "@typed/router"
import { testHydrate } from "@typed/template/Test"
import { describe, it } from "@typed/template/Vitest"
import { toHtml } from "@typed/wire"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"

describe("UI", () => {
  const homePage = Fx.gen(function*(_) {
    const params = yield* _(RefSubject.of<GetArticlesInput>(defaultGetArticlesInput))
    return layout(home.main(params))
  })
  const homePageTestLayer = Layer.mergeAll(
    GetArticles.implement(() => Effect.succeed({ articles: [], articlesCount: 0 })),
    GetTags.implement(() => Effect.succeed([])),
    CurrentUser.make(Effect.succeed(AsyncData.noData()), { take: 1 })
  )

  it("hydrates", () =>
    Effect.gen(function*(_) {
      const { elementRef } = yield* _(testHydrate(homePage, () => {}))
      const rendered = yield* _(elementRef)
      console.log(toHtml(rendered))
    }).pipe(
      Effect.provide(homePageTestLayer),
      Effect.provide(server),
      Effect.provide(Navigation.initialMemory({ url: "/" })),
      withCurrentRoute(Route.home)
    ))
})
