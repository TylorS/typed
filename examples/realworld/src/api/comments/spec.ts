import { security } from "@/api/common/security"
import { Comment } from "@/model"
import { CreateCommentInput } from "@/services/CreateComment"
import { Api } from "effect-http"
import * as Schema from "lib/Schema"
import * as Routes from "./routes"

export const CommentsSpec = Api.apiGroup("Comments").pipe(
  Api.get(
    "getComments",
    Routes.comments.path,
    {
      request: {
        params: Routes.comments.schema
      },
      response: [
        { status: 200, content: Schema.struct({ comments: Schema.array(Comment) }) },
        { status: 422, content: Schema.struct({ errors: Schema.array(Schema.string) }) }
      ]
    }
  ),
  Api.post(
    "createComment",
    Routes.comments.path,
    {
      request: {
        body: Schema.struct({ comment: CreateCommentInput }),
        params: Routes.comments.schema
      },
      response: [
        { status: 201, content: Schema.struct({ comment: Comment }) },
        { status: 401 },
        { status: 422, content: Schema.struct({ errors: Schema.array(Schema.string) }) }
      ]
    },
    {
      security
    }
  ),
  Api.delete(
    "deleteComment",
    Routes.comment.path,
    {
      request: {
        params: Routes.comment.schema
      },
      response: [
        { status: 200 },
        { status: 401 },
        { status: 422, content: Schema.struct({ errors: Schema.array(Schema.string) }) }
      ]
    },
    {
      security
    }
  )
)
