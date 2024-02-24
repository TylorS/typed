import { Client } from "effect-http"
import { RealworldApiSpec } from "./spec"

export const RealworldApiClient = Client.make(RealworldApiSpec, {
  baseUrl: "https://conduit.productionready.io"
})
