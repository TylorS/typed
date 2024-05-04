import {
  add200,
  addJwtTokenSecurity,
  addUnauthorizedResponse,
  addUnprocessableResponse
} from "@realworld/api/common/spec"
import * as Schema from "@realworld/lib/Schema"
import { User } from "@realworld/model"
import { LoginInput } from "@realworld/services/Login"
import { RegisterInput } from "@realworld/services/Register"
import { UpdateUserInput } from "@realworld/services/UpdateUser"
import { Api, ApiGroup } from "@typed/server"
import * as Routes from "./routes"

export const login = Api.post(
  "login",
  Routes.login,
  {
    description: "Login a user"
  }
).pipe(
  Api.setRequestBody(Schema.Struct({ user: LoginInput })),
  add200(Schema.Struct({ user: User })),
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
