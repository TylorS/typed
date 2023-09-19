import { pipe } from "@effect/data/Function"
import * as Effect from "@effect/io/Effect"
import * as Layer from "@effect/io/Layer"
import * as NodeSdk from "@effect/opentelemetry/NodeSdk"
import * as Resource from "@effect/opentelemetry/Resource"
import * as Tracer from "@effect/opentelemetry/Tracer"
import { ConsoleSpanExporter } from "@opentelemetry/sdk-trace-base"
import * as Fx from "@typed/fx/Fx"

const TracingLive = Layer.provide(
  Resource.layer({ serviceName: "example" }),
  Layer.merge(
    NodeSdk.layer(Effect.sync(() =>
      NodeSdk.config({
        traceExporter: new ConsoleSpanExporter()
      })
    )),
    Tracer.layer
  )
)

const program = pipe(
  Fx.fromIterable([1, 2, 3]),
  Fx.withSpan("c"),
  Fx.withSpan("b"),
  Fx.withSpan("a")
)

pipe(
  Fx.drain(program),
  Effect.provideLayer(TracingLive),
  Effect.catchAllCause(Effect.logError),
  Effect.runFork
)
