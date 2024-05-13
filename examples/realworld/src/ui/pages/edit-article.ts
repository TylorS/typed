import { ArticleSlug } from "@typed/realworld/model"
import { isAuthenticatedGuard } from "@typed/realworld/services"
import * as Route from "@typed/route"
import type { RouteGuard } from "@typed/router"
import { html } from "@typed/template"

export const route = Route.literal("editor")
  .concat(Route.paramWithSchema("slug", ArticleSlug))
  .pipe(isAuthenticatedGuard)

export type Params = RouteGuard.RouteGuard.Success<typeof route>

export const main = html`<div class="editor-page">
  <div class="container page">
    <div class="row">
      <div class="col-md-10 col-xs-12 offset-md-1">
        <ul class="error-messages">
          <li>That title is required</li>
        </ul>

        <form>
          <fieldset>
            <fieldset class="form-group">
              <input
                type="text"
                class="form-control form-control-lg"
                placeholder="Article Title"
              />
            </fieldset>
            <fieldset class="form-group">
              <input
                type="text"
                class="form-control"
                placeholder="What's this article about?"
              />
            </fieldset>
            <fieldset class="form-group">
              <textarea
                class="form-control"
                rows="8"
                placeholder="Write your article (in markdown)"
              ></textarea>
            </fieldset>
            <fieldset class="form-group">
              <input
                type="text"
                class="form-control"
                placeholder="Enter tags"
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
