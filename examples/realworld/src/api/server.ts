import { Articles, Comments, Profiles, Tags, Users } from "@/services"
import type { Unauthorized, Unprocessable } from "@/services/errors"
import { ServerError, ServerRouter, ServerRouterBuilder } from "@typed/server"
import { flow, Effect } from "effect"
import { Spec } from "./spec"

const STATUS_200 = { status: 200, body: undefined } as const

export const server = ServerRouterBuilder.make(Spec, { enableDocs: true, docsPath: "/docs" }).pipe(
  ServerRouterBuilder.handle(
    "createArticle",
    ({ body: { article } }) =>
      Articles.create(article).pipe(Effect.bindTo("article"), catchUnauthorizedAndUnprocessable)
  ),
  ServerRouterBuilder.handle(
    "createComment",
    ({ body: { comment }, path: { slug } }) =>
      Comments.create(slug, comment).pipe(Effect.bindTo("comment"), catchUnauthorizedAndUnprocessable)
  ),
  ServerRouterBuilder.handle(
    "deleteArticle",
    ({ path: { slug } }) => Articles.delete({ slug }).pipe(Effect.as(STATUS_200), catchUnauthorizedAndUnprocessable)
  ),
  ServerRouterBuilder.handle(
    "deleteComment",
    ({ path: { id, slug } }) =>
      Comments.delete(slug, { id }).pipe(Effect.as(STATUS_200), catchUnauthorizedAndUnprocessable)
  ),
  ServerRouterBuilder.handle(
    "favorite",
    ({ path: { slug } }) => Articles.favorite(slug).pipe(Effect.bindTo("article"), catchUnauthorizedAndUnprocessable)
  ),
  ServerRouterBuilder.handle(
    "follow",
    ({ path: { username } }) =>
      Profiles.follow(username).pipe(Effect.bindTo("profile"), catchUnauthorizedAndUnprocessable)
  ),
  ServerRouterBuilder.handle(
    "getArticle",
    ({ path: { slug } }) => Articles.get({ slug }).pipe(Effect.bindTo("article"), catchUnprocessable)
  ),
  ServerRouterBuilder.handle(
    "getArticles",
    ({ query }) => Articles.list(query).pipe(Effect.bindTo("articles"), catchUnprocessable)
  ),
  ServerRouterBuilder.handle(
    "getComments",
    ({ path: { slug } }) => Comments.get(slug).pipe(Effect.bindTo("comments"), catchUnprocessable)
  ),
  ServerRouterBuilder.handle(
    "getCurrentUser",
    (_) => Users.current().pipe(Effect.bindTo("user"), catchUnauthorizedAndUnprocessable)
  ),
  ServerRouterBuilder.handle(
    "getFeed",
    ({ query }) => Articles.feed(query).pipe(Effect.bindTo("articles"), catchUnauthorizedAndUnprocessable)
  ),
  ServerRouterBuilder.handle(
    "getProfile",
    ({ path: { username } }) => Profiles.get(username).pipe(Effect.bindTo("profile"), catchUnauthorizedAndUnprocessable)
  ),
  ServerRouterBuilder.handle(
    "getTags",
    () => Tags.get().pipe(Effect.bindTo("tags"), catchUnprocessable)
  ),
  ServerRouterBuilder.handle(
    "login",
    ({ body: { user } }) => Users.login(user).pipe(Effect.bindTo("user"), catchUnauthorizedAndUnprocessable)
  ),
  ServerRouterBuilder.handle(
    "register",
    ({ body: { user } }) => Users.register(user).pipe(Effect.bindTo("user"), catchUnprocessable)
  ),
  ServerRouterBuilder.handle(
    "unfavorite",
    ({ path: { slug } }) => Articles.unfavorite(slug).pipe(Effect.bindTo("article"), catchUnauthorizedAndUnprocessable)
  ),
  ServerRouterBuilder.handle(
    "unfollow",
    ({ path: { username } }) =>
      Profiles.unfollow(username).pipe(Effect.bindTo("profile"), catchUnauthorizedAndUnprocessable)
  ),
  ServerRouterBuilder.handle(
    "updateArticle",
    ({ body: { article }, path: { slug } }) =>
      Articles.update(slug, article).pipe(Effect.bindTo("article"), catchUnauthorizedAndUnprocessable)
  ),
  ServerRouterBuilder.handle(
    "updateUser",
    ({ body: { user } }) => Users.update(user).pipe(Effect.bindTo("user"), catchUnauthorizedAndUnprocessable)
  ),
  flow(ServerRouterBuilder.getRouter, ServerRouter.toPlatformRouter),
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
