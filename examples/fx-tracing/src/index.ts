import * as NodeSdk from "@effect/opentelemetry/NodeSdk"
import * as Resource from "@effect/opentelemetry/Resource"
import * as Tracer from "@effect/opentelemetry/Tracer"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http"
import * as Fx from "@typed/fx/Fx"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"

const TracingLive = Layer.provide(
  Resource.layer({ serviceName: "example" }),
  Layer.merge(
    NodeSdk.layer(Effect.sync(() =>
      NodeSdk.config({
        traceExporter: new OTLPTraceExporter()
      })
    )),
    Tracer.layer
  )
)

const program = pipe(
  Fx.fromIterable([1, 2, 3]),
  Fx.withSpan("c"),
  Fx.map((n) => n * 2),
  Fx.withSpan("b"),
  Fx.map((n) => n + 1),
  Fx.withSpan("a"),
  Fx.observe(Effect.log)
)

pipe(
  program,
  Effect.provide(TracingLive),
  Effect.catchAllCause(Effect.logError),
  Effect.runFork
)
