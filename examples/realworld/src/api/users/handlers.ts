import { catchUnauthorizedAndUnprocessable } from "@realworld/api/common/handlers"
import { Users } from "@realworld/services"
import { ServerRouterBuilder } from "@typed/server"
import { Effect, flow } from "effect"
import * as Spec from "./spec"

export const handleGetCurrentUser = Spec.getCurrentUser.pipe(
  ServerRouterBuilder.fromEndpoint(() => Users.current().pipe(Effect.bindTo("user"), catchUnauthorizedAndUnprocessable))
)

export const handleLogin = Spec.login.pipe(
  ServerRouterBuilder.fromEndpoint(({ body: { user } }) =>
    Users.login(user).pipe(Effect.bindTo("user"), catchUnauthorizedAndUnprocessable)
  )
)

export const handleRegister = Spec.register.pipe(
  ServerRouterBuilder.fromEndpoint(({ body: { user } }) =>
    Users.register(user).pipe(Effect.bindTo("user"), catchUnauthorizedAndUnprocessable)
  )
)

export const handleUpdateUser = Spec.updateUser.pipe(
  ServerRouterBuilder.fromEndpoint(({ body: { user } }) =>
    Users.update(user).pipe(Effect.bindTo("user"), catchUnauthorizedAndUnprocessable)
  )
)

export const handleUsers = flow(
  handleGetCurrentUser,
  handleLogin,
  handleRegister,
  handleUpdateUser
)
