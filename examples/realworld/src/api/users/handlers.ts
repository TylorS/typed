import { catchUnauthorizedAndUnprocessable, STATUS_200 } from "@typed/realworld/api/common/handlers"
import type { User } from "@typed/realworld/model"
import { Users } from "@typed/realworld/services"
import { Cookies, ServerRouterBuilder } from "@typed/server"
import { Effect, flow } from "effect"
import * as Spec from "./spec"

const ONE_WEEK_SECONDS = 60 * 60 * 24 * 7

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
        maxAge: ONE_WEEK_SECONDS,
        expires: new Date(Date.now() + ONE_WEEK_SECONDS)
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

export const handleLogout = Spec.logout.pipe(
  ServerRouterBuilder.fromEndpoint(() =>
    Users.logout().pipe(
      Effect.as({
        ...STATUS_200,
        headers: {
          "set-cookie": Cookies.serializeCookie(
            Cookies.unsafeMakeCookie("conduit-token", "", {
              httpOnly: true,
              sameSite: "strict",
              secure: false,
              path: "/",
              expires: new Date(0)
            })
          )
        }
      }),
      catchUnauthorizedAndUnprocessable
    )
  )
)

export const handleUsers = flow(
  handleGetCurrentUser,
  handleLogin,
  handleLogout,
  handleRegister,
  handleUpdateUser
)
