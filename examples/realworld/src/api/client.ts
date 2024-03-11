import { Client } from "effect-http"
import { Spec } from "./spec"

export const client = Client.make(Spec)
