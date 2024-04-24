import { Articles, Tags } from "@/services"
import { defaultGetArticlesInput } from "@/services/GetArticles"
import { ArticlePreview } from "@/ui/components/ArticlePreview"
import { NavLink } from "@/ui/components/NavLink"
import * as Fx from "@typed/fx"
import * as RefArray from "@typed/fx/RefArray"
import * as RefSubject from "@typed/fx/RefSubject"
import * as Navigation from "@typed/navigation"
import * as Route from "@typed/route"
import { EventHandler, html, many } from "@typed/template"
import { Effect } from "effect"

export const route = Route.home

// const parseQueryParams = (params: URLSearchParams) =>
//   pipe(
//     {
//       tag: params.get("tag"),
//       author: params.get("author"),
//       favorited: params.get("favorited"),
//       limit: params.get("limit"),
//       offset: params.get("offset")
//     },
//     Schema.decode(GetArticlesInput),
//     Effect.catchAll(() => Effect.succeed(defaultGetArticlesInput))
//   )

export const main = Fx.gen(function*(_) {
  const articles = yield* _(Articles.list(defaultGetArticlesInput))
  const tagsList = yield* _(RefArray.make(Tags.get()))

  return html`<div class="home-page">
  <div class="banner">
    <div class="container">
      <h1 class="logo-font">conduit</h1>
      <p>A place to share your knowledge.</p>
    </div>
  </div>

  <div class="container page">
    <div class="row">
      <div class="col-md-9">
        <div class="feed-toggle">
          <ul class="outline-active nav nav-pills">
            <li class="nav-item">
              ${NavLink("Global Feed", route)}
            </li>
          </ul>
        </div>

        ${articles.map(ArticlePreview)}

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
  } 
          </div>
        </div>
      </div>
    </div>
  </div>
</div>`
})
