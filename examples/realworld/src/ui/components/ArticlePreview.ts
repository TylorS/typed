import type { Article } from "@realworld/model"
import { Navigation } from "@typed/core"
import { EventHandler, html } from "@typed/template"
import { Option } from "effect"

export function ArticlePreview(article: Article) {
  const userProfileHref = `/profile/${article.author.username}`
  const userProfileImage = Option.getOrElse(article.author.image, () => "")
  const userProfileName = article.author.username
  const createdDate = article.createdAt.toISOString()
  const favoritesCount = article.favoritesCount
  const tagList = article.tagList
  const title = article.title
  const description = article.description
  const onclickProfile = Navigation.navigate(userProfileHref)
  const articleHref = `/article/${article.slug}`
  const onclickArticle = Navigation.navigate(articleHref)

  return html`<div class="article-preview">
          <div class="article-meta">
            <a 
              href="${userProfileHref}" 
              onclick="${EventHandler.preventDefault(() => onclickProfile)}"
            >
              <img src="${userProfileImage}" />
            </a>
            <div class="info">
              <a
                href="${userProfileHref}" 
                onclick="${EventHandler.preventDefault(() => onclickProfile)}" class="author"
              >
                ${userProfileName}
              </a>
              <span class="date">${createdDate}</span>
            </div>
            <button class="btn btn-outline-primary btn-sm pull-xs-right">
              <i class="ion-heart"></i> ${favoritesCount}
            </button>
          </div>
          <a href="${articleHref}" onclick="${EventHandler.preventDefault(() => onclickArticle)}" class="preview-link">
            <h1>${title}</h1>
            <p>${description}</p>
            <span>Read more...</span>
            <ul class="tag-list">
              ${tagList.map((t) => html`<li class="tag-default tag-pill tag-outline">${t}</li>`)}
            </ul>
          </a>
        </div>`
}
