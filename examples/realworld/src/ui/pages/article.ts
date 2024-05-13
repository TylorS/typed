import { AsyncData, Fx, RefSubject } from "@typed/core"
import type { Comment } from "@typed/realworld/model"
import { ArticleSlug } from "@typed/realworld/model"
import { Articles, Comments, CurrentUser, isAuthenticated } from "@typed/realworld/services"
import * as Route from "@typed/route"
import { html, many } from "@typed/template"
import { format } from "date-fns"
import * as Option from "effect/Option"

export const route = Route.literal("article").concat(
  Route.paramWithSchema("slug", ArticleSlug)
)

export type Params = Route.Route.Type<typeof route>

export const main = (params: RefSubject.RefSubject<Params>) => {
  const article = RefSubject.proxy(RefSubject.mapEffect(params, Articles.get))
  const author = RefSubject.proxy(article.author)
  const authorProfileHref = RefSubject.map(author.username, (username) => `/profile/${username}`)
  const authorImage = RefSubject.map(author.image, (img) => Option.getOrElse(img, () => ""))
  const comments = RefSubject.mapEffect(article.slug, Comments.get)
  const createdDate = RefSubject.map(article.createdAt, (date) => format(date, "MMM do"))
  const currentUserIsAuthor = RefSubject.struct({ username: author.username, currentUser: CurrentUser }).pipe(
    RefSubject.map(
      ({ currentUser, username }) =>
        AsyncData.isSuccess(currentUser) &&
        username === currentUser.value.username
    )
  )

  const meta = html`<div class="article-meta">
    <a href="${authorProfileHref}"><img src="${authorImage}" /></a>
    <div class="info">
      <a href="${authorProfileHref}" class="author">${author.username}</a>
      <span class="date">${createdDate}</span>
    </div>
    ${
    Fx.if(isAuthenticated, {
      onFalse: Fx.null,
      onTrue: html`<button class="btn btn-sm btn-outline-secondary">
          <i class="ion-plus-round"></i>
          &nbsp; Follow ${author.username}
        </button>
        &nbsp;&nbsp;
        <button class="btn btn-sm btn-outline-primary">
          <i class="ion-heart"></i>
          &nbsp; Favorite Post
          <span class="counter">(${article.favoritesCount})</span>
        </button>`
    })
  }
    ${
    Fx.if(currentUserIsAuthor, {
      onFalse: Fx.null,
      onTrue: html`&nbsp;&nbsp;
        <button class="btn btn-sm btn-outline-secondary">
          <i class="ion-edit"></i> Edit Article
        </button>
        &nbsp;&nbsp;
        <button class="btn btn-sm btn-outline-danger">
          <i class="ion-trash-a"></i> Delete Article
        </button>`
    })
  }
  </div>`

  return html`<div class="article-page">
    <div class="banner">
      <div class="container">
        <h1>${article.title}</h1>

        ${meta}
      </div>
    </div>

    <div class="container page">
      <div class="row article-content">
        <div class="col-md-12">
          <p>${article.body}</p>
          <ul class="tag-list">
            ${
    many(
      article.tagList,
      (t) => t,
      (tag) => html`<li class="tag-default tag-pill tag-outline">${tag}</li>`
    )
  }
          </ul>
        </div>
      </div>

      <hr />

      <div class="article-actions">${meta}</div>

      <div class="row">
        <div class="col-xs-12 col-md-8 offset-md-2">
          <form class="card comment-form">
            <div class="card-block">
              <textarea
                class="form-control"
                placeholder="Write a comment..."
                rows="3"
              ></textarea>
            </div>
            <div class="card-footer">
              <img
                src="http://i.imgur.com/Qr71crq.jpg"
                class="comment-author-img"
              />
              <button class="btn btn-sm btn-primary">Post Comment</button>
            </div>
          </form>

          ${many(comments, (c) => c.id, CommentCard)}
        </div>
      </div>
    </div>
  </div>`
}

function CommentCard(comment: RefSubject.RefSubject<Comment>) {
  const { author, body } = RefSubject.proxy(comment)
  const authorUsername = RefSubject.map(author, (a) => a.username)
  const authorProfileHref = RefSubject.map(
    authorUsername,
    (username) => `/profile/${username}`
  )
  const authorImage = RefSubject.map(author, (a) => Option.getOrElse(a.image, () => ""))

  return html`<div class="card">
    <div class="card-block">
      <p class="card-text">${body}</p>
    </div>
    <div class="card-footer">
      <a href="${authorProfileHref}" class="comment-author">
        <img src="${authorImage}" class="comment-author-img" />
      </a>
      &nbsp;
      <a href="${authorProfileHref}" class="comment-author"
        >${authorProfileHref}</a
      >
      <span class="date-posted">Dec 29th</span>
    </div>
  </div>`
}
