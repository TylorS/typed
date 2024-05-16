import type { Schema } from "@effect/schema"
import { Fx, html, Link, many, RefSubject, Router } from "@typed/core"
import { Username } from "@typed/realworld/model"
import { Articles, Profiles } from "@typed/realworld/services"
import { defaultGetArticlesInput } from "@typed/realworld/services/GetArticles"
import { ArticlePreview } from "@typed/realworld/ui/components/ArticlePreview"
import * as Route from "@typed/route"
import { CurrentSearchParams } from "@typed/router"
import { Effect, Option } from "effect"
import { NavLink } from "../components/NavLink"

export const route = Route.literal("profile").concat(Route.paramWithSchema("username", Username))

const favoritesRoute = Route.literal("favorites")
const pageSize = 5

export type Params = Schema.Schema.Type<typeof route.schema>

export const main = (params: RefSubject.RefSubject<Params>) =>
  Fx.gen(function*(_) {
    const ref = yield* _(RefSubject.make(RefSubject.mapEffect(params, (_) => Profiles.get(_.username))))
    const profile = RefSubject.proxy(ref)
    const profileImage = RefSubject.map(profile.image, Option.getOrElse(() => ""))
    const profileBio = RefSubject.map(profile.bio, Option.getOrElse(() => ""))
    const currentPage = RefSubject.map(CurrentSearchParams, (params) => Number(params.page ?? 1))
    const articlesAndCount = RefSubject.mapEffect(
      RefSubject.tuple([Router.isActive(favoritesRoute), profile.username, currentPage]),
      ([favorites, username, page]) =>
        Articles.list({
          ...defaultGetArticlesInput,
          limit: Option.some(pageSize),
          offset: Option.some((page - 1) * pageSize),
          ...(favorites
            ? { favorited: Option.some(username) }
            : { author: Option.some(username) })
        })
    )
    const { articles, articlesCount } = RefSubject.proxy(articlesAndCount)
    const pages = RefSubject.map(articlesCount, (count) =>
      Array.from({ length: Math.ceil(count / pageSize) }, (_, i) => i + 1))

    const followOrUnfollow = Effect.gen(function*() {
      const current = yield* ref
      const updated = current.following
        ? yield* Profiles.unfollow(current.username)
        : yield* Profiles.follow(current.username)
      yield* RefSubject.set(ref, updated)
    })

    return html`<div class="profile-page">
      <div class="user-info">
        <div class="container">
          <div class="row">
            <div class="col-xs-12 col-md-10 offset-md-1">
              <img src="${profileImage}" class="user-img" />
              <h4>${profile.username}</h4>
              <p>${profileBio}</p>
              <button
                class="btn btn-sm btn-outline-secondary action-btn"
                onclick=${followOrUnfollow}
              >
                <i class="ion-plus-round" style="margin-right: 4px"></i>
                ${RefSubject.when(profile.following, { onFalse: "Follow", onTrue: "Unfollow" })}
                ${profile.username}
              </button>
              ${
      Link(
        {
          to: "/settings",
          relative: false
        },
        html`<button
                  class="btn btn-sm btn-outline-secondary action-btn"
                  style="margin-right: 4px"
                >
                  <i class="ion-gear-a" style="margin-right: 4px"></i>
                  Edit Profile Settings
                </button>`
      )
    }
            </div>
          </div>
        </div>
      </div>

      <div class="container">
        <div class="row">
          <div class="col-xs-12 col-md-10 offset-md-1">
            <div class="articles-toggle">
              <ul class="outline-active nav nav-pills">
                ${
      NavLink({
        content: `My Articles`,
        route: Route.home,
        relative: true
      })
    }
                ${
      NavLink({
        content: `Favorited Articles`,
        route: favoritesRoute,
        relative: true
      })
    }
              </ul>
            </div>

            ${
      many(articles, (a) => a.id, ArticlePreview)
    }

            <ul class="pagination">
              ${many(pages, (p) => p, (page) => renderPagination(currentPage, page))}
            </ul>
          </div>
        </div>
      </div>
    </div>`
  })

function renderPagination<R>(
  currentPage: RefSubject.Computed<number, never, R>,
  page: RefSubject.Computed<number>
) {
  const activeClassName = RefSubject.tuple([currentPage, page]).pipe(
    RefSubject.map(([current, p]) => current === p ? "active" : "")
  )
  const to = RefSubject.map(page, (p) => `?page=${p}`)
  return html`<li class="page-item ${activeClassName}">
    ${Link({ to, className: "page-link" }, page)}
  </li>`
}
