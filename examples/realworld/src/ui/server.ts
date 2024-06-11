import { toServerRouter } from "@typed/core/Platform"
import { ServerResponse, ServerRouter } from "@typed/server"
import { document } from "./document"
import { router } from "./router"

// Convert our UI router to a ServerRouter and provide a layout to construct a full HTML document.
// `clientEntry` must correspond to the name provided in your vite configuration within `clientEntries`.
export const UiServer = toServerRouter(router, { clientEntry: "client", layout: document }).pipe(
  // Handle UI errors
  ServerRouter.catchTag("RedirectError", (error) => ServerResponse.seeOther(error.path.toString())),
  ServerRouter.catchTag("Unprocessable", (_) => ServerResponse.json(_, { status: 422 })),
  ServerRouter.catchAll(() => ServerResponse.seeOther("/login"))
)
