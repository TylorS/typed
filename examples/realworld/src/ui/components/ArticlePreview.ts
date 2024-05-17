import { Fx, Link, RefSubject } from "@typed/core"
import { type Article, Image } from "@typed/realworld/model"
import { html, many } from "@typed/template"
import { Effect, Option } from "effect"
import { Articles, isAuthenticated } from "../../services"
import { formatMonthDayYear } from "../common/date"

const FALLBACK_IMAGE = Image.make("https://api.realworld.io/images/demo-avatar.png")

export function ArticlePreview(ref: RefSubject.RefSubject<Article>) {
  const article = RefSubject.proxy(ref)
  const author = RefSubject.proxy(article.author)
  const articleHref = RefSubject.map(article.slug, (slug) => `/article/${slug}`)
  const userProfileHref = RefSubject.map(author.username, (username) => `/profile/${username}`)
  const userProfileImage = RefSubject.map(author.image, Option.getOrElse(() => FALLBACK_IMAGE))
  const createdDate = RefSubject.map(article.createdAt, formatMonthDayYear)

  const favoriteOrUnfavorite = Effect.gen(function*() {
    const slug = yield* article.slug
    const favorited = yield* article.favorited
    const updated = yield* favorited ? Articles.unfavorite(slug) : Articles.favorite(slug)
    yield* RefSubject.set(ref, updated)
  })

  return html`<div class="article-preview">
    <div class="article-meta">
      ${Link({ to: userProfileHref, relative: false }, html`<img src="${userProfileImage}" />`)}
      <div class="info">
        ${Link({ to: userProfileHref, className: "author", relative: false }, author.username)}
        <span class="date">${createdDate}</span>
      </div>
      ${
    Fx.if(isAuthenticated, {
      onFalse: Fx.null,
      onTrue: html`<button class="btn btn-outline-primary btn-sm pull-xs-right" onclick=${favoriteOrUnfavorite}>
        <i class="ion-heart"></i>&nbsp;${article.favoritesCount}
      </button>`
    })
  }
      
    </div>
    ${
    Link(
      { to: articleHref, className: "preview-link", relative: false },
      html`<h1>${article.title}</h1>
        <p>${article.description}</p>
        <span>Read more...</span>
        <ul class="tag-list">
          ${
        many(
          article.tagList,
          (t) => t,
          (t) => html`<li class="tag-default tag-pill tag-outline">${t}</li>`
        )
      }
        </ul>`
    )
  }
  </div>`
}
