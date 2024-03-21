import { Client } from "effect-http"
import { Spec } from "./spec"

export const client = Client.make(Spec, {
  baseUrl: `http://localhost:${import.meta.env.PROD ? "3000" : "5173"}/api`
})
