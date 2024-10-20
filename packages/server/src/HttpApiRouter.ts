/**
 * @since 1.0.0
 */

import * as HttpRouter from "./HttpRouter.js"

/**
 * The router that the API endpoints are attached to.
 *
 * @since 1.0.0
 * @category router
 */
export class HttpApiRouter extends HttpRouter.Tag("@typed/server/HttpApiBuilder/Router")<HttpApiRouter>() {}
