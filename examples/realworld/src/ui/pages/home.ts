import { Link } from "@typed/core"
import * as Fx from "@typed/fx"
import * as RefArray from "@typed/fx/RefArray"
import * as RefSubject from "@typed/fx/RefSubject"
import { Articles, Tags } from "@typed/realworld/services"
import { GetArticlesInput } from "@typed/realworld/services/GetArticles"
import { ArticlePreview } from "@typed/realworld/ui/components/ArticlePreview"
import { NavLink } from "@typed/realworld/ui/components/NavLink"
import * as Route from "@typed/route"
import { html, many } from "@typed/template"
import { usePagination } from "../components/Pagination"

const pageSize = 20

export const route = Route.home.pipe(
  Route.concat(
    Route.queryParams({
      tag: Route.param("tag").optional(),
      author: Route.param("author").optional(),
      favorited: Route.param("favorited").optional(),
      page: Route.integer("page").optional()
    })
  ),
  Route.transform(
    GetArticlesInput,
    (x) => ({ ...x, limit: String(pageSize), offset: String(((x.page ?? 1) - 1) * pageSize) }),
    (x) => ({ ...x, page: x.offset ? Math.ceil(Number(x.offset) / pageSize) : 1 })
  )
)

export const main = (
  params: RefSubject.RefSubject<Route.Route.Type<typeof route>>
) =>
  Fx.gen(function*(_) {
    const feed = RefSubject.mapEffect(params, Articles.list)
    const { articles, articlesCount } = RefSubject.proxy(feed)
    const tagsList = yield* _(RefArray.make(Tags.get()))
    const pagination = usePagination(pageSize, articlesCount)

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

            ${pagination.view}
          </div>

          <div class="col-md-3">
            <div class="sidebar">
              <p>Popular Tags</p>

              <div class="tag-list">
                ${
      many(
        tagsList,
        (t) => t,
        (t) =>
          Link(
            {
              to: RefSubject.map(t, (t) => `/?tag=${t}`),
              className: "tag-pill tag-default",
              relative: false
            },
            t
          )
      )
    }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`
  })
