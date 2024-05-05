import { catchUnauthorizedAndUnprocessable } from "@typed/realworld/api/common/handlers"
import type { User } from "@typed/realworld/model"
import { Users } from "@typed/realworld/services"
import { Cookies, ServerRouterBuilder } from "@typed/server"
import { Effect, flow } from "effect"
import * as Spec from "./spec"

const userToResponse = (user: User) => ({
  status: 200,
  body: { user },
  headers: {
    "set-cookie": Cookies.serializeCookie(
      Cookies.unsafeMakeCookie("conduit-token", user.token, {
        httpOnly: true,
        sameSite: "strict",
        secure: false,
        path: "/",
        maxAge: 60 * 60 * 24 * 7
      })
    )
  }
} as const)

export const handleGetCurrentUser = Spec.getCurrentUser.pipe(
  ServerRouterBuilder.fromEndpoint(() =>
    Users.current().pipe(Effect.map(userToResponse), catchUnauthorizedAndUnprocessable)
  )
)

export const handleLogin = Spec.login.pipe(
  ServerRouterBuilder.fromEndpoint(({ body: { user } }) =>
    Users.login(user).pipe(Effect.map(userToResponse), catchUnauthorizedAndUnprocessable)
  )
)

export const handleRegister = Spec.register.pipe(
  ServerRouterBuilder.fromEndpoint(({ body: { user } }) =>
    Users.register(user).pipe(Effect.map(userToResponse), catchUnauthorizedAndUnprocessable)
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
