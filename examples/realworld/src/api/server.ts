import { Articles, Comments, Profiles, Tags, Users } from "@/services"
import type { Unauthorized, Unprocessable } from "@/services/errors"
import { Effect } from "effect"
import { RouterBuilder, ServerError } from "effect-http"
import { Spec } from "./spec"

const STATUS_200 = { status: 200, body: undefined } as const

export const server = RouterBuilder.make(Spec, { enableDocs: true, docsPath: "/docs" }).pipe(
  RouterBuilder.handle(
    "createArticle",
    ({ body: { article } }) =>
      Articles.create(article).pipe(Effect.bindTo("article"), catchUnauthorizedAndUnprocessable)
  ),
  RouterBuilder.handle(
    "createComment",
    ({ body: { comment }, path: { slug } }) =>
      Comments.create(slug, comment).pipe(Effect.bindTo("comment"), catchUnauthorizedAndUnprocessable)
  ),
  RouterBuilder.handle(
    "deleteArticle",
    ({ path: { slug } }) => Articles.delete({ slug }).pipe(Effect.as(STATUS_200), catchUnauthorizedAndUnprocessable)
  ),
  RouterBuilder.handle(
    "deleteComment",
    ({ path: { id, slug } }) =>
      Comments.delete(slug, { id }).pipe(Effect.as(STATUS_200), catchUnauthorizedAndUnprocessable)
  ),
  RouterBuilder.handle(
    "favorite",
    ({ path: { slug } }) => Articles.favorite(slug).pipe(Effect.bindTo("article"), catchUnauthorizedAndUnprocessable)
  ),
  RouterBuilder.handle(
    "follow",
    ({ path: { username } }) =>
      Profiles.follow(username).pipe(Effect.bindTo("profile"), catchUnauthorizedAndUnprocessable)
  ),
  RouterBuilder.handle(
    "getArticle",
    ({ path: { slug } }) => Articles.get({ slug }).pipe(Effect.bindTo("article"), catchUnprocessable)
  ),
  RouterBuilder.handle(
    "getArticles",
    ({ query }) => Articles.list(query).pipe(Effect.bindTo("articles"), catchUnprocessable)
  ),
  RouterBuilder.handle(
    "getComments",
    ({ path: { slug } }) => Comments.get(slug).pipe(Effect.bindTo("comments"), catchUnprocessable)
  ),
  RouterBuilder.handle(
    "getCurrentUser",
    (_) => Users.current().pipe(Effect.bindTo("user"), catchUnauthorizedAndUnprocessable)
  ),
  RouterBuilder.handle(
    "getFeed",
    ({ query }) => Articles.feed(query).pipe(Effect.bindTo("articles"), catchUnauthorizedAndUnprocessable)
  ),
  RouterBuilder.handle(
    "getProfile",
    ({ path: { username } }) => Profiles.get(username).pipe(Effect.bindTo("profile"), catchUnauthorizedAndUnprocessable)
  ),
  RouterBuilder.handle(
    "getTags",
    () => Tags.get().pipe(Effect.bindTo("tags"), catchUnprocessable)
  ),
  RouterBuilder.handle(
    "login",
    ({ body: { user } }) => Users.login(user).pipe(Effect.bindTo("user"), catchUnauthorizedAndUnprocessable)
  ),
  RouterBuilder.handle(
    "register",
    ({ body: { user } }) => Users.register(user).pipe(Effect.bindTo("user"), catchUnprocessable)
  ),
  RouterBuilder.handle(
    "unfavorite",
    ({ path: { slug } }) => Articles.unfavorite(slug).pipe(Effect.bindTo("article"), catchUnauthorizedAndUnprocessable)
  ),
  RouterBuilder.handle(
    "unfollow",
    ({ path: { username } }) =>
      Profiles.unfollow(username).pipe(Effect.bindTo("profile"), catchUnauthorizedAndUnprocessable)
  ),
  RouterBuilder.handle(
    "updateArticle",
    ({ body: { article }, path: { slug } }) =>
      Articles.update(slug, article).pipe(Effect.bindTo("article"), catchUnauthorizedAndUnprocessable)
  ),
  RouterBuilder.handle(
    "updateUser",
    ({ body: { user } }) => Users.update(user).pipe(Effect.bindTo("user"), catchUnauthorizedAndUnprocessable)
  ),
  RouterBuilder.build
)

function catchUnauthorized<R, E, A>(
  effect: Effect.Effect<R, E | Unauthorized, A>
): Effect.Effect<
  R,
  Exclude<E, { readonly _tag: "Unauthorized" }> | ServerError.ServerError,
  A
> {
  return Effect.catchTag(effect, "Unauthorized", () => ServerError.unauthorizedError(undefined))
}

function catchUnprocessable<A, E, R>(
  effect: Effect.Effect<A, E | Unprocessable, R>
): Effect.Effect<
  A,
  Exclude<E, { readonly _tag: "Unprocessable" }> | ServerError.ServerError,
  R
> {
  return Effect.catchTag(
    effect,
    "Unprocessable",
    (e) => ServerError.makeJson(422, { errors: (e as Unprocessable).errors } as const)
  )
}

function catchUnauthorizedAndUnprocessable<R, E, A>(
  effect: Effect.Effect<R, E | Unauthorized | Unprocessable, A>
): Effect.Effect<
  R,
  Exclude<Exclude<E, { readonly _tag: "Unprocessable" }>, { readonly _tag: "Unauthorized" }> | ServerError.ServerError,
  A
> {
  return catchUnauthorized(catchUnprocessable(effect))
}
