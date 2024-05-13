import { AsyncData, Fx, Link, RefSubject } from "@typed/core"
import type { Comment } from "@typed/realworld/model"
import { ArticleSlug } from "@typed/realworld/model"
import { Articles, Comments, CurrentUser, isAuthenticated, Profiles } from "@typed/realworld/services"
import * as Route from "@typed/route"
import { html, many } from "@typed/template"
import { Effect } from "effect"
import * as Option from "effect/Option"
import { formatMonthAndDay, formatMonthDayYear } from "../common/date"

export const route = Route.literal("article").concat(
  Route.paramWithSchema("slug", ArticleSlug)
)

export type Params = Route.Route.Type<typeof route>

// Delete Article

const FALLBACK_IMAGE = "https://api.realworld.io/images/demo-avatar.png"

export const main = (params: RefSubject.RefSubject<Params>) =>
  Fx.gen(function*(_) {
    const ref = yield* _(RefSubject.make(RefSubject.mapEffect(params, Articles.get)))
    const article = RefSubject.proxy(ref)
    const author = RefSubject.proxy(article.author)
    const authorProfileHref = RefSubject.map(author.username, (username) => `/profile/${username}`)
    const authorImage = RefSubject.map(author.image, (img) => Option.getOrElse(img, () => FALLBACK_IMAGE))
    const comments = RefSubject.mapEffect(article.slug, Comments.get)
    const createdDate = RefSubject.map(article.createdAt, formatMonthDayYear)
    const currentUserIsAuthor = RefSubject.map(
      RefSubject.struct({ username: author.username, currentUser: CurrentUser }),
      ({ currentUser, username }) =>
        AsyncData.isSuccess(currentUser) &&
        username === currentUser.value.username
    )

    const followOrUnfollow = Effect.if(author.following, {
      onFalse: () =>
        Effect.gen(function*() {
          const author = yield* article.author
          const followed = yield* Profiles.follow(author.username)
          yield* RefSubject.update(ref, (a) => ({ ...a, author: followed }))
        }),
      onTrue: () =>
        Effect.gen(function*() {
          const author = yield* article.author
          const unfollowed = yield* Profiles.unfollow(author.username)
          yield* RefSubject.update(ref, (a) => ({ ...a, author: unfollowed }))
        })
    })

    const favoriteOrUnfavorite = Effect.if(article.favorited, {
      onFalse: () =>
        article.slug.pipe(Effect.flatMap(Articles.favorite), Effect.flatMap((_) => RefSubject.set(ref, _))),
      onTrue: () =>
        article.slug.pipe(Effect.flatMap(Articles.unfavorite), Effect.flatMap((_) => RefSubject.set(ref, _)))
    })

    const authenticatedActions = Fx.if(isAuthenticated, {
      onFalse: Fx.null,
      onTrue: html`<button
          class="btn btn-sm btn-outline-secondary"
          onclick=${followOrUnfollow}
        >
          <i class="ion-plus-round"></i>
          &nbsp;
          ${RefSubject.when(author.following, { onFalse: "Follow", onTrue: "Unfollow" })}
          ${author.username}
        </button>
        &nbsp;&nbsp;
        <button
          class="btn btn-sm btn-outline-primary"
          onclick=${favoriteOrUnfavorite}
        >
          <i class="ion-heart"></i>
          &nbsp;
          ${RefSubject.when(article.favorited, { onFalse: "Favorite", onTrue: "Unfavorite" })}
          Post
          <span class="counter">(${article.favoritesCount})</span>
        </button>`
    })

    const editArticleHref = RefSubject.map(article.slug, (slug) => `/editor/${slug}`)

    const currentUserActions = Fx.if(
      currentUserIsAuthor,
      {
        onFalse: Fx.null,
        onTrue: html`&nbsp;&nbsp;
        ${
          Link(
            {
              to: editArticleHref,
              className: "btn btn-sm btn-outline-secondary",
              relative: false
            },
            html`<i class="ion-edit"></i> Edit Article`
          )
        }
        &nbsp;&nbsp;
        <button class="btn btn-sm btn-outline-danger">
          <i class="ion-trash-a"></i> Delete Article
        </button>`
      }
    )

    const meta = html`<div class="article-meta">
      ${Link({ to: authorProfileHref, relative: false }, html`<img src="${authorImage}" />`)}
      <div class="info">
        ${Link({ to: authorProfileHref, className: "author", relative: false }, author.username)}
        <span class="date">${createdDate}</span>
      </div>
      ${authenticatedActions} ${currentUserActions}
    </div>`

    const tags = many(
      article.tagList,
      (t) => t,
      (tag) => html`<li class="tag-default tag-pill tag-outline">${tag}</li>`
    )

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
              ${tags}
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
  })

function CommentCard(comment: RefSubject.RefSubject<Comment>) {
  const { author, body } = RefSubject.proxy(comment)
  const { username } = RefSubject.proxy(author)
  const authorProfileHref = RefSubject.map(username, (username) => `/profile/${username}`)
  const authorImage = RefSubject.map(author, (a) => Option.getOrElse(a.image, () => FALLBACK_IMAGE))
  const datePosted = RefSubject.map(comment, (c) => formatMonthAndDay(c.createdAt))

  return html`<div class="card">
    <div class="card-block">
      <p class="card-text">${body}</p>
    </div>
    <div class="card-footer">
      ${
    Link(
      { to: authorProfileHref, className: "comment-author", relative: false },
      html`<img src="${authorImage}" class="comment-author-img" />`
    )
  }
      &nbsp;
      ${Link({ to: authorProfileHref, className: "comment-author", relative: false }, username)}
      <span class="date-posted">${datePosted}</span>
    </div>
  </div>`
}
