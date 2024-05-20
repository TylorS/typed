import { AsyncData, Fx, Link, RefArray, RefSubject, Router } from "@typed/core"
import type { EventWithTarget } from "@typed/dom/EventTarget"
import type { ArticleSlug, Comment } from "@typed/realworld/model"
import { CommentBody, Image } from "@typed/realworld/model"
import { Articles, Comments, CurrentUser, isAuthenticated, Profiles } from "@typed/realworld/services"
import { formatMonthAndDay, formatMonthDayYear } from "@typed/realworld/ui/common/date"
import * as Routes from "@typed/realworld/ui/common/routes"
import type * as Route from "@typed/route"
import { EventHandler, html, many } from "@typed/template"
import { Effect } from "effect"
import * as Option from "effect/Option"

export const route = Routes.article
export type Params = Route.Route.Type<typeof route>

const FALLBACK_IMAGE = Image.make("https://api.realworld.io/images/demo-avatar.png")

export const main = (params: RefSubject.RefSubject<Params>) =>
  Fx.gen(function*(_) {
    const ref = yield* _(RefSubject.make(RefSubject.mapEffect(params, Articles.get)))
    const article = RefSubject.proxy(ref)
    const author = RefSubject.proxy(article.author)
    const authorProfileHref = RefSubject.map(author.username, (username) => Routes.profile.interpolate({ username }))
    const authorImage = RefSubject.map(author.image, (img) => Option.getOrElse(img, () => FALLBACK_IMAGE))
    const comments = yield* _(RefSubject.make(RefSubject.mapEffect(article.slug, Comments.get)))
    const createdDate = RefSubject.map(article.createdAt, formatMonthDayYear)
    const currentUserIsAuthor = RefSubject.map(
      RefSubject.struct({
        username: author.username,
        currentUser: CurrentUser
      }),
      ({ currentUser, username }) =>
        AsyncData.isSuccess(currentUser) &&
        username === currentUser.value.username
    )

    const followOrUnfollow = Effect.gen(function*() {
      const author = yield* article.author
      const updated = author.following
        ? yield* Profiles.unfollow(author.username)
        : yield* Profiles.follow(author.username)
      yield* RefSubject.update(ref, (a) => ({ ...a, author: updated }))
    })

    const favoriteOrUnfavorite = Effect.gen(function*() {
      const { favorited, slug } = yield* ref
      const updated = yield* favorited ? Articles.unfavorite(slug) : Articles.favorite(slug)
      yield* RefSubject.set(ref, updated)
    })

    const authenticatedActions = Fx.if(isAuthenticated, {
      onFalse: Fx.null,
      onTrue: html`<button
          class="btn btn-sm btn-outline-secondary"
          onclick=${followOrUnfollow}
        >
          <i class="ion-plus-round"></i>
          &nbsp;
          ${
        RefSubject.when(author.following, {
          onFalse: "Follow",
          onTrue: "Unfollow"
        })
      }
          ${author.username}
        </button>
        &nbsp;&nbsp;
        <button
          class="btn btn-sm btn-outline-primary"
          onclick=${favoriteOrUnfavorite}
        >
          <i class="ion-heart"></i>
          &nbsp;
          ${
        RefSubject.when(article.favorited, {
          onFalse: "Favorite",
          onTrue: "Unfavorite"
        })
      }
          Post
          <span class="counter">(${article.favoritesCount})</span>
        </button>`
    })

    const editArticleHref = RefSubject.map(article.slug, (slug) => Routes.editArticle.route.interpolate({ slug }))

    const deleteArticle = Effect.gen(function*() {
      const slug = yield* article.slug
      yield* Articles.delete({ slug })
      yield* Router.navigate(Routes.home)
    })

    const currentUserActions = Fx.if(currentUserIsAuthor, {
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
        <button class="btn btn-sm btn-outline-danger" onclick=${deleteArticle}>
          <i class="ion-trash-a"></i> Delete Article
        </button>`
    })

    const meta = html`<div class="article-meta">
      ${
      Link(
        { to: authorProfileHref, relative: false },
        html`<img src="${authorImage}" />`
      )
    }
      <div class="info">
        ${
      Link(
        { to: authorProfileHref, className: "author", relative: false },
        author.username
      )
    }
        <span class="date">${createdDate}</span>
      </div>
      ${authenticatedActions} ${currentUserActions}
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
            ${
      Fx.if(isAuthenticated, {
        onFalse: html`<p show-authed="false" style="display: inherit;">
          ${Link({ to: "/login", relative: false }, "Sign in")}
          or
          ${Link({ to: "/register", relative: false }, "sign up")}
          to add comments on this article.
        </p>`,
        onTrue: PostComment(article.slug, (comment) => RefArray.append(comments, comment))
      })
    }
            ${many(comments, (c) => c.id, CommentCard)}
          </div>
        </div>
      </div>
    </div>`
  })

function PostComment<E, R, E2, R2>(
  slug: RefSubject.Computed<ArticleSlug, E, R>,
  onNewComment: (comment: Comment) => Effect.Effect<void, E2, R2>
) {
  return Fx.gen(function*(_) {
    const commentBody = yield* RefSubject.of<string>("")

    const updateCommentBody = EventHandler.target<HTMLTextAreaElement>()((ev) =>
      RefSubject.set(commentBody, ev.target.value)
    )

    const postComment = EventHandler.preventDefault(
      (_: EventWithTarget<HTMLFormElement, SubmitEvent>) =>
        Effect.gen(function*() {
          const body = yield* commentBody
          if (body.trim() === "") return

          const comment = yield* Comments.create(yield* slug, { body: CommentBody.make(body) })
          yield* onNewComment(comment)
          yield* RefSubject.set(commentBody, "")
        })
    )

    const currentUserImage = RefSubject.map(CurrentUser, (user) =>
      AsyncData.getSuccess(user).pipe(
        Option.flatMap((u) => u.image),
        Option.getOrElse(() => FALLBACK_IMAGE)
      ))

    return html`<form class="card comment-form" onsubmit=${postComment}>
      <div class="card-block">
        <textarea
          name="comment-body"
          class="form-control"
          placeholder="Write a comment..."
          .value=${commentBody}
          oninput=${updateCommentBody}
          onchange=${updateCommentBody}
          rows="3"
        ></textarea>
      </div>
      <div class="card-footer">
        <img src="${currentUserImage}" class="comment-author-img" />
        <button type="submit" class="btn btn-sm btn-primary">
          Post Comment
        </button>
      </div>
    </form>`
  })
}

function CommentCard(ref: RefSubject.RefSubject<Comment>) {
  const comment = RefSubject.proxy(ref)
  const author = RefSubject.proxy(comment.author)
  const authorProfileHref = RefSubject.map(author.username, (username) => Routes.profile.interpolate({ username }))
  const authorImage = RefSubject.map(author.image, Option.getOrElse(() => FALLBACK_IMAGE))
  const datePosted = RefSubject.map(comment.createdAt, formatMonthAndDay)

  return html`<div class="card">
    <div class="card-block">
      <p class="card-text">${comment.body}</p>
    </div>
    <div class="card-footer">
      ${
    Link(
      { to: authorProfileHref, className: "comment-author", relative: false },
      html`<img src=${authorImage} class="comment-author-img" />`
    )
  }
      &nbsp;
      ${
    Link(
      { to: authorProfileHref, className: "comment-author", relative: false },
      author.username
    )
  }
      <span class="date-posted">${datePosted}</span>
    </div>
  </div>`
}
