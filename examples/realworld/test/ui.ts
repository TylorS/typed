import { describe, it } from "@typed/template/Vitest"
import { testHtmlString, testHydrate } from "@typed/template/Test"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import { GetArticles } from "@/services/GetArticles"
import { GetTags } from "@/services/GetTags"
import { CurrentUser } from "@/services/CurrentUser"
import { layout } from '@/ui/layout'
import * as home from "@/ui/pages/home"
import * as AsyncData from "@typed/async-data/AsyncData"
import { Route, server } from "@typed/core"
import * as Navigation from "@typed/navigation"
import { withCurrentRoute } from "@typed/router"
import { toHtml } from "@typed/wire"

describe("UI", () => {
  const homePage = layout(home.main)
  const homePageTestLayer = Layer.mergeAll(
    GetArticles.implement(() => Effect.succeed([])),
    GetTags.implement(() => Effect.succeed([])),
    CurrentUser.make(Effect.succeed(AsyncData.noData()), { take: 1 })
  )

  it("renders to HTML", () => Effect.gen(function*(_) {
    const html = yield* _(testHtmlString(homePage))
    expect(html).toEqual(`<nav class="navbar navbar-light"><div class="container"><a class="navbar-brand" href="/">conduit</a><ul class="nav navbar-nav pull-xs-right"><li class="nav-item"><a class="nav-link active" href="/"><!--text-->Home<!--hole3--></a></li><!--hole0-->
      <li class="nav-item"><a class="nav-link" href="/login"><!--text-->Sign in<!--hole3--></a></li><!--hole1-->
      <li class="nav-item"><a class="nav-link" href="/register"><!--text-->Sign up<!--hole3--></a></li><!--hole2--></ul></div></nav><!--hole0--><main><div class="home-page"><div class="banner"><div class="container"><h1 class="logo-font">conduit</h1><p>A place to share your knowledge.</p></div></div><div class="container page"><div class="row"><div class="col-md-9"><div class="feed-toggle"><ul class="outline-active nav nav-pills"><li class="nav-item"><li class="nav-item"><a class="nav-link active" href="/"><!--text-->Global Feed<!--hole3--></a></li><!--hole0--></li></ul></div><!--hole1--><ul class="pagination"><li class="page-item active"><a class="page-link">1</a></li><li class="page-item"><a class="page-link">2</a></li></ul></div><div class="col-md-3"><div class="sidebar"><p>Popular Tags</p><div class="tag-list"><!--hole2--></div></div></div></div></div></div><!--hole1--></main><footer><div class="container"><a href="/" class="logo-font">conduit</a><span class="attribution">An interactive learning project from<a href="https://thinkster.io">Thinkster</a>. Code & design licensed under MIT.</span></div></footer><!--hole2-->`)
  }).pipe(
    Effect.provide(homePageTestLayer),
    Effect.provide(server),
    Effect.provide(Navigation.initialMemory({ url: '/' })),
    withCurrentRoute(Route.home),
  ))


  it("hydrates", () => Effect.gen(function*(_) {
    const { elementRef } = yield* _(testHydrate(homePage, () => {}, ))
    const rendered = yield* _(elementRef)
    console.log(toHtml(rendered))
  }).pipe(
    Effect.provide(homePageTestLayer),
    Effect.provide(server),
    Effect.provide(Navigation.initialMemory({ url: '/' })),
    withCurrentRoute(Route.home),
  ))
})
