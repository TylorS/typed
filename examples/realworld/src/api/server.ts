import type { User } from "@/model"
import { Articles, Comments, Profiles, Tags, Users } from "@/services"
import type { Unauthorized, Unprocessable } from "@/services/errors"
import { type Headers, unsafeFromRecord } from "@effect/platform/Http/Headers"
import { Effect, ReadonlyRecord } from "effect"
import { RouterBuilder, ServerError } from "effect-http"
import { Spec } from "./spec"

const STATUS_200 = { status: 200, body: undefined } as const

export const server = RouterBuilder.make(Spec).pipe(
  RouterBuilder.handle(
    "createArticle",
    ({ body: { article } }) =>
      Articles.create(article).pipe(asStatus(201, "article"), catchUnauthorizedAndUnprocessable)
  ),
  RouterBuilder.handle(
    "createComment",
    ({ body: { comment }, path: { slug } }) =>
      Comments.create(slug, comment).pipe(asStatus(201, "comment"), catchUnauthorizedAndUnprocessable)
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
    ({ path: { slug } }) => Articles.favorite(slug).pipe(asStatus(200, "article"), catchUnauthorizedAndUnprocessable)
  ),
  RouterBuilder.handle(
    "follow",
    ({ path: { username } }) =>
      Profiles.follow(username).pipe(asStatus(200, "profile"), catchUnauthorizedAndUnprocessable)
  ),
  RouterBuilder.handle(
    "getArticle",
    ({ path: { slug } }) => Articles.get({ slug }).pipe(asStatus(200, "article"), catchUnprocessable)
  ),
  RouterBuilder.handle(
    "getArticles",
    ({ query }) => Articles.list(query).pipe(asStatus(200, "articles"), catchUnprocessable)
  ),
  RouterBuilder.handle(
    "getComments",
    ({ path: { slug } }) => Comments.get(slug).pipe(asStatus(200, "comments"), catchUnprocessable)
  ),
  RouterBuilder.handle(
    "getCurrentUser",
    (_) => Users.current().pipe(asStatusWithAuthToken(200), catchUnauthorizedAndUnprocessable)
  ),
  RouterBuilder.handle(
    "getFeed",
    ({ query }) => Articles.feed(query).pipe(asStatus(200, "articles"), catchUnauthorizedAndUnprocessable)
  ),
  RouterBuilder.handle(
    "getProfile",
    ({ path: { username } }) => Profiles.get(username).pipe(asStatus(200, "profile"), catchUnauthorizedAndUnprocessable)
  ),
  RouterBuilder.handle(
    "getTags",
    () => Tags.get().pipe(asStatus(200, "tags"), catchUnprocessable)
  ),
  RouterBuilder.handle(
    "login",
    ({ body: { user } }) => Users.login(user).pipe(asStatusWithAuthToken(200), catchUnauthorizedAndUnprocessable)
  ),
  RouterBuilder.handle(
    "register",
    ({ body: { user } }) => Users.register(user).pipe(asStatusWithAuthToken(200), catchUnprocessable)
  ),
  RouterBuilder.handle(
    "unfavorite",
    ({ path: { slug } }) => Articles.unfavorite(slug).pipe(asStatus(200, "article"), catchUnauthorizedAndUnprocessable)
  ),
  RouterBuilder.handle(
    "unfollow",
    ({ path: { username } }) =>
      Profiles.unfollow(username).pipe(asStatus(200, "profile"), catchUnauthorizedAndUnprocessable)
  ),
  RouterBuilder.handle(
    "updateArticle",
    ({ body: { article }, path: { slug } }) =>
      Articles.update(slug, article).pipe(asStatus(200, "article"), catchUnauthorizedAndUnprocessable)
  ),
  RouterBuilder.handle(
    "updateUser",
    ({ body: { user } }) => Users.update(user).pipe(asStatusWithAuthToken(200), catchUnauthorizedAndUnprocessable)
  ),
  RouterBuilder.getRouter
)

function asStatus<const S extends number, const K extends string>(status: S, key: K) {
  return <A, E, R>(
    effect: Effect.Effect<A, E, R>
  ): Effect.Effect<{ readonly status: S; readonly body: { readonly [_ in K]: A } }, E, R> =>
    Effect.map(effect, (content) => ({ status, body: ReadonlyRecord.singleton(key, content) } as const))
}

function asStatusWithAuthToken<const S extends number>(status: S) {
  return <E, R>(
    effect: Effect.Effect<User, E, R>
  ): Effect.Effect<
    {
      readonly status: S
      readonly body: { readonly user: User }
      readonly headers: Headers
    },
    E,
    R
  > =>
    Effect.map(
      effect,
      (
        content
      ) => ({
        status,
        body: ReadonlyRecord.singleton("user", content),
        headers: unsafeFromRecord({
          "set-cookie": `conduit-creds=${content.token}; Path=/; HttpOnly; SameSite=Strict`
        })
      } as const)
    )
}

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
