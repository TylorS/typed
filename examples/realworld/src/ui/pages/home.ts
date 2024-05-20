import { Link } from "@typed/core"
import * as Fx from "@typed/fx"
import * as RefArray from "@typed/fx/RefArray"
import * as RefSubject from "@typed/fx/RefSubject"
import { ArticleTag } from "@typed/realworld/model"
import { Articles, isAuthenticated, Tags } from "@typed/realworld/services"
import type { GetArticlesInput } from "@typed/realworld/services/GetArticles"
import { defaultGetArticlesInput } from "@typed/realworld/services/GetArticles"
import * as Routes from "@typed/realworld/ui/common/routes"
import { ArticlePreview } from "@typed/realworld/ui/components/ArticlePreview"
import { NavLink } from "@typed/realworld/ui/components/NavLink"
import { Pagination } from "@typed/realworld/ui/components/Pagination"
import type * as Route from "@typed/route"
import { html, many } from "@typed/template"
import { Option } from "effect"

const pageSize = 20

export const route = Routes.home

export const main = (
  params: RefSubject.RefSubject<Route.Route.Type<typeof route>>
) =>
  Fx.gen(function*(_) {
    const tab = yield* RefSubject.make<"global" | "feed">(
      RefSubject.map(params, (p) => p.myFeed ? "feed" : "global")
    )
    const feed = RefSubject.mapEffect(
      RefSubject.struct({ params, tab }),
      ({ params, tab }) => {
        const input: GetArticlesInput = {
          ...defaultGetArticlesInput,
          tag: Option.fromNullable(params.tag).pipe(Option.map(ArticleTag.make)),
          limit: Option.some(pageSize),
          offset: Option.some(pageSize * (params.page ?? 1 - 1))
        }

        return tab === "global"
          ? Articles.list(input)
          : Articles.feed(input)
      }
    )
    const { articles, articlesCount } = RefSubject.proxy(feed)
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
                ${NavLink({ content: "Global Feed", route, isActive: RefSubject.map(tab, (t) => t === "global") }, {})}
                ${
      Fx.if(isAuthenticated, {
        onFalse: Fx.null,
        onTrue: NavLink({
          content: "My Feed",
          route,
          isActive: RefSubject.map(tab, (t) => t === "feed")
        }, {
          myFeed: "true"
        })
      })
    }
              </ul>
            </div>

            ${many(articles, (a) => a.id, ArticlePreview)}

            ${Pagination(pageSize, articlesCount)}
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
              to: RefSubject.map(t, (tag) => Routes.home.interpolate({ tag })),
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
