import {
  add200,
  addJwtTokenSecurity,
  addOptionalJwtTokenSecurity,
  addUnauthorizedResponse,
  addUnprocessableResponse
} from "@/api/common/spec"
import { Profile } from "@/model"
import { Api, ApiGroup } from "effect-http"
import * as Schema from "lib/Schema"
import * as Routes from "./routes"

export const getProfile = Api.get(
  "getProfile",
  Routes.profiles.path,
  {
    description: "Get a profile. Auth not required."
  }
).pipe(
  Api.setRequestPath(Routes.profiles.schema),
  add200(Schema.struct({ profile: Profile })),
  addUnauthorizedResponse,
  addUnprocessableResponse,
  addOptionalJwtTokenSecurity
)

export const follow = Api.post(
  "follow",
  Routes.follow.path,
  {
    description: "Follow a user. Auth is required."
  }
).pipe(
  Api.setRequestPath(Routes.follow.schema),
  add200(Schema.struct({ profile: Profile })),
  addUnauthorizedResponse,
  addUnprocessableResponse,
  addJwtTokenSecurity
)

export const unfollow = Api.delete(
  "unfollow",
  Routes.follow.path,
  {
    description: "Unfollow a user. Auth is required."
  }
).pipe(
  Api.setRequestPath(Routes.follow.schema),
  add200(Schema.struct({ profile: Profile })),
  addUnauthorizedResponse,
  addUnprocessableResponse,
  addJwtTokenSecurity
)

export const ProfilesSpec = ApiGroup.make("Profiles").pipe(
  ApiGroup.addEndpoint(getProfile),
  ApiGroup.addEndpoint(follow),
  ApiGroup.addEndpoint(unfollow)
)
