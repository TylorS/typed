import { Articles, isAuthenticated, Tags } from "@/services"
import { defaultGetArticlesInput, GetArticlesInput } from "@/services/GetArticles"
import { ArticlePreview } from "@/ui/components/ArticlePreview"
import { NavLink } from "@/ui/components/NavLink"
import { Schema } from "@effect/schema"
import { Fx, Navigation, RefArray, RefSubject } from "@typed/core"
import * as Route from "@typed/route"
import { EventHandler, html, many } from "@typed/template"
import { Effect, pipe } from "effect"

export const route = Route.fromPath("/", { match: { end: true } })

const parseQueryParams = (params: URLSearchParams) =>
  pipe(
    {
      tag: params.get("tag"),
      author: params.get("author"),
      favorited: params.get("favorited"),
      limit: params.get("limit"),
      offset: params.get("offset")
    },
    Schema.decode(GetArticlesInput),
    Effect.catchAll(() => Effect.succeed(defaultGetArticlesInput))
  )

export const main = Fx.gen(function*(_) {
  const params = RefSubject.takeOneIfNotDomEnvironment(
    yield* _(
      Navigation.CurrentEntry,
      Fx.mapEffect((e) => parseQueryParams(e.url.searchParams)),
      (_) => RefSubject.make(_)
    )
  )

  const articles = RefSubject.mapEffect(params, Articles.list)
  const tagsList = RefSubject.takeOneIfNotDomEnvironment(yield* _(RefArray.make(Tags.get())))

  return html`<div class="home-page">
    <div class="banner">
      <div class="container">
        <h1 class="logo-font">conduit</h1>
        <p>A place to share your knowledge.</p>
      </div>
    </div>
  </div>

<div class="container page">
  <div class="row">
    <div class="col-md-9">
      <div class="feed-toggle">
        <ul class="outline-active nav nav-pills">
            ${
    Fx.if(isAuthenticated, {
      onFalse: Fx.null,
      onTrue: NavLink("Your Feed", route)
    })
  }
          ${NavLink("Global Feed", route)}
        </ul>
      </div>

      ${many(articles, (a) => a.id, ArticlePreview)}

      <ul class="pagination">
        <li class="page-item active">
          <a class="page-link" href="">1</a>
        </li>
        <li class="page-item">
          <a class="page-link" href="">2</a>
        </li>
      </ul>
    </div>

    <div class="col-md-3">
      <div class="sidebar">
        <p>Popular Tags</p>

        <div class="tag-list">
            ${
    many(
      tagsList,
      (t) => t,
      (t) => {
        const href = RefSubject.map(t, (t) => `/?tag=${t}`)
        const onclick = EventHandler.preventDefault(() => Effect.flatMap(href, Navigation.navigate))
        return html`<a href="${href}" class="tag-pill tag-default" onclick="${onclick}">${t}</a>`
      }
    ).pipe(
      Fx.switchMapCause(() => Fx.null)
    )
  }        </div>
      </div>
    </div>
  </div>
</div>`
})
