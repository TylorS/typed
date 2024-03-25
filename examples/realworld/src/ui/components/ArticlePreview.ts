import type { Article } from "@/model"
import { Fx, Navigation, RefSubject } from "@typed/core"
import type { CurrentEnvironment } from "@typed/environment"
import { html, many } from "@typed/template"
import { Effect, Option } from "effect"

export function ArticlePreview(article: RefSubject.RefSubject<Article, never, CurrentEnvironment>) {
  article = RefSubject.takeOneIfNotDomEnvironment(article)
  const userProfileHref = RefSubject.map(article, (a) => `/profile/${a.author.username}`)
  const userProfileImage = RefSubject.map(article, (a) => Option.getOrElse(a.author.image, () => ""))
  const userProfileName = RefSubject.map(article, (a) => a.author.username)
  const createdDate = RefSubject.map(article, (a) => a.createdAt.toISOString())
  const favoritesCount = RefSubject.map(article, (a) => a.favoritesCount)
  const tagList = RefSubject.map(article, (a) => a.tagList)
  const title = RefSubject.map(article, (a) => a.title)
  const description = RefSubject.map(article, (a) => a.description)
  const onclickProfile = Effect.flatMap(userProfileHref, Navigation.navigate)
  const articleHref = RefSubject.map(article, (a) => `/article/${a.slug}`)
  const onclickArticle = Effect.flatMap(articleHref, Navigation.navigate)

  return html`<div class="article-preview">
          <div class="article-meta">
            <a href="${userProfileHref}" onclick=${onclickProfile}><img src="${userProfileImage}" /></a>
            <div class="info">
              <a href="${userProfileHref}" onclick=${onclickProfile} class="author">${userProfileName}</a>
              <span class="date">${createdDate}</span>
            </div>
            <button class="btn btn-outline-primary btn-sm pull-xs-right">
              <i class="ion-heart"></i> ${favoritesCount}
            </button>
          </div>
          <a href="${articleHref}" onclick=${onclickArticle} class="preview-link">
            <h1>${title}</h1>
            <p>${description}</p>
            <span>Read more...</span>
            <ul class="tag-list">
              ${
    many(
      tagList,
      (t) => t,
      (t) => html`<li class="tag-default tag-pill tag-outline">${t}</li>`
    ).pipe(Fx.switchMapCause(() => Fx.null))
  }

            </ul>
          </a>
        </div>`
}
