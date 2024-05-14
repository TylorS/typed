import { EventHandler, html, Route } from "@typed/core"
import { navigate } from "@typed/navigation"
import { getFields, parseFormData } from "@typed/realworld/lib/Schema"
import { Articles, isAuthenticatedGuard } from "@typed/realworld/services"
import { CreateArticleInput } from "@typed/realworld/services/CreateArticle"
import { Effect } from "effect"

export const route = Route.literal("editor").pipe(isAuthenticatedGuard)

const parseCreateArticleInput = parseFormData(getFields(CreateArticleInput))

const onSubmit = EventHandler.target<HTMLFormElement>()((ev) =>
  Effect.gen(function*() {
    const input = yield* parseCreateArticleInput(new FormData(ev.target))
    const article = yield* Articles.create(input)

    yield* navigate(`/article/${article.slug}`)
  })
)

export const main = html`<div class="editor-page">
  <div class="container page">
    <div class="row">
      <div class="col-md-10 col-xs-12 offset-md-1">
        <ul class="error-messages">
          <li>That title is required</li>
        </ul>

        <form onsubmit=${onSubmit}>
          <fieldset>
            <fieldset class="form-group">
              <input
                type="text"
                class="form-control form-control-lg"
                placeholder="Article Title"
                name="title"
              />
            </fieldset>
            <fieldset class="form-group">
              <input
                type="text"
                class="form-control"
                placeholder="What's this article about?"
                name="description"
              />
            </fieldset>
            <fieldset class="form-group">
              <textarea
                class="form-control"
                rows="8"
                placeholder="Write your article (in markdown)"
                name="body"
              ></textarea>
            </fieldset>
            <fieldset class="form-group">
              <input
                type="text"
                class="form-control"
                placeholder="Enter tags"
                name="tagList"
              />
              <div class="tag-list">
                <span class="tag-default tag-pill">
                  <i class="ion-close-round"></i> tag
                </span>
              </div>
            </fieldset>
            <button class="btn btn-lg pull-xs-right btn-primary" type="button">
              Publish Article
            </button>
          </fieldset>
        </form>
      </div>
    </div>
  </div>
</div>`
