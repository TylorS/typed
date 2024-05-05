import {
  add200,
  addJwtTokenSecurity,
  addUnauthorizedResponse,
  addUnprocessableResponse
} from "@typed/realworld/api/common/spec"
import * as Schema from "@typed/realworld/lib/Schema"
import { User } from "@typed/realworld/model"
import { LoginInput } from "@typed/realworld/services/Login"
import { RegisterInput } from "@typed/realworld/services/Register"
import { UpdateUserInput } from "@typed/realworld/services/UpdateUser"
import { Api, ApiGroup } from "@typed/server"
import * as Routes from "./routes"

export const addCookieHeader = Api.setResponseHeaders(Schema.Struct({
  "set-cookie": Schema.optional(Schema.String)
}))

export const login = Api.post(
  "login",
  Routes.login,
  {
    description: "Login a user"
  }
).pipe(
  Api.setRequestBody(Schema.Struct({ user: LoginInput })),
  add200(Schema.Struct({ user: User })),
  addCookieHeader,
  addUnauthorizedResponse,
  addUnprocessableResponse
)

export const getCurrentUser = Api.get(
  "getCurrentUser",
  Routes.user,
  {
    description: "Get current user"
  }
).pipe(
  add200(Schema.Struct({ user: User })),
  addCookieHeader,
  addUnauthorizedResponse,
  addUnprocessableResponse,
  addJwtTokenSecurity
)

export const register = Api.post(
  "register",
  Routes.users,
  {
    description: "Register a user"
  }
).pipe(
  Api.setRequestBody(Schema.Struct({ user: RegisterInput })),
  add200(Schema.Struct({ user: User })),
  addCookieHeader,
  addUnprocessableResponse
)

export const updateUser = Api.put(
  "updateUser",
  Routes.user,
  {
    description: "Update a user. Auth is required."
  }
).pipe(
  Api.setRequestBody(Schema.Struct({ user: UpdateUserInput })),
  add200(Schema.Struct({ user: User })),
  addUnauthorizedResponse,
  addUnprocessableResponse,
  addJwtTokenSecurity
)

export const UsersSpec = ApiGroup.make("Users and Authentication").pipe(
  ApiGroup.addEndpoint(login),
  ApiGroup.addEndpoint(getCurrentUser),
  ApiGroup.addEndpoint(register),
  ApiGroup.addEndpoint(updateUser)
)
