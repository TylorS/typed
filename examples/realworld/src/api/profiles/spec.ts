import { security } from "@/api/common/security"
import { Profile } from "@/model"
import { Api } from "effect-http"
import * as Schema from "lib/Schema"
import * as Routes from "./routes"

export const ProfilesSpec = Api.apiGroup("Profiles").pipe(
  Api.get(
    "getProfile",
    Routes.profiles.path,
    {
      request: {
        params: Routes.profiles.schema
      },
      response: [
        { status: 200, content: Schema.struct({ profile: Profile }) },
        { status: 401 },
        { status: 422, content: Schema.struct({ errors: Schema.array(Schema.string) }) }
      ]
    },
    {
      security
    }
  ),
  Api.post(
    "follow",
    Routes.follow.path,
    {
      request: {
        params: Routes.follow.schema
      },
      response: [
        { status: 200, content: Schema.struct({ profile: Profile }) },
        { status: 401 },
        { status: 422, content: Schema.struct({ errors: Schema.array(Schema.string) }) }
      ]
    },
    {
      security
    }
  ),
  Api.delete(
    "unfollow",
    Routes.follow.path,
    {
      request: {
        params: Routes.follow.schema
      },
      response: [
        { status: 200, content: Schema.struct({ profile: Profile }) },
        { status: 401 },
        { status: 422, content: Schema.struct({ errors: Schema.array(Schema.string) }) }
      ]
    },
    {
      security
    }
  )
)
