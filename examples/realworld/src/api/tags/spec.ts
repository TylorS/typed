import { ArticleTagList } from "@/model"
import { Api } from "effect-http"
import * as Schema from "lib/Schema"
import * as Routes from "./routes"

export const TagsSpec = Api.apiGroup("Tags").pipe(
  Api.get(
    "getTags",
    Routes.tags.path,
    {
      response: [
        { status: 200, content: Schema.struct({ tags: ArticleTagList }) },
        { status: 422, content: Schema.struct({ errors: Schema.array(Schema.string) }) }
      ]
    },
    {}
  )
)
