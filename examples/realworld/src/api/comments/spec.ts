import {
  add200,
  add201,
  addJwtTokenSecurity,
  addOptionalJwtTokenSecurity,
  addUnauthorizedResponse,
  addUnprocessableResponse
} from "@/api/common/spec"
import { Comment } from "@/model"
import { CreateCommentInput } from "@/services/CreateComment"
import { Api, ApiGroup } from "effect-http"
import * as Schema from "lib/Schema"
import * as Routes from "./routes"

export const getComments = Api.get(
  "getComments",
  Routes.comments.path,
  { "description": "Get comments for an article. Auth not required." }
).pipe(
  Api.setRequestPath(Routes.comments.schema),
  add200(Schema.struct({ comments: Schema.array(Comment) })),
  addUnprocessableResponse,
  addOptionalJwtTokenSecurity
)

export const createComment = Api.post(
  "createComment",
  Routes.comments.path,
  { "description": "Create a comment. Auth is required" }
).pipe(
  Api.setRequestPath(Routes.comments.schema),
  Api.setRequestBody(Schema.struct({ comment: CreateCommentInput })),
  add201(Schema.struct({ comment: Comment })),
  addUnauthorizedResponse,
  addUnprocessableResponse,
  addJwtTokenSecurity
)

export const deleteComment = Api.delete(
  "deleteComment",
  Routes.comment.path,
  {
    description: "Delete a comment. Auth is required"
  }
).pipe(
  Api.setRequestPath(Routes.comment.schema),
  add200(),
  addUnauthorizedResponse,
  addUnprocessableResponse,
  addJwtTokenSecurity
)

export const CommentsSpec = ApiGroup.make("Comments").pipe(
  ApiGroup.addEndpoint(getComments),
  ApiGroup.addEndpoint(createComment),
  ApiGroup.addEndpoint(deleteComment)
)
