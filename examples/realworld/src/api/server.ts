import { Articles, Comments, Profiles, Tags, Users } from "@/services"
import type { Unauthorized, Unprocessable } from "@/services/errors"
import { GetCurrentUser } from "@/services/GetCurrentUser"
import { UpdateUser } from "@/services/UpdateUser"
import { Effect, ReadonlyRecord } from "effect"
import { RouterBuilder } from "effect-http"
import { Spec } from "./spec"

const STATUS_200 = { status: 200 } as const

export const server = RouterBuilder.make(Spec).pipe(
  RouterBuilder.handle(
    "createArticle",
    ({ body: { article } }) =>
      Articles.create(article).pipe(asStatus(201, "article"), catchUnauthorizedAndUnprocessable)
  ),
  RouterBuilder.handle(
    "createComment",
    ({ body: { comment }, params: { slug } }) =>
      Comments.create(slug, comment).pipe(asStatus(201, "comment"), catchUnauthorizedAndUnprocessable)
  ),
  RouterBuilder.handle(
    "deleteArticle",
    ({ params: { slug } }) => Articles.delete({ slug }).pipe(Effect.as(STATUS_200), catchUnauthorizedAndUnprocessable)
  ),
  RouterBuilder.handle(
    "deleteComment",
    ({ params: { id, slug } }) =>
      Comments.delete(slug, { id }).pipe(Effect.as(STATUS_200), catchUnauthorizedAndUnprocessable)
  ),
  RouterBuilder.handle(
    "favorite",
    ({ params: { slug } }) => Articles.favorite(slug).pipe(asStatus(200, "article"), catchUnauthorizedAndUnprocessable)
  ),
  RouterBuilder.handle(
    "follow",
    ({ params: { username } }) =>
      Profiles.follow(username).pipe(asStatus(200, "profile"), catchUnauthorizedAndUnprocessable)
  ),
  RouterBuilder.handle(
    "getArticle",
    ({ params: { slug } }) => Articles.get({ slug }).pipe(asStatus(200, "article"), catchUnprocessable)
  ),
  RouterBuilder.handle(
    "getArticles",
    ({ query }) => Articles.list(query).pipe(asStatus(200, "articles"), catchUnprocessable)
  ),
  RouterBuilder.handle(
    "getComments",
    ({ params: { slug } }) => Comments.get(slug).pipe(asStatus(200, "comments"), catchUnprocessable)
  ),
  RouterBuilder.handle(
    "getCurrentUser",
    (_) => GetCurrentUser().pipe(asStatus(200, "user"), catchUnauthorizedAndUnprocessable)
  ),
  RouterBuilder.handle(
    "getFeed",
    ({ query }) => Articles.feed(query).pipe(asStatus(200, "articles"), catchUnauthorizedAndUnprocessable)
  ),
  RouterBuilder.handle(
    "getProfile",
    ({ params: { username } }) =>
      Profiles.get(username).pipe(asStatus(200, "profile"), catchUnauthorizedAndUnprocessable)
  ),
  RouterBuilder.handle(
    "getTags",
    () => Tags.get().pipe(asStatus(200, "tags"), catchUnprocessable)
  ),
  RouterBuilder.handle(
    "login",
    ({ body: { user } }) => Users.login(user).pipe(asStatus(200, "user"), catchUnauthorizedAndUnprocessable)
  ),
  RouterBuilder.handle(
    "register",
    ({ body: { user } }) => Users.register(user).pipe(asStatus(200, "user"), catchUnprocessable)
  ),
  RouterBuilder.handle(
    "unfavorite",
    ({ params: { slug } }) =>
      Articles.unfavorite(slug).pipe(asStatus(200, "article"), catchUnauthorizedAndUnprocessable)
  ),
  RouterBuilder.handle(
    "unfollow",
    ({ params: { username } }) =>
      Profiles.unfollow(username).pipe(asStatus(200, "profile"), catchUnauthorizedAndUnprocessable)
  ),
  RouterBuilder.handle(
    "updateArticle",
    ({ body: { article }, params: { slug } }) =>
      Articles.update(slug, article).pipe(asStatus(200, "article"), catchUnauthorizedAndUnprocessable)
  ),
  RouterBuilder.handle(
    "updateUser",
    ({ body: { user } }) => UpdateUser(user).pipe(asStatus(200, "user"), catchUnauthorizedAndUnprocessable)
  ),
  RouterBuilder.getRouter
)

function asStatus<const S extends number, const K extends string>(status: S, key: K) {
  return <A, E, R>(
    effect: Effect.Effect<A, E, R>
  ): Effect.Effect<{ readonly status: S; readonly content: { readonly [_ in K]: A } }, E, R> =>
    Effect.map(effect, (content) => ({ status, content: ReadonlyRecord.singleton(key, content) } as const))
}

function catchUnauthorized<R, E, A>(
  effect: Effect.Effect<R, E | Unauthorized, A>
): Effect.Effect<R | { readonly status: 401 }, Exclude<E, { readonly _tag: "Unauthorized" }>, A> {
  return Effect.catchTag(effect, "Unauthorized", () => Effect.succeed({ status: 401 } as const))
}

function catchUnprocessable<A, E, R>(
  effect: Effect.Effect<A, E | Unprocessable, R>
): Effect.Effect<
  A | { readonly status: 422; readonly content: { readonly errors: ReadonlyArray<string> } },
  Exclude<E, { readonly _tag: "Unprocessable" }>,
  R
> {
  return Effect.catchTag(
    effect,
    "Unprocessable",
    (e) => Effect.succeed({ status: 422, content: { errors: (e as Unprocessable).errors } } as const)
  )
}

function catchUnauthorizedAndUnprocessable<R, E, A>(
  effect: Effect.Effect<R, E | Unauthorized | Unprocessable, A>
): Effect.Effect<
  { readonly status: 401 } | { readonly status: 422; readonly content: { readonly errors: ReadonlyArray<string> } } | R,
  Exclude<Exclude<E, { readonly _tag: "Unprocessable" }>, { readonly _tag: "Unauthorized" }>,
  A
> {
  return catchUnauthorized(catchUnprocessable(effect))
}
