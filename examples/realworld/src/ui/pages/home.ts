import * as Fx from "@typed/fx"
import * as RefArray from "@typed/fx/RefArray"
import * as RefSubject from "@typed/fx/RefSubject"
import * as Navigation from "@typed/navigation"
import { Articles, Tags } from "@typed/realworld/services"
import { GetArticlesInput } from "@typed/realworld/services/GetArticles"
import { ArticlePreview } from "@typed/realworld/ui/components/ArticlePreview"
import { NavLink } from "@typed/realworld/ui/components/NavLink"
import * as Route from "@typed/route"
import { EventHandler, html, many } from "@typed/template"
import { Effect, identity } from "effect"

export const route = Route.home.pipe(
  Route.concat(
    Route.queryParams({
      tag: Route.param("tag").optional(),
      author: Route.param("author").optional(),
      favorited: Route.param("favorited").optional(),
      limit: Route.param("limit").optional(),
      offset: Route.param("offset").optional()
    })
  ),
  Route.transform(GetArticlesInput, identity, identity)
)

export const main = (
  params: RefSubject.RefSubject<Route.Route.Type<typeof route>>
) =>
  Fx.gen(function*(_) {
    const articlesAndCount = RefSubject.mapEffect(params, Articles.list)
    const { articles } = RefSubject.proxy(articlesAndCount)
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
                ${NavLink({ content: "Global Feed", route }, {})}
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
          return html`<a
                      href="${href}"
                      class="tag-pill tag-default"
                      onclick="${onclick}"
                    >
                      ${t}
                    </a>`
        }
      ).pipe(Fx.switchMapCause(() => Fx.null))
    }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`
  })
