import { security } from "@/api/common/security"
import { User } from "@/model"
import { LoginInput } from "@/services/Login"
import { RegisterInput } from "@/services/Register"
import { UpdateUserInput } from "@/services/UpdateUser"
import { Api } from "effect-http"
import * as Schema from "lib/Schema"
import * as Routes from "./routes"

export const UsersSpec = Api.apiGroup("User and Authentication").pipe(
  Api.post(
    "login",
    Routes.login.path,
    {
      request: {
        body: Schema.struct({ user: LoginInput })
      },
      response: [
        { status: 200, content: Schema.struct({ user: User }) },
        { status: 401 },
        { status: 422, content: Schema.struct({ errors: Schema.array(Schema.string) }) }
      ]
    }
  ),
  Api.get(
    "getCurrentUser",
    Routes.user.path,
    {
      response: [
        { status: 200, content: Schema.struct({ user: User }) },
        { status: 401 },
        { status: 422, content: Schema.struct({ errors: Schema.array(Schema.string) }) }
      ]
    },
    {
      security
    }
  ),
  Api.post("register", Routes.users.path, {
    request: {
      body: Schema.struct({ user: RegisterInput })
    },
    response: [
      { status: 200, content: Schema.struct({ user: User }) },
      { status: 422, content: Schema.struct({ errors: Schema.array(Schema.string) }) }
    ]
  }),
  Api.put(
    "updateUser",
    Routes.user.path,
    {
      request: {
        body: Schema.struct({ user: UpdateUserInput })
      },
      response: [
        { status: 200, content: Schema.struct({ user: User }) },
        { status: 401 },
        { status: 422, content: Schema.struct({ errors: Schema.array(Schema.string) }) }
      ]
    },
    {
      security
    }
  )
)
