import { add200, addUnprocessableResponse } from "@realworld/api/common/spec"
import * as Schema from "@realworld/lib/Schema"
import { ArticleTagList } from "@realworld/model"
import { Api, ApiGroup } from "@typed/server"
import * as Routes from "./routes"

export const getTags = Api.get(
  "getTags",
  Routes.tags,
  {
    description: "Get tags. Auth not required."
  }
).pipe(
  add200(Schema.Struct({ tags: ArticleTagList })),
  addUnprocessableResponse
)

export const TagsSpec = ApiGroup.make("Tags").pipe(
  ApiGroup.addEndpoint(getTags)
)
