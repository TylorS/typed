import type { RouteInput } from "@typed/route"

export type EndpointRoute<R extends RouteInput<any, any, any, any>> = {
  readonly _tag: "Endpoint/Route"
  readonly route: R
}
