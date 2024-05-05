import { catchUnauthorizedAndUnprocessable, catchUnprocessable, STATUS_200 } from "@typed/realworld/api/common/handlers"
import { Comments } from "@typed/realworld/services"
import { ServerRouterBuilder } from "@typed/server"
import { Effect, flow } from "effect"
import * as Spec from "./spec.js"

export const handleCreateComment = Spec.createComment.pipe(
  ServerRouterBuilder.fromEndpoint(({ body: { comment }, path: { slug } }) =>
    Comments.create(slug, comment).pipe(Effect.bindTo("comment"), catchUnauthorizedAndUnprocessable)
  )
)

export const handleDeleteComment = Spec.deleteComment.pipe(
  ServerRouterBuilder.fromEndpoint(
    ({ path: { id, slug } }) =>
      Comments.delete(slug, { id }).pipe(Effect.as(STATUS_200), catchUnauthorizedAndUnprocessable)
  )
)

export const handleGetComments = Spec.getComments.pipe(
  ServerRouterBuilder.fromEndpoint(
    ({ path: { slug } }) => Comments.get(slug).pipe(Effect.bindTo("comments"), catchUnprocessable)
  )
)

export const handleComments = flow(
  handleCreateComment,
  handleDeleteComment,
  handleGetComments
)
