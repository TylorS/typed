import { add200, addUnprocessableResponse } from "@/api/common/spec"
import { ArticleTagList } from "@/model"
import { Api, ApiGroup } from "effect-http"
import * as Schema from "lib/Schema"
import * as Routes from "./routes"

export const getTags = Api.get(
  "getTags",
  Routes.tags.path,
  {
    description: "Get tags. Auth not required."
  }
).pipe(
  add200(Schema.struct({ tags: ArticleTagList })),
  addUnprocessableResponse
)

export const TagsSpec = ApiGroup.make("Tags").pipe(
  ApiGroup.addEndpoint(getTags)
)
