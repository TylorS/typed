import {
  add200,
  addJwtTokenSecurity,
  addOptionalJwtTokenSecurity,
  addUnauthorizedResponse,
  addUnprocessableResponse
} from "@typed/realworld/api/common/spec"
import * as Schema from "@typed/realworld/lib/Schema"
import { Profile } from "@typed/realworld/model"
import { Api, ApiGroup } from "@typed/server"
import * as Routes from "./routes"

export const getProfile = Api.get(
  "getProfile",
  Routes.profiles,
  {
    description: "Get a profile. Auth not required."
  }
).pipe(
  add200(Schema.Struct({ profile: Profile })),
  addUnauthorizedResponse,
  addUnprocessableResponse,
  addOptionalJwtTokenSecurity
)

export const follow = Api.post(
  "follow",
  Routes.follow,
  {
    description: "Follow a user. Auth is required."
  }
).pipe(
  add200(Schema.Struct({ profile: Profile })),
  addUnauthorizedResponse,
  addUnprocessableResponse,
  addJwtTokenSecurity
)

export const unfollow = Api.delete(
  "unfollow",
  Routes.follow,
  {
    description: "Unfollow a user. Auth is required."
  }
).pipe(
  add200(Schema.Struct({ profile: Profile })),
  addUnauthorizedResponse,
  addUnprocessableResponse,
  addJwtTokenSecurity
)

export const ProfilesSpec = ApiGroup.make("Profiles").pipe(
  ApiGroup.addEndpoint(getProfile),
  ApiGroup.addEndpoint(follow),
  ApiGroup.addEndpoint(unfollow)
)
