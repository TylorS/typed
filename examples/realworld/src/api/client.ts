import { Client as HttpClient } from "effect-http"
import { Spec } from "./spec"

export const Client = HttpClient.make(Spec, { baseUrl: "https://localhost:3000/api" })
